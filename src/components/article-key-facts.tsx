function compactSentence(value: string) {
  return value.replace(/^##\s+/, "").replace(/^###\s+/, "").trim();
}

function extractFacts(paragraphs: string[]) {
  const facts = paragraphs
    .filter((paragraph) => !/^##\s+/.test(paragraph) && !/^###\s+/.test(paragraph))
    .map(compactSentence)
    .filter(Boolean)
    .slice(0, 4);

  return facts;
}

export function ArticleKeyFacts({
  lead,
  body,
  tags
}: {
  lead?: string;
  body: string[];
  tags: string[];
}) {
  const facts = [lead, ...extractFacts(body)]
    .filter((value): value is string => Boolean(value))
    .slice(0, 4);

  if (facts.length === 0 && tags.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-3xl border border-line bg-mist/80 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Key Facts</p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        {facts.map((fact) => (
          <li key={fact} className="flex gap-3">
            <span className="mt-2 h-2 w-2 rounded-full bg-brand" />
            <span>{fact}</span>
          </li>
        ))}
      </ul>
      {tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
