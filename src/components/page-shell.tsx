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
    <section className="container-shell py-12 sm:py-16">
      <div className="panel p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

