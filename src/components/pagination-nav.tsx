import Link from "next/link";

function buildHref(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function PaginationNav({
  basePath,
  currentPage,
  totalPages
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-10 flex items-center justify-between gap-4">
      <Link
        href={buildHref(basePath, currentPage - 1)}
        aria-disabled={currentPage <= 1}
        className={`rounded-full border px-4 py-2 text-sm font-semibold ${
          currentPage <= 1
            ? "pointer-events-none border-line bg-mist text-slate-400"
            : "border-line bg-white text-ink transition hover:bg-mist"
        }`}
      >
        Previous
      </Link>
      <p className="text-sm text-slate-600">
        Page {currentPage} of {totalPages}
      </p>
      <Link
        href={buildHref(basePath, currentPage + 1)}
        aria-disabled={currentPage >= totalPages}
        className={`rounded-full border px-4 py-2 text-sm font-semibold ${
          currentPage >= totalPages
            ? "pointer-events-none border-line bg-mist text-slate-400"
            : "border-line bg-white text-ink transition hover:bg-mist"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
