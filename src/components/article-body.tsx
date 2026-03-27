type ArticleBodyProps = {
  paragraphs: string[];
  showGeneratedImageAfterIndex?: number;
  generatedImage?: React.ReactNode;
};

function getListItems(paragraph: string) {
  const lines = paragraph
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const listItems = lines
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line))
    .map((line) => line.replace(/^([-*]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);

  return listItems.length === lines.length && listItems.length > 0 ? listItems : null;
}

function renderParagraphBlock(paragraph: string, key: string) {
  const trimmed = paragraph.trim();

  if (/^##\s+/.test(trimmed)) {
    return (
      <h2 key={key} className="article-heading article-heading-lg">
        {trimmed.replace(/^##\s+/, "").trim()}
      </h2>
    );
  }

  if (/^###\s+/.test(trimmed)) {
    return (
      <h3 key={key} className="article-heading article-heading-sm">
        {trimmed.replace(/^###\s+/, "").trim()}
      </h3>
    );
  }

  if (/^>\s+/.test(trimmed)) {
    return (
      <blockquote key={key} className="article-quote">
        {trimmed.replace(/^>\s+/, "").trim()}
      </blockquote>
    );
  }

  const listItems = getListItems(trimmed);
  if (listItems) {
    return (
      <ul key={key} className="article-list">
        {listItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (/^(Why it matters|What to watch|In context):\s+/i.test(trimmed)) {
    const [label, ...rest] = trimmed.split(/:\s+/);
    return (
      <aside key={key} className="article-callout">
        <p className="article-callout-label">{label}</p>
        <p className="article-callout-text">{rest.join(": ")}</p>
      </aside>
    );
  }

  return <p key={key} className="article-paragraph">{trimmed}</p>;
}

export function ArticleBody({
  paragraphs,
  showGeneratedImageAfterIndex,
  generatedImage
}: ArticleBodyProps) {
  return (
    <div className="reading-copy mt-7 space-y-5 sm:mt-8 sm:space-y-6">
      {paragraphs.map((paragraph, index) => (
        <div key={index} className="space-y-5 sm:space-y-6">
          {renderParagraphBlock(paragraph, `${index}-block`)}
          {generatedImage && showGeneratedImageAfterIndex === index ? generatedImage : null}
        </div>
      ))}
    </div>
  );
}
