import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { 
  CodeChallengeDto, 
  PlaceBetDto, 
  GameResultDto, 
  UserStatsDto, 
  LeaderboardEntryDto, 
  DailyChallengeDto, 
  CasinoStatsResponse 
} from '../types/dtos/casino-dtos';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CasinoService {
  private http = inject(HttpClient);

  private readonly API_BASE_URL = environment.apiUrl + '/codecasino';

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  async debugAuth(): Promise<any> {
    console.log('🔍 CasinoService: Debugging auth...');
    
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE_URL}/debug/auth`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Auth debug response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Auth debug error:', error);
      throw error;
    }
  }

  async initializeUserStats(): Promise<void> {
    console.log('🎰 CasinoService: Initializing user stats...');
    
    try {
      await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/initialize`, {}, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ User stats initialized');
    } catch (error: any) {
      console.error('❌ Initialize stats error:', error);
      throw error;
    }
  }

  async getDashboard(): Promise<CasinoStatsResponse> {
    console.log('🎰 CasinoService: Getting dashboard...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<CasinoStatsResponse>(`${this.API_BASE_URL}/dashboard`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Dashboard response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Dashboard error:', error);
      throw error;
    }
  }

  async getRandomChallenge(): Promise<CodeChallengeDto> {
    console.log('🎰 CasinoService: Getting random challenge...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<CodeChallengeDto>(`${this.API_BASE_URL}/challenge`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Random challenge response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Random challenge error:', error);
      throw error;
    }
  }

  async getDailyChallenge(): Promise<DailyChallengeDto> {
    console.log('🎰 CasinoService: Getting daily challenge...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<DailyChallengeDto>(`${this.API_BASE_URL}/daily-challenge`, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Daily challenge response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Daily challenge error:', error);
      throw error;
    }
  }

  async placeBet(betDto: PlaceBetDto): Promise<GameResultDto> {
    console.log('🎰 CasinoService: Placing bet...', betDto);
    
    try {
      const response = await firstValueFrom(
        this.http.post<GameResultDto>(`${this.API_BASE_URL}/bet`, betDto, this.getHttpOptions()).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Bet response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Bet error:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStatsDto> {
    console.log('🎰 CasinoService: Getting user stats...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<UserStatsDto>(`${this.API_BASE_URL}/stats`, this.getHttpOptions()).pipe(
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

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntryDto[]> {
    console.log('🎰 CasinoService: Getting leaderboard...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<LeaderboardEntryDto[]>(`${this.API_BASE_URL}/leaderboard?limit=${limit}`, this.getHttpOptions()).pipe(
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

  private handleError = (error: HttpErrorResponse) => {
    console.error('🔥 Casino HTTP Error:', error);
    console.error('Request URL:', error.url);
    console.error('Request headers:', error.headers);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      console.error('Response status:', error.status);
      console.error('Response body:', error.error);
      
      if (error.status === 0) {
        errorMessage = 'Unable to connect to casino server. Please check if the server is running and CORS is configured.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Casino Server Error: ${error.status} - ${error.statusText}`;
      }
    }
    
    console.error('Processed casino error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}