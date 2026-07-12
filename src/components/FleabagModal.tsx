"use client";

import React, { useState, useEffect } from "react";
import { getRandomReflection } from "@/config/fleabag";
import { Sparkles, Calendar, BookOpen } from "lucide-react";

interface FleabagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FleabagModal({ isOpen, onClose }: FleabagModalProps) {
  const [reflection, setReflection] = useState({ primary: "", secondary: "" });
  const [countdown, setCountdown] = useState(3);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReflection(getRandomReflection());
      setCountdown(3);
      setCanDismiss(false);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanDismiss(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-indigo-500/10 bg-white dark:bg-slate-950 p-8 shadow-2xl transition-all scale-100">
        
        {/* Soft Glowing Background Blur */}
        <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
        <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"></div>

        <div className="relative flex flex-col items-center text-center space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white font-serif italic">
              &ldquo;{reflection.primary}&rdquo;
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {reflection.secondary}
            </p>
          </div>

          <button
            onClick={() => {
              if (canDismiss) onClose();
            }}
            disabled={!canDismiss}
            className={`w-full py-3 px-6 rounded-xl font-medium tracking-wide transition-all duration-300 ${
              canDismiss
                ? "bg-indigo-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            {canDismiss ? "View Results" : `Reflect (${countdown}s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
