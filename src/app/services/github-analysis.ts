import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { GitHubAuthStatus, GitHubAuthResponse, GitHubAnalysisRequest, GitHubAnalysisResponse, ApiResponse, AnalysisHistoryResponse, ShareCardResponse } from '../types/dtos/github-analysis-dtos';

@Injectable({
  providedIn: 'root'
})
export class GitHubAnalysisService {
  private http = inject(HttpClient);
  private readonly API_BASE_URL = environment.apiUrl + '/githubanalysis';

  constructor() {}

  // Authentication Methods
  async checkGitHubAuthStatus(userId: number): Promise<GitHubAuthStatus> {
    try {
      const response = await firstValueFrom(
        this.http.get<GitHubAuthStatus>(`${this.API_BASE_URL}/auth/status?userId=${userId}`, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );
      return response;
    } catch (error: any) {
      console.error('❌ GitHub auth status check error:', error);
      return {
        isAuthenticated: false,
        message: error.message || 'Failed to check GitHub authentication status'
      };
    }
  }

  async initiateGitHubAuth(userId: number): Promise<GitHubAuthResponse> {
    try {
      const response = await firstValueFrom(
        this.http.get<GitHubAuthResponse>(`${this.API_BASE_URL}/auth/login?userId=${userId}`, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );
      return response;
    } catch (error: any) {
      console.error('❌ GitHub auth initiation error:', error);
      throw new Error(error.message || 'Failed to initiate GitHub authentication');
    }
  }

  async logoutFromGitHub(userId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/auth/logout?userId=${userId}`, {}, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );
    } catch (error: any) {
      console.error('❌ GitHub logout error:', error);
      throw new Error(error.message || 'Failed to logout from GitHub');
    }
  }

  // Analysis Methods
  async analyzeRepositories(request: GitHubAnalysisRequest): Promise<GitHubAnalysisResponse> {
    try {
      console.log('🚀 Starting GitHub repository analysis...', request);
      
      const response = await firstValueFrom(
        this.http.post<ApiResponse<GitHubAnalysisResponse>>(`${this.API_BASE_URL}/analyze`, request, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );

      if (response.success && response.data) {
        console.log('✅ Analysis completed successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('❌ Repository analysis error:', error);
      throw new Error(error.message || 'Failed to analyze repositories');
    }
  }

  async getAnalysisResult(analysisId: number, userId: number): Promise<GitHubAnalysisResponse> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<GitHubAnalysisResponse>>(`${this.API_BASE_URL}/${analysisId}?userId=${userId}`, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get analysis result');
      }
    } catch (error: any) {
      console.error('❌ Get analysis result error:', error);
      throw new Error(error.message || 'Failed to get analysis result');
    }
  }

  async getUserAnalysisHistory(userId: number, page: number = 1, pageSize: number = 10): Promise<AnalysisHistoryResponse> {
    try {
      const response = await firstValueFrom(
        this.http.get<AnalysisHistoryResponse>(`${this.API_BASE_URL}/user/${userId}/history?page=${page}&pageSize=${pageSize}`, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );

      return response;
    } catch (error: any) {
      console.error('❌ Get analysis history error:', error);
      throw new Error(error.message || 'Failed to get analysis history');
    }
  }

  async deleteAnalysis(analysisId: number, userId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_BASE_URL}/${analysisId}?userId=${userId}`, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );
    } catch (error: any) {
      console.error('❌ Delete analysis error:', error);
      throw new Error(error.message || 'Failed to delete analysis');
    }
  }

  // Social Features
  async toggleFavorite(analysisId: number, userId: number): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; isFavorited: boolean; message: string }>(
          `${this.API_BASE_URL}/${analysisId}/favorite?userId=${userId}`, 
          {}, 
          { withCredentials: true }
        ).pipe(catchError(this.handleError))
      );

      return response.isFavorited;
    } catch (error: any) {
      console.error('❌ Toggle favorite error:', error);
      throw new Error(error.message || 'Failed to toggle favorite');
    }
  }

  async getShareableCard(analysisId: number): Promise<ShareCardResponse> {
    try {
      const response = await firstValueFrom(
        this.http.get<ShareCardResponse>(`${this.API_BASE_URL}/${analysisId}/share-card`, {
          withCredentials: true
        }).pipe(catchError(this.handleError))
      );

      return response;
    } catch (error: any) {
      console.error('❌ Get shareable card error:', error);
      throw new Error(error.message || 'Failed to generate shareable card');
    }
  }

  // Utility Methods
  openGitHubAuth(authUrl: string): void {
    // Open GitHub OAuth in a popup window
    const popup = window.open(
      authUrl,
      'github-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Check if popup was opened successfully
    if (!popup) {
      // Fallback to same window if popup was blocked
      window.location.href = authUrl;
    }
  }

  shareOnSocial(platform: 'twitter' | 'linkedin' | 'facebook', shareUrl: string): void {
    const popup = window.open(
      shareUrl,
      `share-${platform}`,
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      // Fallback to same window if popup was blocked
      window.location.href = shareUrl;
    }
  }

  copyToClipboard(text: string): Promise<boolean> {
    return navigator.clipboard.writeText(text)
      .then(() => {
        console.log('✅ Copied to clipboard:', text);
        return true;
      })
      .catch(err => {
        console.error('❌ Failed to copy to clipboard:', err);
        return false;
      });
  }

  // Error Handling
  private handleError = (error: HttpErrorResponse) => {
    console.error('🔥 GitHub Analysis API Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check if the server is running.';
      } else if (error.status === 401) {
        errorMessage = 'GitHub authentication required. Please authenticate with GitHub first.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. Please check your GitHub permissions.';
      } else if (error.status === 404) {
        errorMessage = 'Analysis not found or GitHub user not found.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }
    
    console.error('Processed error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
