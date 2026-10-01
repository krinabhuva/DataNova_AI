"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  Building2,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  PackageSearch,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { fetchBackendStatus } from "@/lib/api";
import { StatusPanel } from "@/components/ui/StatusPanel";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Sales", href: "/sales", icon: Activity },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: PackageSearch },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Forecasting", href: "/forecasting", icon: TrendingUp },
  { name: "AI Insights", href: "/ai-insights", icon: BrainCircuit },
  { name: "Data Sources", href: "/data-sources", icon: Database },
  { name: "Pipelines", href: "/pipelines", icon: GitBranch },
  { name: "ML Models", href: "/ml-models", icon: Sparkles },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<"loading" | "healthy" | "unavailable">(
    "loading",
  );
  const currentPage =
    navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ??
    navigation[0];

  useEffect(() => {
    let isMounted = true;

    void fetchBackendStatus().then((result) => {
      if (!isMounted) {
        return;
      }

      setBackendStatus(result && result.status === "ok" ? "healthy" : "unavailable");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-3 text-slate-900 lg:px-5 lg:py-5">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 lg:flex-row">
        <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:w-72 lg:p-5">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              D
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">DataNova</div>
              <div className="text-xs text-slate-500">Analytics Suite</div>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage.href === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:p-5">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                DataNova Platform
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {currentPage.name}
              </h1>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <div className="hidden min-w-55 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </div>
              <button className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition-colors hover:bg-slate-100">
                <Bell className="h-4 w-4" />
              </button>
              <div className="min-w-45">
                <StatusPanel label="API" state={backendStatus} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  AN
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium text-slate-900">Alex Morgan</div>
                  <div className="text-[11px] text-slate-500">Operations Lead</div>
                </div>
                <Building2 className="hidden h-4 w-4 text-slate-500 sm:block" />
              </div>
            </div>
          </header>

          <main className="pt-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
