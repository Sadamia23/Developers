export interface AIExcuseRequest {
  category: number;
  type: number;
  targetBelievability?: number;
  mood?: string;
  context?: string;
  userTechStack?: string;
  userExperience?: string;
}

export interface AIExcuseResponse {
  excuseText: string;
  category: number;
  type: number;
  believabilityScore: number;
  reasoning: string;
  tags: string[];
  techStackUsed: string;
  humorLevel: number;
  usage: string;
  isAIGenerated: boolean;
}

export interface Category {
  value: number;
  name: string;
  label: string;
}

export interface ExcuseType {
  value: number;
  name: string;
  label: string;
}
