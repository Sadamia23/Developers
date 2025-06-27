import { ExperienceLevel, TechnologyStack, ZodiacSign } from "../enums/enums";

export interface CodeRoastTaskDto {
  id: number;
  title: string;
  description: string;
  requirements: string;
  techStack: TechnologyStack;
  difficultyLevel: ExperienceLevel;
  starterCode?: string;
  testCases: string[];
  examples: string[];
  estimatedMinutes: number;
  createdAt: Date;
}

export interface CodeRoastSubmissionDto {
  taskId: number;
  code: string;
  notes?: string;
  timeSpentMinutes: number;
}

export interface CodeQualityAssessmentDto {
  readabilityScore: number;
  performanceScore: number;
  correctnessScore: number;
  bestPracticesScore: number;
  positivePoints: string[];
  improvementPoints: string[];
  redFlags: string[];
  codeStyle: string;
  detectedPatterns: string[];
  codeSmells: string[];
}

export interface CodeRoastResultDto {
  id: number;
  taskId: number;
  taskTitle: string;
  submittedCode: string;
  userNotes?: string;
  overallScore: number;
  roastMessage: string;
  technicalFeedback: string;
  qualityAssessment: CodeQualityAssessmentDto;
  submittedAt: Date;
  timeSpentMinutes: number;
  isRoasted: boolean;
  isPraised: boolean;
  roastSeverity: RoastSeverity;
}

export interface CodeRoastStatsDto {
  totalSubmissions: number;
  totalRoasts: number;
  totalPraises: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  currentStreak: number;
  longestStreak: number;
  currentRoastStreak: number;
  longestRoastStreak: number;
  totalTimeSpentMinutes: number;
  averageTimePerTask: number;
  juniorTasksCompleted: number;
  middleTasksCompleted: number;
  seniorTasksCompleted: number;
  averageReadabilityScore: number;
  averagePerformanceScore: number;
  averageCorrectnessScore: number;
  averageBestPracticesScore: number;
  lastSubmission?: Date;
  recentScores: number[];
  unlockedAchievements: string[];
  perfectScores: number;
}

export interface HallOfFameEntryDto {
  username: string;
  firstName: string;
  lastName: string;
  techStack: TechnologyStack;
  zodiacSign: ZodiacSign;
  score: number;
  taskTitle: string;
  roastMessage: string;
  submittedAt: Date;
  roastSeverity: RoastSeverity;
}

export interface CodeRoastHallOfFameDto {
  bestScores: HallOfFameEntryDto[];
  worstScores: HallOfFameEntryDto[];
  funniestRoasts: HallOfFameEntryDto[];
  mostImprovedUsers: HallOfFameEntryDto[];
}

export interface CodeRoastDashboardDto {
  userStats: CodeRoastStatsDto;
  recentRoasts: CodeRoastResultDto[];
  recommendedTasks: CodeRoastTaskDto[];
  hallOfFame: CodeRoastHallOfFameDto;
}

// AI-related DTOs
export interface AICodeTaskRequestDto {
  techStack: TechnologyStack;
  difficultyLevel: ExperienceLevel;
  specificTopic?: string;
  focusAreas?: string[];
}

export interface AICodeTaskResponseDto {
  title: string;
  description: string;
  requirements: string;
  starterCode?: string;
  testCases: string[];
  examples: string[];
  estimatedMinutes: number;
  techStack: TechnologyStack;
  difficultyLevel: ExperienceLevel;
  topic: string;
}

export interface AICodeEvaluationRequestDto {
  code: string;
  taskDescription: string;
  techStack: TechnologyStack;
  difficultyLevel: ExperienceLevel;
}

export interface AICodeEvaluationResponseDto {
  overallScore: number;
  roastMessage: string;
  technicalFeedback: string;
  qualityAssessment: CodeQualityAssessmentDto;
  roastSeverity: RoastSeverity;
}

export enum RoastSeverity {
  Gentle = 0,
  Medium = 1,
  Brutal = 2,
  Devastating = 3
}