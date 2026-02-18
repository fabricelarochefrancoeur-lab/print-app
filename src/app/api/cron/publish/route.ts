import { NextResponse } from "next/server";
import { publishPendingPrints } from "@/lib/publish";

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(req.url);
    const secret = req.headers.get("authorization")?.replace("Bearer ", "") ||
      searchParams.get("secret");

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await publishPendingPrints();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
