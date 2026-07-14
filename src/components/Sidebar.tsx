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
} from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [overallProgress, setOverallProgress] = useState(0);
  const [streak, setStreak] = useState(0);

  const getRank = (progress: number) => {
    if (progress === 0) return "Aspirant";
    if (progress < 30) return "Novice";
    if (progress < 60) return "Challenger";
    if (progress < 90) return "Warrior";
    return "Master";
  };

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
    <aside
      className={`fixed md:sticky lg:hidden top-0 bottom-0 left-0 h-screen bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between z-50 md:z-30 transition-all duration-300 ease-in-out
        ${isOpen
          ? "translate-x-0 w-64 opacity-100 animate-fadeIn"
          : "-translate-x-full md:-translate-x-full md:w-0 md:opacity-0 md:pointer-events-none border-r-transparent overflow-hidden"
        }
      `}
    >
      <div className="w-64 shrink-0 flex flex-col justify-between h-full overflow-hidden">
        <div className="flex flex-col flex-1 overflow-y-auto py-6 px-4">
          {/* Brand Logo */}
          <Link href="/dashboard" onClick={onClose} className="flex justify-center mb-8 pt-2">
            <Image src="/logo.png" alt="CATPrep Logo" width={40} height={40} className="rounded-full object-cover" />
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
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-indigo-50 dark:bg-blue-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
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
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Award className="h-4 w-4" />
              <span>{getRank(overallProgress)}</span>
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
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

