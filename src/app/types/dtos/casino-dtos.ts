import { ExperienceLevel, TechnologyStack, ZodiacSign } from "../enums/enums";

export interface CodeChallengeDto {
  id: number;
  title: string;
  description: string;
  techStack: TechnologyStack;
  difficultyLevel: ExperienceLevel;
  codeOption1: string;
  codeOption2: string;
  isDailyChallenge: boolean;
  bonusMultiplier: number;
}

export interface PlaceBetDto {
  pointsBet: number;
  challengeId: number;
  chosenOption: number; // 1 or 2
}

export interface GameResultDto {
  isCorrect: boolean;
  pointsBet: number;
  pointsWon: number;
  pointsLost: number;
  newTotalPoints: number;
  currentStreak: number;
  streakBroken: boolean;
  luckMultiplier: number;
  explanation: string;
  correctCode: string;
  buggyCode: string;
}

export interface UserStatsDto {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  winRate: number;
  canPlayDailyChallenge: boolean;
  lastDailyChallenge?: Date;
}

export interface LeaderboardEntryDto {
  rank: number;
  username: string;
  firstName: string;
  lastName: string;
  techStack: TechnologyStack;
  zodiacSign: ZodiacSign;
  totalPoints: number;
  currentStreak: number;
  totalGamesWon: number;
  winRate: number;
}

export interface DailyChallengeDto {
  challenge: CodeChallengeDto;
  challengeDate: Date;
  bonusMultiplier: number;
  hasPlayed: boolean;
}

export interface CasinoStatsResponse {
  userStats: UserStatsDto;
  topPlayers: LeaderboardEntryDto[];
  dailyChallenge?: DailyChallengeDto;
}