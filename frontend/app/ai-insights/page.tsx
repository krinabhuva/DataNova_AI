"use client";

import { FormEvent, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { askAI, type AIAnswer } from "@/lib/api";
import { aiSuggestedQuestions } from "@/lib/mock-data";

export default function AiInsightsPage() {
  const [question, setQuestion] = useState("Why did revenue decrease last month?");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState<AIAnswer | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || isLoading) return;

    setIsLoading(true);
    setError("");
    setAnswer(null);
    setSubmittedQuestion(normalizedQuestion);
    try {
      setAnswer(await askAI(normalizedQuestion));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate an insight.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Insights" subtitle="Business questions answered with context-aware recommendations." />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Ask DataNova" subtitle="Ask about your business data">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              aria-label="Business question"
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Generating insight…" : "Generate insight"}
            </button>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-500">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {aiSuggestedQuestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={() => setQuestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="AI response" subtitle="Generated from relevant business aggregates">
          <div aria-live="polite" className="space-y-4">
            {submittedQuestion && (
              <div className="ml-auto max-w-[90%] rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">
                {submittedQuestion}
              </div>
            )}
            {isLoading && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600" role="status">
                Analyzing relevant business data…
              </p>
            )}
            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
                {error}
              </p>
            )}
            {answer && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">Answer</span>
                  <StatusBadge
                    label={`${answer.confidence[0].toUpperCase()}${answer.confidence.slice(1)} confidence`}
                    tone={answer.confidence === "high" ? "success" : answer.confidence === "medium" ? "warning" : "neutral"}
                  />
                </div>
                <p className="text-sm leading-6 text-slate-700">{answer.answer}</p>
                {answer.key_findings.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Key findings</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {answer.key_findings.map((finding, index) => <li key={`${finding}-${index}`}>{finding}</li>)}
                    </ul>
                  </div>
                )}
                {answer.recommendations.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recommendations</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {answer.recommendations.map((recommendation, index) => (
                        <li key={`${recommendation}-${index}`}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!submittedQuestion && !isLoading && !error && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Submit a question to see an answer grounded in your business data.
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
