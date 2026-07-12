"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type Difficulty = "ALL" | "EASY" | "MEDIUM" | "HARD";

interface PracticeSessionProps {
  subtopicId: string;
  backHref: string;
  backLabel: string;
  accent?: "blue" | "indigo" | "emerald";
}

export default function PracticeSession({
  subtopicId,
  backHref,
  backLabel,
  accent = "blue",
}: PracticeSessionProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [titaAnswer, setTitaAnswer] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progressUpdated, setProgressUpdated] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("ALL");
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const accentBtn =
    accent === "indigo"
      ? "bg-indigo-600 hover:bg-indigo-700"
      : accent === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-indigo-600 hover:bg-blue-700";

  const accentText =
    accent === "indigo"
      ? "text-indigo-600 dark:text-indigo-400"
      : accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-indigo-600 dark:text-indigo-400";

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setCurrentIndex(0);
      setSelectedOptionId(null);
      setTitaAnswer("");
      setShowSolution(false);
      try {
        const params = new URLSearchParams({
          subtopicId,
          limit: "100",
        });
        if (difficulty !== "ALL") params.set("difficulty", difficulty);
        const res = await fetch(`/api/questions?${params}`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions);
          setAnsweredQuestionIds(new Set());
        }
      } catch (err) {
        console.error("Failed to load practice questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [subtopicId, difficulty]);

  const handleOptionSelect = (optionId: string) => {
    if (showSolution) return;
    setSelectedOptionId(optionId);
    setAnsweredQuestionIds((prev) => {
      const next = new Set(prev);
      next.add(currentQuestion.id);
      return next;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setTitaAnswer("");
      setShowSolution(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOptionId(null);
      setTitaAnswer("");
      setShowSolution(false);
    }
  };

  const markCompleted = async () => {
    try {
      const count = answeredQuestionIds.size;
      const res = await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtopicId,
          field: "practiceQuestionsCompleted",
          value: true,
          questionsAnswered: count > 0 ? count : 1,
        }),
      });
      if (res.ok) {
        setProgressUpdated(true);
        setTimeout(() => router.push(backHref), 1500);
      }
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  const difficultyTabs: { key: Difficulty; label: string; count: number }[] = [
    { key: "ALL", label: "All (100)", count: 100 },
    { key: "EASY", label: "Easy", count: 33 },
    { key: "MEDIUM", label: "Medium", count: 34 },
    { key: "HARD", label: "Hard", count: 33 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading practice questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <HelpCircle className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold">No Questions Found</h2>
        <p className="text-xs text-slate-500">
          Run database seed to load 100 CAT-level questions per subtopic.
        </p>
        <Link
          href={backHref}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 text-white rounded-xl ${accentBtn}`}
        >
          {backLabel}
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <span className="text-xs font-bold px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {difficultyTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDifficulty(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              difficulty === tab.key
                ? `${accentBtn} text-white`
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 p-4 flex gap-2">
          <span
            className={`text-xs tracking-wide font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              currentQuestion.difficulty === "EASY"
                ? "bg-emerald-50 text-emerald-600"
                : currentQuestion.difficulty === "MEDIUM"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {currentQuestion.difficulty}
          </span>
          {currentQuestion.type === "TITA" && (
            <span className="text-xs tracking-wide font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-50 text-amber-600">
              TITA
            </span>
          )}
        </div>

        {currentQuestion.rcPassage && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs tracking-wide font-bold uppercase tracking-wider text-slate-400">Reading Passage</p>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentQuestion.rcPassage.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{currentQuestion.rcPassage.content}</p>
          </div>
        )}

        {currentQuestion.lrdiSet && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs tracking-wide font-bold uppercase tracking-wider text-slate-400">LRDI Set</p>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentQuestion.lrdiSet.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{currentQuestion.lrdiSet.description}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className={`text-xs font-extrabold uppercase tracking-widest ${accentText}`}>Practice Question</p>
          <h2 className="text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
            {currentQuestion.content}
          </h2>
        </div>

        <div className="space-y-3 pt-2">
          {currentQuestion.type === "MCQ" ? (
            <div className="grid gap-3">
              {currentQuestion.options.map((opt: any) => {
                const isSelected = selectedOptionId === opt.id;
                const isCorrect = opt.isCorrect;
                let btnStyle = "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900";
                if (isSelected) btnStyle = "border-indigo-600 bg-indigo-50/10 text-indigo-600";
                if (showSolution) {
                  if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 font-bold";
                  else if (isSelected) btnStyle = "border-red-500 bg-red-500/10 text-red-600";
                }
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    className={`p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt.content}</span>
                    {showSolution && isCorrect && (
                      <span className="text-xs tracking-wide font-bold text-emerald-600 uppercase">Correct</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Type in the Answer (TITA):</label>
              <input
                type="text"
                disabled={showSolution}
                value={titaAnswer}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitaAnswer(val);
                  setAnsweredQuestionIds((prev) => {
                    const next = new Set(prev);
                    if (val.trim()) {
                      next.add(currentQuestion.id);
                    } else {
                      next.delete(currentQuestion.id);
                    }
                    return next;
                  });
                }}
                placeholder="Enter numerical answer"
                className="w-full max-w-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-4 flex-wrap">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSolution ? "Hide Explanation" : "Reveal Answer & Shortcut"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {currentIndex === questions.length - 1 ? (
              <button onClick={markCompleted} className={`px-4 py-2 text-white rounded-xl text-xs font-bold ${accentBtn}`}>
                Complete Practice
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {showSolution && (
          <div className="mt-6 p-5 rounded-2xl bg-indigo-50/50 dark:bg-slate-900 border border-indigo-500/10 space-y-3">
            <div className={`flex items-center gap-1.5 font-bold text-xs ${accentText}`}>
              <Sparkles className="h-4 w-4" />
              <span>Detailed Solution — Easiest Approach</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {currentQuestion.solution}
            </p>
          </div>
        )}
      </div>

      {progressUpdated && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-xs font-bold text-emerald-600 flex items-center gap-2 justify-center">
          <CheckCircle className="h-5 w-5" />
          Practice completed! Updating your checklist...
        </div>
      )}
    </div>
  );
}
