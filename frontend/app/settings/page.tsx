"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile, appearance, alerts, and app preferences." />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Profile" subtitle="Account information">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-500">Full name</label>
              <input defaultValue="Alex Morgan" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-500">Email</label>
              <input defaultValue="alex.morgan@datanova.ai" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appearance" subtitle="Workspace visual preferences">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-500">Theme</label>
              <select defaultValue="light" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-500">Density</label>
              <select defaultValue="comfortable" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notifications" subtitle="Delivery preferences">
          <div className="space-y-4 text-sm text-slate-600">
            <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Weekly digest</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Inventory alerts</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Customer churn warnings</span><input type="checkbox" defaultChecked /></label>
          </div>
        </SectionCard>

        <SectionCard title="Data preferences" subtitle="Operational and reporting defaults">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-500">Default timezone</label>
              <select defaultValue="UTC-05:00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option>UTC-05:00</option>
                <option>UTC-00:00</option>
                <option>UTC+01:00</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-500">Default report format</label>
              <select defaultValue="PDF" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option>PDF</option>
                <option>CSV</option>
                <option>Excel</option>
              </select>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Application information" subtitle="Environment and platform details">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Version</p><p className="mt-2 font-medium text-slate-900">1.0.0</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Environment</p><p className="mt-2 font-medium text-slate-900">Preview</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Last sync</p><p className="mt-2 font-medium text-slate-900">2026-09-29 08:15</p></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
