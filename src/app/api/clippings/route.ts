import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const clips = await prisma.clip.findMany({
      where: { userId },
      orderBy: { clippedAt: "desc" },
      include: {
        print: {
          include: {
            author: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Sort explicitly to guarantee most-recently-clipped first
    clips.sort((a, b) => new Date(b.clippedAt).getTime() - new Date(a.clippedAt).getTime());

    console.log("[clippings] order:", clips.map((c, i) => `${i}: printId=${c.printId} clippedAt=${c.clippedAt.toISOString()}`));

    const prints = clips.map((clip) => ({
      ...clip.print,
      images: clip.print.images || [],
      clippedAt: clip.clippedAt.toISOString(),
    }));

    return NextResponse.json(prints);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
