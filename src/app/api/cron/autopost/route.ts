import { authorizeCron, cronStatus, runCronStep } from "@/lib/cron";
import { markJobLifecycle, runAutopostJob } from "@/lib/pipeline";

export function GET() {
  return cronStatus("autopost");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runCronStep("autopost", "autopost", () =>
    markJobLifecycle("autopost", runAutopostJob)
  );
}
