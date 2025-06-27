import { MeetingCategory, ExcuseType } from '../enums/meeting-excuse-enums';

export interface MeetingExcuseDto {
  id: number;
  excuseText: string;
  category: MeetingCategory;
  type: ExcuseType;
  believabilityScore: number;
  tags: string[];
  usageCount: number;
  averageRating: number;
  ratingCount: number;
  isFavorite: boolean;
  createdAt: Date;
}

export interface GenerateExcuseRequestDto {
  category?: MeetingCategory;
  type?: ExcuseType;
  minBelievability?: number;
  maxBelievability?: number;
  excludeUsed?: boolean;
  tags?: string[];
}

export interface BulkExcuseGenerationDto {
  count: number;
  criteria: GenerateExcuseRequestDto;
}

export interface MeetingExcuseFavoriteDto {
  id: number;
  meetingExcuseId: number;
  customName?: string;
  userRating?: number;
  savedAt: Date;
  excuse: MeetingExcuseDto;
}

export interface SaveFavoriteRequestDto {
  meetingExcuseId: number;
  customName?: string;
  userRating?: number;
}

export interface MeetingExcuseUsageDto {
  id: number;
  meetingExcuseId: number;
  context?: string;
  wasSuccessful?: boolean;
  usedAt: Date;
  excuse: MeetingExcuseDto;
}

export interface SubmitUsageRequestDto {
  meetingExcuseId: number;
  context?: string;
  wasSuccessful?: boolean;
}

export interface RateExcuseRequestDto {
  meetingExcuseId: number;
  rating: number; // 1-5 stars
}

export interface MeetingExcuseStatsDto {
  userId: number;
  totalExcusesGenerated: number;
  totalFavorites: number;
  favoriteCategory?: MeetingCategory;
  favoriteType?: ExcuseType;
  averageBelievability: number;
  currentStreak: number;
  longestStreak: number;
  unlockedAchievements: string[];
  lastExcuseGenerated: Date;
}

export interface MeetingExcuseLeaderboardEntryDto {
  username: string;
  totalExcusesGenerated: number;
  currentStreak: number;
  longestStreak: number;
  averageBelievability: number;
  position: number;
}

export interface MeetingExcuseDashboardDto {
  userStats: MeetingExcuseStatsDto;
  excuseOfTheDay?: MeetingExcuseDto;
  recentFavorites: MeetingExcuseFavoriteDto[];
  recentUsage: MeetingExcuseUsageDto[];
  topUsersThisWeek: MeetingExcuseLeaderboardEntryDto[];
  trendingExcuses: MeetingExcuseDto[];
}

export interface ExcuseAnalyticsDto {
  categoryUsage: Record<MeetingCategory, number>;
  typeUsage: Record<ExcuseType, number>;
  believabilityDistribution: Record<number, number>;
  mostPopularExcuses: MeetingExcuseDto[];
  highestRatedExcuses: MeetingExcuseDto[];
  averageRatingAcrossAllExcuses: number;
  totalExcusesInDatabase: number;
  totalUsageCount: number;
}

export interface AIExcuseGenerationDto {
  criteria: GenerateExcuseRequestDto;
  useAI: boolean;
  mood?: string;
  context?: string;
  targetBelievability?: number;
}