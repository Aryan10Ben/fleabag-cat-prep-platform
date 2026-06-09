"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Clock, Play, Activity } from "lucide-react";
import Link from "next/link";

interface SubtopicTestPickerProps {
  subtopicId: string;
  subtopicName?: string;
  backHref: string;
  backLabel: string;
  accent?: "blue" | "indigo" | "emerald";
}

export default function SubtopicTestPicker({
  subtopicId,
  subtopicName,
  backHref,
  backLabel,
  accent = "blue",
}: SubtopicTestPickerProps) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const accentBtn =
    accent === "indigo"
      ? "bg-indigo-600 hover:bg-indigo-700"
      : accent === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-blue-600 hover:bg-blue-700";

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`/api/tests?type=TOPIC&subtopicId=${subtopicId}`);
        if (res.ok) {
          const data = await res.json();
          setTests(data.tests);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, [subtopicId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading topic tests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Timed Topic Tests</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {subtopicName || "Subtopic"} — 5 CAT-Level Tests
        </h1>
        <p className="text-sm text-slate-500">
          Each test has 10 questions with a 15-minute timer. Questions mix Easy, Medium, and Hard difficulty.
        </p>
      </div>

      <div className="grid gap-4">
        {tests.map((test, idx) => (
          <div
            key={test.id}
            className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{test.name}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {test.duration} mins
                </span>
                <span>{test._count?.questions || 10} questions</span>
                <span className="font-bold text-slate-500">Test {idx + 1} of 5</span>
              </div>
            </div>
            <Link
              href={`/mock-tests/${test.id}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-white text-xs font-bold rounded-xl ${accentBtn}`}
            >
              <Play className="h-3.5 w-3.5" /> Start Timed Test
            </Link>
          </div>
        ))}
      </div>

      {tests.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">
          No tests found. Run <code className="text-xs bg-slate-100 px-1 rounded">npx prisma db seed</code> to populate.
        </p>
      )}
    </div>
  );
}
