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

export function extractLeonardoWebhookData(payload: LeonardoWebhookPayload) {
  const data = getNestedRecord(payload.data) || payload;
  const object = getNestedRecord(data.object) || data;
  const generationId =
    toStringValue(object.id) ||
    toStringValue(object.generationId) ||
    toStringValue(payload.generationId);

  const type = toStringValue(payload.type) || toStringValue(data.type) || "unknown";
  const status =
    toStringValue(object.status) || toStringValue(data.status) || toStringValue(payload.status);

  const rawImages = [
    ...toArray(getNestedRecord(object.images)?.images as unknown[] | undefined),
    ...toArray(object.images as unknown[] | undefined),
    ...toArray(object.generated_images as unknown[] | undefined),
    ...toArray(data.images as unknown[] | undefined)
  ];

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
    toStringValue(object.error) ||
    toStringValue(data.error) ||
    toStringValue(payload.error) ||
    null;

  return {
    generationId,
    type,
    status,
    imageUrl,
    errorMessage
  };
}

