import { GET as getFeedXml } from "@/app/feed.xml/route";

export async function GET() {
  return getFeedXml();
}
