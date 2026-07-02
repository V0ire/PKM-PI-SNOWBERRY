import type { ReactNode } from "react";

type NoticeTone = "safe" | "warning" | "danger" | "info";

export function NoticeBanner({
  tone,
  title,
  children,
}: {
  tone: NoticeTone;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={`notice-banner notice-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  );
}
