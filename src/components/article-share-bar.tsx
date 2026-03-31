"use client";

import { useState } from "react";

type ArticleShareBarProps = {
  title: string;
  url: string;
};

export function ArticleShareBar({ title, url }: ArticleShareBarProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const shareText = `${title}\n${url}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  }

  async function handleCopyShareText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 2000);
    } catch {
      setCopiedText(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-mist/50 p-4 sm:mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Share this article</p>
          <p className="mt-1 text-sm text-slate-600">
            External share links are disabled. Copy the article link or ready-made share text and paste it where you want.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            {copiedLink ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={handleCopyShareText}
            className="rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            {copiedText ? "Copied" : "Copy share text"}
          </button>
        </div>
      </div>
    </div>
  );
}
