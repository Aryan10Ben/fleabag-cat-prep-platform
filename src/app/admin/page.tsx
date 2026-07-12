"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Upload,
  Sparkles,
  PlusCircle,
  CheckCircle,
  ShieldAlert,
  Loader2,
  ListPlus
} from "lucide-react";
import type { GeneratedQuestionResult, SubtopicWithTopic } from "@/types/api";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"manual" | "bulk" | "ai" | "pyq">("manual");
  const [pyqImportJson, setPyqImportJson] = useState("");
  const [subtopics, setSubtopics] = useState<SubtopicWithTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ text: "", type: "" }); // type = 'success' or 'error'

  // Form states: Manual
  const [content, setContent] = useState("");
  const [type, setType] = useState("MCQ");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [subtopicId, setSubtopicId] = useState("");
  const [solution, setSolution] = useState("");
  const [options, setOptions] = useState([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ]);

  // Form states: Bulk
  const [csvContent, setCsvContent] = useState(
    `content,type,difficulty,solution,subtopicName,option1,option2,option3,option4
A car covers 120 km in 2 hours. Find its speed in m/s.,MCQ,EASY,Speed = Distance / Time = 120 / 2 = 60 km/h. Conversion = 60 * 5/18 = 16.67 m/s.,Time Speed Distance,16.67 m/s,20 m/s,15 m/s,30 m/s
A train leaves station A at 50km/h...,MCQ,MEDIUM,Standard speed relative formulas applies...,Time Speed Distance,60km/h,70km/h,80km/h,50km/h`
  );

  // Form states: AI Generator
  const [aiInputText, setAiInputText] = useState(
    "A trader sells wheat at a profit of 10% and uses weights which are 20% less than the actual weight. Find his net profit percentage."
  );
  const [aiDifficulty, setAiDifficulty] = useState("MEDIUM");
  const [aiResult, setAiResult] = useState<GeneratedQuestionResult | null>(null);

  // Auth Redirect check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user && session.user.role !== "ADMIN") {
      // Redirect regular users to dashboard
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch subtopics list on mount
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
          if (list.length > 0) setSubtopicId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (session?.user && (session.user as { role?: string }).role === "ADMIN") {
      fetchSubtopics();
    }
  }, [session]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice({ text: "", type: "" });

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          type,
          difficulty,
          subtopicId,
          solution,
          options,
        }),
      });

      if (res.ok) {
        setNotice({ text: "Question uploaded successfully!", type: "success" });
        setContent("");
        setSolution("");
        setOptions([
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ]);
      } else {
        const err = await res.json();
        setNotice({ text: err.error || "Failed to upload question.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotice({ text: "Error uploading question.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice({ text: "", type: "" });

    try {
      // Simple CSV row parser for MVP bulk uploads
      const lines = csvContent.split("\n");
      const questionsData = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cells = line.split(",");
        
        if (cells.length < 5) continue;
        
        const qContent = cells[0];
        const qType = cells[1];
        const qDiff = cells[2];
        const qSol = cells[3];
        const qSubName = cells[4];
        
        // MCQs have options
        const opts = [];
        if (qType === "MCQ" && cells.length >= 9) {
          opts.push({ content: cells[5], isCorrect: true }); // Assume first is correct
          opts.push({ content: cells[6], isCorrect: false });
          opts.push({ content: cells[7], isCorrect: false });
          opts.push({ content: cells[8], isCorrect: false });
        }

        questionsData.push({
          content: qContent,
          type: qType,
          difficulty: qDiff,
          solution: qSol,
          subtopicName: qSubName,
          options: opts,
        });
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          questions: questionsData,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setNotice({ text: `Successfully bulk loaded ${result.count} questions!`, type: "success" });
      } else {
        setNotice({ text: "Failed to process bulk upload.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotice({ text: "Invalid CSV format or parsing error.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    setNotice({ text: "", type: "" });
    setAiResult(null);

    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: aiInputText,
          difficulty: aiDifficulty,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setAiResult(result);
        setNotice({ text: "Similar question generated and saved to DB!", type: "success" });
      } else {
        setNotice({ text: "Similar question generation failed.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotice({ text: "Error in similar question workflow.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <p className="text-center py-10 text-xs">Validating admin session...</p>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Settings className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">Administration Panel</span>
          </div>
          <h1 className="text-2xl font-black">Content Management System</h1>
          <p className="text-xs text-slate-400">Upload curriculum questions, run bulk uploads, or generate similar questions from source text.</p>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => {
            setActiveTab("manual");
            setNotice({ text: "", type: "" });
          }}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "manual" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
          }`}
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Manual Upload</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("bulk");
            setNotice({ text: "", type: "" });
          }}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "bulk" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
          }`}
        >
          <Upload className="h-4.5 w-4.5" />
          <span>Bulk Upload</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("ai");
            setNotice({ text: "", type: "" });
          }}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "ai" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
          }`}
        >
          <Sparkles className="h-4.5 w-4.5" />
          <span>Similar Question Generator</span>
        </button>

        <button
          onClick={() => { setActiveTab("pyq"); setNotice({ text: "", type: "" }); }}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "pyq" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
          }`}
        >
          <ListPlus className="h-4.5 w-4.5" />
          <span>PYQ Import</span>
        </button>
      </div>

      {/* Alerts Notices */}
      {notice.text && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
          notice.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-950/20 border-red-500/20 text-red-600 dark:text-red-400"
        }`}>
          {notice.type === "success" ? <CheckCircle className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Manual Upload View */}
      {activeTab === "manual" && (
        <form onSubmit={handleManualSubmit} className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base font-bold">Manual CAT Question upload</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Subtopic Mapping</label>
              <select
                value={subtopicId}
                onChange={(e) => setSubtopicId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
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
                className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="TITA">Type in Answer (TITA)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">CAT Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
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
              placeholder="Enter the CAT question text here..."
              className="w-full px-4 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
            />
          </div>

          {/* MCQ choices options */}
          {type === "MCQ" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400">MCQ Options (Mark the correct radio button)</label>
              <div className="grid gap-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct-mcq"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectRadio(idx)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      required
                      value={opt.content}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Detailed Solution Explanation</label>
            <textarea
              required
              rows={4}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Step by step math or verbal reasoning solution..."
              className="w-full px-4 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4.5 w-4.5" />}
            Save to Curriculum
          </button>
        </form>
      )}

      {/* Bulk Upload View */}
      {activeTab === "bulk" && (
        <form onSubmit={handleBulkSubmit} className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold">Bulk upload CSV rows</h2>
            <p className="text-[11px] text-slate-400">Write or paste comma-separated values (CSV) matching headers below to ingest questions.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">CSV Spreadsheet Text</label>
            <textarea
              required
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4.5 w-4.5" />}
            Parse & Import Questions
          </button>
        </form>
      )}

      {/* Similar Question Generator View */}
      {activeTab === "ai" && (
        <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" /> Similar Question Generator
            </h2>
            <p className="text-[11px] text-slate-400">
              Paste a source CAT question. The heuristic engine detects the topic and generates a similar practice question at your chosen difficulty.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Target Difficulty</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="w-28 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Source Question Text</label>
              <textarea
                required
                rows={4}
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Paste original question here..."
                className="w-full px-4 py-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={loading}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Synthesizing similar questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 text-blue-400" />
                  <span>Generate Similar Question</span>
                </>
              )}
            </button>
          </div>

          {aiResult && (
            <div className="mt-8 border-t dark:border-slate-800 pt-6 space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-slate-900 border border-blue-500/10 space-y-2 text-xs">
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Topic Detection Complete</span>
                <div className="flex gap-4 font-mono text-[10px] text-slate-500">
                  <span><strong>Detected Topic:</strong> {aiResult.detectedTopic}</span>
                  <span>|</span>
                  <span><strong>Detected Subtopic:</strong> {aiResult.detectedSubtopic}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold">Synthesized CAT-Level Question Added to DB:</h3>
                
                {aiResult.questions.map((q, idx) => (
                  <div key={idx} className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/20 space-y-4">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{q.content}</p>
                    
                    {q.options.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {q.options.map((opt) => (
                          <div key={opt.id} className={`p-2 rounded border text-left ${
                            opt.isCorrect ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold" : "border-slate-100 dark:border-slate-800 text-slate-500"
                          }`}>
                            {opt.content}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">TITA Question Type</div>
                    )}

                    <div className="p-3.5 bg-blue-50/30 dark:bg-slate-900 rounded-xl text-xs space-y-1.5 font-mono leading-relaxed">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">Explanation:</span>
                      {q.solution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {activeTab === "pyq" && (
        <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border space-y-4">
          <h2 className="text-base font-bold">Import Previous Year CAT Paper (JSON)</h2>
          <p className="text-xs text-slate-400">Schema: <code>data/pyq-import-schema.json</code> — POST to <code>/api/admin/pyq/import</code></p>
          <textarea
            rows={12}
            value={pyqImportJson}
            onChange={(e) => setPyqImportJson(e.target.value)}
            placeholder='{"year":2024,"slot":1,"sections":[...]}'
            className="w-full px-4 py-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono"
          />
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const payload = JSON.parse(pyqImportJson);
                const res = await fetch("/api/admin/pyq/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (res.ok) setNotice({ text: `Imported ${data.imported} questions to ${data.paperId}`, type: "success" });
                else setNotice({ text: data.error || "Import failed", type: "error" });
              } catch {
                setNotice({ text: "Invalid JSON", type: "error" });
              } finally {
                setLoading(false);
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Import PYQ Paper
          </button>
        </div>
      )}

    </div>
  );
}
