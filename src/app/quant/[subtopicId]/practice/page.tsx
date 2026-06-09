"use client";

import { useParams } from "next/navigation";
import PracticeSession from "@/components/PracticeSession";

export default function QuantPracticePage() {
  const params = useParams();
  const subtopicId = params.subtopicId as string;

  return (
    <PracticeSession
      subtopicId={subtopicId}
      backHref="/quant"
      backLabel="Back to Quant"
      accent="blue"
    />
  );
}
