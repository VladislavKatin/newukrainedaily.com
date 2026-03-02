import { authorizeCron, runCronStep } from "@/lib/cron";
import { markJobLifecycle, runGenerateImagesJob } from "@/lib/pipeline";

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runCronStep("generate-images", "image", () =>
    markJobLifecycle("image", runGenerateImagesJob)
  );
}
