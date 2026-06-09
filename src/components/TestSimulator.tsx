"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calculator,
  Clock,
  Play,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

type AnswerState = {
  selectedOptionId: string | null;
  titaAnswer: string;
  isMarkedReview: boolean;
  visited: boolean;
};

interface TestSimulatorProps {
  testId: string;
}

const SECTION_LABELS: Record<string, string> = {
  QUANT: "Quantitative Aptitude (QA)",
  VARC: "Verbal Ability & Reading Comprehension (VARC)",
  LRDI: "Data Interpretation & Logical Reasoning (DILR)",
};

export default function TestSimulator({ testId }: TestSimulatorProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [showCalc, setShowCalc] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const tRes = await fetch(`/api/tests/${testId}`);
        if (!tRes.ok) {
          setTestDetails(null);
          setQuestions([]);
          return;
        }
        const tData = await tRes.json();
        const testObj = tData.test;
        setTestDetails(testObj);
        setSecondsLeft(testObj.duration * 60);

        const qRes = await fetch(`/api/questions?testId=${testId}`);
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestions(qData.questions || []);
          const initialAnswers: Record<string, AnswerState> = {};
          (qData.questions || []).forEach((q: any, idx: number) => {
            initialAnswers[q.id] = {
              selectedOptionId: null,
              titaAnswer: "",
              isMarkedReview: false,
              visited: idx === 0,
            };
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestData();
  }, [testId]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current || questions.length === 0) return;
    submittingRef.current = true;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const submissionAnswers = questions.map((q) => {
      const state = answers[q.id];
      return {
        questionId: q.id,
        selectedOptionId: state?.selectedOptionId ?? null,
        titaAnswer: state?.titaAnswer ?? "",
        isMarkedReview: state?.isMarkedReview ?? false,
      };
    });

    const timeSpent = testDetails ? testDetails.duration * 60 - secondsLeft : 0;

    try {
      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: submissionAnswers, timeSpent }),
      });

      if (res.ok) {
        const result = await res.json();
        router.push(`/mock-tests/result/${result.attemptId}`);
      } else {
        alert("Failed to submit test. Please try again.");
        submittingRef.current = false;
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Submission error occurred.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [answers, questions, router, secondsLeft, testDetails, testId]);

  useEffect(() => {
    if (!started || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, questions.length, handleSubmit]);

  const handleVisitQuestion = (index: number) => {
    setCurrentIndex(index);
    const qId = questions[index].id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], visited: true },
    }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCalcPress = (char: string) => {
    if (char === "C") setCalcInput("");
    else if (char === "=") {
      try {
        const cleanExp = calcInput.replace(/[^0-9+\-*/.]/g, "");
        const result = Function(`"use strict"; return (${cleanExp})`)();
        setCalcInput(String(result));
      } catch {
        setCalcInput("Error");
      }
    } else {
      setCalcInput((prev) => prev + char);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center z-50">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
        <p className="text-sm mt-4">Loading CAT test environment...</p>
      </div>
    );
  }

  if (!testDetails || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center z-50 p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-400" />
        <h1 className="text-xl font-bold">Test Not Found</h1>
        <p className="text-sm text-slate-400 max-w-md">
          This test could not be loaded. It may not exist or has no questions assigned.
        </p>
        <button
          onClick={() => router.push("/mock-tests")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold"
        >
          Back to Mock Tests
        </button>
      </div>
    );
  }

  if (!started) {
    const isPyq = testDetails.name.includes("PYQ");
    const sectionLabel = SECTION_LABELS[testDetails.category] || testDetails.category;

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-2 text-blue-400">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">CAT Exam Simulator</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black">{testDetails.name}</h1>
            <p className="text-sm text-slate-400">{sectionLabel}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-black text-blue-400">{questions.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Questions</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-black text-rose-400">{testDetails.duration}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Minutes</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-black text-emerald-400">{isPyq ? "PYQ" : testDetails.type}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Format</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="font-bold text-white mb-2">Marking Scheme (CAT Standard)</p>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>MCQ correct: <strong className="text-emerald-400">+3 marks</strong></li>
              <li>MCQ incorrect: <strong className="text-rose-400">−1 mark</strong></li>
              <li>TITA correct: <strong className="text-emerald-400">+3 marks</strong> · No negative marking</li>
              <li>Timer starts immediately when you begin — cannot pause</li>
              <li>Use question palette to jump between questions</li>
            </ul>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-white" /> I am ready — Start Test
          </button>

          <button
            onClick={() => router.push("/mock-tests")}
            className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to test list
          </button>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center z-50">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full" />
        <p className="text-sm mt-4">Submitting & generating analysis...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const qState = answers[currentQuestion?.id] || {
    selectedOptionId: null,
    titaAnswer: "",
    isMarkedReview: false,
    visited: false,
  };
  const hasSplitView = currentQuestion?.rcPassage || currentQuestion?.lrdiSet;
  const sectionLabel = SECTION_LABELS[testDetails.category] || "Section";

  const getPaletteStyle = (qId: string, idx: number) => {
    const state = answers[qId];
    const isCurrent = currentIndex === idx;
    let base =
      "h-8 w-8 rounded text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ";
    if (isCurrent) base += "ring-2 ring-blue-500 ";
    if (!state) return base + "bg-slate-200 text-slate-500";
    const hasAnswer = state.selectedOptionId || state.titaAnswer;
    if (state.isMarkedReview) {
      return base + (hasAnswer ? "bg-violet-600 text-white" : "bg-violet-500 text-white");
    }
    if (hasAnswer) return base + "bg-emerald-500 text-white";
    if (state.visited) return base + "bg-rose-500 text-white";
    return base + "bg-slate-200 text-slate-500";
  };

  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOptionId || a.titaAnswer
  ).length;
  const reviewCount = Object.values(answers).filter((a) => a.isMarkedReview).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col h-screen font-sans text-slate-900">
      <header className="h-14 bg-slate-800 text-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-sm truncate max-w-[200px] md:max-w-md">{testDetails.name}</span>
          <span className="h-4 w-px bg-slate-600 shrink-0" />
          <button
            onClick={() => setShowCalc(!showCalc)}
            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs flex items-center gap-1.5 shrink-0"
          >
            <Calculator className="h-4 w-4" /> Calculator
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded ${
              secondsLeft < 120 ? "bg-red-600 animate-pulse" : "bg-red-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(secondsLeft)}
          </div>
          <button
            onClick={() => {
              if (confirm("Submit test now? You cannot change answers after submission.")) {
                handleSubmit();
              }
            }}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded text-xs"
          >
            Submit Section
          </button>
        </div>
      </header>

      <div className="h-9 bg-slate-200 px-4 flex items-center gap-1 shrink-0 border-b">
        <span className="px-3 py-1 bg-white border-t border-x text-xs font-bold text-blue-700">
          {sectionLabel}
        </span>
        <span className="text-[10px] text-slate-500 ml-2">
          Q{currentIndex + 1}/{questions.length} · Answered {answeredCount} · Marked {reviewCount}
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex overflow-hidden p-3">
          {hasSplitView ? (
            <div className="flex-1 grid md:grid-cols-2 gap-3 h-full overflow-hidden">
              <div className="rounded-lg border bg-white p-5 overflow-y-auto text-sm leading-relaxed shadow-sm">
                {currentQuestion.rcPassage && (
                  <>
                    <h3 className="font-bold border-b pb-2 mb-3">{currentQuestion.rcPassage.title}</h3>
                    <p className="whitespace-pre-line">{currentQuestion.rcPassage.content}</p>
                  </>
                )}
                {currentQuestion.lrdiSet && (
                  <>
                    <h3 className="font-bold border-b pb-2 mb-3">{currentQuestion.lrdiSet.title}</h3>
                    <p className="whitespace-pre-line font-mono text-xs bg-slate-50 p-3 rounded">
                      {currentQuestion.lrdiSet.description}
                    </p>
                  </>
                )}
              </div>
              <QuestionPanel
                currentIndex={currentIndex}
                currentQuestion={currentQuestion}
                qState={qState}
                onSelectOption={(id) => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({
                    ...prev,
                    [qId]: { ...prev[qId], selectedOptionId: id, isMarkedReview: false },
                  }));
                }}
                onTita={(val) => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], titaAnswer: val } }));
                }}
                onClear={() => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({
                    ...prev,
                    [qId]: { ...prev[qId], selectedOptionId: null, titaAnswer: "", isMarkedReview: false },
                  }));
                }}
                onMarkReview={() => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({
                    ...prev,
                    [qId]: { ...prev[qId], isMarkedReview: true },
                  }));
                  if (currentIndex < questions.length - 1) handleVisitQuestion(currentIndex + 1);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 rounded-lg border bg-white p-6 overflow-y-auto shadow-sm max-w-3xl mx-auto w-full">
              <QuestionPanel
                currentIndex={currentIndex}
                currentQuestion={currentQuestion}
                qState={qState}
                large
                onSelectOption={(id) => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({
                    ...prev,
                    [qId]: { ...prev[qId], selectedOptionId: id, isMarkedReview: false },
                  }));
                }}
                onTita={(val) => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], titaAnswer: val } }));
                }}
                onClear={() => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({
                    ...prev,
                    [qId]: { ...prev[qId], selectedOptionId: null, titaAnswer: "", isMarkedReview: false },
                  }));
                }}
                onMarkReview={() => {
                  const qId = currentQuestion.id;
                  setAnswers((prev) => ({
                    ...prev,
                    [qId]: { ...prev[qId], isMarkedReview: true },
                  }));
                  if (currentIndex < questions.length - 1) handleVisitQuestion(currentIndex + 1);
                }}
              />
            </div>
          )}
        </div>

        <div className="w-56 bg-slate-200 border-l flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 border-b bg-white text-[10px] grid grid-cols-2 gap-1 font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 bg-emerald-500 rounded" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 bg-rose-500 rounded" /> Not Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 bg-violet-500 rounded" /> Marked
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 bg-slate-200 rounded border" /> Not Visited
            </span>
          </div>
          <div className="p-3 flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Question Palette</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => (
                <button key={q.id} onClick={() => handleVisitQuestion(idx)} className={getPaletteStyle(q.id, idx)}>
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="h-12 bg-white border-t flex items-center justify-between px-4 shrink-0">
        <button
          onClick={() => currentIndex > 0 && handleVisitQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="px-4 py-1.5 border text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          onClick={() => currentIndex < questions.length - 1 && handleVisitQuestion(currentIndex + 1)}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-30"
        >
          Save & Next <ChevronRight className="h-4 w-4" />
        </button>
      </footer>

      {showCalc && (
        <div className="absolute top-16 left-4 z-50 w-52 rounded-xl border bg-white p-3 shadow-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">Calculator</span>
            <button onClick={() => setShowCalc(false)} className="text-xs text-slate-400">
              ✕
            </button>
          </div>
          <input
            readOnly
            value={calcInput}
            className="w-full text-right px-2 py-1.5 border rounded font-mono text-sm bg-slate-50"
          />
          <div className="grid grid-cols-4 gap-1 text-xs font-bold">
            {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "C", "0", "=", "+"].map((char) => (
              <button
                key={char}
                onClick={() => handleCalcPress(char)}
                className={`py-2 rounded ${char === "=" ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionPanel({
  currentIndex,
  currentQuestion,
  qState,
  large,
  onSelectOption,
  onTita,
  onClear,
  onMarkReview,
}: {
  currentIndex: number;
  currentQuestion: any;
  qState: AnswerState;
  large?: boolean;
  onSelectOption: (id: string) => void;
  onTita: (val: string) => void;
  onClear: () => void;
  onMarkReview: () => void;
}) {
  return (
    <div className={`flex flex-col justify-between h-full ${large ? "" : "rounded-lg border bg-white p-5 shadow-sm"}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Question {currentIndex + 1}</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
              currentQuestion.difficulty === "EASY"
                ? "bg-emerald-100 text-emerald-700"
                : currentQuestion.difficulty === "MEDIUM"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {currentQuestion.difficulty}
          </span>
          {currentQuestion.type === "TITA" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-700">
              TITA
            </span>
          )}
        </div>
        <h3 className={`font-semibold leading-relaxed ${large ? "text-lg" : "text-sm"}`}>
          {currentQuestion.content}
        </h3>
        <div className="space-y-2 pt-2">
          {currentQuestion.type === "MCQ" ? (
            currentQuestion.options.map((opt: any) => (
              <button
                key={opt.id}
                onClick={() => onSelectOption(opt.id)}
                className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                  qState.selectedOptionId === opt.id
                    ? "border-blue-600 bg-blue-50 text-blue-800 font-semibold"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.content}
              </button>
            ))
          ) : (
            <input
              type="text"
              value={qState.titaAnswer}
              onChange={(e) => onTita(e.target.value)}
              placeholder="Enter numerical answer (TITA)"
              className="w-full max-w-xs px-3 py-2 text-sm border rounded-lg focus:border-blue-500 focus:outline-none"
            />
          )}
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t gap-2 mt-4">
        <button onClick={onClear} className="px-3 py-1.5 border text-[10px] font-bold rounded-lg hover:bg-slate-50">
          Clear Response
        </button>
        <button
          onClick={onMarkReview}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg"
        >
          Mark for Review & Next
        </button>
      </div>
    </div>
  );
}
