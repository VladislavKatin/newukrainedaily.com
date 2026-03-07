import "server-only";
import { rewriteRawNews } from "@/lib/ai/rewrite-service";
import { buildInternalLinks } from "@/lib/internal-linker";
import {
  buildNewsFingerprint,
  charCount,
  normalizeCanonicalUrl,
  readingTimeMinutes,
  wordCount
} from "@/lib/news-normalization";
import { getEnv } from "@/lib/env";
import { ingestRssSources } from "@/lib/ingestion/rss";
import { createLeonardoGeneration, getLeonardoGeneration } from "@/lib/leonardo/client";
import { extractLeonardoWebhookData } from "@/lib/leonardo/webhook";
import { absoluteUrl, siteConfig } from "@/lib/site";
import {
  countPublishedNewsSince,
  completeNewsImage,
  enqueueJob,
  failNewsImage,
  getRawNewsById,
  getNewsImageByGenerationId,
  getNewsImageByNewsItemId,
  getNewsBySlug,
  getNewsByTitle,
  listCandidateRawNews,
  listRecentPublishedNews,
  listNewsItemsNeedingImageGeneration,
  listPendingJobs,
  listPublishReadyNews,
  publishNewsItem,
  upsertNewsImageRequest,
  updateJob,
  updateNewsItemAssets,
  upsertNewsItem,
  upsertTopic
} from "@/lib/postgres-repository";
import { slugify } from "@/lib/slug";
import { saveRemoteImage } from "@/lib/storage";

function sleep(milliseconds: number) {
  if (milliseconds <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getPipelineLimits() {
  const env = getEnv();

  return {
    fetchSourcesLimit: env.FETCH_SOURCES_LIMIT ?? 20,
    fetchItemsPerSourceLimit: env.FETCH_ITEMS_PER_SOURCE_LIMIT ?? 15,
    rewriteBatchLimit: env.REWRITE_BATCH_LIMIT ?? 8,
    rewriteRequestSpacingMs: env.REWRITE_REQUEST_SPACING_MS ?? 1500,
    imageBatchLimit: env.IMAGE_BATCH_LIMIT ?? 4,
    imageMaxAttempts: env.IMAGE_MAX_ATTEMPTS ?? 3,
    imageStaleMinutes: env.IMAGE_STALE_MINUTES ?? 60,
    imageRequestSpacingMs: env.IMAGE_REQUEST_SPACING_MS ?? 2500,
    publishBatchLimit: env.PUBLISH_BATCH_LIMIT ?? 5
  };
}

function stripHtml(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveTags(title: string, snippet: string | null) {
  const seed = `${title} ${snippet || ""}`.toLowerCase();
  const tags = new Set<string>();

  if (seed.includes("humanitarian") || seed.includes("aid")) tags.add("humanitarian");
  if (seed.includes("logistics") || seed.includes("supply")) tags.add("logistics");
  if (seed.includes("energy") || seed.includes("power")) tags.add("energy");
  if (seed.includes("recovery") || seed.includes("rebuild")) tags.add("recovery");
  if (tags.size === 0) tags.add("support");

  return Array.from(tags);
}

async function buildUniqueTitle(baseTitle: string) {
  let attempt = 0;
  let title = baseTitle.slice(0, 90).trim();

  while (attempt < 50) {
    const existing = await getNewsByTitle(title);
    if (!existing) {
      return title;
    }

    attempt += 1;
    const suffix = ` (${attempt + 1})`;
    title = `${baseTitle.slice(0, Math.max(1, 90 - suffix.length)).trim()}${suffix}`;
  }

  return `${baseTitle.slice(0, 70).trim()} ${Date.now()}`.slice(0, 90);
}

function buildImagePrompt(input: {
  title: string;
  dek: string | null;
  summary: string | null;
  whyItMatters: string | null;
  tags: string[];
  sourceName: string | null;
}) {
  const sanitizeForImagePrompt = (value: string | null | undefined) =>
    (value || "")
      .replace(/\s+/g, " ")
      .replace(/\b(sexual violence|rape|torture|massacre|gore|blood|execution)\b/gi, "human rights abuse")
      .trim();

  const tagText = sanitizeForImagePrompt(input.tags.slice(0, 6).join(", "));
  const summaryText = sanitizeForImagePrompt(input.summary);
  const whyText = sanitizeForImagePrompt(input.whyItMatters);
  const titleText = sanitizeForImagePrompt(input.title);
  const dekText = sanitizeForImagePrompt(input.dek);
  const sourceText = sanitizeForImagePrompt(input.sourceName);

  return [
    "Create a photorealistic editorial cover image for a Ukraine news article.",
    `Headline context: ${titleText}.`,
    dekText ? `Short brief: ${dekText}.` : null,
    summaryText ? `Article summary: ${summaryText.slice(0, 320)}.` : null,
    whyText ? `Editorial importance: ${whyText.slice(0, 220)}.` : null,
    tagText ? `Themes: ${tagText}.` : null,
    sourceText ? `Source context: ${sourceText}.` : null,
    "Show concrete human, infrastructure, or institutional context implied by the article.",
    "Use symbolic and non-graphic composition. No text overlays, no watermarks, no logos, no explicit violence, cinematic natural light, realistic reportage style."
  ]
    .filter(Boolean)
    .join(" ");
}

function isModerationFailure(errorMessage: string) {
  return /content moderated|moderation|safety|policy/i.test(errorMessage);
}

function getUtcDayStartIso(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  ).toISOString();
}

async function buildUniqueSlug(baseSlug: string) {
  let attempt = 0;
  let slug = baseSlug;

  while (attempt < 50) {
    const existing = await getNewsBySlug(slug);
    if (!existing) {
      return slug;
    }

    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function runFetchNewsJob(options?: {
  sourceLimit?: number;
  itemsPerSourceLimit?: number;
}) {
  const limits = getPipelineLimits();
  return ingestRssSources({
    sourceLimit: options?.sourceLimit ?? limits.fetchSourcesLimit,
    itemsPerSourceLimit: options?.itemsPerSourceLimit ?? limits.fetchItemsPerSourceLimit
  });
}

export async function runRewriteNewsJob(limitOverride?: number) {
  const limits = getPipelineLimits();
  const rewriteLimit = limitOverride ?? limits.rewriteBatchLimit;
  const pendingRaws = await listCandidateRawNews(Math.max(rewriteLimit * 6, rewriteLimit), 48);
  const publishedPool = await listRecentPublishedNews(200);

  let createdDrafts = 0;
  let topicsUpdated = 0;
  let jobsQueued = 0;
  let skipped = 0;
  let scanned = 0;

  for (const raw of pendingRaws) {
    if (createdDrafts >= rewriteLimit) {
      break;
    }

    scanned += 1;
    const rewritten = await rewriteRawNews(raw);

    if (!rewritten) {
      skipped += 1;
      continue;
    }

    const cleanedSnippet = stripHtml(raw.contentSnippet);
    const slugBase = slugify(rewritten.title) || slugify(raw.title) || `news-${raw.id.slice(0, 8)}`;
    const slug = await buildUniqueSlug(slugBase);
    const title = await buildUniqueTitle(rewritten.title);
    const tags = Array.from(new Set([...rewritten.tags, ...deriveTags(raw.title, cleanedSnippet)])).slice(0, 10);
    const topics = Array.from(new Set(rewritten.topics)).slice(0, 6);
    const entities = Array.from(new Set(rewritten.entities)).slice(0, 12);
    const primaryTopic = rewritten.primary_topic || topics[0] || tags[0] || "World";
    const canonicalUrl = normalizeCanonicalUrl(raw.canonicalUrl || raw.url);
    const sourceUrl = raw.url || raw.sourceUrl || raw.canonicalUrl || null;
    const content = rewritten.body;
    const entryCharCount = charCount(content);
    const entryWordCount = wordCount(content);
    const entryReadingTime = readingTimeMinutes(content);
    const fingerprint = buildNewsFingerprint({
      title,
      sourceName: raw.sourceName,
      canonicalUrl,
      publishedAt: raw.publishedAt
    });

    const linkingSeed = {
      id: `draft:${slug}`,
      rawId: raw.id,
      slug,
      title,
      dek: rewritten.lede,
      summary: rewritten.body,
      content,
      keyPoints: rewritten.key_points,
      whyItMatters: rewritten.why_it_matters,
      tags,
      topics,
      entities,
      coverImageUrl: null,
      ogImageUrl: null,
      ogImageAlt: rewritten.image_alt,
      previewImageUrl: raw.previewImageUrl ?? null,
      previewImageSource: raw.previewImageSource ?? null,
      previewImageCaption: raw.previewImageCaption ?? null,
      generatedImagePrompt: rewritten.image_prompt,
      generatedImageUrl: null,
      generatedImageAlt: rewritten.image_alt,
      generatedImageCaption: null,
      sourceName: raw.sourceName || "Unknown Source",
      sourceUrl: sourceUrl || null,
      canonicalUrl,
      metaTitle: rewritten.meta_title,
      metaDescription: rewritten.meta_description,
      readingTimeMinutes: entryReadingTime,
      wordCount: entryWordCount,
      charCount: entryCharCount,
      internalLinks: [],
      relatedIds: [],
      fingerprint,
      isDuplicate: false,
      qualityScore: 0.9,
      primaryTopic,
      location: rewritten.location || null,
      scheduledAt: null,
      indexable: true,
      status: "draft" as const,
      language: "en",
      publishedAt: raw.publishedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const linking = buildInternalLinks(linkingSeed, publishedPool);

    await upsertNewsItem({
      rawId: raw.id,
      slug,
      title,
      dek: rewritten.lede,
      summary: rewritten.lede,
      content,
      keyPoints: rewritten.key_points,
      whyItMatters: rewritten.why_it_matters,
      tags,
      topics,
      entities,
      previewImageUrl: raw.previewImageUrl ?? null,
      previewImageSource: raw.previewImageSource ?? null,
      previewImageCaption: raw.previewImageCaption ?? null,
      generatedImagePrompt: rewritten.image_prompt,
      generatedImageAlt: rewritten.image_alt,
      sourceName: raw.sourceName || "Unknown Source",
      sourceUrl: sourceUrl || null,
      canonicalUrl,
      metaTitle: rewritten.meta_title,
      metaDescription: rewritten.meta_description,
      readingTimeMinutes: entryReadingTime,
      wordCount: entryWordCount,
      charCount: entryCharCount,
      internalLinks: linking.links,
      relatedIds: linking.relatedIds,
      fingerprint,
      qualityScore: 0.9,
      primaryTopic,
      location: rewritten.location || null,
      status: "draft",
      language: "en",
      publishedAt: raw.publishedAt
    });

    createdDrafts += 1;

    for (const tag of tags) {
      await upsertTopic({
        tag,
        title: tag.charAt(0).toUpperCase() + tag.slice(1),
        description: `Coverage, context, and related reporting for ${tag}.`
      });
      topicsUpdated += 1;
    }

    await enqueueJob({
      type: "image",
      payload: { rawId: raw.id, slug }
    });
    jobsQueued += 1;

    await sleep(limits.rewriteRequestSpacingMs);
  }

  return {
    ok: true,
    processed: scanned,
    createdDrafts,
    topicsUpdated,
    jobsQueued,
    skipped
  };
}

export async function runGenerateImagesJob(limitOverride?: number) {
  const limits = getPipelineLimits();
  const draftItems = await listNewsItemsNeedingImageGeneration(
    limitOverride ?? limits.imageBatchLimit,
    limits.imageMaxAttempts
  );
  let requested = 0;
  let completed = 0;
  let skipped = 0;
  let failed = 0;
  let retried = 0;
  const errors: Array<{ slug: string; message: string }> = [];

  for (const item of draftItems) {
    if (!item.summary || !item.dek || !item.whyItMatters || item.tags.length === 0) {
      skipped += 1;
      continue;
    }

    const previousRequest = await getNewsImageByNewsItemId(item.id);
    const prompt = buildImagePrompt({
      title: item.title,
      dek: item.dek,
      summary: item.summary,
      whyItMatters: item.whyItMatters,
      tags: item.tags,
      sourceName: item.sourceName
    });
    const attempts = (previousRequest?.attempts ?? 0) + 1;

    try {
      if (previousRequest?.status === "requested" && previousRequest.generationId) {
        retried += 1;
        const generation = await getLeonardoGeneration(previousRequest.generationId);

        if (generation.status && ["failed", "error"].includes(generation.status.toLowerCase())) {
          const message = generation.errorMessage || "Leonardo generation failed";
          failed += 1;
          errors.push({ slug: item.slug, message });
          await failNewsImage({
            generationId: previousRequest.generationId,
            error: message,
            webhookPayload: generation.payload
          });
          continue;
        }

        if (generation.imageUrl) {
          const stored = await saveRemoteImage(generation.imageUrl, item.id);
          await completeNewsImage({
            generationId: previousRequest.generationId,
            remoteImageUrl: generation.imageUrl,
            localPath: stored.filePath,
            localImageUrl: stored.publicUrl,
            webhookPayload: generation.payload
          });
          await updateNewsItemAssets(item.id, {
            coverImageUrl: stored.publicUrl,
            ogImageUrl: stored.publicUrl,
            generatedImageUrl: stored.publicUrl,
            generatedImageCaption:
              item.generatedImageCaption ||
              "Illustration generated with AI (Leonardo) based on the headline"
          });
          completed += 1;
          continue;
        }

        continue;
      }

      const generation = await createLeonardoGeneration({ prompt });

      await upsertNewsImageRequest({
        newsItemId: item.id,
        prompt,
        generationId: generation.generationId,
        status: "requested",
        attempts
      });

      requested += 1;
      await sleep(limits.imageRequestSpacingMs);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown Leonardo error";
      const terminalModerationFailure = isModerationFailure(message);
      errors.push({
        slug: item.slug,
        message
      });
      if (terminalModerationFailure) {
        const fallbackImageUrl = absoluteUrl(siteConfig.defaultOgImage);
        await updateNewsItemAssets(item.id, {
          coverImageUrl: fallbackImageUrl,
          ogImageUrl: fallbackImageUrl,
          generatedImageUrl: fallbackImageUrl,
          generatedImageCaption:
            "Illustration generated with AI (Leonardo) based on the headline"
        });
      }
      await upsertNewsImageRequest({
        newsItemId: item.id,
        prompt,
        status: "failed",
        attempts: terminalModerationFailure ? limits.imageMaxAttempts : attempts,
        lastError: message
      });
    }
  }

  return {
    ok: true,
    processed: draftItems.length,
    requested,
    completed,
    retried,
    skipped,
    failed,
    errors
  };
}

export async function runPublishJob(limit?: number) {
  const limits = getPipelineLimits();
  const publishLimit = Math.min(limit ?? getEnv().DAILY_PUBLISH_LIMIT ?? 10, limits.publishBatchLimit);
  const publishedToday = await countPublishedNewsSince(getUtcDayStartIso());
  const availableSlots = Math.max(publishLimit - publishedToday, 0);

  if (availableSlots === 0) {
    return {
      ok: true,
      processed: 0,
      published: 0,
      publishedToday,
      availableSlots,
      message: "Daily publish limit reached."
    };
  }

  const readyItems = await listPublishReadyNews(availableSlots);
  let published = 0;
  let skipped = 0;

  for (const item of readyItems) {
    const publishedItem = await publishNewsItem(item.id);

    if (!publishedItem) {
      skipped += 1;
      continue;
    }

    published += 1;
  }

  return {
    ok: true,
    processed: readyItems.length,
    published,
    skipped,
    publishedToday,
    availableSlots
  };
}

export async function runAutopostJob() {
  const env = getEnv();
  const pending = await listPendingJobs(25);

  if (env.AUTOPOST_DRY_RUN) {
    return {
      ok: true,
      dryRun: true,
      pendingJobs: pending.length,
      message: "AUTOPOST_DRY_RUN is enabled; no publish action executed."
    };
  }

  return runPublishJob(env.DAILY_PUBLISH_LIMIT);
}

export async function runGeneratePipeline(count = 1) {
  const normalizedCount = Math.max(1, Math.min(10, Math.floor(count)));
  const limits = getPipelineLimits();
  const candidateMultiplier = 4;
  const fetchItemsPerSource = Math.max(
    limits.fetchItemsPerSourceLimit,
    normalizedCount * candidateMultiplier
  );
  const rewriteBatchSize = Math.max(
    limits.rewriteBatchLimit,
    normalizedCount * candidateMultiplier
  );

  console.log(`[generate] starting pipeline count=${normalizedCount}`);

  const fetchResult = await markJobLifecycle("fetch", () =>
    runFetchNewsJob({
      sourceLimit: limits.fetchSourcesLimit,
      itemsPerSourceLimit: fetchItemsPerSource
    })
  );
  console.log(
    `[generate] fetch completed job=${fetchResult.jobId} new=${fetchResult.result.newRecords}`
  );

  const rewriteResult = await markJobLifecycle("rewrite", () =>
    runRewriteNewsJob(rewriteBatchSize)
  );
  console.log(
    `[generate] rewrite completed job=${rewriteResult.jobId} drafts=${rewriteResult.result.createdDrafts}`
  );

  const imageResult = await markJobLifecycle("image", () => runGenerateImagesJob(normalizedCount));
  console.log(
    `[generate] image completed job=${imageResult.jobId} requested=${imageResult.result.requested}`
  );

  const publishResult = await markJobLifecycle("publish", () => runPublishJob(normalizedCount));
  console.log(
    `[generate] publish completed job=${publishResult.jobId} published=${publishResult.result.published}`
  );

  return {
    ok: true,
    requested: normalizedCount,
    generated: publishResult.result.published,
    steps: {
      fetch: fetchResult.result,
      rewrite: rewriteResult.result,
      image: imageResult.result,
      publish: publishResult.result
    }
  };
}

export async function runFullPipeline() {
  const limits = getPipelineLimits();
  const fetchResult = await ingestRssSources({
    sourceLimit: limits.fetchSourcesLimit,
    itemsPerSourceLimit: limits.fetchItemsPerSourceLimit
  });
  const rewriteResult = await runRewriteNewsJob();
  const imageResult = await runGenerateImagesJob();
  const publishResult = await runPublishJob();

  return {
    ok: true,
    steps: {
      fetch: fetchResult,
      rewrite: rewriteResult,
      image: imageResult,
      publish: publishResult
    }
  };
}

export async function markJobLifecycle<T>(
  jobType: "fetch" | "rewrite" | "image" | "publish" | "autopost",
  runner: () => Promise<T>
) {
  const job = await enqueueJob({
    type: jobType,
    status: "running",
    attempts: 1,
    payload: { startedAt: new Date().toISOString(), mode: "direct-execution" }
  });

  try {
    const result = await runner();
    await updateJob(job.id, {
      status: "completed",
      payload: { completedAt: new Date().toISOString(), result }
    });
    return { jobId: job.id, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error";
    await updateJob(job.id, {
      status: "failed",
      lastError: message
    });
    throw error;
  }
}

export async function replayRewriteJob(rawId: string) {
  const raw = await getRawNewsById(rawId);

  if (!raw) {
    return { ok: false, message: `Raw item ${rawId} not found.` };
  }

  const rewritten = await rewriteRawNews(raw);

  if (!rewritten) {
    return { ok: false, message: `Raw item ${rawId} does not contain enough source material.` };
  }

  const cleanedSnippet = stripHtml(raw.contentSnippet);
  const slugBase = slugify(rewritten.title) || slugify(raw.title) || `news-${raw.id.slice(0, 8)}`;
  const slug = await buildUniqueSlug(slugBase);
  const title = await buildUniqueTitle(rewritten.title);
  const tags = Array.from(new Set([...rewritten.tags, ...deriveTags(raw.title, cleanedSnippet)])).slice(0, 10);
  const topics = Array.from(new Set(rewritten.topics)).slice(0, 6);
  const entities = Array.from(new Set(rewritten.entities)).slice(0, 12);
  const primaryTopic = rewritten.primary_topic || topics[0] || tags[0] || "World";
  const canonicalUrl = normalizeCanonicalUrl(raw.canonicalUrl || raw.url);
  const sourceUrl = raw.url || raw.sourceUrl || raw.canonicalUrl || null;
  const content = rewritten.body;
  const entryCharCount = charCount(content);
  const entryWordCount = wordCount(content);
  const entryReadingTime = readingTimeMinutes(content);
  const fingerprint = buildNewsFingerprint({
    title,
    sourceName: raw.sourceName,
    canonicalUrl,
    publishedAt: raw.publishedAt
  });
  const publishedPool = await listRecentPublishedNews(200);
  const linkingSeed = {
    id: `draft:${slug}`,
    rawId: raw.id,
    slug,
    title,
    dek: rewritten.lede,
    summary: rewritten.body,
    content,
    keyPoints: rewritten.key_points,
    whyItMatters: rewritten.why_it_matters,
    tags,
    topics,
    entities,
    coverImageUrl: null,
    ogImageUrl: null,
    ogImageAlt: rewritten.image_alt,
    previewImageUrl: raw.previewImageUrl ?? null,
    previewImageSource: raw.previewImageSource ?? null,
    previewImageCaption: raw.previewImageCaption ?? null,
    generatedImagePrompt: rewritten.image_prompt,
    generatedImageUrl: null,
    generatedImageAlt: rewritten.image_alt,
    generatedImageCaption: null,
    sourceName: raw.sourceName || "Unknown Source",
    sourceUrl: sourceUrl || null,
    canonicalUrl,
    metaTitle: rewritten.meta_title,
    metaDescription: rewritten.meta_description,
    readingTimeMinutes: entryReadingTime,
    wordCount: entryWordCount,
    charCount: entryCharCount,
    internalLinks: [],
    relatedIds: [],
    fingerprint,
    isDuplicate: false,
    qualityScore: 0.9,
    primaryTopic,
    location: rewritten.location || null,
    scheduledAt: null,
    indexable: true,
    status: "draft" as const,
    language: "en",
    publishedAt: raw.publishedAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const linking = buildInternalLinks(linkingSeed, publishedPool);

  const draft = await upsertNewsItem({
    rawId: raw.id,
    slug,
    title,
    dek: rewritten.lede,
    summary: rewritten.lede,
    content,
    keyPoints: rewritten.key_points,
    whyItMatters: rewritten.why_it_matters,
    tags,
    topics,
    entities,
    previewImageUrl: raw.previewImageUrl ?? null,
    previewImageSource: raw.previewImageSource ?? null,
    previewImageCaption: raw.previewImageCaption ?? null,
    generatedImagePrompt: rewritten.image_prompt,
    generatedImageAlt: rewritten.image_alt,
    sourceName: raw.sourceName || "Unknown Source",
    sourceUrl: sourceUrl || null,
    canonicalUrl,
    metaTitle: rewritten.meta_title,
    metaDescription: rewritten.meta_description,
    readingTimeMinutes: entryReadingTime,
    wordCount: entryWordCount,
    charCount: entryCharCount,
    internalLinks: linking.links,
    relatedIds: linking.relatedIds,
    fingerprint,
    qualityScore: 0.9,
    primaryTopic,
    location: rewritten.location || null,
    status: "draft",
    language: "en",
    publishedAt: raw.publishedAt
  });

  return { ok: true, draftId: draft.id, rawId: raw.id, slug: draft.slug };
}

export async function handleLeonardoWebhook(payload: Record<string, unknown>) {
  const parsed = extractLeonardoWebhookData(payload);

  if (!parsed.generationId) {
    return { ok: false, status: "ignored", reason: "Missing generation id." };
  }

  const imageRecord = await getNewsImageByGenerationId(parsed.generationId);

  if (!imageRecord) {
    return { ok: false, status: "ignored", reason: "Unknown generation id." };
  }

  if (parsed.status && ["failed", "error"].includes(parsed.status.toLowerCase())) {
    await failNewsImage({
      generationId: parsed.generationId,
      error: parsed.errorMessage || "Leonardo generation failed",
      webhookPayload: payload
    });

    return { ok: false, status: "failed", generationId: parsed.generationId };
  }

  if (!parsed.imageUrl) {
    await failNewsImage({
      generationId: parsed.generationId,
      error: "Leonardo webhook did not include an image URL",
      webhookPayload: payload
    });

    return { ok: false, status: "failed", generationId: parsed.generationId };
  }

  const stored = await saveRemoteImage(parsed.imageUrl, imageRecord.newsItemId);

  await completeNewsImage({
    generationId: parsed.generationId,
    remoteImageUrl: parsed.imageUrl,
    localPath: stored.filePath,
    localImageUrl: stored.publicUrl,
    webhookPayload: payload
  });

  await updateNewsItemAssets(imageRecord.newsItemId, {
    coverImageUrl: stored.publicUrl,
    ogImageUrl: stored.publicUrl,
    generatedImageUrl: stored.publicUrl,
    generatedImageCaption: "Illustration generated with AI (Leonardo) based on the headline"
  });

  await enqueueJob({
    type: "publish",
    payload: {
      newsItemId: imageRecord.newsItemId,
      generationId: parsed.generationId,
      status: "image-complete"
    }
  });

  return {
    ok: true,
    status: "completed",
    generationId: parsed.generationId,
    newsItemId: imageRecord.newsItemId,
    publicUrl: stored.publicUrl
  };
}
