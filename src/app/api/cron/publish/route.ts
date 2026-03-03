import { authorizeCron, cronStatus, runCronStep } from "@/lib/cron";
import { markJobLifecycle, runPublishJob } from "@/lib/pipeline";

export function GET() {
  return cronStatus("publish");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runCronStep("publish", "publish", () =>
    markJobLifecycle("publish", runPublishJob)
  );
}
