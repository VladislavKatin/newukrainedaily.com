"use client";

import Link from "next/link";
import { useState } from "react";

type NewsletterSignupFormProps = {
  sourcePage: string;
  compact?: boolean;
};

export function NewsletterSignupForm({ sourcePage, compact = false }: NewsletterSignupFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, sourcePage, website: "" })
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Failed to subscribe.");
      }

      setStatus("success");
      setMessage("You are on the briefing list. Future daily notes will use this address.");
      setEmail("");
      setName("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to subscribe.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className={`grid gap-3 ${compact ? "md:grid-cols-[0.8fr_1.2fr]" : "md:grid-cols-2"}`}>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name (optional)"
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
        />
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Saving..." : "Join the daily briefing"}
        </button>
        <Link
          href="/contact"
          className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
        >
          Contact the newsroom
        </Link>
      </div>
      {message ? (
        <p className={`text-sm leading-6 ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
          {message}
        </p>
      ) : (
        <p className="text-xs leading-5 text-slate-500">
          This signup stays inside the site workflow. No third-party form provider is used.
        </p>
      )}
    </form>
  );
}