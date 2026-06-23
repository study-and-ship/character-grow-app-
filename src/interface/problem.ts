export interface Choice {
  id: number;
  content: string;
  orderNum: number;
}

export interface Problem {
  id: number;
  content: string;
  explanation: string | null;
  choices: Choice[];
}

export interface AnswerResult {
  isCorrect: boolean;
  correctChoiceId: number;
  expReward: number;
}
