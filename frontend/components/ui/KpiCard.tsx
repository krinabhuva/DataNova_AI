import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function KpiCard({
  label,
  value,
  change,
  description,
  trend,
}: {
  label: string;
  value: string;
  change: string;
  description: string;
  trend: "up" | "down" | "neutral";
}) {
  const trendClasses = {
    up: "bg-emerald-50 text-emerald-700",
    down: "bg-rose-50 text-rose-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={['inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium', trendClasses[trend]].join(' ')}>
          <TrendIcon className="h-3.5 w-3.5" />
          {change}
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
