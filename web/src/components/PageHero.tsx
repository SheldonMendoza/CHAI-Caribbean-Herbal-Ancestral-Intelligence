/** Shared page hero for inner pages. */
export function PageHero({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-hero">
      <div className="container">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}
