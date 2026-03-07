export function PageShell({
  title,
  eyebrow,
  description,
  children
}: {
  title: string;
  eyebrow: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="container-shell py-8 sm:py-16">
      <div className="panel p-5 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:mt-4 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
          {description}
        </p>
        {children ? <div className="mt-6 sm:mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
