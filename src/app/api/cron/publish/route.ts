import { authorizeCron, methodNotAllowed, runCronStep } from "@/lib/cron";
import { markJobLifecycle, runPublishJob } from "@/lib/pipeline";

export function GET() {
  return methodNotAllowed("publish");
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
