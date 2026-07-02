export function StatusPill({ label, className = "" }: { label: string; className?: string }) {
  return <span className={`status-pill ${className}`.trim()}>{label}</span>;
}
