import type { AIInsight } from "@/lib/types";

export const aiSuggestedQuestions = [
  "Why did revenue decrease last month?",
  "What are my top 5 products?",
  "Which region has the highest revenue?",
  "Which customers are most valuable?",
  "Which products have inventory risk?",
  "Predict next month's revenue.",
];

export const aiConversation: { role: "assistant" | "user"; text: string }[] = [
  { role: "user", text: "Why did revenue decrease last month?" },
  { role: "assistant", text: "Revenue dipped 3.2% last month due to a slowdown in home and office categories after a large inventory reset. Electronics remained strong and offset part of the decline." },
  { role: "user", text: "Which region has the highest revenue?" },
  { role: "assistant", text: "North America generated the highest revenue at $1.82M, with Asia Pacific close behind at $1.56M. Both regions are up from the prior month." },
];

export const aiBusinessInsights: AIInsight[] = [
  { title: "Top product momentum", summary: "Apex Laptop 15 and Velo Smart Watch continue to pace year-over-year growth.", priority: "High" },
  { title: "Inventory risk flag", summary: "One-third of at-risk SKUs are concentrated in the office category and require replenishment.", priority: "Medium" },
  { title: "Nurture high-value accounts", summary: "The top 12 enterprise accounts contribute 41% of total revenue and show stable retention.", priority: "High" },
];
