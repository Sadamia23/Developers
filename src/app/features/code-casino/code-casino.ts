import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { CodeHighlightComponent } from '../code-highlight/code-highlight'; // Import the new component
import { AuthService } from '../../services/auth';
import { CasinoService } from '../../services/casino';
import { TechnologyStack, ExperienceLevel, ZodiacSign } from '../../types/enums/enums';
import { 
  CodeChallengeDto, 
  GameResultDto, 
  UserStatsDto, 
  LeaderboardEntryDto, 
  DailyChallengeDto, 
} from '../../types/dtos/casino-dtos';

@Component({
  selector: 'app-code-casino',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NavbarComponent, 
    CodeHighlightComponent 
  ],
  templateUrl: './code-casino.html',
  styleUrl: './code-casino.css'
})
export class CodeCasinoComponent implements OnInit {
  authService = inject(AuthService);
  casinoService = inject(CasinoService);
  
  isLoading = signal<boolean>(false);
  userStats = signal<UserStatsDto | null>(null);
  leaderboard = signal<LeaderboardEntryDto[]>([]);
  currentChallenge = signal<CodeChallengeDto | null>(null);
  dailyChallenge = signal<DailyChallengeDto | null>(null);
  gameResult = signal<GameResultDto | null>(null);
  
  selectedOption = signal<number | null>(null);
  betAmount = signal<number>(100);
  showResult = signal<boolean>(false);
  activeTab = signal<'challenge' | 'daily' | 'stats' | 'leaderboard'>('challenge');
  
  errorMessage = signal<string | null>(null);
  retryAttempts = signal<number>(0);
  maxRetries = 3;

  async ngOnInit() {
    console.log('🎰 Casino Component: Initializing...');
    await this.initializeWithRetry();
  }

  private async initializeWithRetry() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      this.retryAttempts.set(attempt);
      console.log(`🎰 Casino initialization attempt ${attempt}/${this.maxRetries}`);
      
      try {
        await this.performInitialization();
        console.log('✅ Casino initialization successful');
        return; // Success, exit retry loop
      } catch (error: any) {
        console.error(`❌ Casino initialization attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          this.errorMessage.set(`Failed to initialize casino after ${this.maxRetries} attempts. ${error.message}`);
          return;
        }
        
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async performInitialization() {
    console.log('🎰 Starting casino initialization...');
    
    console.log('🎰 Step 1: Waiting for auth initialization...');
    await this.authService.waitForAuthInit();
    
    console.log('🎰 Step 2: Checking authentication status...');
    if (!this.authService.isAuthenticated()) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    console.log('🎰 User is authenticated:', this.authService.currentUser());
    
    console.log('🎰 Step 3: Running authentication debug...');
    await this.debugAuthentication();
    
    console.log('🎰 Step 4: Initializing casino...');
    await this.initializeCasino();
    
    console.log('✅ Casino initialization completed successfully');
  }

  async debugAuthentication() {
    try {
      this.isLoading.set(true);
      console.log('🔍 Debugging authentication...');
      
      const authInfo = {
        isAuthenticated: this.authService.isAuthenticated(),
        currentUser: this.authService.currentUser(),
        timestamp: new Date().toISOString()
      };
      console.log('🔍 Auth Service Status:', authInfo);
      
      console.log('✅ Authentication debug completed - session is valid');
      
    } catch (error: any) {
      console.error('❌ Debug auth error:', error);
      
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        console.log('🔄 Attempting to refresh authentication...');
        await this.refreshAuthentication();
        
      } else {
        throw error;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private async refreshAuthentication() {
    try {
      console.log('🔄 Refreshing authentication...');
      
      const profile = await this.authService.getProfile();
      if (!profile) {
        throw new Error('Failed to refresh user profile');
      }
      
      console.log('✅ Authentication refreshed successfully');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('❌ Failed to refresh authentication:', error);
      
      this.authService.redirectToLogin();
      throw new Error('Authentication refresh failed. Please login again.');
    }
  }

  async initializeCasino() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      console.log('🎰 Initializing casino...');
      console.log('🎰 User authenticated:', this.authService.isAuthenticated());
      console.log('🎰 Current user:', this.authService.currentUser());

      console.log('🎰 Attempting to initialize user stats...');
      await this.initializeWithRetryWrapper(() => this.casinoService.initializeUserStats());
      console.log('✅ User stats initialized successfully');
      
      console.log('🎰 Attempting to load dashboard...');
      await this.initializeWithRetryWrapper(() => this.loadDashboard());
      console.log('✅ Dashboard loaded successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to initialize casino:', error);
      throw error; // Re-throw to trigger retry logic
    } finally {
      this.isLoading.set(false);
    }
  }

  private async initializeWithRetryWrapper<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.error(`Operation attempt ${attempt} failed:`, error);
        
        if (attempt < 3) {
          if (error.message.includes('Authentication') || error.message.includes('401')) {
            await this.refreshAuthentication();
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }

  async loadDashboard() {
    try {
      const dashboard = await this.casinoService.getDashboard();
      this.userStats.set(dashboard.userStats);
      this.leaderboard.set(dashboard.topPlayers);
      if (dashboard.dailyChallenge) {
        this.dailyChallenge.set(dashboard.dailyChallenge);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      throw new Error('Failed to load dashboard data: ' + error.message);
    }
  }

  async loadRandomChallenge() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.showResult.set(false);
      this.selectedOption.set(null);
      this.gameResult.set(null);

      const challenge = await this.casinoService.getRandomChallenge();
      this.currentChallenge.set(challenge);
      this.activeTab.set('challenge');
    } catch (error: any) {
      console.error('Failed to load challenge:', error);
      this.handleApiError(error, 'Failed to load challenge');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadDailyChallenge() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const daily = await this.casinoService.getDailyChallenge();
      this.dailyChallenge.set(daily);
      this.activeTab.set('daily');
    } catch (error: any) {
      console.error('Failed to load daily challenge:', error);
      this.handleApiError(error, 'Failed to load daily challenge');
    } finally {
      this.isLoading.set(false);
    }
  }

  async placeBet(challengeId: number) {
    const option = this.selectedOption();
    const amount = this.betAmount();

    if (!option || option < 1 || option > 2) {
      this.errorMessage.set('Please select an option (1 or 2)');
      return;
    }

    if (amount < 1 || amount > (this.userStats()?.totalPoints || 0)) {
      this.errorMessage.set('Invalid bet amount');
      return;
    }

    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const result = await this.casinoService.placeBet({
        pointsBet: amount,
        challengeId: challengeId,
        chosenOption: option
      });

      this.gameResult.set(result);
      this.showResult.set(true);
      
      await this.loadUserStats();
      
    } catch (error: any) {
      console.error('Failed to place bet:', error);
      this.handleApiError(error, 'Failed to place bet');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadUserStats() {
    try {
      const stats = await this.casinoService.getUserStats();
      this.userStats.set(stats);
    } catch (error: any) {
      console.error('Failed to load user stats:', error);
      this.handleApiError(error, 'Failed to load user stats');
    }
  }

  async loadLeaderboard() {
    try {
      this.isLoading.set(true);
      const leaderboard = await this.casinoService.getLeaderboard(10);
      this.leaderboard.set(leaderboard);
      this.activeTab.set('leaderboard');
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      this.handleApiError(error, 'Failed to load leaderboard');
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleApiError(error: any, defaultMessage: string) {
    if (error.message.includes('Authentication') || error.message.includes('401')) {
      this.errorMessage.set('Session expired. Please refresh the page or login again.');
    } else {
      this.errorMessage.set(error.message || defaultMessage);
    }
  }

  async retryInitialization() {
    this.errorMessage.set(null);
    this.retryAttempts.set(0);
    await this.initializeWithRetry();
  }

  setActiveTab(tab: 'challenge' | 'daily' | 'stats' | 'leaderboard') {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  selectOption(option: number) {
    this.selectedOption.set(option);
  }

  setBetAmount(amount: number) {
    this.betAmount.set(Math.max(1, amount));
  }

  getZodiacEmoji(zodiacSign: ZodiacSign): string {
    const zodiacEmojis: Record<ZodiacSign, string> = {
      [ZodiacSign.Aries]: '♈',
      [ZodiacSign.Taurus]: '♉',
      [ZodiacSign.Gemini]: '♊',
      [ZodiacSign.Cancer]: '♋',
      [ZodiacSign.Leo]: '♌',
      [ZodiacSign.Virgo]: '♍',
      [ZodiacSign.Libra]: '♎',
      [ZodiacSign.Scorpio]: '♏',
      [ZodiacSign.Sagittarius]: '♐',
      [ZodiacSign.Capricorn]: '♑',
      [ZodiacSign.Aquarius]: '♒',
      [ZodiacSign.Pisces]: '♓'
    };
    return zodiacEmojis[zodiacSign] || '⭐';
  }

  getTechnologyStackName(techStack: TechnologyStack): string {
    return TechnologyStack[techStack] || 'Unknown';
  }

  getExperienceLevelName(experience: ExperienceLevel): string {
    return ExperienceLevel[experience] || 'Unknown';
  }

  getZodiacSignName(zodiacSign: ZodiacSign): string {
    return ZodiacSign[zodiacSign] || 'Unknown';
  }

  formatDate(dateString: Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRankEmoji(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  }

  clearError() {
    this.errorMessage.set(null);
  }
}