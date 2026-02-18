import { prisma } from "@/lib/prisma";

export async function publishPendingPrints(): Promise<{
  printsPublished: number;
  editionsCreated: number;
}> {
  // 1. Publish all pending prints
  const now = new Date();
  const todayDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const pendingPrints = await prisma.print.updateMany({
    where: { status: "PENDING" },
    data: {
      status: "PUBLISHED",
      publishedAt: now,
    },
  });

  if (pendingPrints.count === 0) {
    return { printsPublished: 0, editionsCreated: 0 };
  }

  // 2. Get all just-published prints (published today)
  const publishedPrints = await prisma.print.findMany({
    where: {
      publishedAt: { gte: todayDate },
      status: "PUBLISHED",
    },
    select: { id: true, authorId: true },
  });

  // 3. For each user who has followers, create editions
  const authorIds = [...new Set(publishedPrints.map((p) => p.authorId))];

  const followers = await prisma.follow.findMany({
    where: { followingId: { in: authorIds } },
    select: { followerId: true, followingId: true },
  });

  // Group: follower -> list of followed author ids who published today
  const followerMap = new Map<string, string[]>();
  for (const f of followers) {
    const list = followerMap.get(f.followerId) || [];
    list.push(f.followingId);
    followerMap.set(f.followerId, list);
  }

  // Also add each author's own prints to their own edition
  for (const authorId of authorIds) {
    const list = followerMap.get(authorId) || [];
    if (!list.includes(authorId)) {
      list.push(authorId);
    }
    followerMap.set(authorId, list);
  }

  let editionsCreated = 0;

  for (const [userId, followedAuthorIds] of followerMap) {
    const printsForUser = publishedPrints.filter((p) =>
      followedAuthorIds.includes(p.authorId)
    );

    if (printsForUser.length === 0) continue;

    const edition = await prisma.edition.upsert({
      where: { userId_date: { userId, date: todayDate } },
      update: {},
      create: { userId, date: todayDate },
    });

    for (const print of printsForUser) {
      await prisma.editionPrint.upsert({
        where: {
          editionId_printId: {
            editionId: edition.id,
            printId: print.id,
          },
        },
        update: {},
        create: {
          editionId: edition.id,
          printId: print.id,
        },
      });
    }

    editionsCreated++;
  }

  return { printsPublished: pendingPrints.count, editionsCreated };
}
