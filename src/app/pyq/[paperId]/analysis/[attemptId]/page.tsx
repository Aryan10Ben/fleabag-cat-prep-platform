"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy, Target, Clock, CheckCircle2, XCircle, HelpCircle,
  Sparkles, ChevronDown, ChevronUp, RotateCcw, BarChart3,
} from "lucide-react";
import MathRenderer from "@/components/pyq/MathRenderer";

export default function PyqAnalysisPage() {
  const params = useParams();
  const paperId = params.paperId as string;
  const attemptId = params.attemptId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "review">("overview");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/pyq/analysis/${attemptId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!data?.attempt) {
    return <div className="text-center py-20">Analysis not found.</div>;
  }

  const { attempt, questions, sectionScores } = data;
  const paper = attempt.paper;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 md:p-8 rounded-2xl space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-300 uppercase">PYQ Analysis Report</p>
            <h1 className="text-2xl font-black">{paper?.title}</h1>
            <p className="text-sm text-slate-400">CAT {paper?.year} Slot {paper?.slot}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/pyq/${paperId}/exam`} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold flex items-center gap-1">
              <RotateCcw className="h-3.5 w-3.5" /> Retake
            </Link>
            <Link href="/pyq" className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold">All Papers</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon={Trophy} label="Percentile" value={`${attempt.percentile}`} suffix="ile" />
          <Stat icon={Target} label="Score" value={`${attempt.score}`} suffix={`/ ${questions.length * 3}`} />
          <Stat icon={CheckCircle2} label="Accuracy" value={`${attempt.accuracy}`} suffix="%" />
          <Stat icon={Clock} label="Time" value={`${Math.round(attempt.timeSpent / 60)}`} suffix=" min" />
          <Stat icon={BarChart3} label="Attempted" value={`${attempt.correctCount + attempt.incorrectCount}`} suffix={`/ ${questions.length}`} />
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(["overview", "review"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-bold capitalize border-b-2 -mb-px ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}>
            {t === "overview" ? "Section Analysis" : "Question Review"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid md:grid-cols-3 gap-4">
          {sectionScores?.map((sec: any) => (
            <div key={sec.section} className="bg-white dark:bg-slate-950 rounded-2xl border p-5 space-y-3">
              <h3 className="font-bold text-lg">{sec.section}</h3>
              <div className="space-y-2 text-sm">
                <Row label="Score" value={sec.score} />
                <Row label="Attempted" value={sec.attemptedCount} />
                <Row label="Correct" value={sec.correctCount} />
                <Row label="Incorrect" value={sec.incorrectCount} />
                <Row label="Skipped" value={sec.unattemptedCount} />
                <Row label="Accuracy" value={`${sec.accuracy}%`} />
                <Row label="Time" value={`${Math.round(sec.timeSpent / 60)} min`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-3">
          {questions.map((q: any, idx: number) => {
            const open = expanded[q.id];
            const attempted = q.selectedOptionId || q.titaAnswer;
            return (
              <div key={q.id} className={`bg-white dark:bg-slate-950 rounded-xl border overflow-hidden ${q.isCorrect ? "border-emerald-300" : attempted ? "border-rose-300" : ""}`}>
                <button onClick={() => setExpanded((p) => ({ ...p, [q.id]: !p[q.id] }))} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${!attempted ? "bg-slate-200" : q.isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400">{q.section} · {q.difficulty} · {q.timeSpentSeconds}s spent</p>
                      <p className="text-sm truncate">{q.content.replace(/\$[^$]+\$/g, "...")}</p>
                    </div>
                  </div>
                  {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {open && (
                  <div className="p-4 border-t space-y-3 text-sm">
                    <MathRenderer content={q.content} />
                    {q.type === "MCQ" ? (
                      <div className="grid gap-2">
                        {q.options.map((opt: any) => (
                          <div key={opt.id} className={`p-3 rounded-lg border text-xs ${opt.isCorrect ? "border-emerald-500 bg-emerald-50 font-bold" : q.selectedOptionId === opt.id ? "border-rose-500 bg-rose-50" : ""}`}>
                            {opt.content}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>Your answer: <strong>{q.titaAnswer || "—"}</strong> · Correct: <strong>{q.options.find((o: any) => o.isCorrect)?.content}</strong></p>
                    )}
                    <div className="p-3 bg-blue-50 dark:bg-slate-900 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 flex items-center gap-1 mb-1"><Sparkles className="h-3.5 w-3.5" /> Explanation</p>
                      <MathRenderer content={q.solution} className="text-xs" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; suffix?: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/10 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-blue-300" />
      <p className="text-[10px] text-slate-400 uppercase font-bold">{label}</p>
      <p className="text-xl font-black">{value}{suffix && <span className="text-xs font-normal text-slate-400"> {suffix}</span>}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
