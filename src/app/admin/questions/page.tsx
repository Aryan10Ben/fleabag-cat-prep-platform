"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Search, Filter, Edit, Trash2 } from "lucide-react";
import EditQuestionModal from "@/components/admin/EditQuestionModal";

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        alert("Failed to delete question");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Question Bank</h1>
          <p className="text-xs text-slate-400 mt-1">Manage and edit the full curriculum of questions.</p>
        </div>
        <button 
          onClick={fetchQuestions}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No questions found. Go to Upload to add some.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider">Type / Diff</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider">Topic</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="line-clamp-2 font-medium text-slate-700 dark:text-slate-300">
                        {q.content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 dark:bg-blue-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs tracking-wide">
                          {q.type}
                        </span>
                        <span className={`block text-xs tracking-wide font-bold ${
                          q.difficulty === "EASY" ? "text-emerald-500" :
                          q.difficulty === "MEDIUM" ? "text-amber-500" : "text-rose-500"
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs tracking-wide font-bold text-slate-500">{q.subtopic?.topic?.name}</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{q.subtopic?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingQuestion(q)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-blue-900/30 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingQuestion && (
        <EditQuestionModal 
          question={editingQuestion} 
          onClose={() => setEditingQuestion(null)} 
          onSaved={() => {
            setEditingQuestion(null);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}
