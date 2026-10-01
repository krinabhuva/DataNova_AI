type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneStyles: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={['inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', toneStyles[tone]].join(' ')}>
      {label}
    </span>
  );
}
