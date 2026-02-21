import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitize } from "@/lib/sanitize";
import { validateBio } from "@/lib/validation";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { displayName, bio, avatarUrl } = await req.json();

    if (bio !== undefined) {
      const bioError = validateBio(bio);
      if (bioError) {
        return NextResponse.json({ error: bioError }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName: sanitize(displayName) }),
        ...(bio !== undefined && { bio: sanitize(bio) }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
