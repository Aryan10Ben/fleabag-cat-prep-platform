"use client";

import React, { useEffect, useState } from "react";
import { Award, Trophy, TrendingUp, AlertTriangle, CheckCircle, BarChart2, Star } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";
import Link from "next/link";

export default function PerformancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Loading performance analytics...</p>
      </div>
    );
  }

  const recentAttempts = data?.recentAttempts ?? [];
  const allTopicAccuracies = data?.allTopicAccuracies || [];
  const revisionQueue = data?.revisionQueue || [];

  let overallTot = 0, overallCor = 0;
  let qTot = 0, qCor = 0;
  let vTot = 0, vCor = 0;
  let lTot = 0, lCor = 0;

  allTopicAccuracies.forEach((topic: any) => {
    overallTot += topic.total || 0;
    overallCor += topic.correct || 0;
    if (topic.category === "QUANT") { qTot += topic.total; qCor += topic.correct; }
    if (topic.category === "VARC") { vTot += topic.total; vCor += topic.correct; }
    if (topic.category === "LRDI") { lTot += topic.total; lCor += topic.correct; }
  });

  const getAcc = (c: number, t: number) => t > 0 ? Math.round((c / t) * 100) : 0;
  const overallAcc = getAcc(overallCor, overallTot);
  const qAcc = getAcc(qCor, qTot);
  const vAcc = getAcc(vCor, vTot);
  const lAcc = getAcc(lCor, lTot);

  const strongestTopics = [...allTopicAccuracies].filter(t => t.accuracy >= 80).slice(0, 5);
  const weakestTopics = [...allTopicAccuracies].filter(t => t.accuracy < 65).reverse().slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
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
          <span className="text-xs tracking-wide font-bold text-slate-400 uppercase tracking-wider block">Overall Accuracy</span>
          <span className="text-3xl font-black text-slate-900 dark:text-white block">{overallAcc}%</span>
          <span className="text-xs tracking-wide text-slate-400 block">{overallTot > 0 ? `Based on ${overallTot} questions` : 'No data yet'}</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <TrendingUp className="h-6 w-6 text-indigo-600 mx-auto" />
          <span className="text-xs tracking-wide font-bold text-slate-400 uppercase tracking-wider block">Quant Accuracy</span>
          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 block">{qAcc}%</span>
          <span className="text-xs tracking-wide text-slate-400 block">QA Section</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <Star className="h-6 w-6 text-indigo-500 mx-auto" />
          <span className="text-xs tracking-wide font-bold text-slate-400 uppercase tracking-wider block">VARC Accuracy</span>
          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 block">{vAcc}%</span>
          <span className="text-xs tracking-wide text-slate-400 block">VARC Section</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto" />
          <span className="text-xs tracking-wide font-bold text-slate-400 uppercase tracking-wider block">LRDI Accuracy</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block">{lAcc}%</span>
          <span className="text-xs tracking-wide text-slate-400 block">DILR Section</span>
        </div>

      </div>

      {/* Topics mastery and Weak/Strong lists */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Topic Wise Accuracy bars */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold tracking-tight">Topic-wise Accuracy Profile</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {allTopicAccuracies.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No topic data available yet.</p>
            ) : (
              allTopicAccuracies.map((topic: any) => (
                <div key={topic.subtopicId} className="space-y-1">
                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <span className="font-bold block">{topic.name}</span>
                      <span className="text-xs tracking-wide text-slate-400">Avg Time: {topic.avgTime}s / q</span>
                    </div>
                    <span className={`font-bold ${
                      topic.accuracy >= 80 ? "text-emerald-500" : topic.accuracy >= 65 ? "text-amber-500" : "text-rose-500"
                    }`}>
                      {topic.accuracy}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        topic.accuracy >= 80 ? "bg-emerald-500" : topic.accuracy >= 65 ? "bg-amber-500" : "bg-rose-500"
                      }`} 
                      style={{ width: `${topic.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Strong vs Weak Areas */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Strong / Weak splits */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mastery Profile</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">Strongest Topics (Acc &gt;= 80%)</span>
                <div className="flex flex-wrap gap-2">
                  {strongestTopics.length > 0 ? strongestTopics.map((t: any) => (
                    <span key={t.subtopicId} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-xs">
                      {t.name}
                    </span>
                  )) : <span className="text-xs text-slate-400 italic">None yet</span>}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">Weakest Topics (Acc &lt; 65%)</span>
                <div className="flex flex-wrap gap-2">
                  {weakestTopics.length > 0 ? weakestTopics.map((t: any) => (
                    <span key={t.subtopicId} className="px-3 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 font-bold rounded-lg text-xs">
                      {t.name}
                    </span>
                  )) : <span className="text-xs text-slate-400 italic">None yet</span>}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Revision Queue */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/50 shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <AlertTriangle className="h-24 w-24 text-rose-50 dark:text-rose-950/20" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-bold tracking-tight">Revision Queue</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">Wrong or skipped questions from recent attempts that need your attention.</p>
          
          {revisionQueue.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-emerald-500 font-bold text-sm">All caught up! 🎉</span>
              <p className="text-xs text-slate-400 mt-1">Your revision queue is empty.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revisionQueue.map((q: any) => (
                <div key={q.id} className="bg-rose-50/50 dark:bg-rose-950/20 rounded-xl p-4 border border-rose-100 dark:border-rose-900/50 text-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs tracking-wide font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded">
                      {q.topic}
                    </span>
                  </div>
                  <p className="font-semibold line-clamp-3 text-slate-800 dark:text-slate-200">
                    {q.content}
                  </p>
                  
                  {expandedQ === q.id ? (
                    <div className="pt-2 space-y-2 border-t border-rose-200 dark:border-rose-800">
                      <div>
                        <span className="text-xs tracking-wide font-bold text-slate-500 uppercase">Your Answer</span>
                        <p className="text-rose-600 dark:text-rose-400 font-medium text-xs mt-0.5">{q.userAnswer}</p>
                      </div>
                      <div>
                        <span className="text-xs tracking-wide font-bold text-emerald-600 uppercase">Correct Answer</span>
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium text-xs mt-0.5">{q.correctAnswer}</p>
                      </div>
                      <button 
                        onClick={() => setExpandedQ(null)}
                        className="text-xs tracking-wide font-bold text-slate-500 hover:text-slate-700 w-full text-center mt-2 pt-2 border-t"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setExpandedQ(q.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 w-full text-left pt-2 border-t border-rose-200 dark:border-rose-800"
                    >
                      Review Mistake &rarr;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
                    <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-bold">{attempt.percentile}%ile</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{attempt.accuracy}%</td>
                    <td className="py-3 px-4">{Math.round(attempt.timeSpent / 60)} mins</td>
                    <td className="py-3 pl-4">
                      <Link 
                        href={
                          attempt.catPyqPaperId 
                            ? `/pyq/${attempt.catPyqPaperId}/analysis/${attempt.id}` 
                            : `/mock-tests/result/${attempt.id}`
                        } 
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
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
