import { listingPageParams } from "@/lib/static-params";

export { default, generateMetadata } from "../../page";

export const dynamicParams = false;

export async function generateStaticParams() {
  return listingPageParams("news");
}
