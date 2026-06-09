"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@/components/CircularProgress";
import DailyGoalModal from "@/components/DailyGoalModal";
import {
  Flame,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  Calendar,
  Zap,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

const quotes = [
  "Success is built one question at a time.",
  "Every percentile starts with one solved problem.",
  "Consistency beats intensity.",
  "Your potential is endless. Go do the work.",
  "Focus on the process, not the score.",
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [loadingQuote, setLoadingQuote] = useState("");
  // Skip cinematic screen if coming from login
  const [skipScreen] = useState(() => {
    if (typeof window !== "undefined") {
      const came = sessionStorage.getItem("fromLogin");
      if (came) {
        sessionStorage.removeItem("fromLogin");
        return true;
      }
    }
    return false;
  });
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshData = async () => {
    try {
      const [progRes, analyticsRes] = await Promise.all([
        fetch("/api/user/progress"),
        fetch("/api/user/analytics"),
      ]);
      if (progRes.ok) setData(await progRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    window.addEventListener("daily-goals-updated", refreshData);
    return () => {
      window.removeEventListener("daily-goals-updated", refreshData);
    };
  }, []);

  // Auth Redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Loading quotes cycle
  useEffect(() => {
    setLoadingQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    const quoteInterval = setInterval(() => {
      setLoadingQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 2500);
    return () => clearInterval(quoteInterval);
  }, []);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/progress");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        // Simulate premium loading delay
        const timer = setTimeout(() => {
          setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  if (!skipScreen && (status === "loading" || loading)) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white overflow-hidden">
        {/* Fleabag painting background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('/fleabag-bg.jpg')" }}
        ></div>
        {/* Dark cinematic overlay */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"></div>
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 space-y-8">

          {/* Slow spinning ring */}
          <div className="relative flex items-center justify-center h-24 w-24 mb-4 animate-fadeInUp">
            <div className="absolute inset-0 rounded-full border border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/30 animate-spin-slow"></div>
            <div className="absolute inset-2 rounded-full border border-white/5"></div>
            <span className="text-xs font-light tracking-[0.25em] text-white/70 uppercase">
              Bored :)
            </span>
          </div>

          {/* Main text — two lines */}
          <div className="space-y-2 animate-fadeInUp-delay">
            <h2 className="font-playfair text-2xl md:text-3xl font-light tracking-wide text-white/70 leading-none">
              i Know
            </h2>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Keep doing it
            </h2>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 animate-fadeInUp-delay2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/25"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white/30"></div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/25"></div>
          </div>

          {/* Subtitle */}
          <p className="font-playfair text-lg md:text-xl italic font-light text-white/60 tracking-[0.15em] animate-fadeInUp-delay2">
            &ldquo;it will pass&rdquo;
          </p>
        </div>
      </div>
    );
  }

  // Fallbacks if fetch fails
  const progress = data?.overallProgress ?? 62;
  const quant = data?.quantProgress ?? 80;
  const varc = data?.varcProgress ?? 65;
  const lrdi = data?.lrdiProgress ?? 58;
  const streak = data?.streak ?? 5;
  const recentAttempts = data?.recentAttempts ?? [];
  const achievements = data?.achievements ?? [];

  const dailyGoalProgress = data?.dailyGoalProgress;
  const quantSolved = dailyGoalProgress?.quantSolved ?? 0;
  const varcSolved = dailyGoalProgress?.varcSolved ?? 0;
  const lrdiSolved = dailyGoalProgress?.lrdiSolved ?? 0;
  const quantGoal = dailyGoalProgress?.quantGoal ?? 10;
  const varcGoal = dailyGoalProgress?.varcGoal ?? 6;
  const lrdiGoal = dailyGoalProgress?.lrdiGoal ?? 4;

  const solvedToday = quantSolved + varcSolved + lrdiSolved;
  const dailyGoal = quantGoal + varcGoal + lrdiGoal;
  const goalPercentage = dailyGoal > 0 ? Math.min(100, Math.round((solvedToday / dailyGoal) * 100)) : 0;
  const remaining = Math.max(0, dailyGoal - solvedToday);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-500/5 blur-2xl"></div>
        <div className="space-y-2 relative">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back, {session?.user?.name || "Aspirant"}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg">
            Consistency is the secret ingredient. You solved 8 questions today. Keep it up!
          </p>
        </div>
        
        {/* Streak card */}
        <div className="flex items-center gap-4 py-2 px-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-500/10 text-orange-700 dark:text-orange-400 shrink-0">
          <Flame className="h-6 w-6 fill-orange-500 text-orange-500 animate-bounce" />
          <div>
            <p className="text-sm font-black leading-none">{streak} Days</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-500 mt-1">Daily Streak</p>
          </div>
        </div>
      </div>

      {analytics?.analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "PYQ Mocks", value: analytics.analytics.pyqMocksTaken ?? 0 },
            { label: "Best Score", value: analytics.analytics.bestScore ?? 0 },
            { label: "Avg Score", value: Math.round(analytics.analytics.averageScore ?? 0) },
            { label: "Best %ile", value: `${analytics.analytics.bestPercentile ?? 0}` },
            { label: "Strongest", value: analytics.analytics.strongestSection ?? "—" },
            { label: "Weakest", value: analytics.analytics.weakestSection ?? "—" },
          ].map((w) => (
            <div key={w.label} className="bg-white dark:bg-slate-950 p-4 rounded-xl border text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{w.label}</p>
              <p className="text-lg font-black mt-1">{w.value}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/pyq"
        className="block p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950/30 hover:border-indigo-400 transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase">Previous Year CAT</p>
            <h3 className="text-lg font-bold mt-1">18 Full PYQ Mocks (2020–2025)</h3>
            <p className="text-xs text-slate-500 mt-1">3 sections · 120 min · Slot-wise papers with analysis</p>
          </div>
          <ArrowRight className="h-5 w-5 text-indigo-600" />
        </div>
      </Link>

      {/* Main Grid: Circles & Metrics */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left column: Circular and Section progress */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Circular Tracker block */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex justify-center py-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
              <CircularProgress percentage={progress} size={140} strokeWidth={12} label="Overall CAT" />
            </div>
            
            <div className="md:col-span-8 space-y-4 px-2">
              <h2 className="text-lg font-bold tracking-tight">Section-wise Preparation Progress</h2>
              <div className="space-y-3">
                {/* Quant */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Quantitative Aptitude</span>
                    <span className="text-blue-600 dark:text-blue-400">{quant}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${quant}%` }}></div>
                  </div>
                </div>
                {/* VARC */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Verbal Ability & RC</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{varc}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${varc}%` }}></div>
                  </div>
                </div>
                {/* LRDI */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Logical Reasoning & DI</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{lrdi}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${lrdi}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section navigation cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/quant"
              className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all flex flex-col justify-between h-40 group shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">{quant}%</span>
              </div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-blue-600 transition-colors">Quant Preparation</h3>
                <p className="text-[11px] text-slate-400 mt-1">Arithmetic, Algebra, Geometry...</p>
              </div>
            </Link>

            <Link
              href="/varc"
              className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col justify-between h-40 group shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{varc}%</span>
              </div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-indigo-600 transition-colors">VARC Preparation</h3>
                <p className="text-[11px] text-slate-400 mt-1">Reading Comprehension, VA...</p>
              </div>
            </Link>

            <Link
              href="/lrdi"
              className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between h-40 group shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{lrdi}%</span>
              </div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-emerald-600 transition-colors">LRDI Preparation</h3>
                <p className="text-[11px] text-slate-400 mt-1">Matrix Arrangements, Venns...</p>
              </div>
            </Link>
          </div>

          {/* Recent mock performance */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold tracking-tight">Recent Mock Performance</h2>
              <Link href="/performance" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                All Scores <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            
            {recentAttempts.length === 0 ? (
              <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600 space-y-3">
                <Clock className="h-8 w-8" />
                <div>
                  <p className="text-sm font-bold">No Mock Attempts Recorded Yet</p>
                  <p className="text-xs mt-1">Start by taking a Full Mock Test to track metrics.</p>
                </div>
                <Link
                  href="/mock-tests"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Take a Mock Test
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAttempts.map((attempt: any) => (
                  <div key={attempt.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{attempt.test.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Score: <strong className="text-slate-700 dark:text-slate-350">{attempt.score}</strong></span>
                        <span>•</span>
                        <span>Accuracy: <strong className="text-slate-700 dark:text-slate-350">{attempt.accuracy}%</strong></span>
                        <span>•</span>
                        <span>Time: {Math.round(attempt.timeSpent / 60)} mins</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">{attempt.percentile}%ile</span>
                      <p className="text-[10px] text-slate-400 mt-1">Estimated</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Goals, Weak topics, achievements */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Daily Goal Widget */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 cursor-pointer hover:border-emerald-500/30 transition-all group"
            title="Click to adjust daily targets"
          >
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-emerald-500 transition-colors">Daily Goal Progress</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black">{solvedToday} / {dailyGoal}</span>
                <span className="text-xs text-slate-400">Questions solved today</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${goalPercentage}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {remaining > 0 
                  ? `Complete ${remaining} more practice questions to hit your daily percentile multiplier goal!`
                  : "Fantastic job! You've achieved your daily goal target!"
                }
              </p>
            </div>
          </div>

          {/* Weak Topics Widget */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Weak Areas</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold">Geometry Circles</h4>
                  <p className="text-[10px] text-red-600 dark:text-red-400">Accuracy is 64%. Needs Revision.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-500/10 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold">Time-Speed-Distance</h4>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Formula sheet read, but topic test accuracy is 50%.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Revision Topics */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-serif">Upcoming Revision</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold">Percentages</h4>
                  <span className="text-[10px] text-slate-400">Last practiced: 3 days ago</span>
                </div>
                <Link
                  href="/quant"
                  className="p-1 rounded bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold">Arrangement sets</h4>
                  <span className="text-[10px] text-slate-400">Last practiced: Yesterday</span>
                </div>
                <Link
                  href="/lrdi"
                  className="p-1 rounded bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Achievements shelf */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Achievements Shelf</h2>
              <Link href="/profile" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {achievements.slice(0, 4).map((ach: any) => (
                <div
                  key={ach.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-1 hover:bg-blue-550/10 cursor-pointer group"
                  title={ach.description}
                >
                  <Award className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 block truncate max-w-full">
                    {ach.title.split(" ")[0]}
                  </span>
                </div>
              ))}
              {achievements.length === 0 && (
                <p className="col-span-4 text-xs text-slate-400 italic text-center py-4">No badges unlocked yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      <DailyGoalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={dailyGoalProgress}
      />
    </div>
  );
}
