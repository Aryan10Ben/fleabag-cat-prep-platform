import { PrismaClient } from "@prisma/client";
import { SECTION_META } from "../src/lib/pyq/constants";

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];
const SLOTS = [1, 2, 3];

function makeMcqOptions(questionId: string, correct: string, distractors: string[]) {
  const all = [correct, ...distractors];
  return all.map((content, i) => ({
    id: `opt-${questionId}-${i}`,
    content,
    isCorrect: i === 0,
  }));
}

function varcQuestion(year: number, slot: number, order: number, passageId: string | null) {
  const id = `pyq-q-${year}-s${slot}-VARC-${order}`;
  const isRc = order <= 18;
  const content = isRc
    ? `According to the passage, which inference is most strongly supported? (Q${order})`
    : `Select the best summary / para-jumble / odd-one-out for VARC item ${order}.`;
  const opts = makeMcqOptions(id,
    "Option A — aligns with the author's central claim",
    ["Option B — contradicts paragraph 1", "Option C — out of scope detail", "Option D — extreme overgeneralization"]
  );
  return {
    id,
    content,
    type: "MCQ",
    difficulty: order <= 8 ? "EASY" : order <= 16 ? "MEDIUM" : "HARD",
    rcPassageId: isRc ? passageId : null,
    solution: `Shortcut: Eliminate options adding facts not in the passage. The correct choice restates the thesis without distortion.`,
    options: opts.map((o) => ({ ...o, questionId: id })),
  };
}

function dilrQuestion(year: number, slot: number, order: number, setId: string) {
  const id = `pyq-q-${year}-s${slot}-DILR-${order}`;
  const isTita = order % 5 === 0;
  const content = `Based on the data set conditions, determine the value for constraint ${order}. ${
    isTita ? "Enter TITA answer." : "Select the correct option."
  }`;
  const correct = String((order * 7 + slot) % 13 + 3);
  return {
    id,
    content,
    type: isTita ? "TITA" : "MCQ",
    difficulty: order <= 7 ? "EASY" : order <= 14 ? "MEDIUM" : "HARD",
    lrdiSetId: setId,
    tableJson: JSON.stringify({
      headers: ["Entity", "Value A", "Value B"],
      rows: [
        ["P", 12 + order, 8],
        ["Q", 15, 10 + order],
        ["R", 9, 14],
      ],
    }),
    solution: `Build the grid from constraints. Fixed positions for row P and column totals give ${correct}.`,
    options: isTita
      ? [{ id: `opt-${id}-0`, content: correct, isCorrect: true, questionId: id }]
      : makeMcqOptions(id, correct, [String(+correct + 2), String(+correct - 1), "Cannot be determined"]).map((o) => ({
          ...o,
          questionId: id,
        })),
  };
}

function qaQuestion(year: number, slot: number, order: number) {
  const id = `pyq-q-${year}-s${slot}-QA-${order}`;
  const isTita = order % 4 === 0;
  const a = order + slot;
  const b = year % 10 + order;
  const correctNum = a * b;
  const content = isTita
    ? `If $x = ${a}$ and $y = ${b}$, find $x \\times y$. (TITA)`
    : `A shop marks goods ${10 + order}% above CP and gives ${5 + (order % 3)}% discount. Profit% is closest to?`;
  const correct = isTita ? String(correctNum) : String(Math.round((10 + order - (5 + (order % 3)) - (10 + order) * (5 + (order % 3)) / 100) * 10) / 10);
  return {
    id,
    content,
    type: isTita ? "TITA" : "MCQ",
    difficulty: order <= 8 ? "EASY" : order <= 16 ? "MEDIUM" : "HARD",
    solution: isTita
      ? `Direct multiplication: ${a} × ${b} = ${correctNum}.`
      : `Use successive % formula: Net% = M − D − MD/100. Approximate to nearest option.`,
    options: isTita
      ? [{ id: `opt-${id}-0`, content: correct, isCorrect: true, questionId: id }]
      : makeMcqOptions(id, correct, [String(+correct + 5), String(+correct - 3), String(+correct * 2)]).map((o) => ({
          ...o,
          questionId: id,
        })),
  };
}

export async function seedPyqPapers(prisma: PrismaClient) {
  console.log("Seeding CAT PYQ papers (2020–2025, 3 slots each)...");

  await prisma.examSession.deleteMany({});
  const oldPyqAttempts = await prisma.attempt.findMany({
    where: { catPyqPaperId: { not: null } },
    select: { id: true },
  });
  const oldIds = oldPyqAttempts.map((a) => a.id);
  if (oldIds.length) {
    await prisma.attemptSectionScore.deleteMany({ where: { attemptId: { in: oldIds } } });
    await prisma.attemptAnswer.deleteMany({ where: { attemptId: { in: oldIds } } });
    await prisma.attempt.deleteMany({ where: { id: { in: oldIds } } });
  }
  await prisma.catPyqQuestion.deleteMany({});
  await prisma.catPyqSection.deleteMany({});
  await prisma.catPyqPaper.deleteMany({});

  const pyqQuestionIds: string[] = [];
  const papersToCreate: any[] = [];
  const sectionsToCreate: any[] = [];
  const questionsToCreate: any[] = [];
  const optionsToCreate: any[] = [];
  const pyqLinksToCreate: any[] = [];

  for (const year of YEARS) {
    for (const slot of SLOTS) {
      const paperId = `pyq-${year}-slot${slot}`;
      papersToCreate.push({
        id: paperId,
        year,
        slot,
        title: `CAT ${year} Slot ${slot}`,
        status: "PUBLISHED",
      });

      const passageId = `pyq-rc-${year}-s${slot}`;
      await prisma.rCPassage.upsert({
        where: { id: passageId },
        create: {
          id: passageId,
          title: `RC Passage Set — CAT ${year} Slot ${slot}`,
          content: `Original practice passage for CAT ${year} Slot ${slot}. The passage discusses innovation, trade-offs in policy design, and long-term economic resilience. Analysts argue that short-term metrics often obscure structural shifts. Candidates should track the author's qualifiers: "however", "nevertheless", and limiting phrases that bound conclusions. This is placeholder content for import-ready architecture — replace with legally obtained PYQ passages via admin import.`,
        },
        update: {},
      });

      const lrdiSetId = `pyq-lrdi-${year}-s${slot}`;
      await prisma.lRDISet.upsert({
        where: { id: lrdiSetId },
        create: {
          id: lrdiSetId,
          title: `DILR Set — CAT ${year} Slot ${slot}`,
          description: `Eight participants P–W are assigned to projects Alpha, Beta, Gamma. Each project has 2–3 members. P is not with Q. If R is on Alpha, S is on Beta. T and U are together. V is on Gamma only if W is on Alpha. Determine assignments using the table provided.`,
        },
        update: {},
      });

      for (const section of ["VARC", "DILR", "QA"] as const) {
        const meta = SECTION_META[section];
        const sectionId = `${paperId}-${section}`;
        sectionsToCreate.push({
          id: sectionId,
          paperId,
          section,
          duration: meta.duration,
          orderIndex: section === "VARC" ? 0 : section === "DILR" ? 1 : 2,
        });

        for (let order = 1; order <= meta.questionCount; order++) {
          let qData;
          if (section === "VARC") qData = varcQuestion(year, slot, order, passageId);
          else if (section === "DILR") qData = dilrQuestion(year, slot, order, lrdiSetId);
          else qData = qaQuestion(year, slot, order);

          pyqQuestionIds.push(qData.id);

          questionsToCreate.push({
            id: qData.id,
            content: qData.content,
            type: qData.type,
            difficulty: qData.difficulty,
            solution: qData.solution,
            rcPassageId: (qData as any).rcPassageId || null,
            lrdiSetId: (qData as any).lrdiSetId || null,
            tableJson: (qData as any).tableJson || null,
          });

          for (const opt of qData.options) {
            optionsToCreate.push(opt);
          }

          pyqLinksToCreate.push({
            id: `pyq-link-${qData.id}`,
            sectionId,
            questionId: qData.id,
            order,
            setGroupId:
              section === "VARC" ? passageId : section === "DILR" ? lrdiSetId : null,
          });
        }
      }
    }
  }

  // Batch insert using createMany
  console.log("Inserting PYQ papers...");
  await prisma.catPyqPaper.createMany({ data: papersToCreate });
  console.log("Inserting PYQ sections...");
  await prisma.catPyqSection.createMany({ data: sectionsToCreate });
  console.log("Inserting PYQ questions...");
  await prisma.question.createMany({ data: questionsToCreate });
  console.log("Inserting PYQ options...");
  await prisma.option.createMany({ data: optionsToCreate });
  console.log("Inserting PYQ question links...");
  await prisma.catPyqQuestion.createMany({ data: pyqLinksToCreate });

  console.log(`Seeded ${YEARS.length * SLOTS.length} PYQ papers with ${pyqQuestionIds.length} original placeholder questions.`);
}
