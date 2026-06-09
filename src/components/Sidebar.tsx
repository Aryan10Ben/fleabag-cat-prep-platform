"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calculator,
  BookOpen,
  GitMerge,
  FileSpreadsheet,
  History,
  Trophy,
  User,
  Settings,
  Flame,
  Award,
  Cat
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [overallProgress, setOverallProgress] = useState(62); // State-driven default fallback
  const [streak, setStreak] = useState(5);

  useEffect(() => {
    // Fetch user progress periodically
    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/user/progress");
        if (res.ok) {
          const data = await res.json();
          if (data.overallProgress !== undefined) {
            setOverallProgress(data.overallProgress);
          }
          if (data.streak !== undefined) {
            setStreak(data.streak);
          }
        }
      } catch (err) {
        console.error("Failed to fetch sidebar progress:", err);
      }
    };
    if (session) {
      fetchProgress();
    }
  }, [session, pathname]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Quant Section", href: "/quant", icon: Calculator },
    { name: "VARC Section", href: "/varc", icon: BookOpen },
    { name: "LRDI Section", href: "/lrdi", icon: GitMerge },
    { name: "Previous Year CAT", href: "/pyq", icon: History },
    { name: "Full Mock Tests", href: "/mock-tests", icon: FileSpreadsheet },
    { name: "Performance", href: "/performance", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
  ];

  // If user is admin, show Admin Panel link
  if (session?.user && (session.user as any).role === "ADMIN") {
    navItems.push({ name: "Admin Panel", href: "/admin", icon: Settings });
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col flex-1 overflow-y-auto py-6 px-4">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex justify-center mb-8 pt-2">
          <Cat className="h-10 w-10 text-blue-500" />
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Progress & Streak Card in Sidebar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            <Award className="h-4 w-4" />
            <span>Warrior</span>
          </div>
        </div>

        {/* Progress Tracker Widget */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">Overall CAT Progress</span>
            <span className="text-slate-900 dark:text-white">{overallProgress}%</span>
          </div>
          {/* Custom ASCII styled modern bar */}
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
