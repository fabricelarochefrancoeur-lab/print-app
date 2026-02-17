import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: check if current user liked + stats (only for author)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const printId = params.id;

    const print = await prisma.print.findUnique({
      where: { id: printId },
      select: { authorId: true },
    });

    if (!print) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const liked = await prisma.like.findUnique({
      where: { userId_printId: { userId, printId } },
    });

    const isAuthor = print.authorId === userId;

    // Only return count and likers if the viewer is the author
    if (isAuthor) {
      const likeCount = await prisma.like.count({ where: { printId } });
      const likers = await prisma.like.findMany({
        where: { printId },
        include: {
          user: {
            select: { username: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        liked: !!liked,
        isAuthor: true,
        likeCount,
        likers: likers.map((l) => l.user),
      });
    }

    return NextResponse.json({ liked: !!liked, isAuthor: false });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST: toggle like/unlike
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const printId = params.id;

    const existing = await prisma.like.findUnique({
      where: { userId_printId: { userId, printId } },
    });

    if (existing) {
      await prisma.like.delete({
        where: { userId_printId: { userId, printId } },
      });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({
        data: { userId, printId },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
