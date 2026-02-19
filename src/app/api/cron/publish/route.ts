import { NextResponse } from "next/server";
import { publishPendingPrints } from "@/lib/publish";

export async function GET(req: Request) {
  const startTime = Date.now();
  const startedAt = new Date().toISOString();
  console.log(`[CRON] publish started at ${startedAt}`);

  try {
    // Verify cron secret
    const { searchParams } = new URL(req.url);
    const secret = req.headers.get("authorization")?.replace("Bearer ", "") ||
      searchParams.get("secret");

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      console.log(`[CRON] publish unauthorized attempt at ${startedAt}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await publishPendingPrints();
    const duration = Date.now() - startTime;

    console.log(
      `[CRON] publish completed in ${duration}ms — ` +
      `${result.printsPublished} prints published, ${result.editionsCreated} editions created`
    );

    return NextResponse.json({
      success: true,
      startedAt,
      duration: `${duration}ms`,
      ...result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[CRON] publish FAILED after ${duration}ms:`, error);
    return NextResponse.json(
      { error: "Something went wrong", startedAt, duration: `${duration}ms` },
      { status: 500 }
    );
  }
}
