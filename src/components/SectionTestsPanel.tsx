"use client";

import React, { useEffect, useState } from "react";
import { Award, FileSpreadsheet, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

interface DomainConfig {
  name: string;
  description: string;
}

interface SectionTestsPanelProps {
  category: "QUANT" | "VARC" | "LRDI";
  domains: DomainConfig[];
  showFullSectional?: boolean;
}

export default function SectionTestsPanel({
  category,
  domains,
  showFullSectional = false,
}: SectionTestsPanelProps) {
  const [domainTests, setDomainTests] = useState<Record<string, any[]>>({});
  const [sectionalTests, setSectionalTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const domainMap: Record<string, any[]> = {};
        await Promise.all(
          domains.map(async (d) => {
            const res = await fetch(`/api/tests?type=SECTION&domain=${encodeURIComponent(d.name)}`);
            if (res.ok) {
              const data = await res.json();
              domainMap[d.name] = data.tests;
            }
          })
        );
        setDomainTests(domainMap);

        if (showFullSectional) {
          const res = await fetch(`/api/tests?type=MOCK&category=QUANT`);
          if (res.ok) {
            const data = await res.json();
            setSectionalTests(data.tests);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, domains, showFullSectional]);

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Domain Sectional Tests</h2>
          <p className="text-xs text-slate-400 mt-1">5 timed tests per domain — 15 questions each, CAT difficulty.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain) => {
            const tests = domainTests[domain.name] || [];
            return (
              <div
                key={domain.name}
                className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                  <Award className="h-4 w-4" /> {domain.name}
                </div>
                <p className="text-xs text-slate-400">{domain.description}</p>
                <div className="space-y-1.5">
                  {tests.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      href={`/mock-tests/${t.id}`}
                      className="flex items-center justify-between text-xs font-semibold text-blue-600 hover:underline py-1"
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
                        <Clock className="h-3 w-3" /> {t.duration}m
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showFullSectional && sectionalTests.length > 0 && (
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Full Quant Sectional Tests</h2>
            <p className="text-xs text-slate-400 mt-1">10 full-length Quant section mocks — 22 questions, 40 minutes each (CAT format).</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {sectionalTests.map((t) => (
              <Link
                key={t.id}
                href={`/mock-tests/${t.id}`}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-xs mb-1">
                    <FileSpreadsheet className="h-4 w-4" /> Sectional Mock
                  </div>
                  <h3 className="text-sm font-bold">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">22 Q · {t.duration} mins</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
