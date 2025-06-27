// services/bug-chase.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { 
  BugChaseScoreDto, 
  BugChaseGameResultDto, 
  BugChaseStatsDto, 
  BugChaseLeaderboardEntryDto, 
  BugChaseDashboardDto 
} from '../types/dtos/bug-chase-dtos';

@Injectable({
  providedIn: 'root'
})
export class BugChaseService {
  private http = inject(HttpClient);

  // ⭐ CHANGE THIS TO YOUR ACTUAL API URL
  private readonly API_BASE_URL = 'https://localhost:7276/api/bugchase';

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
   * Initialize bug chase stats for the current user
   */
  async initializeUserStats(): Promise<void> {
    console.log('🏃 BugChaseService: Initializing user stats...');
    
    try {
      await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/initialize`, {}, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ User bug chase stats initialized');
    } catch (error: any) {
      console.error('❌ Initialize bug chase stats error:', error);
      throw error;
    }
  }

  /**
   * Get bug chase dashboard with user stats, leaderboard, and recent games
   */
  async getDashboard(): Promise<BugChaseDashboardDto> {
    console.log('🏃 BugChaseService: Getting dashboard...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<BugChaseDashboardDto>(`${this.API_BASE_URL}/dashboard`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Bug chase dashboard response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Bug chase dashboard error:', error);
      throw error;
    }
  }

  /**
   * Submit a new bug chase score
   */
  async submitScore(scoreDto: BugChaseScoreDto): Promise<BugChaseGameResultDto> {
    console.log('🏃 BugChaseService: Submitting score...', scoreDto);
    
    try {
      const response = await firstValueFrom(
        this.http.post<BugChaseGameResultDto>(`${this.API_BASE_URL}/score`, scoreDto, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Score submission response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Score submission error:', error);
      throw error;
    }
  }

  /**
   * Get current user's bug chase statistics
   */
  async getUserStats(): Promise<BugChaseStatsDto> {
    console.log('🏃 BugChaseService: Getting user stats...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<BugChaseStatsDto>(`${this.API_BASE_URL}/stats`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ User stats response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ User stats error:', error);
      throw error;
    }
  }

  /**
   * Get bug chase leaderboard
   */
  async getLeaderboard(limit: number = 5): Promise<BugChaseLeaderboardEntryDto[]> {
    console.log('🏃 BugChaseService: Getting leaderboard...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<BugChaseLeaderboardEntryDto[]>(`${this.API_BASE_URL}/leaderboard?limit=${limit}`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Leaderboard response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Get user's recent bug chase games
   */
  async getRecentGames(limit: number = 10): Promise<BugChaseGameResultDto[]> {
    console.log('🏃 BugChaseService: Getting recent games...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<BugChaseGameResultDto[]>(`${this.API_BASE_URL}/recent?limit=${limit}`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Recent games response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Recent games error:', error);
      throw error;
    }
  }

  /**
   * Helper method to format survival time from seconds to TimeSpan string format
   */
formatSurvivalTime(seconds: number): string {
  const totalMilliseconds = Math.floor(seconds * 1000);
  const hours = Math.floor(totalMilliseconds / 3600000);
  const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
  const secs = Math.floor((totalMilliseconds % 60000) / 1000);
  const ms = totalMilliseconds % 1000;
  
  // Format as TimeSpan string: "hh:mm:ss.fffffff"
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}0000`;
}


  /**
   * Helper method to parse TimeSpan string to display format
   */
 parseTimeSpanToDisplay(timeSpanString: string): string {
  try {
    // Parse TimeSpan string format like "00:01:30.4500000"
    const parts = timeSpanString.split(':');
    if (parts.length !== 3) return timeSpanString;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    
    // FIXED: Always show HH:MM:SS format (no milliseconds)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // Even when hours = 0, show MM:SS format (no milliseconds)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  } catch {
    return timeSpanString;
  }
}

  /**
   * Helper method to parse survival time string to seconds
   */
parseSurvivalTime(timeString: string): number {
  try {
    // Parse formats like "00:01:30.4500000" (TimeSpan format)
    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = secondsParts.length > 1 ? 
      parseInt(secondsParts[1].substring(0, 3), 10) : 0;
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  } catch {
    return 0;
  }
}

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse) => {
    console.error('🔥 Bug Chase HTTP Error:', error);
    console.error('Request URL:', error.url);
    console.error('Request headers:', error.headers);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      console.error('Response status:', error.status);
      console.error('Response body:', error.error);
      
      if (error.status === 0) {
        errorMessage = 'Unable to connect to bug chase server. Please check if the server is running and CORS is configured.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Bug Chase Server Error: ${error.status} - ${error.statusText}`;
      }
    }
    
    console.error('Processed bug chase error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}