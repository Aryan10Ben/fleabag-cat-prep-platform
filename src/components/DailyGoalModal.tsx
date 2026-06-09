"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Minus, Target, Sparkles, CheckCircle2 } from "lucide-react";

interface DailyGoalProgress {
  quantGoal: number;
  varcGoal: number;
  lrdiGoal: number;
  quantSolved: number;
  varcSolved: number;
  lrdiSolved: number;
}

interface DailyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DailyGoalProgress;
  onSaved?: () => void;
}

export default function DailyGoalModal({ isOpen, onClose, initialData, onSaved }: DailyGoalModalProps) {
  const [quantGoal, setQuantGoal] = useState(10);
  const [varcGoal, setVarcGoal] = useState(6);
  const [lrdiGoal, setLrdiGoal] = useState(4);

  const [quantSolved, setQuantSolved] = useState(0);
  const [varcSolved, setVarcSolved] = useState(0);
  const [lrdiSolved, setLrdiSolved] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setQuantGoal(initialData.quantGoal);
      setVarcGoal(initialData.varcGoal);
      setLrdiGoal(initialData.lrdiGoal);
      setQuantSolved(initialData.quantSolved);
      setVarcSolved(initialData.varcSolved);
      setLrdiSolved(initialData.lrdiSolved);
    } else {
      // Fetch fresh data if not provided
      const fetchGoal = async () => {
        try {
          const res = await fetch("/api/user/daily-goal");
          if (res.ok) {
            const data = await res.json();
            setQuantGoal(data.quantGoal);
            setVarcGoal(data.varcGoal);
            setLrdiGoal(data.lrdiGoal);
            setQuantSolved(data.quantSolved);
            setVarcSolved(data.varcSolved);
            setLrdiSolved(data.lrdiSolved);
          }
        } catch (err) {
          console.error("Failed to load daily goal in modal:", err);
        }
      };
      if (isOpen) {
        fetchGoal();
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Quant: multiple of 5, range 5-100
  const adjustQuant = (amount: number) => {
    setQuantGoal((prev) => {
      const next = prev + amount;
      return Math.max(5, Math.min(100, next));
    });
  };

  const handleQuantBlur = (val: string) => {
    const num = parseInt(val) || 5;
    // Round to nearest multiple of 5, clamp between 5 and 100
    const rounded = Math.max(5, Math.min(100, Math.round(num / 5) * 5));
    setQuantGoal(rounded);
  };

  // VARC: multiple of 2, range 2-100
  const adjustVarc = (amount: number) => {
    setVarcGoal((prev) => {
      const next = prev + amount;
      return Math.max(2, Math.min(100, next));
    });
  };

  const handleVarcBlur = (val: string) => {
    const num = parseInt(val) || 2;
    const rounded = Math.max(2, Math.min(100, Math.round(num / 2) * 2));
    setVarcGoal(rounded);
  };

  // LRDI: multiple of 1, range 1-100
  const adjustLrdi = (amount: number) => {
    setLrdiGoal((prev) => {
      const next = prev + amount;
      return Math.max(1, Math.min(100, next));
    });
  };

  const handleLrdiBlur = (val: string) => {
    const num = parseInt(val) || 1;
    const rounded = Math.max(1, Math.min(100, num));
    setLrdiGoal(rounded);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/daily-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantGoal,
          varcGoal,
          lrdiGoal,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        // Trigger global custom event so other components sync instantly
        window.dispatchEvent(new CustomEvent("daily-goals-updated"));
        
        if (onSaved) {
          onSaved();
        }
        
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update daily targets.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const totalSolved = quantSolved + varcSolved + lrdiSolved;
  const totalGoal = quantGoal + varcGoal + lrdiGoal;
  const overallPercentage = totalGoal > 0 ? Math.min(100, Math.round((totalSolved / totalGoal) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark blur overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-6 animate-fadeInUp">
        {/* Header */}
        <div className="flex justify-between items-center pb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Daily Targets</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Personalize your daily questions goal per section</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Overall Goal progress */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Overall Daily Goal Progress</span>
            <span className="text-lg font-black text-slate-800 dark:text-white">
              {totalSolved} <span className="text-xs font-bold text-slate-400">/ {totalGoal} solved</span>
            </span>
          </div>
          
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>{overallPercentage}% Complete</span>
            <span>{Math.max(0, totalGoal - totalSolved)} questions remaining</span>
          </div>
        </div>

        {/* Section List */}
        <div className="space-y-4 pt-2">
          {/* Quantitative Aptitude */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 space-y-1">
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250">Quantitative Aptitude</h4>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                <span>{quantSolved} / {quantGoal} Solved</span>
              </div>
            </div>
            
            {/* Progress bar in middle */}
            <div className="col-span-3">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min(100, (quantSolved / quantGoal) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Controls */}
            <div className="col-span-4 flex items-center justify-end gap-1.5">
              <button 
                onClick={() => adjustQuant(-5)}
                className="h-7 w-7 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                value={quantGoal}
                onChange={(e) => setQuantGoal(Number(e.target.value) || 0)}
                onBlur={(e) => handleQuantBlur(e.target.value)}
                className="w-12 text-center text-xs font-bold py-1 border border-slate-200 dark:border-slate-750 bg-transparent rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => adjustQuant(5)}
                className="h-7 w-7 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80" />

          {/* Verbal Ability & RC */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 space-y-1">
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250">Verbal Ability & RC</h4>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-650 dark:text-indigo-400 mt-1">
                <span>{varcSolved} / {varcGoal} Solved</span>
              </div>
            </div>
            
            {/* Progress bar in middle */}
            <div className="col-span-3">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${Math.min(100, (varcSolved / varcGoal) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Controls */}
            <div className="col-span-4 flex items-center justify-end gap-1.5">
              <button 
                onClick={() => adjustVarc(-2)}
                className="h-7 w-7 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                value={varcGoal}
                onChange={(e) => setVarcGoal(Number(e.target.value) || 0)}
                onBlur={(e) => handleVarcBlur(e.target.value)}
                className="w-12 text-center text-xs font-bold py-1 border border-slate-200 dark:border-slate-750 bg-transparent rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => adjustVarc(2)}
                className="h-7 w-7 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80" />

          {/* Logical Reasoning & DI */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 space-y-1">
              <h4 className="text-xs font-bold text-slate-855 dark:text-slate-250">Logical Reasoning & DI</h4>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-450 mt-1">
                <span>{lrdiSolved} / {lrdiGoal} Solved</span>
              </div>
            </div>
            
            {/* Progress bar in middle */}
            <div className="col-span-3">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${Math.min(100, (lrdiSolved / lrdiGoal) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Controls */}
            <div className="col-span-4 flex items-center justify-end gap-1.5">
              <button 
                onClick={() => adjustLrdi(-1)}
                className="h-7 w-7 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                value={lrdiGoal}
                onChange={(e) => setLrdiGoal(Number(e.target.value) || 0)}
                onBlur={(e) => handleLrdiBlur(e.target.value)}
                className="w-12 text-center text-xs font-bold py-1 border border-slate-200 dark:border-slate-750 bg-transparent rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => adjustLrdi(1)}
                className="h-7 w-7 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <p className="text-[11px] font-bold text-red-500 text-center animate-shake">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || saveSuccess}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-500/10"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Apply Targets
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
