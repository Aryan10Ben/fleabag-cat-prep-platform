import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { QuestionOptionInput } from "@/types/api";

type GeneratedQuestion = {
  content: string;
  type: string;
  difficulty: string;
  solution: string;
  options: QuestionOptionInput[];
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { rawText, difficulty } = body;

    if (!rawText) {
      return NextResponse.json({ error: "Missing source text question" }, { status: 400 });
    }

    let topicName = "Arithmetic";
    let subtopicName = "Percentages";

    const textLower = String(rawText).toLowerCase();
    if (textLower.includes("profit") || textLower.includes("loss") || textLower.includes("sell") || textLower.includes("cost")) {
      topicName = "Arithmetic";
      subtopicName = "Profit and Loss";
    } else if (textLower.includes("speed") || textLower.includes("distance") || textLower.includes("km/h") || textLower.includes("time")) {
      topicName = "Arithmetic";
      subtopicName = "Time Speed Distance";
    } else if (textLower.includes("equation") || textLower.includes("roots") || textLower.includes("quadratic")) {
      topicName = "Algebra";
      subtopicName = "Quadratic Equations";
    } else if (textLower.includes("triangle") || textLower.includes("circle") || textLower.includes("radius") || textLower.includes("angle")) {
      topicName = "Geometry";
      subtopicName = "Triangles";
    } else if (textLower.includes("remainder") || textLower.includes("divisible") || textLower.includes("mod")) {
      topicName = "Number System";
      subtopicName = "Remainders";
    }

    let subtopic = await prisma.subtopic.findFirst({
      where: { name: subtopicName },
    });

    if (!subtopic) {
      subtopic = await prisma.subtopic.findFirst();
    }

    if (!subtopic) {
      return NextResponse.json({ error: "No subtopic configured in database" }, { status: 500 });
    }

    const generatedQuestions: GeneratedQuestion[] = [];

    if (subtopicName === "Percentages") {
      generatedQuestions.push({
        content: `In a town, 45% of the population are males and the rest are females. If 60% of the males and 40% of the females are literate, what percentage of the total population is illiterate?`,
        type: "MCQ",
        difficulty: difficulty || "MEDIUM",
        solution: `Let total population be 100. Males = 45, Females = 55. Literate males = 60% of 45 = 27. Literate females = 40% of 55 = 22. Total literate population = 27 + 22 = 49. Total illiterate population = 100 - 49 = 51%.`,
        options: [
          { content: "51%", isCorrect: true },
          { content: "49%", isCorrect: false },
          { content: "55%", isCorrect: false },
          { content: "45%", isCorrect: false },
        ],
      });
    } else if (subtopicName === "Profit and Loss") {
      generatedQuestions.push({
        content: `A shopkeeper marked his goods 40% above the cost price and sold them allowing a discount of 15% on the marked price. What was his actual profit percentage?`,
        type: "MCQ",
        difficulty: difficulty || "MEDIUM",
        solution: `Let cost price be 100. Marked Price = 140. Discount = 15% of 140 = 21. Selling Price = 140 - 21 = 119. Profit = 119 - 100 = 19. Profit % = 19%.`,
        options: [
          { content: "19%", isCorrect: true },
          { content: "20%", isCorrect: false },
          { content: "25%", isCorrect: false },
          { content: "15%", isCorrect: false },
        ],
      });
    } else if (subtopicName === "Quadratic Equations") {
      generatedQuestions.push({
        content: `If one root of the equation x^2 - 8x + k = 0 is three times the other root, find the value of k.`,
        type: "TITA",
        difficulty: difficulty || "MEDIUM",
        solution: `Let the roots be a and 3a. Sum of roots = a + 3a = 4a = 8 => a = 2. The roots are 2 and 6. Product of roots = k = 2 * 6 = 12.`,
        options: [],
      });
    } else {
      generatedQuestions.push({
        content: `Two positive numbers are in the ratio 4:7. If their difference is 15, what is the value of the larger number?`,
        type: "MCQ",
        difficulty: difficulty || "EASY",
        solution: `Let the numbers be 4x and 7x. Difference = 7x - 4x = 3x = 15 => x = 5. Larger number = 7 × 5 = 35.`,
        options: [
          { content: "35", isCorrect: true },
          { content: "20", isCorrect: false },
          { content: "15", isCorrect: false },
          { content: "40", isCorrect: false },
        ],
      });
    }

    const savedQuestions = [];
    for (const gq of generatedQuestions) {
      const { options, ...qParams } = gq;
      const createdQ = await prisma.question.create({
        data: {
          ...qParams,
          subtopicId: subtopic.id,
          options: {
            create: options,
          },
        },
        include: {
          options: true,
        },
      });
      savedQuestions.push(createdQ);
    }

    return NextResponse.json({
      success: true,
      detectedTopic: topicName,
      detectedSubtopic: subtopic.name,
      questions: savedQuestions,
    });
  } catch (error: unknown) {
    console.error("Similar question generation error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
