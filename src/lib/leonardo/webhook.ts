import "server-only";

type LeonardoWebhookPayload = Record<string, unknown>;

function getNestedRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toStringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getCandidateRecords(payload: LeonardoWebhookPayload) {
  const data = getNestedRecord(payload.data);
  const object = getNestedRecord(data?.object);
  const sdGenerationJob = getNestedRecord(payload.sdGenerationJob);
  const generation = getNestedRecord(payload.generation);
  const generationByPk = getNestedRecord(payload.generations_by_pk);

  return [
    object,
    data,
    sdGenerationJob,
    generation,
    generationByPk,
    payload
  ].filter((value): value is Record<string, unknown> => Boolean(value));
}

export function extractLeonardoWebhookData(payload: LeonardoWebhookPayload) {
  const candidates = getCandidateRecords(payload);
  const generationId =
    candidates
      .map((candidate) => toStringValue(candidate.id) || toStringValue(candidate.generationId))
      .find(Boolean) ||
    toStringValue(payload.generationId);

  const type =
    candidates
      .map((candidate) => toStringValue(candidate.type))
      .find(Boolean) || "unknown";
  const status =
    candidates
      .map((candidate) => toStringValue(candidate.status))
      .find(Boolean) || null;

  const rawImages = candidates.flatMap((candidate) => [
    ...toArray(getNestedRecord(candidate.images)?.images as unknown[] | undefined),
    ...toArray(candidate.images as unknown[] | undefined),
    ...toArray(candidate.generated_images as unknown[] | undefined)
  ]);

  const imageUrl =
    rawImages
      .map((item) => {
        const record = getNestedRecord(item);
        return (
          toStringValue(record?.url) ||
          toStringValue(record?.uri) ||
          toStringValue(record?.imageUrl)
        );
      })
      .find(Boolean) || null;

  const errorMessage =
    candidates
      .map((candidate) => toStringValue(candidate.error) || toStringValue(candidate.message))
      .find(Boolean) || null;

  return {
    generationId,
    type,
    status,
    imageUrl,
    errorMessage
  };
}
