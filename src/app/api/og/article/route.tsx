import { ImageResponse } from "next/og";
import { getEntry } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 300;

const size = {
  width: 1200,
  height: 630
};

function clampTitle(title: string) {
  const normalized = String(title || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 117).trimEnd()}...`;
}

function clampLead(text: string) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 170) {
    return normalized;
  }

  return `${normalized.slice(0, 167).trimEnd()}...`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

function getSectionLabel(type: string, storyFormat?: string) {
  if (storyFormat) {
    return storyFormat;
  }

  return type === "news" ? "News report" : "Analysis";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if ((type !== "news" && type !== "blog") || !slug) {
    return new Response("Missing or invalid type/slug", { status: 400 });
  }

  const entry = await getEntry(type, slug);

  if (!entry) {
    return new Response("Not found", { status: 404 });
  }

  const title = clampTitle(entry.title);
  const lead = clampLead(entry.lead || entry.description);
  const dateLabel = formatDate(entry.publishedAt);
  const sectionLabel = getSectionLabel(entry.type, entry.storyFormat);
  const topic = entry.primaryTopic || entry.tags[0] || (entry.type === "news" ? "Ukraine" : "Explainer");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #f4f8fc 0%, #edf4fb 42%, #f8fbff 100%)",
          color: "#0f172a",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Georgia, serif"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -90,
            width: 360,
            height: 360,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(30,90,150,0.18) 0%, rgba(30,90,150,0.08) 45%, rgba(30,90,150,0) 72%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -80,
            width: 420,
            height: 240,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(75,152,121,0.16) 0%, rgba(75,152,121,0.08) 42%, rgba(75,152,121,0) 72%)"
          }}
        />

        <div
          style={{
            margin: 42,
            width: "calc(100% - 84px)",
            height: "calc(100% - 84px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "34px 38px",
            borderRadius: 28,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(209, 222, 235, 1)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "#1e5a96"
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#1e5a96"
                }}
              >
                New Ukraine Daily
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "#1e5a96",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase"
              }}
            >
              {entry.type === "news" ? "News" : "Blog"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#475569"
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "#e8f0f8",
                  color: "#1e5a96"
                }}
              >
                {sectionLabel}
              </div>
              <div style={{ display: "flex" }}>{topic}</div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 62,
                lineHeight: 1.08,
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: "#0f172a"
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 24
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 760 }}>
              <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, color: "#475569" }}>
                {lead}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#64748b" }}>
                Edited from Zaporizhzhia, Ukraine
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 10,
                fontSize: 20,
                color: "#64748b"
              }}
            >
              <div style={{ display: "flex", fontWeight: 700, color: "#0f172a" }}>{dateLabel}</div>
              <div style={{ display: "flex" }}>{absoluteUrl(`/${entry.type}/${entry.slug}`)}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
