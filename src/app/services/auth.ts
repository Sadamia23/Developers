// services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { 
  RegisterDto, 
  LoginDto, 
  AuthResponse, 
  UserProfileDto, 
  AuthStatus 
} from '../types/dtos/dtos';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
   private http = inject(HttpClient);
  private router = inject(Router);

  // ⭐ CHANGE THIS TO YOUR ACTUAL API URL
  private readonly API_BASE_URL = 'https://localhost:7276/api/auth';
  
  // Reactive state
  currentUser = signal<UserProfileDto | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  private authCheckPromise: Promise<void> | null = null;

  constructor() {
    // Check authentication status on service initialization
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    if (!this.authCheckPromise) {
      this.authCheckPromise = this.checkAuthStatus();
    }
    return this.authCheckPromise;
  }

  /**
   * Wait for auth initialization to complete
   */
  async waitForAuthInit(): Promise<void> {
    if (this.authCheckPromise) {
      await this.authCheckPromise;
    }
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    console.log('🚀 AuthService: Starting registration...', registerDto);
    
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_BASE_URL}/register`, registerDto, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('✅ Registration response:', response);

      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        console.log('✅ User registered and authenticated');
        
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return response;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Login user with username only
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    console.log('🚀 AuthService: Starting login...', loginDto);
    
    try {
      this.isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_BASE_URL}/login`, loginDto, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('✅ Login response:', response);

      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        console.log('✅ User logged in and authenticated');
        
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return response;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please check your username.'
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfileDto | null> {
    console.log('🚀 AuthService: Getting profile...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<UserProfileDto>(`${this.API_BASE_URL}/profile`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      
      console.log('✅ Profile response:', response);
      this.currentUser.set(response);
      this.isAuthenticated.set(true);
      return response;
    } catch (error) {
      console.error('❌ Get profile error:', error);
      this.currentUser.set(null);
      this.isAuthenticated.set(false);
      return null;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    console.log('🚀 AuthService: Logging out...');
    
    try {
      await firstValueFrom(
        this.http.post(`${this.API_BASE_URL}/logout`, {}, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      this.currentUser.set(null);
      this.isAuthenticated.set(false);
      this.authCheckPromise = null;
      await this.router.navigate(['/login']);
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus(): Promise<void> {
    console.log('🚀 AuthService: Checking auth status...');
    
    try {
      const response = await firstValueFrom(
        this.http.get<AuthStatus>(`${this.API_BASE_URL}/status`, {
          withCredentials: true
        }).pipe(
          catchError(this.handleError)
        )
      );

      console.log('✅ Auth status response:', response);
      this.isAuthenticated.set(response.isAuthenticated);
      
      if (response.isAuthenticated) {
        // If authenticated, fetch full profile
        await this.getProfile();
      } else {
        this.currentUser.set(null);
      }
    } catch (error) {
      console.error('❌ Auth status check error:', error);
      this.isAuthenticated.set(false);
      this.currentUser.set(null);
    }
  }

  /**
   * Navigate to login page
   */
  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to profile page
   */
  redirectToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse) => {
    console.error('🔥 HTTP Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check if the server is running and CORS is configured.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }
    
    console.error('Processed error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}