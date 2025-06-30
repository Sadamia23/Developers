import { ExperienceLevel, TechnologyStack, ZodiacSign } from "../enums/enums";

export interface BugChaseScoreDto {
  score: number;
  distance: number;
  survivalTime: string; // TimeSpan serialized as string (e.g., "00:01:30.4500000")
  bugsAvoided: number;
  deadlinesAvoided: number;
  meetingsAvoided: number;
  coffeeCollected: number;
  weekendsCollected: number;
}

export interface BugChaseGameResultDto {
  id: number;
  score: number;
  distance: number;
  survivalTime: string; // TimeSpan serialized as string
  bugsAvoided: number;
  deadlinesAvoided: number;
  meetingsAvoided: number;
  coffeeCollected: number;
  weekendsCollected: number;
  playedAt: Date;
  isNewBestScore: boolean;
  rank: number;
}

export interface BugChaseLeaderboardEntryDto {
  rank: number;
  username: string;
  firstName: string;
  lastName: string;
  techStack: TechnologyStack;
  zodiacSign: ZodiacSign;
  score: number;
  distance: number;
  survivalTime: string; // TimeSpan serialized as string
  playedAt: Date;
}

export interface BugChaseStatsDto {
  bestScore: number;
  totalGamesPlayed: number;
  totalDistance: number;
  totalSurvivalTime: string; // TimeSpan serialized as string
  totalBugsAvoided: number;
  totalDeadlinesAvoided: number;
  totalMeetingsAvoided: number;
  totalCoffeeCollected: number;
  totalWeekendsCollected: number;
  averageScore: number;
  averageSurvivalTime: number;
}

export interface BugChaseDashboardDto {
  userStats: BugChaseStatsDto;
  topScores: BugChaseLeaderboardEntryDto[];
  recentGames: BugChaseGameResultDto[];
}

// Game-specific interfaces for the frontend game engine
export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: GameObjectType;
  emoji?: string;
  color?: string;
  speed?: number;
}

export enum GameObjectType {
  Player = 'player',
  Bug = 'bug',
  Deadline = 'deadline',
  Meeting = 'meeting',
  Coffee = 'coffee',
  Weekend = 'weekend'
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  distance: number;
  speed: number;
  startTime: Date;
  endTime?: Date;
  obstacles: GameObject[];
  powerUps: GameObject[];
  player: GameObject;
  effects: GameEffect[];
}

export interface GameEffect {
  type: 'speed' | 'invincible';
  startTime: Date;
  duration: number; // in milliseconds
  active: boolean;
}

export interface GameStats {
  bugsAvoided: number;
  deadlinesAvoided: number;
  meetingsAvoided: number;
  coffeeCollected: number;
  weekendsCollected: number;
}

export interface GameControls {
  up: boolean;
  down: boolean;
  jump: boolean;
  duck: boolean;
}