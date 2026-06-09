import type { CatSection } from "./constants";

export type AnswerInput = {
  questionId: string;
  section: CatSection;
  type: "MCQ" | "TITA";
  selectedOptionId?: string | null;
  titaAnswer?: string | null;
  correctOptionId?: string | null;
  correctTita?: string | null;
};

export function evaluateAnswer(input: AnswerInput): boolean {
  const attempted =
    (input.type === "MCQ" && input.selectedOptionId) ||
    (input.type === "TITA" && input.titaAnswer?.trim());

  if (!attempted) return false;

  if (input.type === "MCQ") {
    return input.selectedOptionId === input.correctOptionId;
  }

  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
  const sub = clean(input.titaAnswer || "");
  const cor = clean(input.correctTita || "");
  return sub === cor || cor.includes(sub) || sub.includes(cor);
}

export function scoreSection(
  answers: { isCorrect: boolean; attempted: boolean; type: "MCQ" | "TITA" }[]
) {
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  for (const a of answers) {
    if (!a.attempted) {
      unattempted++;
      continue;
    }
    if (a.isCorrect) {
      correct++;
      score += 3;
    } else {
      incorrect++;
      if (a.type === "MCQ") score -= 1;
    }
  }

  const attempted = correct + incorrect;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  return { score, correct, incorrect, unattempted, attempted, accuracy };
}

export function estimatePercentile(pctOfMax: number): number {
  if (pctOfMax >= 85) return 99.9;
  if (pctOfMax >= 70) return 99.0;
  if (pctOfMax >= 55) return 97.0;
  if (pctOfMax >= 40) return 93.0;
  if (pctOfMax >= 25) return 85.0;
  if (pctOfMax >= 10) return 70.0;
  return 50.0;
}
