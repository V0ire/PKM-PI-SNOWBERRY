import { connectionVisual } from "../utils/status";
import type { ConnectionState, ThemeMode } from "../types";
import { StatusPill } from "./StatusPill";

export function TopBar({
  connection,
  theme,
  onThemeToggle,
}: {
  connection: ConnectionState;
  theme: ThemeMode;
  onThemeToggle: () => void;
}) {
  const visual = connectionVisual[connection];

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <img src="/snowberry-mark.svg" alt="" className="brand-mark" />
        <div>
          <strong>Snowberry</strong>
          <span>Greenhouse Ciwidey</span>
        </div>
      </div>
      <div className="topbar-actions">
        <button
          className="theme-toggle"
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? "Gunakan mode terang" : "Gunakan mode gelap"}
        >
          {theme === "dark" ? "Terang" : "Gelap"}
        </button>
        <StatusPill label={visual.shortLabel} className={visual.className} />
      </div>
    </header>
  );
}
