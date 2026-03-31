"use client";

import { useState } from "react";

type CopyableValueProps = {
  label?: string;
  value: string;
  buttonLabel?: string;
  className?: string;
};

export function CopyableValue({
  label,
  value,
  buttonLabel = "Copy",
  className = ""
}: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={className}>
      {label ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{label}</p> : null}
      <div className="mt-3 rounded-2xl border border-line bg-white px-4 py-3">
        <p className="break-all text-sm leading-7 text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
      >
        {copied ? "Copied" : buttonLabel}
      </button>
    </div>
  );
}
