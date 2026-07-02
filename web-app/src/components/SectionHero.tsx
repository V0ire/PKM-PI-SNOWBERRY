import type { ReactNode } from "react";

export function SectionHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="section-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <div>{children}</div>
    </section>
  );
}
