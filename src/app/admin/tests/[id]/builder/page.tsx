"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function TestBuilderPage() {
  const params = useParams();
  const testId = params.id as string;
  const router = useRouter();

  const [test, setTest] = useState<any>(null);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setTest(data.test);
      } else {
        router.push("/admin/tests");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBank = async () => {
    try {
      const res = await fetch(`/api/admin/questions?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setBankQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchTest(), fetchBank()]).finally(() => setLoading(false));
  }, [testId]); // Removed search from deps so it doesn't auto-fetch on every keystroke

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBank();
  };

  const handleAddQuestion = async (questionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (res.ok) {
        await fetchTest();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveQuestion = async (testQuestionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/questions?id=${testQuestionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTest();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  if (!test) return null;

  return (
    <div className="space-y-6 animate-fadeIn font-sans h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-4 shrink-0">
        <Link href="/admin/tests" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Builder: {test.name}</h1>
          <p className="text-xs text-slate-400 mt-1">Assemble questions for this Mock Test.</p>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
        {/* Left Pane: Test Questions */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-sm">Assigned Questions</h2>
            <span className="px-2.5 py-1 bg-indigo-100 dark:bg-blue-900/30 text-blue-700 dark:text-indigo-400 font-bold text-xs tracking-wide rounded-full">
              {test.questions?.length || 0} Total
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {test.questions?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No questions assigned yet. Add some from the bank.
              </div>
            ) : (
              test.questions?.map((tq: any, index: number) => (
                <div key={tq.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-700 transition-colors flex gap-3 group">
                  <div className="font-mono text-xs tracking-wide font-bold text-slate-400 pt-1 shrink-0">Q{index + 1}.</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                      {tq.question.content}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{tq.question.subtopic?.topic?.category}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">•</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${tq.question.difficulty === 'EASY' ? 'text-emerald-500' : tq.question.difficulty === 'HARD' ? 'text-rose-500' : 'text-amber-500'}`}>
                        {tq.question.difficulty}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveQuestion(tq.id)}
                    disabled={actionLoading}
                    className="p-1.5 h-fit text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Question Bank Search */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 space-y-3">
            <h2 className="font-bold text-sm">Question Bank</h2>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions by content..." 
                className="w-full pl-9 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </form>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {bankQuestions.map((q: any) => {
              const isAdded = test.questions?.some((tq: any) => tq.questionId === q.id);
              
              return (
                <div key={q.id} className={`p-3 border rounded-xl transition-colors flex gap-3 ${
                  isAdded 
                    ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-900/10 opacity-60" 
                    : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-700"
                }`}>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                      {q.content}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{q.subtopic?.topic?.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">•</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${q.difficulty === 'EASY' ? 'text-emerald-500' : q.difficulty === 'HARD' ? 'text-rose-500' : 'text-amber-500'}`}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddQuestion(q.id)}
                    disabled={actionLoading || isAdded}
                    className={`p-1.5 h-fit rounded shrink-0 transition-colors ${
                      isAdded 
                        ? "text-emerald-500 cursor-not-allowed" 
                        : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    {isAdded ? <span className="text-xs tracking-wide font-bold">ADDED</span> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
