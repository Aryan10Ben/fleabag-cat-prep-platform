"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SubtopicTestPicker from "@/components/SubtopicTestPicker";

export default function VarcTestPage() {
  const params = useParams();
  const subtopicId = params.subtopicId as string;
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const fetchName = async () => {
      const res = await fetch("/api/topics?category=VARC");
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
      backHref="/varc"
      backLabel="Back to VARC"
      accent="indigo"
    />
  );
}
