export type ApiError = { error: string };

export type QuestionOptionInput = {
  content: string;
  isCorrect: boolean;
};

export type BulkQuestionInput = {
  content: string;
  options: QuestionOptionInput[];
  solution: string;
  subtopicName?: string;
  difficulty?: string;
  type?: string;
};

export type SubmitAnswerInput = {
  questionId: string;
  selectedOptionId?: string | null;
  titaAnswer?: string | null;
  isMarkedReview?: boolean;
  timeSpentSeconds?: number;
  section?: string;
};

export type SubtopicWithTopic = {
  id: string;
  name: string;
  topicName: string;
};

export type TopicWithSubtopics = {
  id: string;
  name: string;
  category: string;
  subtopics: {
    id: string;
    name: string;
    progress?: {
      formulaSheetRead: boolean;
      practiceQuestionsCompleted: boolean;
      topicTestCompleted: boolean;
      revisionDone: boolean;
    } | null;
  }[];
};

export type GeneratedQuestionResult = {
  success: boolean;
  detectedTopic: string;
  detectedSubtopic: string;
  questions: {
    id?: string;
    content: string;
    type: string;
    difficulty: string;
    solution: string;
    options: (QuestionOptionInput & { id?: string })[];
  }[];
};
