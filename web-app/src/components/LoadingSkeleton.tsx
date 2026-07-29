export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <span className="skeleton-line" style={{ width }} />;
}

export function SummarySkeleton() {
  return (
    <section className="summary-card skeleton-card">
      <SkeletonLine width="34%" />
      <SkeletonLine width="82%" />
      <SkeletonLine width="68%" />
      <div className="summary-meta-grid">
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine />
      </div>
    </section>
  );
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <section className="card skeleton-card">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine key={index} width={index === 0 ? "46%" : index === 1 ? "70%" : "92%"} />
      ))}
    </section>
  );
}

export function ChartSkeleton() {
  return (
    <section className="card chart-card skeleton-card">
      <SkeletonLine width="42%" />
      <span className="skeleton-chart" />
    </section>
  );
}

export function FormSkeleton() {
  return (
    <section className="field-group skeleton-card">
      <SkeletonLine width="48%" />
      <SkeletonLine width="86%" />
      <div className="field-grid">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </section>
  );
}
