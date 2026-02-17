import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (date) {
      const edition = await prisma.edition.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(date),
          },
        },
        include: {
          editionPrint: {
            include: {
              print: {
                include: {
                  author: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!edition) {
        return NextResponse.json({ prints: [], date });
      }

      const prints = edition.editionPrint.map((ep) => ep.print);
      // Shuffle prints for random order
      for (let i = prints.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [prints[i], prints[j]] = [prints[j], prints[i]];
      }

      return NextResponse.json({ prints, date, editionId: edition.id });
    }

    // Ensure today's edition exists
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.edition.upsert({
      where: { userId_date: { userId, date: today } },
      update: {},
      create: { userId, date: today },
    });

    // List all editions for user
    const editions = await prisma.edition.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: {
        _count: { select: { editionPrint: true } },
      },
    });

    return NextResponse.json(editions);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
