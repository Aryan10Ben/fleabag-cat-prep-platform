"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, CheckCircle, Play, Filter, Archive } from "lucide-react";

type Paper = {
  id: string;
  year: number;
  slot: number;
  title: string;
  status: string;
  totalQuestions: number;
  totalDuration: number;
  completed: boolean;
  lastAttempt: { id: string; score: number; percentile: number } | null;
};

export default function PyqPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [slotFilter, setSlotFilter] = useState("ALL");
  const [completedFilter, setCompletedFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/pyq/papers")
      .then((r) => r.json())
      .then((d) => setPapers(d.papers || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (yearFilter !== "ALL" && p.year !== +yearFilter) return false;
      if (slotFilter !== "ALL" && p.slot !== +slotFilter) return false;
      if (completedFilter === "true" && !p.completed) return false;
      if (completedFilter === "false" && p.completed) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !String(p.year).includes(q)) return false;
      }
      return true;
    });
  }, [papers, yearFilter, slotFilter, completedFilter, search]);

  const byYear = useMemo(() => {
    const map = new Map<number, Paper[]>();
    filtered.forEach((p) => {
      if (!map.has(p.year)) map.set(p.year, []);
      map.get(p.year)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-8 rounded-2xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Official Format</p>
        <h1 className="text-3xl font-black">Previous Year CAT Papers</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Full 3-section mocks (VARC · DILR · QA) with 40-minute section timers, question palette, and detailed post-test analysis. Original placeholder questions — import legally obtained PYQs via Admin.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search year, slot, paper name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-sm"
          />
        </div>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950">
          <option value="ALL">All Years</option>
          {[2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
            <option key={y} value={y}>CAT {y}</option>
          ))}
        </select>
        <select value={slotFilter} onChange={(e) => setSlotFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950">
          <option value="ALL">All Slots</option>
          <option value="1">Slot 1</option>
          <option value="2">Slot 2</option>
          <option value="3">Slot 3</option>
        </select>
        <select value={completedFilter} onChange={(e) => setCompletedFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950">
          <option value="ALL">All Status</option>
          <option value="false">Not Completed</option>
          <option value="true">Completed</option>
        </select>
      </div>

      <div className="space-y-10">
        {byYear.map(([year, slots]) => (
          <div key={year} className="space-y-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              CAT {year}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 pl-4 border-l-2 border-indigo-200 dark:border-blue-900">
              {slots.sort((a, b) => a.slot - b.slot).map((paper) => (
                <div
                  key={paper.id}
                  className="bg-white dark:bg-slate-950 rounded-2xl border p-5 space-y-4 hover:border-blue-400 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">Slot {paper.slot}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{paper.totalQuestions} Q · {paper.totalDuration} min</p>
                    </div>
                    {paper.completed ? (
                      <span className="text-xs tracking-wide font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <span className="text-xs tracking-wide font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">New</span>
                    )}
                  </div>
                  {paper.lastAttempt && (
                    <p className="text-xs text-slate-500">
                      Last: {paper.lastAttempt.score} pts · {paper.lastAttempt.percentile}ile
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href={`/pyq/${paper.id}/exam`}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      {paper.completed ? "Retake" : "Start Mock"}
                    </Link>
                    {paper.lastAttempt && (
                      <Link
                        href={`/pyq/${paper.id}/analysis/${paper.lastAttempt.id}`}
                        className="px-3 py-2.5 border rounded-xl text-xs font-bold hover:bg-slate-50"
                      >
                        Analysis
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-400 py-12">No papers match your filters.</p>
      )}
    </div>
  );
}
