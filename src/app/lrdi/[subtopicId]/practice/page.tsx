"use client";

import { useParams } from "next/navigation";
import PracticeSession from "@/components/PracticeSession";

export default function LrdiPracticePage() {
  const params = useParams();
  const subtopicId = params.subtopicId as string;

  return (
    <PracticeSession
      subtopicId={subtopicId}
      backHref="/lrdi"
      backLabel="Back to LRDI"
      accent="emerald"
    />
  );
}
