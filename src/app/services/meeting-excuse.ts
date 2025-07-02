import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AIExcuseRequest, AIExcuseResponse } from '../types/enums/meeting-excuse-enums';

@Injectable({
  providedIn: 'root'
})
export class MeetingExcuseService {
  private http = inject(HttpClient);
  private readonly API_BASE_URL = environment.apiUrl + '/MeetingExcuse';

  // State signals
  isLoading = signal<boolean>(false);

  async generateAIExcuse(request: AIExcuseRequest): Promise<AIExcuseResponse> {
    try {
      this.isLoading.set(true);
      
      console.log('Calling API with request:', request);
      console.log('API URL:', `${this.API_BASE_URL}/generate`);

      const response = await firstValueFrom(
        this.http.post<AIExcuseResponse>(`${this.API_BASE_URL}/generate`, request, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('API Response:', response);
      return response;
    } catch (error: any) {
      console.error('Error generating AI excuse:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateBulkAIExcuses(request: AIExcuseRequest, count: number = 3): Promise<AIExcuseResponse[]> {
    try {
      this.isLoading.set(true);
      
      console.log('Calling bulk API with request:', request, 'count:', count);

      const response = await firstValueFrom(
        this.http.post<AIExcuseResponse[]>(`${this.API_BASE_URL}/generate/bulk?count=${count}`, request, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('Bulk API Response:', response);
      return response;
    } catch (error: any) {
      console.error('Error generating bulk AI excuses:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Test the API connection
  async testConnection(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE_URL}/health`).pipe(
          catchError(this.handleError)
        )
      );
      console.log('Health check response:', response);
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
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
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  };
}