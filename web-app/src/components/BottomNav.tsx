import type { Page } from "../types";

const items: Array<{ page: Page; label: string }> = [
  { page: "dashboard", label: "Kondisi" },
  { page: "thresholds", label: "Batas" },
  { page: "history", label: "Riwayat" },
  { page: "growth", label: "Fase" },
];

export function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map((item) => (
        <button
          key={item.page}
          type="button"
          className={page === item.page ? "active" : ""}
          onClick={() => onChange(item.page)}
          aria-current={page === item.page ? "page" : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
