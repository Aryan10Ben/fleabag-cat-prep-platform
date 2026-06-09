"use client";

import React, { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, AlertTriangle, Calendar, CheckSquare, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DailyGoalModal from "@/components/DailyGoalModal";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [solvedToday, setSolvedToday] = useState(8);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [userName, setUserName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  // Close logout modal on Esc
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLogoutModalOpen) {
        setIsLogoutModalOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isLogoutModalOpen]);

  const fetchGoalData = async () => {
    try {
      const res = await fetch("/api/user/daily-goal");
      if (res.ok) {
        const data = await res.json();
        setSolvedToday(data.quantSolved + data.varcSolved + data.lrdiSolved);
        setDailyGoal(data.quantGoal + data.varcGoal + data.lrdiGoal);
      }
    } catch (err) {
      console.error("Failed to load daily goal in Navbar:", err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchGoalData();
    }
  }, [session, pathname]);

  useEffect(() => {
    window.addEventListener("daily-goals-updated", fetchGoalData);
    return () => {
      window.removeEventListener("daily-goals-updated", fetchGoalData);
    };
  }, []);

  useEffect(() => {
    // Check local storage or system preference for dark mode
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    }

    // Set actual date
    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    setCurrentDate(dateStr);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/progress");
        if (res.ok) {
          const data = await res.json();
          if (data.userName) {
            setUserName(data.userName);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (session) {
      fetchUser();
    }
    window.addEventListener("profile-updated", fetchUser);
    return () => {
      window.removeEventListener("profile-updated", fetchUser);
    };
  }, [session, pathname]);

  const toggleDarkMode = () => {
    if (typeof window !== "undefined") {
      const newDark = !isDarkMode;
      setIsDarkMode(newDark);
      if (newDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  // Skip rendering navbar if on landing page or login page
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Session/Topic Context Indicator */}
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span>{currentDate || "June 9, 2026"}</span>
        </span>
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 px-2 py-0.5 rounded-lg transition-all border border-transparent hover:border-slate-150 dark:hover:border-slate-800"
            title="Click to adjust daily targets"
          >
            <CheckSquare className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-350 font-semibold">
              <strong className="text-slate-900 dark:text-white font-extrabold">{solvedToday} / {dailyGoal}</strong> solved today
            </span>
          </button>

        </div>
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-500" />}
        </button>

        {session?.user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all group-hover:border-blue-500/35">
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || session.user.name || "CAT Aspirant")}`} 
                  alt="Avatar" 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                  {userName || session.user.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">
                  {(session.user as any).role || "USER"}
                </p>
              </div>
            </Link>

            <span className="h-6 w-px bg-slate-100 dark:bg-slate-800"></span>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-1 text-sm font-semibold"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline text-xs">Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
        )}
      </div>
      <DailyGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          aria-describedby="logout-desc"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsLogoutModalOpen(false)}
          />

          {/* Dialog */}
          <div
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
            style={{ animation: "fadeInUp 0.18s ease both" }}
          >
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3
                  id="logout-title"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Sign Out
                </h3>
                <p
                  id="logout-desc"
                  className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
                >
                  Are you sure you want to sign out?
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
