"use client";

import React, { useEffect, useState } from "react";
import { Award, Trophy, TrendingUp, AlertTriangle, CheckCircle, BarChart2, Star } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";
import Link from "next/link";

export default function PerformancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await fetch("/api/user/progress");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Loading performance analytics...</p>
      </div>
    );
  }

  const recentAttempts = data?.recentAttempts ?? [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400">
          <BarChart2 className="h-6 w-6" />
          <span className="text-xs font-black uppercase tracking-widest">Analytics Dashboard</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Performance Tracker</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
          Monitor section accuracies, track topic mastery, and review score trends from mock tests.
        </p>
      </div>

      {/* Accuracy Section Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <Trophy className="h-6 w-6 text-amber-500 mx-auto" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Accuracy</span>
          <span className="text-3xl font-black text-slate-900 dark:text-white block">72%</span>
          <span className="text-[10px] text-emerald-500 font-bold block">✓ Safe percentile range</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <TrendingUp className="h-6 w-6 text-blue-600 mx-auto" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quant Accuracy</span>
          <span className="text-3xl font-black text-blue-600 dark:text-blue-400 block">75%</span>
          <span className="text-[10px] text-slate-400 block">Based on 5 topics</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <Star className="h-6 w-6 text-indigo-500 mx-auto" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VARC Accuracy</span>
          <span className="text-3xl font-black text-indigo-650 dark:text-indigo-400 block">68%</span>
          <span className="text-[10px] text-slate-400 block">Passages & VA summary</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LRDI Accuracy</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block">70%</span>
          <span className="text-[10px] text-emerald-500 font-bold block">✓ Target achieved</span>
        </div>

      </div>

      {/* Topics mastery and Weak/Strong lists */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Topic Wise Accuracy bars */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold tracking-tight">Topic-wise Accuracy Profile</h2>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Algebra</span>
                <span className="text-emerald-500">81% Accuracy</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "81%" }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Percentages</span>
                <span className="text-emerald-500">72% Accuracy</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "72%" }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Geometry</span>
                <span className="text-amber-500">64% Accuracy</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "64%" }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Remainders (Number System)</span>
                <span className="text-rose-500">50% Accuracy</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: "50%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Strong vs Weak Areas */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Strong / Weak splits */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mastery Profile</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">Strongest Topics (Acc &gt; 80%)</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-xs">Algebra</span>
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-xs">Profit & Loss</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">Weakest Topics (Acc &lt; 65%)</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 font-bold rounded-lg text-xs">Geometry</span>
                  <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 font-bold rounded-lg text-xs">Remainders</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Recent Tests Log */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-lg font-bold tracking-tight">Completed Mock Logs</h2>
        
        {recentAttempts.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No completed tests logged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 pr-4">Test Name</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentile</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 pl-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAttempts.map((attempt: any) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="py-3 pr-4 font-bold">
                      {attempt.test?.name || attempt.catPyqPaper?.title || "Practice Attempt"}
                    </td>
                    <td className="py-3 px-4">{attempt.score} pts</td>
                    <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-bold">{attempt.percentile}%ile</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{attempt.accuracy}%</td>
                    <td className="py-3 px-4">{Math.round(attempt.timeSpent / 60)} mins</td>
                    <td className="py-3 pl-4">
                      <Link 
                        href={
                          attempt.catPyqPaperId 
                            ? `/pyq/${attempt.catPyqPaperId}/analysis/${attempt.id}` 
                            : `/mock-tests/result/${attempt.id}`
                        } 
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                      >
                        Review Solutions &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
