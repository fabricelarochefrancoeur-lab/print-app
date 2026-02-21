import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clipsLimiter } from "@/lib/ratelimit";

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

    const clip = await prisma.clip.findUnique({
      where: { userId_printId: { userId, printId } },
    });

    return NextResponse.json({ clipped: !!clip });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

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

    try {
      await clipsLimiter.consume(userId);
    } catch {
      return NextResponse.json(
        { error: "Too many clips. Max 100 per hour." },
        { status: 429 }
      );
    }

    const existing = await prisma.clip.findUnique({
      where: { userId_printId: { userId, printId } },
    });

    if (existing) {
      await prisma.clip.delete({
        where: { userId_printId: { userId, printId } },
      });
      return NextResponse.json({ clipped: false });
    } else {
      await prisma.clip.create({
        data: { userId, printId },
      });
      return NextResponse.json({ clipped: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
