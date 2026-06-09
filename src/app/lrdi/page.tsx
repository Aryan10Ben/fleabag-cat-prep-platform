"use client";

import React, { useEffect, useState } from "react";
import { CircularProgress } from "@/components/CircularProgress";
import { GitMerge, FileText, Activity, CheckSquare, Square, Play, Award } from "lucide-react";
import Link from "next/link";
import SectionTestsPanel from "@/components/SectionTestsPanel";

export default function LrdiPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [lrdiProgress, setLrdiProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLrdiData = async () => {
    try {
      const res = await fetch("/api/topics?category=LRDI");
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics);
        
        const prog: Record<string, any> = {};
        data.userProgress.forEach((p: any) => {
          prog[p.subtopicId] = p;
        });
        setProgressMap(prog);

        const totalItems = data.topics.reduce((acc: number, t: any) => acc + t.subtopics.length * 4, 0);
        let completedItems = 0;
        data.topics.forEach((t: any) => {
          t.subtopics.forEach((s: any) => {
            const row = prog[s.id];
            if (row) {
              if (row.formulaSheetRead) completedItems++;
              if (row.practiceQuestionsCompleted) completedItems++;
              if (row.topicTestCompleted) completedItems++;
              if (row.revisionDone) completedItems++;
            }
          });
        });
        setLrdiProgress(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLrdiData();
  }, []);

  const toggleCheck = async (subtopicId: string, field: string) => {
    const currentRow = progressMap[subtopicId] || {
      formulaSheetRead: false,
      practiceQuestionsCompleted: false,
      topicTestCompleted: false,
      revisionDone: false,
    };
    const newValue = !currentRow[field];

    const updatedRow = { ...currentRow, [field]: newValue };
    setProgressMap((prev) => ({ ...prev, [subtopicId]: updatedRow }));

    try {
      const res = await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopicId, field, value: newValue }),
      });
      if (res.ok) {
        fetchLrdiData();
      } else {
        setProgressMap((prev) => ({ ...prev, [subtopicId]: currentRow }));
      }
    } catch (err) {
      console.error(err);
      setProgressMap((prev) => ({ ...prev, [subtopicId]: currentRow }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Loading LRDI modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-605 dark:text-emerald-400">
            <GitMerge className="h-7 w-7" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Logical Reasoning & Data Interpretation</h1>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-150">
          <CircularProgress percentage={lrdiProgress} size={110} strokeWidth={9} colorClass="text-emerald-600 dark:text-emerald-400" label="LRDI Prep" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">Status</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {lrdiProgress === 100 ? "Ready for CAT" : "Active Practice"}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold block mt-1">✓ Syllabus covers 7 set types</span>
          </div>
        </div>
      </div>

      {/* Grid listing topics */}
      <div className="space-y-8">
        {topics.map((topic) => (
          <div key={topic.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                {topic.name}
              </h2>
              <span className="text-xs text-slate-400 font-semibold">{topic.subtopics.length} Set Types</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topic.subtopics.map((sub: any) => {
                const progress = progressMap[sub.id] || {
                  formulaSheetRead: false,
                  practiceQuestionsCompleted: false,
                  topicTestCompleted: false,
                  revisionDone: false,
                };
                const count =
                  (progress.formulaSheetRead ? 1 : 0) +
                  (progress.practiceQuestionsCompleted ? 1 : 0) +
                  (progress.topicTestCompleted ? 1 : 0) +
                  (progress.revisionDone ? 1 : 0);
                const pct = Math.round((count / 4) * 100);

                return (
                  <div key={sub.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2 lg:w-1/4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{sub.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{pct}% Completed</span>
                      </div>
                    </div>

                    {/* Progress checklist ticks */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-650 dark:text-slate-400">
                      <button onClick={() => toggleCheck(sub.id, "formulaSheetRead")} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                        {progress.formulaSheetRead ? <CheckSquare className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /> : <Square className="h-4 w-4 text-slate-300" />}
                        <span>Set Read</span>
                      </button>
                      <button onClick={() => toggleCheck(sub.id, "practiceQuestionsCompleted")} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                        {progress.practiceQuestionsCompleted ? <CheckSquare className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /> : <Square className="h-4 w-4 text-slate-300" />}
                        <span>Practice Sets</span>
                      </button>
                      <button onClick={() => toggleCheck(sub.id, "topicTestCompleted")} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                        {progress.topicTestCompleted ? <CheckSquare className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /> : <Square className="h-4 w-4 text-slate-300" />}
                        <span>Topic Test</span>
                      </button>
                      <button onClick={() => toggleCheck(sub.id, "revisionDone")} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                        {progress.revisionDone ? <CheckSquare className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /> : <Square className="h-4 w-4 text-slate-300" />}
                        <span>Revision</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/lrdi/${sub.id}/formula`}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        Strategy
                      </Link>
                      <Link
                        href={`/lrdi/${sub.id}/practice`}
                        className="px-4 py-2 bg-emerald-50 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Play className="h-3 w-3" />
                        Practice (100 Q)
                      </Link>
                      <Link
                        href={`/lrdi/${sub.id}/test`}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Activity className="h-3.5 w-3.5 text-emerald-400" />
                        Take Test (5)
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <SectionTestsPanel
        category="LRDI"
        domains={[
          { name: "Logical Reasoning", description: "Arrangement, Games, Selection, Distribution" },
          { name: "Data Interpretation", description: "Venn Diagrams, Caselets, Mixed Sets" },
        ]}
      />

    </div>
  );
}
