import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Match, PotentialMatchDto, ChatMessageDto, DatingProfileStatus, DatingSetupRequest, SwipeRequest, SwipeResponse, SendMessageRequest, SendMessageResponse } from '../types/dtos/dev-dating-dtos';

@Injectable({
  providedIn: 'root'
})
export class DevDatingService {
  private http = inject(HttpClient);
  private readonly API_BASE_URL = environment.apiUrl + '/DevDating';

  // State signals
  isLoading = signal<boolean>(false);
  currentMatches = signal<Match[]>([]);
  potentialMatches = signal<PotentialMatchDto[]>([]);
  activeChat = signal<ChatMessageDto[]>([]);
  activeChatMatchId = signal<number | null>(null);

  async checkProfileStatus(): Promise<DatingProfileStatus> {
    try {
      this.isLoading.set(true);
      
      console.log('Checking dating profile status...');
      console.log('API URL:', `${this.API_BASE_URL}/profile/status`);

      const response = await firstValueFrom(
        this.http.get<DatingProfileStatus>(`${this.API_BASE_URL}/profile/status`, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('Profile status response:', response);
      return response;
    } catch (error: any) {
      console.error('Error checking profile status:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async setupDatingProfile(request: DatingSetupRequest): Promise<void> {
    try {
      this.isLoading.set(true);
      
      console.log('Setting up dating profile with request:', request);
      console.log('API URL:', `${this.API_BASE_URL}/setup`);

      await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/setup`, request, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('Dating profile setup successful');
    } catch (error: any) {
      console.error('Error setting up dating profile:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getPotentialMatches(): Promise<PotentialMatchDto[]> {
    try {
      this.isLoading.set(true);
      
      console.log('Getting potential matches...');
      console.log('API URL:', `${this.API_BASE_URL}/profiles`);

      const response = await firstValueFrom(
        this.http.get<PotentialMatchDto[]>(`${this.API_BASE_URL}/profiles`, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('Potential matches response:', response);
      this.potentialMatches.set(response);
      return response;
    } catch (error: any) {
      console.error('Error getting potential matches:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async processSwipe(request: SwipeRequest): Promise<SwipeResponse> {
    try {
      this.isLoading.set(true);
      
      console.log('Processing swipe with request:', request);
      console.log('API URL:', `${this.API_BASE_URL}/swipe`);

      const response = await firstValueFrom(
        this.http.post<SwipeResponse>(`${this.API_BASE_URL}/swipe`, request, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('Swipe response:', response);
      
      // Remove the swiped user from potential matches
      const currentMatches = this.potentialMatches();
      const updatedMatches = currentMatches.filter(match => match.userId !== request.targetUserId);
      this.potentialMatches.set(updatedMatches);

      return response;
    } catch (error: any) {
      console.error('Error processing swipe:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getChatHistory(matchId: number): Promise<ChatMessageDto[]> {
    try {
      this.isLoading.set(true);
      
      console.log('Getting chat history for match:', matchId);
      console.log('API URL:', `${this.API_BASE_URL}/chat/${matchId}`);

      const response = await firstValueFrom(
        this.http.get<ChatMessageDto[]>(`${this.API_BASE_URL}/chat/${matchId}`, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('Chat history response:', response);
      this.activeChat.set(response);
      this.activeChatMatchId.set(matchId);
      return response;
    } catch (error: any) {
      console.error('Error getting chat history:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendMessage(matchId: number, request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      this.isLoading.set(true);
      
      console.log('Sending message to match:', matchId, 'with request:', request);
      console.log('API URL:', `${this.API_BASE_URL}/chat/${matchId}`);

      const response = await firstValueFrom(
        this.http.post<SendMessageResponse>(`${this.API_BASE_URL}/chat/${matchId}`, request, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('Send message response:', response);
      
      // Update the active chat with new messages
      const currentChat = this.activeChat();
      const updatedChat = [...currentChat, response.userMessage];
      if (response.aiResponse) {
        updatedChat.push(response.aiResponse);
      }
      this.activeChat.set(updatedChat);

      return response;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getUserMatches(): Promise<Match[]> {
    try {
      this.isLoading.set(true);
      
      console.log('Getting user matches...');
      console.log('API URL:', `${this.API_BASE_URL}/matches`);

      const response = await firstValueFrom(
        this.http.get<Match[]>(`${this.API_BASE_URL}/matches`, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('User matches response:', response);
      this.currentMatches.set(response);
      return response;
    } catch (error: any) {
      console.error('Error getting user matches:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Test the API connection
  async testConnection(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE_URL}/profile/status`, {
          withCredentials: true  // Include session cookies
        }).pipe(
          catchError(this.handleError)
        )
      );
      console.log('Dev Dating health check response:', response);
      return response;
    } catch (error) {
      console.error('Dev Dating health check failed:', error);
      throw error;
    }
  }

  // Utility methods for managing state
  clearChat(): void {
    this.activeChat.set([]);
    this.activeChatMatchId.set(null);
  }

  clearMatches(): void {
    this.potentialMatches.set([]);
  }

  clearAll(): void {
    this.clearChat();
    this.clearMatches();
    this.currentMatches.set([]);
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('Full HTTP Error:', error);
    console.error('Error status:', error.status);
    console.error('Error statusText:', error.statusText);
    console.error('Error body:', error.error);
    console.error('Error headers:', error.headers);

    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check if the server is running.';
      } else if (error.status === 400) {
        // Bad Request - likely validation error
        if (error.error?.errors) {
          // ASP.NET Core validation errors
          const validationErrors = Object.keys(error.error.errors)
            .map(key => `${key}: ${error.error.errors[key].join(', ')}`)
            .join('; ');
          errorMessage = `Validation Error: ${validationErrors}`;
        } else if (error.error?.message) {
          errorMessage = `Bad Request: ${error.error.message}`;
        } else {
          errorMessage = `Bad Request: ${error.statusText}`;
        }
      } else if (error.status === 401) {
        errorMessage = 'You need to setup your dating profile first or login again.';
      } else if (error.status === 404) {
        errorMessage = 'Match not found or no longer available.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  };
}