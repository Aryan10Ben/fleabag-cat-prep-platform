"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import FleabagModal from "@/components/FleabagModal";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ResultAnalysisPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFleabag, setShowFleabag] = useState(true);
  const [expandedQs, setExpandedQs] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"overview" | "solutions">("overview");

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => setData(result))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [attemptId]);

  const analysis = useMemo(() => {
    if (!data?.questions) return null;
    const qs = data.questions;
    const byDiff: Record<string, { correct: number; total: number }> = {
      EASY: { correct: 0, total: 0 },
      MEDIUM: { correct: 0, total: 0 },
      HARD: { correct: 0, total: 0 },
    };
    qs.forEach((q: any) => {
      const d = q.difficulty || "MEDIUM";
      if (byDiff[d]) {
        byDiff[d].total++;
        if (q.isCorrect) byDiff[d].correct++;
      }
    });
    const maxScore = qs.length * 3;
    const pctOfMax = maxScore > 0 ? Math.round((data.attempt.score / maxScore) * 100) : 0;
    return { byDiff, maxScore, pctOfMax };
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Generating performance analysis...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-lg font-bold">Results Not Found</h2>
        <Link href="/mock-tests" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Back to Tests
        </Link>
      </div>
    );
  }

  const { attempt, questions } = data;
  const durationMins = attempt.test.duration;
  const timeUsedMins = Math.round(attempt.timeSpent / 60);
  const timeEfficiency = durationMins > 0 ? Math.round((timeUsedMins / durationMins) * 100) : 0;

  const toggleQ = (qId: string) => {
    setExpandedQs((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <FleabagModal isOpen={showFleabag} onClose={() => setShowFleabag(false)} />

      <div className={`space-y-6 transition-all duration-500 ${showFleabag ? "blur-sm pointer-events-none opacity-50" : ""}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 md:p-8 rounded-2xl space-y-4">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Test Analysis Report</p>
              <h1 className="text-2xl md:text-3xl font-black mt-1">{attempt.test.name}</h1>
              <p className="text-sm text-slate-400 mt-1">
                {attempt.test.category} · {questions.length} Questions · {durationMins} min slot
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/mock-tests/${attempt.test.id}`}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retake
              </Link>
              <Link
                href="/mock-tests"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                All Tests <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={Trophy} label="Percentile" value={`${attempt.percentile}`} suffix="ile" accent="text-amber-400" />
            <StatCard icon={Award} label="Score" value={`${attempt.score}`} suffix={`/ ${analysis?.maxScore}`} accent="text-blue-400" />
            <StatCard icon={Target} label="Accuracy" value={`${attempt.accuracy}`} suffix="%" accent="text-emerald-400" />
            <StatCard icon={CheckCircle2} label="Correct" value={`${attempt.correctCount}`} suffix={`/ ${questions.length}`} accent="text-emerald-400" />
            <StatCard icon={Clock} label="Time Used" value={`${timeUsedMins}`} suffix={`/ ${durationMins}m`} accent="text-slate-300" />
          </div>
        </div>

        {/* Question palette summary */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border p-5 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" /> Question Status Overview
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q: any, idx: number) => {
              const attempted = q.selectedOptionId || q.titaAnswer;
              const bg = !attempted ? "bg-slate-200 text-slate-500" : q.isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white";
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setActiveTab("solutions");
                    setExpandedQs((prev) => ({ ...prev, [q.id]: true }));
                    document.getElementById(`q-review-${q.id}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`h-8 w-8 rounded text-xs font-bold ${bg} hover:opacity-80`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1"><span className="h-3 w-3 bg-emerald-500 rounded" /> Correct ({attempt.correctCount})</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 bg-rose-500 rounded" /> Wrong ({attempt.incorrectCount})</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 bg-slate-200 rounded" /> Skipped ({attempt.unattemptedCount})</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          {(["overview", "solutions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold capitalize border-b-2 -mb-px transition-colors ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
              }`}
            >
              {tab === "overview" ? "Performance Overview" : "Solutions & Review"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && analysis && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-950 rounded-2xl border p-5 space-y-4">
              <h3 className="text-sm font-bold">Difficulty Breakdown</h3>
              {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => {
                const row = analysis.byDiff[diff];
                const pct = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
                return (
                  <div key={diff} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">{diff}</span>
                      <span className="text-slate-500">
                        {row.correct}/{row.total} correct ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          diff === "EASY" ? "bg-emerald-500" : diff === "MEDIUM" ? "bg-blue-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-2xl border p-5 space-y-4">
              <h3 className="text-sm font-bold">CAT Scoring Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Correct Answers</span>
                  <span className="font-black text-emerald-600">+{attempt.correctCount * 3} marks</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20">
                  <span className="text-rose-700 dark:text-rose-400 font-semibold">Incorrect (MCQ penalty)</span>
                  <span className="font-black text-rose-600">−{attempt.incorrectCount} marks</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <span className="font-semibold">Net Score</span>
                  <span className="font-black text-lg">{attempt.score}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                  <span className="text-blue-700 font-semibold">Score % of Maximum</span>
                  <span className="font-black text-blue-600">{analysis.pctOfMax}%</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <span className="font-semibold">Time Efficiency</span>
                  <span className="font-bold">{timeEfficiency}% of allotted time used</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "solutions" && (
          <div className="space-y-3">
            {questions.map((q: any, idx: number) => {
              const isOpen = expandedQs[q.id] ?? false;
              const attempted = q.selectedOptionId || q.titaAnswer;
              return (
                <div
                  key={q.id}
                  id={`q-review-${q.id}`}
                  className={`bg-white dark:bg-slate-950 rounded-xl border overflow-hidden ${
                    !attempted ? "border-slate-200" : q.isCorrect ? "border-emerald-300" : "border-rose-300"
                  }`}
                >
                  <button
                    onClick={() => toggleQ(q.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          !attempted ? "bg-slate-200 text-slate-600" : q.isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-400">{q.difficulty} · {q.type}</p>
                        <p className="text-sm font-medium truncate">{q.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          !attempted ? "bg-slate-100 text-slate-500" : q.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {!attempted ? "Skipped" : q.isCorrect ? "Correct +3" : "Wrong"}
                      </span>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t">
                      {q.rcPassage && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs max-h-32 overflow-y-auto mt-3">
                          <p className="font-bold text-indigo-600 mb-1">Passage</p>
                          {q.rcPassage.content}
                        </div>
                      )}
                      {q.lrdiSet && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs max-h-32 overflow-y-auto mt-3">
                          <p className="font-bold text-emerald-600 mb-1">LRDI Set</p>
                          {q.lrdiSet.description}
                        </div>
                      )}

                      <p className="text-sm font-semibold pt-2">{q.content}</p>

                      {q.type === "MCQ" ? (
                        <div className="grid gap-2">
                          {q.options.map((opt: any) => {
                            const isSelected = q.selectedOptionId === opt.id;
                            const isCorrectOpt = opt.isCorrect;
                            let style = "border-slate-200 bg-slate-50 text-slate-600";
                            if (isCorrectOpt) style = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                            else if (isSelected) style = "border-rose-500 bg-rose-50 text-rose-700";
                            return (
                              <div key={opt.id} className={`p-3 rounded-lg border text-xs flex justify-between ${style}`}>
                                <span>{opt.content}</span>
                                {isCorrectOpt && <span className="text-[9px] font-black text-emerald-600">CORRECT</span>}
                                {isSelected && !isCorrectOpt && <span className="text-[9px] font-black text-rose-600">YOUR ANSWER</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs space-y-1">
                          <p>
                            <strong>Your answer:</strong>{" "}
                            <span className={q.isCorrect ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                              {q.titaAnswer || "—"}
                            </span>
                          </p>
                          <p>
                            <strong>Correct:</strong> {q.options.find((o: any) => o.isCorrect)?.content || "See solution"}
                          </p>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl">
                        <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5 mb-2">
                          <Sparkles className="h-4 w-4" /> Shortcut Solution
                        </p>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                          {q.solution}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string;
  accent: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${accent}`} />
      <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
      <p className="text-xl font-black mt-0.5">
        {value}
        {suffix && <span className="text-xs font-normal text-slate-400 ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}
