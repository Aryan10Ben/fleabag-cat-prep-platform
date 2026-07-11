"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Sparkles, CheckSquare, ShieldAlert, ArrowRight, Loader2, Cat } from "lucide-react";

const motivationalQuotes = [
  "Success is built one question at a time.",
  "Every percentile starts with one solved problem.",
  "Consistency beats intensity.",
  "Your potential is endless. Go do the work.",
  "Focus on the process, not the score.",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("user@test.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Pick a random motivational message on mount
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setQuote(motivationalQuotes[randomIndex]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error || "Invalid login credentials. Please try again.");
        setLoading(false);
      } else {
        sessionStorage.setItem("fromLogin", "1");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const setCredentials = (role: "user" | "admin") => {
    if (role === "user") {
      setEmail("user@test.com");
      setPassword("password123");
    } else {
      setEmail("admin@test.com");
      setPassword("password123");
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      
      {/* Left panel: Login form */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center p-8 sm:p-12 bg-slate-950 border-r border-slate-900 relative overflow-hidden">
        
        {/* Form area */}
        <div className="space-y-6 py-12 relative z-10 w-full">
          {/* Logo centered above Welcome back */}
          <div className="flex justify-center mb-4">
            <Cat className="h-20 w-20 text-blue-400" />
          </div>

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="user@test.com"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs font-semibold text-blue-400 hover:underline">Forgot?</a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 active:scale-[0.98] disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick seeded login selectors */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setCredentials("user")}
              className="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Student Mode
            </button>
            <button
              type="button"
              onClick={() => setCredentials("admin")}
              className="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Admin Mode
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: Brand showcase (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden bg-[url('/fleabag-bg.jpg')] bg-cover bg-center p-16 text-white text-center">
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-0"></div>

        <div className="max-w-xl space-y-6 relative z-10 px-8">
          <blockquote className="space-y-6">
            <p className="text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-md">
              &ldquo;It will pass.&rdquo;
            </p>
            <p className="text-lg lg:text-xl font-light italic text-white/80 tracking-widest leading-relaxed">
              But first, you have to pass this exam.
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
