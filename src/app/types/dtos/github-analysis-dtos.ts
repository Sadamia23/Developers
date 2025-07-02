export interface GitHubAnalysisRequest {
  userId: number;
  gitHubUsername: string;
  maxRepositories: number;
  includeForkedRepos: boolean;
  analyzePrivateRepos: boolean;
}

export interface AnalysisScores {
  commitMessageQuality: number;
  codeCommentingScore: number;
  variableNamingScore: number;
  projectStructureScore: number;
  overallScore: number;
}

export interface CelebrityDeveloper {
  name: string;
  description: string;
  gitHubUsername: string;
  reason: string;
  similarityScore: number;
}

export interface RepositorySummary {
  name: string;
  description: string;
  primaryLanguage: string;
  starsCount: number;
  commitsAnalyzed: number;
  scores: AnalysisScores;
}

export interface GitHubAnalysisResponse {
  id: number;
  personalityType: string;
  personalityDescription: string;
  strengths: string[];
  weaknesses: string[];
  celebrityDevelopers: CelebrityDeveloper[];
  scores: AnalysisScores;
  repositoriesAnalyzed: RepositorySummary[];
  shareableCardUrl: string;
  analyzedAt: string;
}

export interface GitHubAuthStatus {
  isAuthenticated: boolean;
  githubUsername?: string;
  avatarUrl?: string;
  message: string;
}

export interface GitHubAuthResponse {
  authUrl: string;
  state: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ShareUrls {
  twitter: string;
  linkedin: string;
  facebook: string;
}

export interface ShareCardResponse {
  success: boolean;
  shareableCardUrl: string;
  socialShareUrls: ShareUrls;
}

export interface AnalysisHistoryResponse {
  success: boolean;
  data: GitHubAnalysisResponse[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}