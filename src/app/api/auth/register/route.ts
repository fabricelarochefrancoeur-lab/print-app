import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authLimiter, getIP } from "@/lib/ratelimit";
import { sanitize } from "@/lib/sanitize";
import { validateEmail, validateUsername } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { addWelcomePrintsToEdition } from "@/lib/welcome";

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    try {
      await authLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const { email, password, username, displayName } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password and username are required" },
        { status: 400 }
      );
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return NextResponse.json({ error: usernameError }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one lowercase letter" },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const cleanUsername = sanitize(username);
    const cleanDisplayName = displayName ? sanitize(displayName) : cleanUsername;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: cleanUsername,
        displayName: cleanDisplayName,
      },
    });

    await audit("ACCOUNT_CREATED", ip, user.id);

    // Create first edition for today so new users see it immediately
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const edition = await prisma.edition.create({
      data: {
        userId: user.id,
        date: today,
      },
    });

    // Add welcome PRINTs to the first edition
    await addWelcomePrintsToEdition(edition.id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
