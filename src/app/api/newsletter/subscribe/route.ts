import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertNewsletterSubscriber } from "@/lib/postgres-repository";

const payloadSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120).optional(),
  sourcePage: z.string().trim().min(1).max(240).optional(),
  website: z.string().trim().max(0).optional()
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid newsletter signup payload." }, { status: 400 });
    }

    if (parsed.data.website) {
      return NextResponse.json({ ok: true, status: "ignored" });
    }

    const subscriber = await upsertNewsletterSubscriber({
      email: parsed.data.email,
      name: parsed.data.name,
      sourcePage: parsed.data.sourcePage,
      status: "active"
    });

    return NextResponse.json({
      ok: true,
      status: "subscribed",
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        sourcePage: subscriber.sourcePage,
        createdAt: subscriber.createdAt
      }
    });
  } catch (error) {
    console.error("[newsletter] subscribe failed", error);
    return NextResponse.json({ ok: false, error: "Failed to save newsletter signup." }, { status: 500 });
  }
}