export interface Question {
  id: string;
  text: string;
  dimension: string;
  ampItUpPrinciple: string;
}

export interface Dimension {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  resources: string[];
}

export interface UserResults {
  dimensionScores: Record<string, number>;
  answers: Record<string, number>;
  date: string;
}
