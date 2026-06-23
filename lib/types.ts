export type PuzzleOption = {
  id: string;
  text: string;
};

export type DailyPuzzle = {
  id: string;
  date: string;
  title: string;
  story: string;
  question: string;
  options: PuzzleOption[];
  correctAnswerIndex: number;
  knowledgePoint: string;
  hint: string;
};

export type PuzzleAnswerResult = {
  correct: boolean;
  correctAnswerIndex: number;
  correctAnswerText: string;
  explanation?: string;
};
