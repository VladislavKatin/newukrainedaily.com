import Image from "next/image";
import { ExternalLink } from "@/components/external-link";
import { shouldBypassImageOptimization } from "@/lib/image";
import type { WorldDigestItemRecord } from "@/lib/world-repository";

type WorldDigestCardProps = {
  item: WorldDigestItemRecord;
};

export function WorldDigestCard({ item }: WorldDigestCardProps) {
  const unoptimized = shouldBypassImageOptimization(item.imageUrl);

  return (
    <article className="panel grid gap-4 p-4 sm:grid-cols-[124px_minmax(0,1fr)] sm:p-5">
      <div className="overflow-hidden rounded-2xl border border-line bg-mist">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt || item.title}
            width={248}
            height={160}
            unoptimized={unoptimized}
            sizes="(max-width: 640px) 100vw, 124px"
            className="h-36 w-full object-cover sm:h-full"
          />
        ) : (
          <div className="flex h-36 items-center justify-center bg-[#f8fbff] text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            World
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>{item.sourceName}</span>
          {item.publishedAt ? (
            <time dateTime={item.publishedAt}>
              {new Date(item.publishedAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "UTC",
                hour12: true
              })} UTC
            </time>
          ) : null}
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-7 text-ink sm:text-xl">{item.title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-slate-500">Source:</span>
          <ExternalLink href={item.sourceUrl} className="font-semibold text-brand transition hover:text-ink">
            Open source report from {item.sourceName}
          </ExternalLink>
        </div>
      </div>
    </article>
  );
}
