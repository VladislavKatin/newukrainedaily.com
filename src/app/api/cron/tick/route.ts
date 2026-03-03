import { authorizeCron, methodNotAllowed } from "@/lib/cron";
import { enqueueJob, getNextFreeTopic } from "@/lib/postgres-repository";

export function GET() {
  return methodNotAllowed("tick");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const topic = await getNextFreeTopic();

    if (!topic) {
      return Response.json({
        ok: true,
        status: "idle",
        message: "No free topics available."
      });
    }

    const job = await enqueueJob({
      type: "rewrite",
      status: "pending",
      payload: {
        topicId: topic.id,
        topicTag: topic.tag,
        topicTitle: topic.title,
        mode: "topic-tick",
        createdBy: "vercel-cron"
      }
    });

    return Response.json({
      ok: true,
      status: "queued",
      topic: {
        id: topic.id,
        tag: topic.tag,
        title: topic.title
      },
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        runAt: job.runAt
      }
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to queue topic job"
      },
      { status: 503 }
    );
  }
}
