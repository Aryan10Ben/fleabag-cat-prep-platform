"use client";

import { useParams } from "next/navigation";
import CatPyqExam from "@/components/pyq/CatPyqExam";

export default function PyqExamPage() {
  const params = useParams();
  return <CatPyqExam paperId={params.paperId as string} />;
}
