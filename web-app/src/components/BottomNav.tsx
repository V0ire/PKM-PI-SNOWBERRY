import { ChartLine, House, SlidersHorizontal, Sprout } from "lucide-react";
import type { Page } from "../types";

const items: Array<{ page: Page; label: string; Icon: typeof House }> = [
  { page: "dashboard", label: "Kondisi", Icon: House },
  { page: "thresholds", label: "Batas", Icon: SlidersHorizontal },
  { page: "history", label: "Riwayat", Icon: ChartLine },
  { page: "growth", label: "Fase", Icon: Sprout },
];

export function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map((item) => {
        const { Icon } = item;
        return (
          <button
            key={item.page}
            type="button"
            className={page === item.page ? "active" : ""}
            onClick={() => onChange(item.page)}
            aria-current={page === item.page ? "page" : undefined}
          >
            <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
