import { prisma } from "@/lib/prisma";

export const SYSTEM_USERNAME = "print_team";

export async function addWelcomePrintsToEdition(editionId: string) {
  const welcomePrints = await prisma.print.findMany({
    where: {
      author: { username: SYSTEM_USERNAME },
      title: "Welcome to PRINT",
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  if (welcomePrints.length === 0) return;

  await prisma.editionPrint.createMany({
    data: welcomePrints.map((p) => ({
      editionId,
      printId: p.id,
    })),
    skipDuplicates: true,
  });
}
