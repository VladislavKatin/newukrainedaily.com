type ArticleBodyProps = {
  paragraphs: string[];
  showGeneratedImageAfterIndex?: number;
  generatedImage?: React.ReactNode;
};

function renderParagraphBlock(paragraph: string, key: string) {
  if (/^##\s+/.test(paragraph)) {
    return (
      <h2 key={key} className="pt-2 text-2xl font-semibold tracking-tight text-ink">
        {paragraph.replace(/^##\s+/, "").trim()}
      </h2>
    );
  }

  if (/^###\s+/.test(paragraph)) {
    return (
      <h3 key={key} className="pt-2 text-xl font-semibold tracking-tight text-ink">
        {paragraph.replace(/^###\s+/, "").trim()}
      </h3>
    );
  }

  return <p key={key}>{paragraph}</p>;
}

export function ArticleBody({
  paragraphs,
  showGeneratedImageAfterIndex,
  generatedImage
}: ArticleBodyProps) {
  return (
    <div className="reading-copy mt-7 space-y-5 sm:mt-8 sm:space-y-6">
      {paragraphs.map((paragraph, index) => (
        <div key={`${index}-${paragraph.slice(0, 24)}`} className="space-y-5 sm:space-y-6">
          {renderParagraphBlock(paragraph, `${index}-${paragraph.slice(0, 24)}-block`)}
          {generatedImage && showGeneratedImageAfterIndex === index ? generatedImage : null}
        </div>
      ))}
    </div>
  );
}
