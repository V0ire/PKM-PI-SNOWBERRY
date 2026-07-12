import type { ReactNode } from "react";
import type { ConnectionState, Page } from "../types";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function AppShell({
  page,
  connection,
  toast,
  onPageChange,
  children,
}: {
  page: Page;
  connection: ConnectionState;
  toast: string;
  onPageChange: (page: Page) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <TopBar connection={connection} />
      <main>{children}</main>
      {page !== "check" && <BottomNav page={page} onChange={onPageChange} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
