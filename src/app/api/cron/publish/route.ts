import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(req.url);
    const secret = req.headers.get("authorization")?.replace("Bearer ", "") ||
      searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // 1. Publish all pending prints
    const pendingPrints = await prisma.print.updateMany({
      where: { status: "PENDING" },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
      },
    });

    // 2. Get all just-published prints
    const publishedPrints = await prisma.print.findMany({
      where: {
        publishedAt: { gte: todayDate },
        status: "PUBLISHED",
      },
      select: { id: true, authorId: true },
    });

    // 3. For each user who has followers, create editions
    const authorIds = [...new Set(publishedPrints.map((p) => p.authorId))];

    // Find all users who follow any of these authors
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

    let editionsCreated = 0;

    for (const [userId, followedAuthorIds] of followerMap) {
      // Get prints from followed authors published today
      const printsForUser = publishedPrints.filter((p) =>
        followedAuthorIds.includes(p.authorId)
      );

      if (printsForUser.length === 0) continue;

      // Create edition
      const edition = await prisma.edition.upsert({
        where: { userId_date: { userId, date: todayDate } },
        update: {},
        create: { userId, date: todayDate },
      });

      // Link prints to edition
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

    return NextResponse.json({
      success: true,
      printsPublished: pendingPrints.count,
      editionsCreated,
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
