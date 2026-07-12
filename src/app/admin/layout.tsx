"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Database, 
  Upload, 
  FileCheck,
  ShieldCheck,
  Loader2,
  LayoutDashboard
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user && (session.user as any).role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null; // Let the useEffect redirect
  }

  const navItems = [
    { name: "Content Upload", href: "/admin/upload", icon: Upload },
    { name: "Question Bank", href: "/admin/questions", icon: Database },
    { name: "Test Builder", href: "/admin/tests", icon: FileCheck },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 shrink-0 border-b border-slate-800">
          <ShieldCheck className="h-6 w-6 text-indigo-500" />
          <span className="font-black text-lg tracking-tight">CAT Admin</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <Link 
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Exit Admin
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
