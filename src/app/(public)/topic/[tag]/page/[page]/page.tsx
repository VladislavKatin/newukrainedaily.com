import { topicPageParams } from "@/lib/static-params";

export { default, generateMetadata } from "../../page";

export const dynamicParams = false;

export async function generateStaticParams() {
  return topicPageParams();
}
