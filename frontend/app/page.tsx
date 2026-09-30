"use client";

import { useEffect, useState } from "react";

import { StatusPanel } from "@/components/ui/StatusPanel";
import { fetchHealth } from "@/lib/api";

type HealthState = "loading" | "healthy" | "unavailable";

export default function Home() {
  const [healthState, setHealthState] = useState<HealthState>("loading");

  useEffect(() => {
    let active = true;

    fetchHealth()
      .then(() => {
        if (active) setHealthState("healthy");
      })
      .catch(() => {
        if (active) setHealthState("unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <section className="mx-auto w-full max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          DataNova
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Service status</h1>
        <p className="mt-2 text-sm text-slate-600">
          Phase 1 foundation
        </p>
        <div className="mt-8 border-b border-slate-200">
          <StatusPanel label="Backend API" state={healthState} />
        </div>
      </section>
    </main>
  );
}
