import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { SECTION_META } from "@/lib/pyq/constants";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {

    const body = await req.json();
    const { year, slot, title, status = "DRAFT", sections } = body;

    if (!year || !slot || !sections?.length) {
      return NextResponse.json({ error: "year, slot, sections required" }, { status: 400 });
    }

    const paperId = `pyq-${year}-slot${slot}`;

    await prisma.catPyqPaper.upsert({
      where: { id: paperId },
      create: {
        id: paperId,
        year,
        slot,
        title: title || `CAT ${year} Slot ${slot}`,
        status,
      },
      update: { title: title || `CAT ${year} Slot ${slot}`, status },
    });

    let imported = 0;

    for (const sec of sections) {
      const sectionId = `${paperId}-${sec.section}`;
      const meta = SECTION_META[sec.section as keyof typeof SECTION_META];
      if (!meta) continue;

      await prisma.catPyqSection.upsert({
        where: { id: sectionId },
        create: {
          id: sectionId,
          paperId,
          section: sec.section,
          duration: meta.duration,
          orderIndex: sec.section === "VARC" ? 0 : sec.section === "DILR" ? 1 : 2,
        },
        update: {},
      });

      for (const q of sec.questions) {
        const qId = `import-q-${year}-s${slot}-${sec.section}-${q.order}`;
        let rcPassageId: string | null = null;
        let lrdiSetId: string | null = null;

        if (q.passage) {
          rcPassageId = `import-rc-${year}-s${slot}-${q.order}`;
          await prisma.rCPassage.upsert({
            where: { id: rcPassageId },
            create: { id: rcPassageId, title: q.passage.title, content: q.passage.content },
            update: { title: q.passage.title, content: q.passage.content },
          });
        }
        if (q.lrdiSet) {
          lrdiSetId = `import-lrdi-${year}-s${slot}-${q.order}`;
          await prisma.lRDISet.upsert({
            where: { id: lrdiSetId },
            create: { id: lrdiSetId, title: q.lrdiSet.title, description: q.lrdiSet.description },
            update: { title: q.lrdiSet.title, description: q.lrdiSet.description },
          });
        }

        await prisma.question.upsert({
          where: { id: qId },
          create: {
            id: qId,
            content: q.content,
            type: q.type,
            difficulty: q.difficulty,
            solution: q.solution,
            imageUrl: q.imageUrl || null,
            tableJson: q.tableJson ? JSON.stringify(q.tableJson) : null,
            chartJson: q.chartJson ? JSON.stringify(q.chartJson) : null,
            rcPassageId,
            lrdiSetId,
          },
          update: {
            content: q.content,
            solution: q.solution,
            imageUrl: q.imageUrl || null,
          },
        });

        if (q.options?.length) {
          for (let i = 0; i < q.options.length; i++) {
            const opt = q.options[i];
            const optId = `import-opt-${qId}-${i}`;
            await prisma.option.upsert({
              where: { id: optId },
              create: { id: optId, content: opt.content, isCorrect: opt.isCorrect, questionId: qId },
              update: { content: opt.content, isCorrect: opt.isCorrect },
            });
          }
        }

        await prisma.catPyqQuestion.upsert({
          where: { id: `import-link-${qId}` },
          create: {
            id: `import-link-${qId}`,
            sectionId,
            questionId: qId,
            order: q.order,
            setGroupId: rcPassageId || lrdiSetId,
          },
          update: { order: q.order },
        });

        imported++;
      }
    }

    return NextResponse.json({ success: true, paperId, imported });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
