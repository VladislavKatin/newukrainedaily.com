"use client";

import { useState } from "react";

type ArticleShareBarProps = {
  title: string;
  url: string;
};

function openShareWindow(targetUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.open(targetUrl, "_blank", "noopener,noreferrer,width=720,height=720");
}

export function ArticleShareBar({ title, url }: ArticleShareBarProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const shareText = `${title}\n${url}`;

  const links = [
    {
      label: "X",
      onClick: () =>
        openShareWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)
    },
    {
      label: "Facebook",
      onClick: () => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)
    },
    {
      label: "Telegram",
      onClick: () =>
        openShareWindow(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`)
    },
    {
      label: "LinkedIn",
      onClick: () =>
        openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)
    }
  ];

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

  async function handleNativeShare() {
    if (!canUseNativeShare) {
      return;
    }

    try {
      await navigator.share({ title, url });
    } catch {
      // Share dialog dismissed.
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-mist/50 p-4 sm:mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Share this article</p>
          <p className="mt-1 text-sm text-slate-600">
            Share to social platforms, or copy the article link and share text manually.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={link.onClick}
              className="rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              {link.label}
            </button>
          ))}
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
          {canUseNativeShare ? (
            <button
              type="button"
              onClick={handleNativeShare}
              className="rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              Share
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
