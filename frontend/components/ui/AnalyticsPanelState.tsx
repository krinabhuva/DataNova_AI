export function AnalyticsPanelState({
  loading,
  empty,
  emptyMessage = "No data available yet.",
}: {
  loading: boolean;
  empty: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="flex h-full min-h-20 items-center justify-center text-sm text-slate-500" role="status">
      {loading ? "Loading analytics…" : empty ? emptyMessage : null}
    </div>
  );
}