import { GET as getFeedXml } from "@/app/feed.xml/route";

export const dynamic = "force-static";

export async function GET() {
  return getFeedXml();
}
