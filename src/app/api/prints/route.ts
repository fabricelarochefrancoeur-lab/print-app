import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { printsLimiter } from "@/lib/ratelimit";
import { sanitize } from "@/lib/sanitize";
import { validatePrintTitle, validatePrintContent } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    try {
      await printsLimiter.consume(userId);
    } catch {
      return NextResponse.json(
        { error: "Too many prints. Max 10 per hour." },
        { status: 429 }
      );
    }

    const { title, content, images } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const titleError = validatePrintTitle(title);
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    const contentError = validatePrintContent(content);
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    const cleanTitle = sanitize(title);
    const cleanContent = sanitize(content);

    const print = await prisma.print.create({
      data: {
        title: cleanTitle,
        content: cleanContent,
        images: images || [],
        authorId: userId,
        status: "PENDING",
      },
    });

    return NextResponse.json(print);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: any = {};
    if (userId) where.authorId = userId;
    if (status) where.status = status;

    const prints = await prisma.print.findMany({
      where,
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prints);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
