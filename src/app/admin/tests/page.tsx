"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, FileText, LayoutList } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, pyqRes] = await Promise.all([
        fetch("/api/admin/tests"),
        fetch("/api/admin/pyq"),
      ]);
      if (testsRes.ok) {
        const data = await testsRes.json();
        setTests(data.tests);
      }
      if (pyqRes.ok) {
        const data = await pyqRes.json();
        setPyqs(data.papers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTest = async () => {
    const name = prompt("Enter Mock Test Name:");
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: "MOCK",
          category: "FULL",
          duration: 120, // 40x3
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/tests/${data.test.id}/builder`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Test Builder</h1>
        <p className="text-xs text-slate-400 mt-1">Assemble Mock Tests and Past Year Papers from the Question Bank.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Mock Tests */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Custom Mock Tests
            </h2>
            <button 
              onClick={handleCreateTest}
              disabled={creating}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> New Mock
            </button>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : tests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No Mock Tests created yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {tests.map(test => (
                  <li key={test.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{test.name}</div>
                      <div className="text-xs tracking-wide text-slate-400 font-bold uppercase tracking-wide">
                        {test.category} • {test.duration} MINS • {test.questions?.length || 0} Qs
                      </div>
                    </div>
                    <Link href={`/admin/tests/${test.id}/builder`} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold">
                      Builder
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* PYQ Papers */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-purple-500" />
              Previous Year Papers
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : pyqs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No PYQ Papers found.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {pyqs.map(paper => (
                  <li key={paper.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">CAT {paper.year} Slot {paper.slot}</div>
                      <div className="text-xs tracking-wide text-slate-400 font-bold uppercase tracking-wide">
                        {paper.title} • {paper.status}
                      </div>
                    </div>
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed">
                      Read Only (JSON Importer)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
