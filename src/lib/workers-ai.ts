import "server-only";

// Free AI illustrations with Cloudflare Workers AI (FLUX.1 schnell).
// The free plan includes a daily allowance that easily covers ~10 images a day.
// Uses the same CLOUDFLARE_API_TOKEN as R2 uploads; the token needs the
// "Workers AI" permission. Set IMAGE_PROVIDER=leonardo to go back to Leonardo.
const MODEL = "@cf/black-forest-labs/flux-1-schnell";

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken || process.env.IMAGE_PROVIDER === "leonardo") {
    return null;
  }

  return { accountId, apiToken };
}

export function isWorkersAiImageConfigured() {
  return getConfig() !== null;
}

export async function generateWorkersAiImage(prompt: string) {
  const config = getConfig();

  if (!config) {
    throw new Error("Workers AI is not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN).");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt.slice(0, 2000), steps: 6 })
    }
  );
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Workers AI image failed: ${response.status} ${text.slice(0, 300)}`);
  }

  let image: unknown;
  try {
    image = (JSON.parse(text) as { result?: { image?: unknown } }).result?.image;
  } catch {
    image = null;
  }

  if (typeof image !== "string" || image.length === 0) {
    throw new Error(`Workers AI image failed: no image in response ${text.slice(0, 200)}`);
  }

  return Buffer.from(image, "base64");
}
