"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X, Save } from "lucide-react";
import type { SubtopicWithTopic } from "@/types/api";

interface EditQuestionModalProps {
  question: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditQuestionModal({ question, onClose, onSaved }: EditQuestionModalProps) {
  const [content, setContent] = useState(question.content || "");
  const [type, setType] = useState(question.type || "MCQ");
  const [difficulty, setDifficulty] = useState(question.difficulty || "MEDIUM");
  const [subtopicId, setSubtopicId] = useState(question.subtopicId || "");
  const [solution, setSolution] = useState(question.solution || "");
  const [options, setOptions] = useState<any[]>(
    question.options && question.options.length > 0
      ? question.options.map((o: any) => ({ content: o.content, isCorrect: o.isCorrect }))
      : [
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ]
  );
  
  const [subtopics, setSubtopics] = useState<SubtopicWithTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubtopics = async () => {
      try {
        const res = await fetch("/api/topics?category=QUANT");
        if (res.ok) {
          const result = await res.json();
          const list: SubtopicWithTopic[] = [];
          result.topics.forEach((t: { name: string; subtopics: { id: string; name: string }[] }) => {
            t.subtopics.forEach((s) => {
              list.push({ ...s, topicName: t.name });
            });
          });
          setSubtopics(list);
          if (!subtopicId && list.length > 0) {
            setSubtopicId(list[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubtopics();
  }, [subtopicId]);

  const handleOptionChange = (idx: number, val: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[idx].content = val;
      return copy;
    });
  };

  const handleCorrectRadio = (idx: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === idx,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          type,
          difficulty,
          subtopicId,
          solution,
          options: type === "MCQ" ? options : [],
        }),
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to update question.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col font-sans border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Edit Question</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900 rounded-full">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 text-xs font-bold rounded-lg">
              {error}
            </div>
          )}
          
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Subtopic Mapping</label>
                <select
                  value={subtopicId}
                  onChange={(e) => setSubtopicId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {subtopics.map((s) => (
                    <option key={s.id} value={s.id}>[{s.topicName}] {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Question Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="TITA">Type in Answer (TITA)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Question Content</label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {type === "MCQ" && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400">MCQ Options</label>
                <div className="grid gap-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={opt.isCorrect}
                        onChange={() => handleCorrectRadio(idx)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        required
                        value={opt.content}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Solution Explanation</label>
              <textarea
                required
                rows={4}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-form"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
