import { connectionVisual } from "../utils/status";
import type { ConnectionState } from "../types";
import { StatusPill } from "./StatusPill";

export function TopBar({ connection }: { connection: ConnectionState }) {
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
      </div>
    </header>
  );
}
