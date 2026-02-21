import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const SYSTEM_USERNAME = "print_team";
const SYSTEM_EMAIL = "system@print.app";
const SYSTEM_DISPLAY_NAME = "PRINT Team";

const WELCOME_PRINTS = [
  {
    title: "Welcome to PRINT",
    content:
      "Welcome to PRINT! We're thrilled to have you here. PRINT is your daily newspaper, curated just for you. Every day, a new edition lands on your doorstep — filled with stories, thoughts, and creations from the people you follow.",
  },
  {
    title: "Welcome to PRINT",
    content:
      "How it works: write a PRINT and publish it. It will appear in the next edition of everyone who follows you. Think of it as sending a letter to all your readers at once. Short or long, funny or serious — it's your page.",
  },
  {
    title: "Welcome to PRINT",
    content:
      "Discover and connect: follow people whose writing you enjoy. Clip PRINTs you love to save them for later. Like a PRINT to let the author know you appreciated it. The more people you follow, the richer your daily edition becomes.",
  },
  {
    title: "Welcome to PRINT",
    content:
      "Ready to get started? Head to your profile and write your first PRINT. Then follow a few people and check back tomorrow for your next edition. Happy reading, happy writing!",
  },
];

async function main() {
  console.log("Seeding welcome PRINTs...");

  // 1. Upsert system user
  const randomPassword = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await hash(randomPassword, 12);

  const systemUser = await prisma.user.upsert({
    where: { username: SYSTEM_USERNAME },
    update: {},
    create: {
      email: SYSTEM_EMAIL,
      password: hashedPassword,
      username: SYSTEM_USERNAME,
      displayName: SYSTEM_DISPLAY_NAME,
    },
  });
  console.log(`System user: ${systemUser.id} (${systemUser.username})`);

  // 2. Create the 4 welcome PRINTs (idempotent via upsert on unique fields)
  const now = new Date();
  const printIds: string[] = [];

  for (let i = 0; i < WELCOME_PRINTS.length; i++) {
    const wp = WELCOME_PRINTS[i];
    // Use findFirst + create pattern for idempotency
    let print = await prisma.print.findFirst({
      where: {
        authorId: systemUser.id,
        title: wp.title,
        content: wp.content,
      },
    });

    if (!print) {
      print = await prisma.print.create({
        data: {
          title: wp.title,
          content: wp.content,
          authorId: systemUser.id,
          status: "PUBLISHED",
          publishedAt: now,
        },
      });
      console.log(`Created welcome PRINT ${i + 1}: ${print.id}`);
    } else {
      console.log(`Welcome PRINT ${i + 1} already exists: ${print.id}`);
    }
    printIds.push(print.id);
  }

  // 3. For each existing user, upsert their welcome edition and add PRINTs
  const users = await prisma.user.findMany({
    where: { username: { not: SYSTEM_USERNAME } },
    select: { id: true, createdAt: true },
  });

  console.log(`Processing ${users.length} existing users...`);

  for (const user of users) {
    // Truncate createdAt to start of UTC day
    const regDate = new Date(
      Date.UTC(
        user.createdAt.getUTCFullYear(),
        user.createdAt.getUTCMonth(),
        user.createdAt.getUTCDate()
      )
    );

    const edition = await prisma.edition.upsert({
      where: { userId_date: { userId: user.id, date: regDate } },
      update: {},
      create: { userId: user.id, date: regDate },
    });

    await prisma.editionPrint.createMany({
      data: printIds.map((printId) => ({
        editionId: edition.id,
        printId,
      })),
      skipDuplicates: true,
    });

    console.log(`  User ${user.id}: edition ${edition.id} at ${regDate.toISOString()}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
