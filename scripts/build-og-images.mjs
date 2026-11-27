// Builds the social share images (Open Graph / Twitter cards) and PNG icons
// before `next build`. Facebook, X, Telegram, LinkedIn and Google do not accept
// SVG share images, so every page gets a 1200x630 PNG with the site name and
// section title. sharp is installed together with Next.js.
import fs from "node:fs";
import path from "node:path";

const publicDir = path.join(process.cwd(), "public");

const cards = {
  "og-home": { kicker: "Independent English-language newsroom", title: "Ukraine news, analysis and explainers" },
  "og-news-hub": { kicker: "Latest news", title: "Breaking Ukraine news, updated around the clock" },
  "og-world-hub": { kicker: "World digest", title: "Daily world news digest through Ukraine's lens" },
  "og-blog-hub": { kicker: "Analysis & explainers", title: "Context behind the headlines on Ukraine" },
  "og-about": { kicker: "About us", title: "Who we are and how we report on Ukraine" },
  "og-newsroom": { kicker: "Newsroom", title: "Our editorial team and standards" },
  "og-contact": { kicker: "Contact", title: "Get in touch with New Ukraine Daily" },
  "og-corrections": { kicker: "Corrections", title: "How we correct and update our reporting" },
  "og-editorial-policy": { kicker: "Editorial policy", title: "Sourcing, accuracy and AI use in our newsroom" },
  "og-default": { kicker: "New Ukraine Daily", title: "Ukraine news, analysis and explainers" }
};

function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Splits the headline into at most three lines of ~26 characters.
function wrap(text, max = 26) {
  const lines = [];
  let line = "";

  for (const word of text.split(/\s+/)) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function cardSvg({ kicker, title }) {
  const lines = wrap(title);
  const titleY = 330 - (lines.length - 1) * 38;
  const titleText = lines
    .map((line, index) => `<text x="96" y="${titleY + index * 76}" font-size="62" font-weight="700" fill="#0F172A">${escapeXml(line)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFFFFF"/>
  <rect x="96" y="520" width="1008" height="2" fill="#E2E8F0"/>
  <rect x="0" y="0" width="24" height="315" fill="#0A57A4"/>
  <rect x="0" y="315" width="24" height="315" fill="#FFD500"/>
  <g font-family="DejaVu Sans, Liberation Sans, Arial, Helvetica, sans-serif">
    <rect x="96" y="72" width="44" height="22" fill="#0A57A4"/>
    <rect x="96" y="94" width="44" height="22" fill="#FFD500"/>
    <text x="160" y="110" font-size="40" font-weight="700" fill="#0A57A4">New Ukraine Daily</text>
    <text x="96" y="${titleY - 82}" font-size="28" font-weight="700" fill="#0A57A4" letter-spacing="2">${escapeXml(kicker.toUpperCase())}</text>
    ${titleText}
    <text x="96" y="570" font-size="28" fill="#475569">www.newukrainedaily.com</text>
  </g>
</svg>`;
}

async function main() {
  let sharp;

  try {
    sharp = (await import("sharp")).default;
  } catch (error) {
    console.warn(`[og-images] sharp is not available, skipping: ${error instanceof Error ? error.message : error}`);
    return;
  }

  for (const [name, card] of Object.entries(cards)) {
    await sharp(Buffer.from(cardSvg(card))).png({ compressionLevel: 9 }).toFile(path.join(publicDir, `${name}.png`));
  }

  // PNG icons: Apple touch icon (iOS ignores SVG), publisher logo for Google
  // structured data, and manifest icons.
  const icon = fs.readFileSync(path.join(publicDir, "icon.svg"));
  await sharp(icon, { density: 300 }).resize(512, 512).png().toFile(path.join(publicDir, "icon-512.png"));
  await sharp(icon, { density: 300 }).resize(192, 192).png().toFile(path.join(publicDir, "icon-192.png"));
  await sharp(fs.readFileSync(path.join(publicDir, "apple-icon.svg")), { density: 300 })
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-icon.png"));

  console.log(`[og-images] built ${Object.keys(cards).length} share images and 3 PNG icons`);
}

main().catch((error) => {
  // Never block the site build because of share images.
  console.warn(`[og-images] failed: ${error instanceof Error ? error.stack : error}`);
});
