import type { ReactNode } from "react";
import type { ConnectionState, Page, ThemeMode } from "../types";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function AppShell({
  page,
  connection,
  theme,
  toast,
  onThemeToggle,
  onPageChange,
  children,
}: {
  page: Page;
  connection: ConnectionState;
  theme: ThemeMode;
  toast: string;
  onThemeToggle: () => void;
  onPageChange: (page: Page) => void;
  children: ReactNode;
}) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <TopBar connection={connection} theme={theme} onThemeToggle={onThemeToggle} />
      <main>{children}</main>
      <BottomNav page={page} onChange={onPageChange} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
