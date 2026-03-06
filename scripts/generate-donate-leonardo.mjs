import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://cloud.leonardo.ai/api/rest/v1/generations";
const OUTPUT_FILES = [
  "donate-leonardo-1.jpg",
  "donate-leonardo-2.jpg",
  "donate-leonardo-3.jpg"
];

async function loadEnvFromFile(fileName) {
  try {
    const fullPath = path.join(process.cwd(), fileName);
    const content = await fs.readFile(fullPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalIndex = trimmed.indexOf("=");
      if (equalIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // File does not exist or is unreadable.
  }
}

function requireLeonardoKey() {
  const key = process.env.LEONARDO_API_KEY;
  if (!key) {
    throw new Error("Missing LEONARDO_API_KEY. Set it in environment or .env.local.");
  }
  return key;
}

async function createGeneration(apiKey, prompt) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      prompt,
      modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",
      width: 1536,
      height: 1024,
      num_images: 1,
      presetStyle: "CINEMATIC"
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create generation failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const generationId =
    payload?.generationId || payload?.sdGenerationJob?.generationId || payload?.sdGenerationJob?.id;

  if (!generationId || typeof generationId !== "string") {
    throw new Error("Leonardo did not return generationId.");
  }

  return generationId;
}

function findImageUrl(payload) {
  const root = payload?.generations_by_pk || payload?.sdGenerationJob || payload;
  const images = root?.generated_images || root?.images || [];
  for (const image of images) {
    const candidate =
      image?.url || image?.generated_image?.url || image?.generatedImageUrl || image?.imageUrl;
    if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function waitForImageUrl(apiKey, generationId) {
  const maxAttempts = 40;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${API_BASE}/${generationId}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Get generation failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const status =
      payload?.generations_by_pk?.status || payload?.sdGenerationJob?.status || payload?.status || "UNKNOWN";
    const imageUrl = findImageUrl(payload);

    if (imageUrl) {
      return imageUrl;
    }

    if (status === "FAILED") {
      const reason =
        payload?.generations_by_pk?.error ||
        payload?.sdGenerationJob?.error ||
        payload?.error ||
        "Unknown failure";
      throw new Error(`Generation failed: ${String(reason)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 4000));
    process.stdout.write(`Waiting for generation ${generationId} (${attempt}/${maxAttempts})...\n`);
  }

  throw new Error(`Timed out waiting for generation ${generationId}.`);
}

async function downloadImage(url, outputFileName) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  const outputDir = path.join(process.cwd(), "public");
  const targetPath = path.join(outputDir, outputFileName);
  await fs.writeFile(targetPath, data);
  return targetPath;
}

async function run() {
  await loadEnvFromFile(".env.local");
  await loadEnvFromFile(".env");
  const apiKey = requireLeonardoKey();

  const prompts = [
    "Minimal editorial illustration of humanitarian aid planning for Ukraine, clean composition, flat geometric forms, restrained blue and yellow palette, subtle paper texture, professional news visual, 16:9, no text, no logos",
    "Minimal editorial illustration of transparent donation workflow and accountability, abstract charts, boxes and flow lines, muted neutral palette with blue accent, modern magazine style, 16:9, no text, no logos",
    "Minimal editorial illustration of long-term rebuilding support for Ukrainian communities, symbolic city blocks and support hands, calm tonal contrast, balanced editorial layout, 16:9, no text, no logos"
  ];

  for (let index = 0; index < prompts.length; index += 1) {
    const prompt = prompts[index];
    const fileName = OUTPUT_FILES[index];
    process.stdout.write(`Generating ${fileName}...\n`);
    const generationId = await createGeneration(apiKey, prompt);
    process.stdout.write(`Generation started: ${generationId}\n`);
    const imageUrl = await waitForImageUrl(apiKey, generationId);
    const savedPath = await downloadImage(imageUrl, fileName);
    process.stdout.write(`Saved: ${savedPath}\n`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
