"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calculator, Clock, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import MathRenderer from "./MathRenderer";
import { CAT_SECTIONS, SECTION_META, type CatSection } from "@/lib/pyq/constants";

type AnswerState = {
  selectedOptionId: string | null;
  titaAnswer: string;
  isMarkedReview: boolean;
  visited: boolean;
  section: CatSection;
};

type Question = {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  section: CatSection;
  order: number;
  options: { id: string; content: string; isCorrect: boolean }[];
  rcPassage?: { title: string; content: string } | null;
  lrdiSet?: { title: string; description: string } | null;
  tableJson?: string | null;
  imageUrl?: string | null;
};

export default function CatPyqExam({ paperId }: { paperId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const candidateName = session?.user?.name || "CAT Aspirant";

  const [paper, setPaper] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sectionIndex, setSectionIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<CatSection>("VARC");
  const [lockedSections, setLockedSections] = useState<Set<CatSection>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [sectionTimers, setSectionTimers] = useState<Record<CatSection, number>>({
    VARC: SECTION_META.VARC.duration * 60,
    DILR: SECTION_META.DILR.duration * 60,
    QA: SECTION_META.QA.duration * 60,
  });
  const [showSectionWarning, setShowSectionWarning] = useState<CatSection | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const persistRef = useRef<NodeJS.Timeout | null>(null);

  const sectionQuestions: Question[] =
    paper?.sections?.find((s: any) => s.section === currentSection)?.questions?.map((q: any) => ({
      ...q,
      section: currentSection,
    })) ?? [];

  const totalSecondsLeft = CAT_SECTIONS.reduce((sum, sec) => sum + sectionTimers[sec], 0);

  const persistSession = useCallback(async () => {
    if (!sessionId) return;
    await fetch(`/api/pyq/session/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentSection,
        sectionIndex,
        sectionTimers,
        answers,
        questionTimes,
      }),
    });
  }, [sessionId, currentSection, sectionIndex, sectionTimers, answers, questionTimes]);

  useEffect(() => {
    async function init() {
      const [paperRes, sessionRes] = await Promise.all([
        fetch(`/api/pyq/papers/${paperId}`),
        fetch("/api/pyq/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId }),
        }),
      ]);
      if (paperRes.ok) {
        const data = await paperRes.json();
        setPaper(data.paper);
        const initAnswers: Record<string, AnswerState> = {};
        data.paper.sections.forEach((sec: any) => {
          sec.questions.forEach((q: any) => {
            initAnswers[q.id] = {
              selectedOptionId: null,
              titaAnswer: "",
              isMarkedReview: false,
              visited: false,
              section: sec.section,
            };
          });
        });
        setAnswers(initAnswers);
      }
      if (sessionRes.ok) {
        const { session: sess } = await sessionRes.json();
        setSessionId(sess.id);
        if (sess.answersJson && sess.answersJson !== "{}") {
          setAnswers(JSON.parse(sess.answersJson));
        }
        if (sess.sectionTimersJson) {
          setSectionTimers(JSON.parse(sess.sectionTimersJson));
        }
        if (sess.questionTimesJson) {
          setQuestionTimes(JSON.parse(sess.questionTimesJson));
        }
        setCurrentSection(sess.currentSection as CatSection);
        setSectionIndex(sess.sectionIndex);
      }
      setLoading(false);
    }
    init();
  }, [paperId]);

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setSectionTimers((prev) => {
        const sec = currentSection;
        if (prev[sec] <= 1) {
          handleSectionTimeUp();
          return { ...prev, [sec]: 0 };
        }
        return { ...prev, [sec]: prev[sec] - 1 };
      });
      const q = sectionQuestions[currentIndex];
      if (q) {
        setQuestionTimes((prev) => ({
          ...prev,
          [q.id]: (prev[q.id] || 0) + 1,
        }));
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, currentSection, currentIndex, sectionQuestions]);

  useEffect(() => {
    if (!started || !sessionId) return;
    persistRef.current = setInterval(persistSession, 5000);
    return () => {
      if (persistRef.current) clearInterval(persistRef.current);
    };
  }, [started, sessionId, persistSession]);

  useEffect(() => {
    const onBeforeUnload = () => persistSession();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [persistSession]);

  const handleSectionTimeUp = () => {
    setLockedSections((prev) => new Set(prev).add(currentSection));
    if (sectionIndex < 2) {
      const next = CAT_SECTIONS[sectionIndex + 1];
      setShowSectionWarning(next);
    } else {
      handleSubmit();
    }
  };

  const confirmSectionSwitch = (next: CatSection) => {
    setLockedSections((prev) => new Set(prev).add(currentSection));
    const nextIdx = CAT_SECTIONS.indexOf(next);
    setSectionIndex(nextIdx);
    setCurrentSection(next);
    setCurrentIndex(0);
    setShowSectionWarning(null);
    const firstQ = paper.sections.find((s: any) => s.section === next)?.questions?.[0];
    if (firstQ) {
      setAnswers((prev) => ({
        ...prev,
        [firstQ.id]: { ...prev[firstQ.id], visited: true },
      }));
    }
    persistSession();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const totalTime = CAT_SECTIONS.reduce(
      (s, sec) => s + SECTION_META[sec].duration * 60 - sectionTimers[sec],
      0
    );
    try {
      const res = await fetch(`/api/pyq/papers/${paperId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          questionTimes,
          timeSpent: totalTime,
          sessionId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/pyq/${paperId}/analysis/${data.attemptId}`);
      } else {
        alert("Submit failed");
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 3600) > 0 ? Math.floor(s / 3600) + ":" : ""}${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const getPaletteClass = (qId: string, idx: number) => {
    const st = answers[qId];
    const isCurrent = idx === currentIndex;
    let base = "h-8 w-8 rounded text-xs font-bold flex items-center justify-center ";
    if (isCurrent) base += "ring-2 ring-blue-600 ";
    if (!st?.visited) return base + "bg-slate-200 text-slate-600";
    const hasAns = st.selectedOptionId || st.titaAnswer;
    if (st.isMarkedReview && hasAns) return base + "bg-violet-600 text-white ring-2 ring-emerald-400";
    if (st.isMarkedReview) return base + "bg-violet-500 text-white";
    if (hasAns) return base + "bg-emerald-500 text-white";
    return base + "bg-rose-500 text-white";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
        <p>Paper not found</p>
        <button onClick={() => router.push("/pyq")} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold">
          Back
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 to-blue-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Previous Year CAT Mock</p>
            <h1 className="text-3xl font-black mt-2">{paper.title}</h1>
            <p className="text-slate-400 text-sm mt-1">CAT {paper.year} · Slot {paper.slot}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {CAT_SECTIONS.map((sec) => (
              <div key={sec} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="font-black text-lg">{SECTION_META[sec].questionCount}</p>
                <p className="text-xs tracking-wide text-slate-400 uppercase">{sec}</p>
                <p className="text-xs tracking-wide text-slate-500">{SECTION_META[sec].duration} min</p>
              </div>
            ))}
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>3 sections — VARC → DILR → QA (40 min each)</li>
            <li>Section locks after timer ends or you click Next Section</li>
            <li>MCQ: +3/−1 · TITA: +3/0 · Timer persists on refresh</li>
          </ul>
          <button
            onClick={() => setStarted(true)}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold"
          >
            Begin CAT {paper.year} Slot {paper.slot}
          </button>
          <button onClick={() => router.push(`/pyq`)} className="w-full text-xs text-slate-400">
            ← Back to papers
          </button>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full" />
        <p className="mt-4 text-sm">Generating full analysis...</p>
      </div>
    );
  }

  const currentQ = sectionQuestions[currentIndex];
  const qState = currentQ ? answers[currentQ.id] : null;
  const hasSplit = currentQ?.rcPassage || currentQ?.lrdiSet;
  const tableData = currentQ?.tableJson ? JSON.parse(currentQ.tableJson) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col h-screen text-slate-900">
      <header className="h-14 bg-slate-800 text-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{paper.title}</p>
            <p className="text-xs tracking-wide text-slate-400">CAT {paper.year} · Slot {paper.slot} · {candidateName}</p>
          </div>
          <button onClick={() => setShowCalc(!showCalc)} className="px-2 py-1 bg-slate-700 rounded text-xs flex items-center gap-1">
            <Calculator className="h-3.5 w-3.5" /> Calc
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${sectionTimers[currentSection] < 120 ? "bg-red-600 animate-pulse" : "bg-red-800"}`}>
            <Clock className="h-3.5 w-3.5" />
            Section: {formatTime(sectionTimers[currentSection])}
          </div>
          <div className="px-3 py-1 bg-slate-700 rounded text-xs font-bold hidden md:block">
            Total: {formatTime(totalSecondsLeft)}
          </div>
          <button
            onClick={() => {
              if (confirm("Submit entire test? All sections will be evaluated.")) handleSubmit();
            }}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold"
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="h-10 bg-slate-200 flex items-center px-4 gap-1 border-b shrink-0 overflow-x-auto">
        {CAT_SECTIONS.map((sec, idx) => {
          const active = sec === currentSection;
          const locked = lockedSections.has(sec);
          return (
            <button
              key={sec}
              disabled={locked && !active}
              onClick={() => {
                if (!locked || active) {
                  setSectionIndex(idx);
                  setCurrentSection(sec);
                  setCurrentIndex(0);
                }
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-t whitespace-nowrap ${
                active ? "bg-white text-blue-700 border-t border-x" : locked ? "text-slate-400" : "text-slate-600 hover:bg-white/50"
              }`}
            >
              {SECTION_META[sec].label}
              {locked && " 🔒"}
            </button>
          );
        })}
        {sectionIndex < 2 && (
          <button
            onClick={() => setShowSectionWarning(CAT_SECTIONS[sectionIndex + 1])}
            className="ml-auto px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded"
          >
            Next Section →
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden p-3">
          {currentQ && hasSplit ? (
            <div className="grid md:grid-cols-2 gap-3 h-full">
              <div className="bg-white rounded-lg border overflow-y-auto p-4 sticky top-0 max-h-full">
                {currentQ.rcPassage && (
                  <>
                    <h3 className="font-bold text-sm border-b pb-2 mb-3">{currentQ.rcPassage.title}</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{currentQ.rcPassage.content}</p>
                  </>
                )}
                {currentQ.lrdiSet && (
                  <>
                    <h3 className="font-bold text-sm border-b pb-2 mb-3">{currentQ.lrdiSet.title}</h3>
                    <p className="text-xs font-mono bg-slate-50 p-3 rounded whitespace-pre-line">{currentQ.lrdiSet.description}</p>
                    {tableData && (
                      <table className="mt-3 w-full text-xs border">
                        <thead>
                          <tr>
                            {tableData.headers.map((h: string) => (
                              <th key={h} className="border p-2 bg-slate-100">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row: string[], ri: number) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci} className="border p-2">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
              <QuestionBody currentQ={currentQ} qState={qState} setAnswers={setAnswers} currentIndex={currentIndex} onNext={() => setCurrentIndex((i) => Math.min(i + 1, sectionQuestions.length - 1))} />
            </div>
          ) : currentQ ? (
            <div className="bg-white rounded-lg border p-6 max-w-3xl mx-auto h-full overflow-y-auto">
              <QuestionBody currentQ={currentQ} qState={qState} setAnswers={setAnswers} currentIndex={currentIndex} onNext={() => setCurrentIndex((i) => Math.min(i + 1, sectionQuestions.length - 1))} large />
            </div>
          ) : null}
        </div>

        <aside className="w-52 bg-slate-200 border-l flex flex-col shrink-0 overflow-y-auto">
          <div className="p-2 grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-600 border-b bg-white">
            <span>🟢 Answered</span><span>🔴 Not Ans</span>
            <span>🟣 Marked</span><span>⬜ Not Visit</span>
          </div>
          <div className="p-3 grid grid-cols-5 gap-1.5">
            {sectionQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], visited: true } }));
                }}
                className={getPaletteClass(q.id, idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <footer className="h-11 bg-white border-t flex items-center justify-between px-4 shrink-0">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="px-3 py-1 border rounded text-xs font-bold disabled:opacity-30 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <span className="text-xs text-slate-500">{SECTION_META[currentSection].fullName}</span>
        <button
          disabled={currentIndex >= sectionQuestions.length - 1}
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold disabled:opacity-30 flex items-center gap-1"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </footer>

      {showSectionWarning && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-md space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold">Switch to {showSectionWarning}?</h3>
            </div>
            <p className="text-sm text-slate-600">
              You cannot return to {currentSection} after switching. Unanswered questions in {currentSection} will remain unattempted.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSectionWarning(null)} className="flex-1 py-2 border rounded-lg text-sm font-bold">
                Cancel
              </button>
              <button
                onClick={() => confirmSectionSwitch(showSectionWarning)}
                className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold"
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalc && (
        <div className="absolute top-16 left-4 z-50 w-48 bg-white border rounded-xl p-3 shadow-xl">
          <input readOnly value={calcInput} className="w-full text-right border rounded p-1 font-mono text-sm mb-2" />
          <div className="grid grid-cols-4 gap-1 text-xs">
            {["7","8","9","/","4","5","6","*","1","2","3","-","C","0","=","+"].map((c) => (
              <button
                key={c}
                onClick={() => {
                  if (c === "C") setCalcInput("");
                  else if (c === "=") {
                    try { setCalcInput(String(Function(`"use strict";return(${calcInput})`)())); } catch { setCalcInput("Err"); }
                  } else setCalcInput((p) => p + c);
                }}
                className={`py-1.5 rounded ${c === "=" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionBody({
  currentQ,
  qState,
  setAnswers,
  currentIndex,
  onNext,
  large,
}: {
  currentQ: Question;
  qState: AnswerState | null;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, AnswerState>>>;
  currentIndex: number;
  onNext: () => void;
  large?: boolean;
}) {
  if (!qState) return null;
  return (
    <div className={`flex flex-col justify-between h-full ${large ? "" : "bg-white rounded-lg border p-4"}`}>
      <div className="space-y-3">
        <span className="text-xs tracking-wide font-bold text-slate-400">Q{currentIndex + 1} · {currentQ.difficulty} · {currentQ.type}</span>
        <MathRenderer content={currentQ.content} className={large ? "text-base" : "text-sm"} />
        {currentQ.imageUrl && <img src={currentQ.imageUrl} alt="Question" className="max-w-full rounded border" />}
        <div className="space-y-2 pt-2">
          {currentQ.type === "MCQ" ? (
            currentQ.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQ.id]: { ...prev[currentQ.id], selectedOptionId: opt.id, isMarkedReview: false },
                  }))
                }
                className={`w-full p-3 rounded-lg border text-left text-sm ${
                  qState.selectedOptionId === opt.id ? "border-indigo-600 bg-indigo-50 font-semibold" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.content}
              </button>
            ))
          ) : (
            <input
              type="text"
              value={qState.titaAnswer}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentQ.id]: { ...prev[currentQ.id], titaAnswer: e.target.value },
                }))
              }
              placeholder="Type In The Answer (TITA)"
              className="w-full max-w-xs px-3 py-2 border rounded-lg text-sm"
            />
          )}
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t mt-4 gap-2">
        <button
          onClick={() =>
            setAnswers((prev) => ({
              ...prev,
              [currentQ.id]: { ...prev[currentQ.id], selectedOptionId: null, titaAnswer: "", isMarkedReview: false },
            }))
          }
          className="px-3 py-1.5 border text-xs font-bold rounded-lg"
        >
          Clear
        </button>
        <button
          onClick={() => {
            setAnswers((prev) => ({ ...prev, [currentQ.id]: { ...prev[currentQ.id], isMarkedReview: true } }));
            onNext();
          }}
          className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg"
        >
          Mark & Next
        </button>
      </div>
    </div>
  );
}
