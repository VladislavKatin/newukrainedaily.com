import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeCron } from "@/lib/cron";
import { isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram";

const payloadSchema = z.object({
  title: z.string().min(1),
  text: z.string().optional(),
  status: z.enum(["success", "warning", "error", "info"]).optional()
});

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) {
    return unauthorized;
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: false, error: "Telegram is not configured" }, { status: 503 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const result = await sendTelegramMessage(payload);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to send Telegram message" },
      { status: 500 }
    );
  }
}
