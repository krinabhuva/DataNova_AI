export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-300" />
        <span>{label}</span>
      </div>
    </div>
  );
}
