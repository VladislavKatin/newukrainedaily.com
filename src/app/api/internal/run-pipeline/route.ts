import { authorizeCron, runCronStep } from "@/lib/cron";
import { markJobLifecycle, runFullPipeline } from "@/lib/pipeline";

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runCronStep("internal/run-pipeline", "autopost", () =>
    markJobLifecycle("autopost", runFullPipeline)
  );
}
