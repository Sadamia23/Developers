import { Component, inject, OnInit, signal } from '@angular/core';
import { CodeRoastDashboardDto, CodeRoastHallOfFameDto, CodeRoastResultDto, CodeRoastSubmissionDto, CodeRoastTaskDto, RoastSeverity } from '../../types/dtos/code-roast-dtos';
import { ExperienceLevel, TechnologyStack, ZodiacSign } from '../../types/enums/enums';
import { Router } from '@angular/router';
import { CodeRoastService } from '../../services/code-roast';
import { AuthService } from '../../services/auth';
import { NavbarComponent } from "../navbar/navbar";

@Component({
  selector: 'app-code-roast',
  imports: [NavbarComponent],
  templateUrl: './code-roast.html',
  styleUrl: './code-roast.css'
})
export class CodeRoastComponent implements OnInit {
  authService = inject(AuthService);
  codeRoastService = inject(CodeRoastService);
  router = inject(Router);

  // Reactive state
  isLoading = signal<boolean>(false);
  dashboard = signal<CodeRoastDashboardDto | null>(null);
  currentTask = signal<CodeRoastTaskDto | null>(null);
  submissionResult = signal<CodeRoastResultDto | null>(null);
  hallOfFame = signal<CodeRoastHallOfFameDto | null>(null);
  roastHistory = signal<CodeRoastResultDto[]>([]);

  // UI state
  activeTab = signal<'dashboard' | 'challenge' | 'results' | 'stats' | 'history' | 'hall-of-fame'>('dashboard');
  selectedDifficulty = signal<ExperienceLevel>(ExperienceLevel.Junior);
  submittedCode = signal<string>('');
  userNotes = signal<string>('');
  timeSpentMinutes = signal<number>(0);
  showResult = signal<boolean>(false);

  // Error handling
  errorMessage = signal<string | null>(null);
  retryAttempts = signal<number>(0);
  maxRetries = 3;

  // Timer for tracking time spent
  private startTime: number = 0;
  private timerInterval: any;

  async ngOnInit() {
    console.log('🔥 Code Roast Component: Initializing...');
    await this.initializeWithRetry();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private async initializeWithRetry() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      this.retryAttempts.set(attempt);
      console.log(`🔥 Code Roast initialization attempt ${attempt}/${this.maxRetries}`);
      
      try {
        await this.performInitialization();
        console.log('✅ Code Roast initialization successful');
        return;
      } catch (error: any) {
        console.error(`❌ Code Roast initialization attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          this.errorMessage.set(`Failed to initialize Code Roast after ${this.maxRetries} attempts. ${error.message}`);
          return;
        }
        
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async performInitialization() {
    console.log('🔥 Starting Code Roast initialization...');
    
    await this.authService.waitForAuthInit();
    
    if (!this.authService.isAuthenticated()) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    console.log('🔥 User is authenticated:', this.authService.currentUser());
    
    await this.initializeCodeRoast();
    
    console.log('✅ Code Roast initialization completed successfully');
  }

  async initializeCodeRoast() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      console.log('🔥 Initializing Code Roast...');
      
      // Initialize user stats
      await this.codeRoastService.initializeUserStats();
      console.log('✅ User stats initialized');
      
      // Load dashboard
      await this.loadDashboard();
      console.log('✅ Dashboard loaded');
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Code Roast:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadDashboard() {
    try {
      const dashboard = await this.codeRoastService.getDashboard();
      this.dashboard.set(dashboard);
      this.activeTab.set('dashboard');
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      throw new Error('Failed to load dashboard data: ' + error.message);
    }
  }

  async loadNewTask() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.showResult.set(false);
      this.submissionResult.set(null);
      this.submittedCode.set('');
      this.userNotes.set('');
      this.timeSpentMinutes.set(0);

      const task = await this.codeRoastService.getTask(this.selectedDifficulty());
      this.currentTask.set(task);
      this.activeTab.set('challenge');
      
      // Start timer
      this.startTimer();
    } catch (error: any) {
      console.error('Failed to load task:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitCode() {
    const task = this.currentTask();
    const code = this.submittedCode().trim();

    if (!task) {
      this.errorMessage.set('No task available. Please load a task first.');
      return;
    }

    if (!code) {
      this.errorMessage.set('Please enter your code solution.');
      return;
    }

    if (code.length < 10) {
      this.errorMessage.set('Your code seems too short. Please provide a meaningful solution.');
      return;
    }

    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      // Stop timer and calculate time spent
      this.stopTimer();

      const submission: CodeRoastSubmissionDto = {
        taskId: task.id,
        code: code,
        notes: this.userNotes() || undefined,
        timeSpentMinutes: this.timeSpentMinutes()
      };

      const result = await this.codeRoastService.submitCode(submission);
      this.submissionResult.set(result);
      this.showResult.set(true);
      this.activeTab.set('results');
      
      // Refresh dashboard stats
      await this.loadDashboard();
      
    } catch (error: any) {
      console.error('Failed to submit code:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadRoastHistory() {
    try {
      this.isLoading.set(true);
      const history = await this.codeRoastService.getRoastHistory(20);
      this.roastHistory.set(history);
      this.activeTab.set('history');
    } catch (error: any) {
      console.error('Failed to load history:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadHallOfFame() {
    try {
      this.isLoading.set(true);
      const hallOfFame = await this.codeRoastService.getHallOfFame();
      this.hallOfFame.set(hallOfFame);
      this.activeTab.set('hall-of-fame');
    } catch (error: any) {
      console.error('Failed to load hall of fame:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  private startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 60000); // minutes
      this.timeSpentMinutes.set(elapsed);
    }, 60000); // Update every minute
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const elapsed = Math.floor((Date.now() - this.startTime) / 60000);
    this.timeSpentMinutes.set(Math.max(1, elapsed)); // Minimum 1 minute
  }

  // Manual retry function
  async retryInitialization() {
    this.errorMessage.set(null);
    this.retryAttempts.set(0);
    await this.initializeWithRetry();
  }

  // UI Helper Methods
  setActiveTab(tab: 'dashboard' | 'challenge' | 'results' | 'stats' | 'history' | 'hall-of-fame') {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    
    // Load data for specific tabs
    if (tab === 'history' && this.roastHistory().length === 0) {
      this.loadRoastHistory();
    } else if (tab === 'hall-of-fame' && !this.hallOfFame()) {
      this.loadHallOfFame();
    } else if (tab === 'stats') {
      // Stats are available in dashboard
    }
  }

  setDifficulty(difficulty: ExperienceLevel) {
    this.selectedDifficulty.set(difficulty);
  }

  clearError() {
    this.errorMessage.set(null);
  }

  // Utility methods
  getTechnologyStackName(techStack: TechnologyStack): string {
    return TechnologyStack[techStack] || 'Unknown';
  }

  getExperienceLevelName(experience: ExperienceLevel): string {
    return ExperienceLevel[experience] || 'Unknown';
  }

  getZodiacSignName(zodiacSign: ZodiacSign): string {
    return ZodiacSign[zodiacSign] || 'Unknown';
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

  getRoastSeverityEmoji(severity: RoastSeverity): string {
    switch (severity) {
      case RoastSeverity.Gentle: return '😊';
      case RoastSeverity.Medium: return '😏';
      case RoastSeverity.Brutal: return '😈';
      case RoastSeverity.Devastating: return '💀';
      default: return '😐';
    }
  }

  getRoastSeverityName(severity: RoastSeverity): string {
    return RoastSeverity[severity] || 'Unknown';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#22c55e'; // Green
    if (score >= 70) return '#f59e0b'; // Yellow
    if (score >= 50) return '#ef4444'; // Red
    return '#7c2d12'; // Dark red
  }

  formatDate(dateString: Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTimeSpent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  getAchievementEmoji(achievement: string): string {
    const achievementEmojis: Record<string, string> = {
      'FirstSubmission': '🎉',
      'PerfectScore': '💯',
      'Perfectionist': '👑',
      'SurvivalStreak': '🔥',
      'Resilient': '💪',
      'ImprovementStreak': '📈',
      'Comeback': '🚀',
      'SpeedDemon': '⚡',
      'TechMaster': '🎯',
      'Consistent': '⭐'
    };
    return achievementEmojis[achievement] || '🏆';
  }
}
