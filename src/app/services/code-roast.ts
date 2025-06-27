import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { CodeRoastDashboardDto, CodeRoastTaskDto, CodeRoastSubmissionDto, CodeRoastResultDto, CodeRoastStatsDto, CodeRoastHallOfFameDto } from '../types/dtos/code-roast-dtos';
import { ExperienceLevel } from '../types/enums/enums';

@Injectable({
  providedIn: 'root'
})
export class CodeRoastService {
  private http = inject(HttpClient);
  private baseUrl = 'https://localhost:7276/api/coderoast'; // ✅ FIXED: Changed from codecasino to coderoast

  // Common HTTP options for all requests
  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  /**
   * Get the dashboard with user stats, recent roasts, recommended tasks, and hall of fame
   */
  async getDashboard(): Promise<CodeRoastDashboardDto> {
    try {
      console.log('🔥 CodeRoastService: Getting dashboard...');
      const response = await firstValueFrom(
        this.http.get<CodeRoastDashboardDto>(`${this.baseUrl}/dashboard`, this.getHttpOptions())
      );
      
      if (!response) {
        throw new Error('No dashboard data received');
      }
      
      console.log('✅ CodeRoastService: Dashboard loaded successfully');
      return response;
    } catch (error) {
      console.error('❌ CodeRoastService: Dashboard error:', error);
      throw this.handleError(error, 'Failed to load dashboard');
    }
  }

  /**
   * Get a coding task based on difficulty level
   */
  async getTask(difficulty: ExperienceLevel = ExperienceLevel.Junior): Promise<CodeRoastTaskDto> {
    try {
      console.log('🔥 CodeRoastService: Getting task with difficulty:', difficulty);
      const difficultyName = ExperienceLevel[difficulty].toLowerCase();
      const response = await firstValueFrom(
        this.http.get<CodeRoastTaskDto>(`${this.baseUrl}/task?difficulty=${difficultyName}`, this.getHttpOptions())
      );
      
      if (!response) {
        throw new Error('No task data received');
      }
      
      console.log('✅ CodeRoastService: Task loaded successfully');
      return response;
    } catch (error) {
      console.error('❌ CodeRoastService: Task error:', error);
      throw this.handleError(error, 'Failed to load coding task');
    }
  }

  /**
   * Submit code for roasting and evaluation
   */
  async submitCode(submission: CodeRoastSubmissionDto): Promise<CodeRoastResultDto> {
    try {
      console.log('🔥 CodeRoastService: Submitting code for roasting...');
      const response = await firstValueFrom(
        this.http.post<CodeRoastResultDto>(`${this.baseUrl}/submit`, submission, this.getHttpOptions())
      );
      
      if (!response) {
        throw new Error('No result received from submission');
      }
      
      console.log('✅ CodeRoastService: Code submitted and evaluated successfully');
      return response;
    } catch (error) {
      console.error('❌ CodeRoastService: Submit code error:', error);
      throw this.handleError(error, 'Failed to submit code for roasting');
    }
  }

  /**
   * Get user's code roast statistics
   */
  async getUserStats(): Promise<CodeRoastStatsDto> {
    try {
      console.log('🔥 CodeRoastService: Getting user stats...');
      const response = await firstValueFrom(
        this.http.get<CodeRoastStatsDto>(`${this.baseUrl}/stats`, this.getHttpOptions())
      );
      
      if (!response) {
        throw new Error('No stats data received');
      }
      
      console.log('✅ CodeRoastService: Stats loaded successfully');
      return response;
    } catch (error) {
      console.error('❌ CodeRoastService: Stats error:', error);
      throw this.handleError(error, 'Failed to load user statistics');
    }
  }

  /**
   * Get user's roast history
   */
  async getRoastHistory(limit: number = 10): Promise<CodeRoastResultDto[]> {
    try {
      console.log('🔥 CodeRoastService: Getting roast history...');
      const response = await firstValueFrom(
        this.http.get<CodeRoastResultDto[]>(`${this.baseUrl}/history?limit=${limit}`, this.getHttpOptions())
      );
      
      if (!response) {
        throw new Error('No history data received');
      }
      
      console.log('✅ CodeRoastService: History loaded successfully');
      return response;
    } catch (error) {
      console.error('❌ CodeRoastService: History error:', error);
      throw this.handleError(error, 'Failed to load roast history');
    }
  }

  /**
   * Get hall of fame - best and worst roasts
   */
  async getHallOfFame(): Promise<CodeRoastHallOfFameDto> {
    try {
      console.log('🔥 CodeRoastService: Getting hall of fame...');
      const response = await firstValueFrom(
        this.http.get<CodeRoastHallOfFameDto>(`${this.baseUrl}/hall-of-fame`, this.getHttpOptions())
      );
      
      if (!response) {
        throw new Error('No hall of fame data received');
      }
      
      console.log('✅ CodeRoastService: Hall of fame loaded successfully');
      return response;
    } catch (error) {
      console.error('❌ CodeRoastService: Hall of fame error:', error);
      throw this.handleError(error, 'Failed to load hall of fame');
    }
  }

  /**
   * Initialize user stats (if not exists)
   */
  async initializeUserStats(): Promise<void> {
    try {
      console.log('🔥 CodeRoastService: Initializing user stats...');
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/initialize`, {}, this.getHttpOptions())
      );
      console.log('✅ CodeRoastService: User stats initialized successfully');
    } catch (error) {
      console.error('❌ CodeRoastService: Initialize stats error:', error);
      throw this.handleError(error, 'Failed to initialize user statistics');
    }
  }

  /**
   * Handle HTTP errors and convert them to meaningful messages
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof HttpErrorResponse) {
      // Server error
      if (error.status === 0) {
        return new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      if (error.status === 401) {
        return new Error('Authentication required. Please login again.');
      }
      
      if (error.status === 403) {
        return new Error('Access denied. You do not have permission to perform this action.');
      }
      
      if (error.status === 404) {
        return new Error('The requested resource was not found.');
      }
      
      if (error.status >= 500) {
        return new Error('Server error occurred. Please try again later.');
      }
      
      // Try to extract error message from response
      if (error.error?.message) {
        return new Error(error.error.message);
      }
      
      return new Error(`Server returned ${error.status}: ${error.statusText}`);
    }
    
    // Network or other errors
    if (error instanceof Error) {
      return error;
    }
    
    return new Error(defaultMessage);
  }
}