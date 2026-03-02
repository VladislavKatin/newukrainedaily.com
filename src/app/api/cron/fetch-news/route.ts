import { authorizeCron, runCronStep } from "@/lib/cron";
import { ingestRssSources } from "@/lib/ingestion/rss";
import { markJobLifecycle } from "@/lib/pipeline";

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runCronStep("fetch-news", "fetch", () =>
    markJobLifecycle("fetch", ingestRssSources)
  );
}
