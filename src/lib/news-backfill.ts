import "server-only";
import { query } from "@/lib/db";
import { extractMainImage } from "@/lib/ingestion/main-image";
import { listNews } from "@/lib/postgres-repository";
import { absoluteUrl, siteConfig } from "@/lib/site";

function normalizeUrl(value: string | null | undefined) {
  const normalized = (value || "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function backfillNewsImagesAndSeo(limit = 200) {
  const news = await listNews(limit, "published");
  let updated = 0;

  for (const item of news) {
    let previewImageUrl = normalizeUrl(item.previewImageUrl);
    const previewImageSource = normalizeUrl(item.previewImageSource) || item.sourceName || "Source";
    let previewImageCaption = normalizeUrl(item.previewImageCaption);
    let generatedImageUrl = normalizeUrl(item.generatedImageUrl);
    const generatedImageAlt =
      normalizeUrl(item.generatedImageAlt) || item.ogImageAlt || `${item.title} generated illustration`;
    const generatedImageCaption =
      normalizeUrl(item.generatedImageCaption) ||
      "Illustration generated with AI (Leonardo) based on the headline";
    let ogImageUrl = normalizeUrl(item.ogImageUrl);
    let coverImageUrl = normalizeUrl(item.coverImageUrl);

    if (!previewImageUrl && item.sourceUrl) {
      const extracted = await extractMainImage({
        rssItem: {},
        articleUrl: item.sourceUrl
      });
      previewImageUrl = normalizeUrl(extracted.url);
      if (previewImageUrl && !previewImageCaption) {
        previewImageCaption = `Preview: original image from ${previewImageSource || "Source"}`;
      }
    }

    const fallbackGenerated =
      generatedImageUrl || coverImageUrl || ogImageUrl || absoluteUrl(siteConfig.defaultOgImage);
    generatedImageUrl = fallbackGenerated;
    coverImageUrl = coverImageUrl || fallbackGenerated;
    ogImageUrl = ogImageUrl || fallbackGenerated;

    if (previewImageUrl && !previewImageCaption) {
      previewImageCaption = `Preview: original image from ${previewImageSource || "Source"}`;
    }

    await query(
      `
        update news_items
        set
          preview_image_url = $2,
          preview_image_source = $3,
          preview_image_caption = $4,
          generated_image_url = $5,
          generated_image_alt = $6,
          generated_image_caption = $7,
          cover_image_url = $8,
          og_image_url = $9,
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        item.id,
        previewImageUrl,
        previewImageSource,
        previewImageCaption,
        generatedImageUrl,
        generatedImageAlt,
        generatedImageCaption,
        coverImageUrl,
        ogImageUrl
      ]
    );

    updated += 1;
  }

  return {
    ok: true,
    processed: news.length,
    updated
  };
}
