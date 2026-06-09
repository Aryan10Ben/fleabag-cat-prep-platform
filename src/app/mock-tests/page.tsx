"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FileSpreadsheet, Clock, AlertTriangle, ShieldCheck, Play, Award, BookOpen } from "lucide-react";
import Link from "next/link";

type TestItem = {
  id: string;
  name: string;
  duration: number;
  questionCount: number;
  category: string;
  type: string;
};

type TabKey = "PYQ" | "FULL" | "DOMAIN" | "TOPIC";

export default function MockTestsSelectionPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("PYQ");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/tests")
      .then((res) => (res.ok ? res.json() : { tests: [] }))
      .then((data) => {
        setTests(
          data.tests.map((t: any) => ({
            id: t.id,
            name: t.name,
            duration: t.duration,
            questionCount: t._count?.questions || 0,
            category: t.category,
            type: t.type,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const pyq = tests.filter((t) => t.name.includes("PYQ"));
    const full = tests.filter((t) => t.type === "MOCK");
    const domain = tests.filter((t) => t.type === "SECTION" && !t.name.includes("PYQ"));
    const topic = tests.filter((t) => t.type === "TOPIC");
    return { pyq, full, domain, topic };
  }, [tests]);

  const currentList = useMemo(() => {
    let list: TestItem[] = [];
    if (activeTab === "PYQ") list = grouped.pyq;
    else if (activeTab === "FULL") list = grouped.full;
    else if (activeTab === "DOMAIN") list = grouped.domain;
    else list = grouped.topic;

    if (categoryFilter !== "ALL") {
      list = list.filter((t) => t.category === categoryFilter);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [activeTab, grouped, categoryFilter]);

  const pyqByCategory = useMemo(() => {
    const cats = ["QUANT", "VARC", "LRDI"] as const;
    return cats.map((cat) => ({
      cat,
      label: cat === "QUANT" ? "Quant (QA)" : cat === "VARC" ? "VARC" : "DILR",
      tests: grouped.pyq.filter((t) => t.category === cat),
    }));
  }, [grouped.pyq]);

  const tabs: { key: TabKey; label: string; count: number; desc: string }[] = [
    { key: "PYQ", label: "CAT PYQ Sectionals", count: grouped.pyq.length, desc: "20 min · 10 Q per slot" },
    { key: "FULL", label: "Full Section Mocks", count: grouped.full.length, desc: "40 min · 22 Q (CAT QA format)" },
    { key: "DOMAIN", label: "Domain Sectionals", count: grouped.domain.length, desc: "25 min · 15 Q per domain" },
    { key: "TOPIC", label: "Topic Tests", count: grouped.topic.length, desc: "15 min · 10 Q per subtopic" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading mock tests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border shadow-sm space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-5">
          <FileSpreadsheet className="h-40 w-40" />
        </div>
        <div className="flex items-center gap-2 text-rose-600">
          <ShieldCheck className="h-6 w-6" />
          <span className="text-xs font-black uppercase tracking-widest">CAT Exam Simulator</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Mock Tests & PYQ Sectionals</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Cracku-style timed tests with official CAT marking (+3/−1), question palette, calculator, and detailed post-test analysis with solutions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white dark:bg-slate-950 border text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "QUANT", "VARC", "LRDI"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
              categoryFilter === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {cat === "ALL" ? "All Sections" : cat}
          </button>
        ))}
        <span className="text-[10px] text-slate-400 self-center ml-2">{tabs.find((t) => t.key === activeTab)?.desc}</span>
      </div>

      {activeTab === "PYQ" && categoryFilter === "ALL" ? (
        <div className="space-y-8">
          {pyqByCategory.map(({ cat, label, tests: catTests }) =>
            catTests.length > 0 ? (
              <div key={cat} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  {label} — PYQ Slot Tests
                  <span className="text-xs font-normal text-slate-400">(20 min strict timer)</span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catTests.map((mock) => (
                    <TestCard key={mock.id} mock={mock} badge="PYQ SLOT" badgeColor="amber" />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((mock) => (
            <TestCard
              key={mock.id}
              mock={mock}
              badge={mock.type}
              badgeColor={mock.type === "MOCK" ? "rose" : mock.type === "TOPIC" ? "blue" : "indigo"}
            />
          ))}
        </div>
      )}

      {currentList.length === 0 && activeTab !== "PYQ" && (
        <p className="text-center text-sm text-slate-400 py-12">No tests in this category.</p>
      )}

      <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-50/30 dark:bg-slate-950 text-xs space-y-2 flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">CAT Test Rules</h4>
          <ul className="list-disc pl-4 mt-2 space-y-1 text-amber-700 dark:text-amber-300/80 font-medium">
            <li>Timer starts when you click &quot;I am ready — Start Test&quot;</li>
            <li>MCQ: +3 correct, −1 wrong · TITA: +3 correct, no negative marking</li>
            <li>Auto-submits when time runs out — full analysis with solutions after submit</li>
            <li>Virtual on-screen calculator available during the test</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function TestCard({
  mock,
  badge,
  badgeColor,
}: {
  mock: TestItem;
  badge: string;
  badgeColor: "amber" | "rose" | "indigo" | "blue";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border p-5 flex flex-col justify-between min-h-[200px] hover:border-blue-300 transition-all group">
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${colors[badgeColor]}`}>
            {badge}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold shrink-0">
            <Clock className="h-3.5 w-3.5" />
            {mock.duration}m
          </div>
        </div>
        <h3 className="text-sm font-bold group-hover:text-blue-600 transition-colors leading-snug">{mock.name}</h3>
        <p className="text-xs text-slate-400">
          {mock.questionCount} questions · {mock.category} · CAT marking scheme
        </p>
      </div>
      <div className="pt-4 border-t mt-4 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
          <Award className="h-3.5 w-3.5" /> Analysis included
        </span>
        <Link
          href={`/mock-tests/${mock.id}`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 active:scale-[0.98]"
        >
          <Play className="h-3 w-3 fill-white" /> Start
        </Link>
      </div>
    </div>
  );
}
