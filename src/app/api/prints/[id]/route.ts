import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const print = await prisma.print.findUnique({
      where: { id: params.id },
    });

    if (!print) {
      return NextResponse.json({ error: "Print not found" }, { status: 404 });
    }

    if (print.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (print.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cannot edit a published PRINT" },
        { status: 400 }
      );
    }

    const { title, content, images } = await req.json();

    const updated = await prisma.print.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(images !== undefined && { images }),
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const print = await prisma.print.findUnique({
      where: { id: params.id },
    });

    if (!print) {
      return NextResponse.json({ error: "Print not found" }, { status: 404 });
    }

    if (print.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (print.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cannot delete a published PRINT" },
        { status: 400 }
      );
    }

    await prisma.print.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
