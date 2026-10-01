"use client";

import { useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { aiBusinessInsights, aiConversation, aiSuggestedQuestions } from "@/lib/mock-data";

export default function AiInsightsPage() {
  const [question, setQuestion] = useState("Why did revenue decrease last month?");

  return (
    <div>
      <PageHeader title="AI Insights" subtitle="Business questions answered with context-aware recommendations." />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Ask DataNova" subtitle="Mock business intelligence assistant">
          <div className="space-y-4">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <button className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95">
              Generate insight
            </button>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-500">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {aiSuggestedQuestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={() => setQuestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Conversation" subtitle="AI-generated business summary">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {aiConversation.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={entry.role === "user" ? "ml-auto max-w-[80%] rounded-xl bg-slate-900 px-3 py-2 text-sm text-white" : "max-w-[85%] rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"}>
                {entry.text}
              </div>
            ))}
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-slate-900">AI response</span>
                <StatusBadge label="High confidence" tone="success" />
              </div>
              Revenue dipped 3.2% last month due to slower home and office demand, but electronics and North America offset the decline. Recommended actions include promoting premium bundles and tightening replenishment in faster-moving categories.
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Business insight cards" subtitle="Strategic recommendations">
          <div className="grid gap-4 md:grid-cols-3">
            {aiBusinessInsights.map((insight) => (
              <div key={insight.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h4 className="font-medium text-slate-900">{insight.title}</h4>
                  <StatusBadge label={insight.priority} tone={insight.priority === "High" ? "warning" : "info"} />
                </div>
                <p className="text-sm text-slate-600">{insight.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
