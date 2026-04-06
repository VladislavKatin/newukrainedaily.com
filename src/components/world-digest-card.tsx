import Image from "next/image";
import { ExternalLink } from "@/components/external-link";
import { shouldBypassImageOptimization } from "@/lib/image";
import { getWorldDigestVisual } from "@/lib/world/visuals";
import type { WorldDigestItemRecord } from "@/lib/world-repository";

type WorldDigestCardProps = {
  item: WorldDigestItemRecord;
};

export function WorldDigestCard({ item }: WorldDigestCardProps) {
  const visual = getWorldDigestVisual(item);
  const unoptimized = shouldBypassImageOptimization(visual.imageUrl);

  return (
    <article className="panel grid gap-3 p-3 sm:grid-cols-[104px_minmax(0,1fr)] sm:p-4">
      <div className="overflow-hidden rounded-[18px] border border-line bg-mist">
        <Image
          src={visual.imageUrl}
          alt={visual.imageAlt}
          width={208}
          height={144}
          unoptimized={unoptimized}
          sizes="(max-width: 640px) 100vw, 104px"
          className="h-28 w-full object-cover sm:h-full"
        />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>{visual.topicLabel}</span>
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
        <h2 className="mt-1.5 text-base font-semibold leading-6 text-ink sm:text-[1.08rem] sm:leading-6">{item.title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-6">{item.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] leading-6">
          <span className="font-medium text-slate-500">Source:</span>
          <ExternalLink href={item.sourceUrl} className="font-semibold text-brand transition hover:text-ink">
            {item.sourceName} source report
          </ExternalLink>
        </div>
      </div>
    </article>
  );
}
