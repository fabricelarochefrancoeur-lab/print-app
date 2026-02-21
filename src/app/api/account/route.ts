import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { getIP } from "@/lib/ratelimit";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const ip = getIP(req);

    // Delete all related data in correct order
    // 1. Edition prints (junction table)
    await prisma.editionPrint.deleteMany({
      where: { edition: { userId } },
    });

    // 2. Editions
    await prisma.edition.deleteMany({
      where: { userId },
    });

    // 3. Likes (given and received)
    await prisma.like.deleteMany({
      where: { OR: [{ userId }, { print: { authorId: userId } }] },
    });

    // 4. Follows (both directions)
    await prisma.follow.deleteMany({
      where: { OR: [{ followerId: userId }, { followingId: userId }] },
    });

    // 5. Prints
    await prisma.print.deleteMany({
      where: { authorId: userId },
    });

    // 6. Audit log before deleting user
    await audit("ACCOUNT_DELETED", ip, userId);

    // 7. User
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[account/delete]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
