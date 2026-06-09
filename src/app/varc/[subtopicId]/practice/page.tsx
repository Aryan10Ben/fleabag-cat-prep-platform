"use client";

import { useParams } from "next/navigation";
import PracticeSession from "@/components/PracticeSession";

export default function VarcPracticePage() {
  const params = useParams();
  const subtopicId = params.subtopicId as string;

  return (
    <PracticeSession
      subtopicId={subtopicId}
      backHref="/varc"
      backLabel="Back to VARC"
      accent="indigo"
    />
  );
}
