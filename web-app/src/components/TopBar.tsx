import { LogOut } from "lucide-react";
import { connectionVisual } from "../utils/status";
import type { ConnectionState } from "../types";
import { StatusPill } from "./StatusPill";

export function TopBar({
  connection,
  accountEmail,
  onSignOut,
}: {
  connection: ConnectionState;
  accountEmail: string | null;
  onSignOut: () => void;
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
        <StatusPill label={visual.shortLabel} className={visual.className} />
        {accountEmail && (
          <button
            type="button"
            className="topbar-icon-btn"
            title={`Keluar dari ${accountEmail}`}
            aria-label="Keluar dari akun"
            onClick={onSignOut}
          >
            <LogOut size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
