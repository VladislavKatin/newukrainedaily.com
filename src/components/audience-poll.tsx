"use client";

import { useEffect, useState } from "react";

type PollAnswer = "singapore" | "china";

type AudiencePollProps = {
  pollKey: string;
  sourcePage: string;
};

const pollOptions: Array<{ value: PollAnswer; label: string }> = [
  { value: "singapore", label: "Singapore" },
  { value: "china", label: "China" }
];

export function AudiencePoll({ pollKey, sourcePage }: AudiencePollProps) {
  const storageKey = `nud_poll_${pollKey}`;
  const [selectedAnswer, setSelectedAnswer] = useState<PollAnswer | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedAnswer = window.localStorage.getItem(storageKey);

    if (savedAnswer === "singapore" || savedAnswer === "china") {
      setSelectedAnswer(savedAnswer);
      setStatus("success");
      setMessage("Thanks for voting.");
    }
  }, [storageKey]);

  async function submitVote(answer: PollAnswer) {
    if (status === "submitting" || selectedAnswer) {
      return;
    }

    setSelectedAnswer(answer);
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/audience-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollKey, answer, sourcePage, website: "" })
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Failed to save your vote.");
      }

      window.localStorage.setItem(storageKey, answer);
      setStatus("success");
      setMessage(payload.message || "Thanks for voting.");
    } catch (error) {
      setSelectedAnswer(null);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to save your vote.");
    }
  }

  return (
    <section className="panel overflow-hidden p-5 sm:p-6" aria-labelledby="homepage-audience-poll-title">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Quick Poll</p>
        <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          10 sec
        </span>
      </div>
      <h2 id="homepage-audience-poll-title" className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        Where are you from?
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Help us understand which readers interact with New Ukraine Daily.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {pollOptions.map((option) => {
          const isSelected = selectedAnswer === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => void submitVote(option.value)}
              disabled={status === "submitting" || Boolean(selectedAnswer)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-default ${
                isSelected
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink hover:border-brand hover:bg-mist"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {message ? (
        <p className={`mt-3 text-sm leading-6 ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
          {message}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-500">One vote per browser for this poll.</p>
      )}
    </section>
  );
}
