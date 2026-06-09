export const CAT_SECTIONS = ["VARC", "DILR", "QA"] as const;
export type CatSection = (typeof CAT_SECTIONS)[number];

export const SECTION_META: Record<
  CatSection,
  { label: string; fullName: string; duration: number; questionCount: number }
> = {
  VARC: {
    label: "VARC",
    fullName: "Verbal Ability and Reading Comprehension",
    duration: 40,
    questionCount: 24,
  },
  DILR: {
    label: "DILR",
    fullName: "Data Interpretation & Logical Reasoning",
    duration: 40,
    questionCount: 20,
  },
  QA: {
    label: "QA",
    fullName: "Quantitative Aptitude",
    duration: 40,
    questionCount: 22,
  },
};

export const TOTAL_EXAM_MINUTES = 120;

export const PALETTE_LEGEND = [
  { key: "not-visited", label: "Not Visited", className: "bg-slate-200 text-slate-600" },
  { key: "visited", label: "Visited", className: "bg-rose-500 text-white" },
  { key: "answered", label: "Answered", className: "bg-emerald-500 text-white" },
  { key: "marked", label: "Marked for Review", className: "bg-violet-500 text-white" },
  { key: "answered-marked", label: "Answered & Marked", className: "bg-violet-600 text-white ring-2 ring-emerald-400" },
] as const;
