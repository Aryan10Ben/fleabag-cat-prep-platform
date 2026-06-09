"use client";

import { useParams } from "next/navigation";
import TestSimulator from "@/components/TestSimulator";

export default function MockTestPage() {
  const params = useParams();
  const testId = params.testId as string;
  return <TestSimulator testId={testId} />;
}
