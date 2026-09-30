type StatusPanelProps = {
  label: string;
  state: "loading" | "healthy" | "unavailable";
};

const stateLabels: Record<StatusPanelProps["state"], string> = {
  loading: "Checking",
  healthy: "Available",
  unavailable: "Unavailable",
};

export function StatusPanel({ label, state }: StatusPanelProps) {
  const isHealthy = state === "healthy";

  return (
    <div className="flex items-center justify-between border-t border-slate-200 py-4">
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={`inline-flex items-center gap-2 text-sm ${isHealthy ? "text-emerald-700" : "text-slate-500"}`}
        role="status"
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-slate-400"}`}
        />
        {stateLabels[state]}
      </span>
    </div>
  );
}