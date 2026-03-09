import assert from "node:assert/strict";

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const fillerPatterns = [
  /as the situation continues to develop[^.!?]*[.!?]/gi,
  /this underscores[^.!?]*[.!?]/gi,
  /this highlights[^.!?]*[.!?]/gi
];

function splitContentBlocks(value) {
  const rawBlocks = normalizeWhitespace(value)
    .split(/\n{2,}|(?=^#{1,3}\s+)/m)
    .map((block) => block.trim())
    .filter(Boolean);

  const blocks = [];

  for (const block of rawBlocks) {
    const headingMatch = block.match(/^(#{1,3}\s+[^\n]+)\n+([\s\S]+)$/);

    if (headingMatch) {
      blocks.push(headingMatch[1].trim());
      if (headingMatch[2].trim()) {
        blocks.push(headingMatch[2].trim());
      }
      continue;
    }

    blocks.push(block);
  }

  return blocks;
}

function cleanAIFiller(text) {
  const blocks = splitContentBlocks(text);

  return blocks
    .map((block) => {
      if (/^#{1,3}\s+/.test(block)) {
        return block;
      }

      let result = block;
      for (const pattern of fillerPatterns) {
        result = result.replace(pattern, " ");
      }

      return normalizeWhitespace(result);
    })
    .join("\n\n");
}

function splitSentences(value) {
  return normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitIntoEditorialParagraphs(text) {
  const paragraphs = [];
  const blocks = splitContentBlocks(cleanAIFiller(text));

  for (const block of blocks) {
    if (/^#{1,3}\s+/.test(block)) {
      paragraphs.push(block);
      continue;
    }

    const sentences = splitSentences(block);
    let bucket = [];

    for (const sentence of sentences) {
      bucket.push(sentence);
      if (bucket.length >= 2) {
        paragraphs.push(bucket.join(" "));
        bucket = [];
      }
    }

    if (bucket.length > 0) {
      paragraphs.push(bucket.join(" "));
    }
  }

  return paragraphs;
}

function buildImageCaption(kind, sourceName) {
  if (kind === "preview") {
    return `Photo: ${sourceName}`;
  }

  return "AI illustration based on reported details. Not a documentary image.";
}

function normalizeVisibleCaption(caption, kind, sourceName) {
  const normalized = normalizeWhitespace(caption);
  if (
    kind === "generated" &&
    /^illustration generated with ai \(leonardo\) based on the headline$/i.test(normalized)
  ) {
    return buildImageCaption("generated", sourceName);
  }

  return normalized || buildImageCaption(kind, sourceName);
}

function normalizeImageBlocks(input) {
  const previewImageUrl = normalizeWhitespace(input.previewImageUrl || "") || undefined;
  const generatedImageUrl = normalizeWhitespace(input.generatedImageUrl || "") || undefined;

  return {
    previewImageUrl,
    generatedImageUrl:
      previewImageUrl && generatedImageUrl && previewImageUrl === generatedImageUrl
        ? undefined
        : generatedImageUrl
  };
}

function run() {
  const duplicateImageResult = normalizeImageBlocks({
    previewImageUrl: "https://cdn.example.com/photo.jpg",
    generatedImageUrl: "https://cdn.example.com/photo.jpg"
  });
  assert.equal(duplicateImageResult.previewImageUrl, "https://cdn.example.com/photo.jpg");
  assert.equal(duplicateImageResult.generatedImageUrl, undefined);

  const aiCaption = normalizeVisibleCaption(
    "Illustration generated with AI (Leonardo) based on the headline",
    "generated",
    "Ukrinform"
  );
  assert.equal(
    aiCaption,
    "AI illustration based on reported details. Not a documentary image."
  );

  const cleaned = cleanAIFiller(
    "Ukraine's Air Force reported new attacks. As the situation continues to develop, officials are monitoring the response. The Air Force said several regions were targeted."
  );
  assert.equal(cleaned.includes("As the situation continues to develop"), false);
  assert.equal(cleaned.includes("Ukraine's Air Force reported new attacks."), true);

  const paragraphs = splitIntoEditorialParagraphs(
    "Ukraine's Air Force said Russia launched 199 drones overnight on March 9 targeting several regions. Ukrainian defenses intercepted most of them. Frontline areas remained harder to protect. Officials said debris caused damage in several communities. Regional authorities reported emergency crews were responding. Military officials said the attacks again focused pressure on air defense systems."
  );
  assert.ok(paragraphs.length >= 2);

  const headingParagraphs = splitIntoEditorialParagraphs(
    "## Introduction\nUkraine support remains essential.\n## Why It Matters\nCommunities need stable aid."
  );
  assert.equal(headingParagraphs[0], "## Introduction");
  assert.equal(headingParagraphs[1].includes("Ukraine support remains essential."), true);
  assert.equal(headingParagraphs[2], "## Why It Matters");

  assert.equal(buildImageCaption("preview", "Ukrinform EN"), "Photo: Ukrinform EN");

  console.log("[test:content] all checks passed");
}

run();
