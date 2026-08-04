import { ChartLine, House, Power, SlidersHorizontal, Sprout } from "lucide-react";
import type { Page } from "../types";

const items: Array<{ page: Page; label: string; Icon: typeof House }> = [
  { page: "dashboard", label: "Beranda", Icon: House },
  { page: "plants", label: "Tanaman", Icon: Sprout },
  { page: "tools", label: "Alat", Icon: Power },
  { page: "history", label: "Riwayat", Icon: ChartLine },
  { page: "settings", label: "Atur", Icon: SlidersHorizontal },
];

// Halaman turunan menyorot tab induknya supaya petani tahu posisinya.
const PARENT: Partial<Record<Page, Page>> = { edu: "plants", sensor: "plants" };

export function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  const active = PARENT[page] ?? page;
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map((item) => {
        const { Icon } = item;
        return (
          <button
            key={item.page}
            type="button"
            className={active === item.page ? "active" : ""}
            onClick={() => onChange(item.page)}
            aria-current={active === item.page ? "page" : undefined}
          >
            <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
