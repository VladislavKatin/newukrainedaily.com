import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET(request: Request) {
  const iconUrl = new URL("/icon.svg", request.url);
  return NextResponse.redirect(iconUrl, 308);
}
