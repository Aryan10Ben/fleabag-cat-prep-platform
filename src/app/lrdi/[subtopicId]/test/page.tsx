"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SubtopicTestPicker from "@/components/SubtopicTestPicker";

export default function LrdiTestPage() {
  const params = useParams();
  const subtopicId = params.subtopicId as string;
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const fetchName = async () => {
      const res = await fetch("/api/topics?category=LRDI");
      if (res.ok) {
        const data = await res.json();
        for (const t of data.topics) {
          const sub = t.subtopics.find((s: any) => s.id === subtopicId);
          if (sub) {
            setName(sub.name);
            break;
          }
        }
      }
    };
    fetchName();
  }, [subtopicId]);

  return (
    <SubtopicTestPicker
      subtopicId={subtopicId}
      subtopicName={name}
      backHref="/lrdi"
      backLabel="Back to LRDI"
      accent="emerald"
    />
  );
}
