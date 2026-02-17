import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Delete all related data in correct order
    // 1. Edition prints (junction table)
    await prisma.editionPrint.deleteMany({
      where: { edition: { userId } },
    });

    // 2. Editions
    await prisma.edition.deleteMany({
      where: { userId },
    });

    // 3. Follows (both directions)
    await prisma.follow.deleteMany({
      where: { OR: [{ followerId: userId }, { followingId: userId }] },
    });

    // 4. Prints
    await prisma.print.deleteMany({
      where: { authorId: userId },
    });

    // 5. User
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
