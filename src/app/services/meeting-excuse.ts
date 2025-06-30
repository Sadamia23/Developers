import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import {
  MeetingExcuseDto,
  GenerateExcuseRequestDto,
  BulkExcuseGenerationDto,
  MeetingExcuseFavoriteDto,
  SaveFavoriteRequestDto,
  MeetingExcuseUsageDto,
  SubmitUsageRequestDto,
  RateExcuseRequestDto,
  MeetingExcuseStatsDto,
  MeetingExcuseDashboardDto,
  MeetingExcuseLeaderboardEntryDto,
  ExcuseAnalyticsDto,
  AIExcuseGenerationDto
} from '../types/dtos/meeting-excuse-dtos';

@Injectable({
  providedIn: 'root'
})
export class MeetingExcuseService {
  private http = inject(HttpClient);
  
  private readonly API_BASE_URL = 'https://localhost:7276/api/MeetingExcuse';
  
  currentExcuse = signal<MeetingExcuseDto | null>(null);
  userStats = signal<MeetingExcuseStatsDto | null>(null);
  dashboard = signal<MeetingExcuseDashboardDto | null>(null);
  favorites = signal<MeetingExcuseFavoriteDto[]>([]);
  usageHistory = signal<MeetingExcuseUsageDto[]>([]);
  isLoading = signal<boolean>(false);
  
  constructor() {
    this.initializeUserStats();
  }

  private async initializeUserStats(): Promise<void> {
    try {
      await this.initialize();
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  }

  async getDashboard(): Promise<MeetingExcuseDashboardDto> {
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseDashboardDto>(`${this.API_BASE_URL}/dashboard`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.dashboard.set(response);
      this.userStats.set(response.userStats);
      return response;
    } catch (error: any) {
      console.error('Error getting dashboard:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateExcuse(criteria?: GenerateExcuseRequestDto): Promise<MeetingExcuseDto> {
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<MeetingExcuseDto>(`${this.API_BASE_URL}/generate`, criteria || {}, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.currentExcuse.set(response);
      return response;
    } catch (error: any) {
      console.error('Error generating excuse:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateBulkExcuses(request: BulkExcuseGenerationDto): Promise<MeetingExcuseDto[]> {
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<MeetingExcuseDto[]>(`${this.API_BASE_URL}/generate/bulk`, request, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error generating bulk excuses:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateAIExcuse(criteria?: GenerateExcuseRequestDto): Promise<MeetingExcuseDto> {
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<MeetingExcuseDto>(`${this.API_BASE_URL}/generate/ai`, criteria || {}, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.currentExcuse.set(response);
      return response;
    } catch (error: any) {
      console.error('Error generating AI excuse:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async generatePersonalizedAIExcuse(criteria?: GenerateExcuseRequestDto): Promise<MeetingExcuseDto> {
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<MeetingExcuseDto>(`${this.API_BASE_URL}/generate/ai/personalized`, criteria || {}, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.currentExcuse.set(response);
      return response;
    } catch (error: any) {
      console.error('Error generating personalized AI excuse:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateSmartExcuse(request: AIExcuseGenerationDto): Promise<MeetingExcuseDto> {
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<MeetingExcuseDto>(`${this.API_BASE_URL}/generate/smart`, request, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.currentExcuse.set(response);
      return response;
    } catch (error: any) {
      console.error('Error generating smart excuse:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getExcuseOfTheDay(): Promise<MeetingExcuseDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseDto>(`${this.API_BASE_URL}/excuse-of-the-day`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting excuse of the day:', error);
      return null;
    }
  }

  async saveFavorite(request: SaveFavoriteRequestDto): Promise<MeetingExcuseFavoriteDto> {
    try {
      const response = await firstValueFrom(
        this.http.post<MeetingExcuseFavoriteDto>(`${this.API_BASE_URL}/favorites`, request, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      const currentFavorites = this.favorites();
      this.favorites.set([response, ...currentFavorites]);
      
      return response;
    } catch (error: any) {
      console.error('Error saving favorite:', error);
      throw error;
    }
  }

  async removeFavorite(favoriteId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_BASE_URL}/favorites/${favoriteId}`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      const currentFavorites = this.favorites();
      this.favorites.set(currentFavorites.filter(f => f.id !== favoriteId));
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  async getFavorites(limit: number = 20): Promise<MeetingExcuseFavoriteDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseFavoriteDto[]>(`${this.API_BASE_URL}/favorites?limit=${limit}`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.favorites.set(response);
      return response;
    } catch (error: any) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async submitUsage(request: SubmitUsageRequestDto): Promise<MeetingExcuseUsageDto> {
    try {
      const response = await firstValueFrom(
        this.http.post<MeetingExcuseUsageDto>(`${this.API_BASE_URL}/usage`, request, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error submitting usage:', error);
      throw error;
    }
  }

  async getUsageHistory(limit: number = 20): Promise<MeetingExcuseUsageDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseUsageDto[]>(`${this.API_BASE_URL}/usage?limit=${limit}`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.usageHistory.set(response);
      return response;
    } catch (error: any) {
      console.error('Error getting usage history:', error);
      return [];
    }
  }

  async rateExcuse(request: RateExcuseRequestDto): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/rate`, request, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
    } catch (error: any) {
      console.error('Error rating excuse:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<MeetingExcuseStatsDto> {
    try {
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseStatsDto>(`${this.API_BASE_URL}/stats`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      this.userStats.set(response);
      return response;
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getLeaderboard(limit: number = 10): Promise<MeetingExcuseLeaderboardEntryDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseLeaderboardEntryDto[]>(`${this.API_BASE_URL}/leaderboard?limit=${limit}`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  async getTrendingExcuses(limit: number = 10): Promise<MeetingExcuseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseDto[]>(`${this.API_BASE_URL}/trending?limit=${limit}`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting trending excuses:', error);
      return [];
    }
  }

  async getTopRatedExcuses(limit: number = 10): Promise<MeetingExcuseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<MeetingExcuseDto[]>(`${this.API_BASE_URL}/top-rated?limit=${limit}`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting top rated excuses:', error);
      return [];
    }
  }

  async getAnalytics(): Promise<ExcuseAnalyticsDto> {
    try {
      const response = await firstValueFrom(
        this.http.get<ExcuseAnalyticsDto>(`${this.API_BASE_URL}/analytics`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  async getAvailableTags(): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<string[]>(`${this.API_BASE_URL}/tags`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting available tags:', error);
      return [];
    }
  }

  async initialize(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/initialize`, {}, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
    } catch (error: any) {
      console.error('Error initializing user stats:', error);
      throw error;
    }
  }

  async getAIStatus(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE_URL}/ai/status`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting AI status:', error);
      return { aiAvailable: false };
    }
  }

  async getAISamples(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.API_BASE_URL}/ai/samples`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      return response;
    } catch (error: any) {
      console.error('Error getting AI samples:', error);
      return [];
    }
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('Meeting Excuse Service Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check if the server is running.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  };
}