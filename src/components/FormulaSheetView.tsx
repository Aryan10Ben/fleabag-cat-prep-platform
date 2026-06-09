"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, CheckCircle } from "lucide-react";
import Link from "next/link";

interface FormulaSheetViewProps {
  category: "QUANT" | "VARC" | "LRDI";
  backHref: string;
  backLabel: string;
  accent?: "blue" | "indigo" | "emerald";
}

export default function FormulaSheetView({
  category,
  backHref,
  backLabel,
  accent = "blue",
}: FormulaSheetViewProps) {
  const params = useParams();
  const subtopicId = params.subtopicId as string;
  const router = useRouter();

  const [sheet, setSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggled, setToggled] = useState(false);

  const accentBtn =
    accent === "indigo"
      ? "bg-indigo-600 hover:bg-indigo-700"
      : accent === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-blue-600 hover:bg-blue-700";

  useEffect(() => {
    const fetchFormula = async () => {
      try {
        const res = await fetch(`/api/topics?category=${category}`);
        if (res.ok) {
          const data = await res.json();
          let foundSheet = null;
          data.topics.forEach((t: any) => {
            t.subtopics.forEach((s: any) => {
              if (s.id === subtopicId) {
                const dbSheet = s.formulaSheets?.[0];
                foundSheet = {
                  title: dbSheet?.title || `${s.name} — CAT Guide`,
                  subtopicName: s.name,
                  content:
                    dbSheet?.content ||
                    `<div class="space-y-4"><h3 class="text-lg font-bold">${s.name}</h3><p class="text-sm text-slate-500">CAT-specific strategies and key concepts for ${s.name}.</p></div>`,
                };
              }
            });
          });
          setSheet(foundSheet);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFormula();
  }, [subtopicId, category]);

  const handleCompleteAndDownload = async () => {
    try {
      const res = await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopicId, field: "formulaSheetRead", value: true }),
      });
      if (res.ok) {
        setToggled(true);
        const element = document.createElement("a");
        const file = new Blob([sheet?.title || "Formula sheet"], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `${sheet?.subtopicName || "guide"}_cat_notes.txt`;
        document.body.appendChild(element);
        element.click();
        setTimeout(() => router.push(backHref), 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading formula guide...</p>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-lg font-bold">Guide Not Found</h2>
        <Link href={backHref} className={`px-4 py-2 text-white rounded-xl text-xs ${accentBtn}`}>
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <FileText className="h-4 w-4" /> CAT Cheatsheet
        </span>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black">{sheet.title}</h1>
            <p className="text-xs text-slate-400">Condensed quick-revision handbook for CAT.</p>
          </div>
          <button
            onClick={handleCompleteAndDownload}
            className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ${accentBtn}`}
          >
            <Download className="h-4 w-4" />
            Download & Complete
          </button>
        </div>
        <div
          className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-350"
          dangerouslySetInnerHTML={{ __html: sheet.content }}
        />
      </div>

      {toggled && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-500/20 text-xs font-bold text-emerald-600 flex items-center gap-2 justify-center">
          <CheckCircle className="h-5 w-5" />
          Milestone checked! Redirecting...
        </div>
      )}
    </div>
  );
}
