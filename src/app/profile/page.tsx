"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Award, Flame, User, Mail, ShieldAlert, Sparkles, CheckCircle } from "lucide-react";

const allAchievements = [
  { title: "First Topic Completed", description: "Successfully finished a formula sheet and practice questions for one topic." },
  { title: "First 100 Questions Solved", description: "Cleared 100 practice questions on the platform." },
  { title: "First Mock Attempted", description: "Submitted your first full-length CAT mock test." },
  { title: "Quant Master", description: "Attained over 80% accuracy in the Quant section." },
  { title: "VARC Master", description: "Attained over 80% accuracy in the VARC section." },
  { title: "LRDI Master", description: "Attained over 80% accuracy in the LRDI section." },
  { title: "CAT Warrior", description: "Completed a Mock test under exam conditions." },
  { title: "30 Day Streak", description: "Maintained a continuous daily prep streak of 30 days." },
  { title: "100 Day Streak", description: "Maintained a continuous daily prep streak of 100 days." },
];

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
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
    fetchProfileData();
  }, []);

  const handleEdit = () => {
    setTempName(session?.user?.name || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!tempName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tempName }),
      });
      if (res.ok) {
        const result = await res.json();
        await update({ name: result.userName });
        setIsEditing(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update profile name");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile name");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Loading student profile...</p>
      </div>
    );
  }

  const streak = data?.streak ?? 5;
  const unlockedAchievements = data?.achievements ?? [];

  const isUnlocked = (title: string) => {
    return unlockedAchievements.some((a: any) => a.title === title);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session?.user?.name || "CAT Aspirant")}`} 
              alt="Avatar" 
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="space-y-2 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  disabled={saving}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs"
                  placeholder="Enter name"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !tempName.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black">{session?.user?.name || "Aspirant Student"}</h1>
                <button
                  onClick={handleEdit}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-blue-950/20 rounded transition-all"
                  title="Edit Name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
              </div>
            )}
            <p className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
              <Mail className="h-4.5 w-4.5 text-slate-400" /> {session?.user?.email || "user@test.com"}
            </p>
          </div>
        </div>

        {/* Streak widget */}
        <div className="flex items-center gap-4 py-3 px-6 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-500/10 text-orange-700 dark:text-orange-400 shrink-0">
          <Flame className="h-7 w-7 fill-orange-500 text-orange-500 animate-pulse" />
          <div>
            <p className="text-lg font-black leading-none">{streak} Days</p>
            <p className="text-xs tracking-wide font-bold uppercase tracking-wider text-orange-600 dark:text-orange-500 mt-1">Streaks Active</p>
          </div>
        </div>
      </div>

      {/* Achievements shelf grid */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Award className="h-5.5 w-5.5 text-indigo-600" />
            Achievements Shelf
          </h2>
          <p className="text-xs text-slate-400">Complete curriculum topics, mocks, and maintain streaks to unlock badges.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {allAchievements.map((ach) => {
            const unlocked = isUnlocked(ach.title);
            return (
              <div
                key={ach.title}
                className={`p-5 rounded-2xl border flex flex-col justify-between h-44 transition-all relative ${
                  unlocked
                    ? "border-emerald-500/25 bg-emerald-50/5 dark:bg-slate-900/10"
                    : "border-slate-100 dark:border-slate-805 bg-slate-50/20 dark:bg-slate-900/5 opacity-55"
                }`}
              >
                {/* Unlock badge overlay */}
                {unlocked && (
                  <div className="absolute right-4 top-4 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Unlocked
                  </div>
                )}

                <div className="space-y-2">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                    unlocked ? "bg-emerald-50 dark:bg-slate-800 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}>
                    <Award className="h-5 w-5" />
                  </div>

                  <h3 className="text-sm font-bold leading-tight">{ach.title}</h3>
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal line-clamp-2">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
