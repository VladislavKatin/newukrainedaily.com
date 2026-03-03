import { authorizeCron, cronStatus, runCronStep } from "@/lib/cron";
import { markJobLifecycle, runRewriteNewsJob } from "@/lib/pipeline";

export function GET() {
  return cronStatus("rewrite-news");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runCronStep("rewrite-news", "rewrite", () =>
    markJobLifecycle("rewrite", runRewriteNewsJob)
  );
}
