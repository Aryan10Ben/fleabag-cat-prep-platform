"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isCleanLayout = pathname === "/" || pathname === "/login";
  const isTestSimulator =
    /^\/mock-tests\/[^/]+$/.test(pathname) && pathname !== "/mock-tests";
  const isPyqExam = /^\/pyq\/[^/]+\/exam$/.test(pathname);

  if (isCleanLayout || isTestSimulator || isPyqExam) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
