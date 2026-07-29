import type { ReactNode } from "react";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";

type NoticeTone = "safe" | "warning" | "danger" | "info";

const NOTICE_ICON: Record<NoticeTone, typeof Info> = {
  safe: CircleCheck,
  warning: TriangleAlert,
  danger: TriangleAlert,
  info: Info,
};

export function NoticeBanner({
  tone,
  title,
  children,
}: {
  tone: NoticeTone;
  title: string;
  children: ReactNode;
}) {
  const Icon = NOTICE_ICON[tone];

  return (
    <section className={`notice-banner notice-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <span className="notice-icon">
        <Icon size={20} strokeWidth={2.3} aria-hidden="true" />
      </span>
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </section>
  );
}
