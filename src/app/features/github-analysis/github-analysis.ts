import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { GitHubAnalysisService } from '../../services/github-analysis';
import { GitHubAuthStatus, GitHubAnalysisRequest, GitHubAnalysisResponse } from '../../types/dtos/github-analysis-dtos';
import { NavbarComponent } from "../navbar/navbar";

type AnalysisStep = 'auth' | 'form' | 'analyzing' | 'results' | 'history';

@Component({
  selector: 'app-github-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './github-analysis.html',
  styleUrl: './github-analysis.css'
})

export class GitHubAnalysisComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private githubService = inject(GitHubAnalysisService);

  // Signals for state management
  currentStep = signal<AnalysisStep>('auth');
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // GitHub Auth state
  githubAuthStatus = signal<GitHubAuthStatus>({
    isAuthenticated: false,
    message: 'Not authenticated'
  });

  // Analysis form state
  analysisForm = signal<GitHubAnalysisRequest>({
    userId: 0,
    gitHubUsername: '',
    maxRepositories: 5,
    includeForkedRepos: false,
    analyzePrivateRepos: false
  });

  // Analysis results
  currentAnalysis = signal<GitHubAnalysisResponse | null>(null);
  analysisHistory = signal<GitHubAnalysisResponse[]>([]);
  
  // UI state
  showAdvancedOptions = signal(false);
  analysisProgress = signal(0);

  // Computed values
  currentUser = computed(() => this.authService.currentUser());
  canStartAnalysis = computed(() => 
    this.githubAuthStatus().isAuthenticated && 
    this.analysisForm().gitHubUsername.trim().length > 0
  );

  constructor() {
    // Auto-update userId when user changes
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.analysisForm.update(form => ({ ...form, userId: user.id }));
      }
    });
  }

  async ngOnInit() {
    await this.checkGitHubAuth();
    await this.loadAnalysisHistory();
  }

  // Event Handlers
  onUsernameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateAnalysisForm({ gitHubUsername: target.value });
  }

  onMaxReposChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateAnalysisForm({ maxRepositories: +target.value });
  }

  onIncludeForkedChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateAnalysisForm({ includeForkedRepos: target.checked });
  }

  onAnalyzePrivateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateAnalysisForm({ analyzePrivateRepos: target.checked });
  }

  // Authentication Methods
  async checkGitHubAuth(): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.isLoading.set(true);
      const authStatus = await this.githubService.checkGitHubAuthStatus(user.id);
      this.githubAuthStatus.set(authStatus);
      
      if (authStatus.isAuthenticated && authStatus.githubUsername) {
        this.analysisForm.update(form => ({ 
          ...form, 
          gitHubUsername: authStatus.githubUsername || '' 
        }));
        this.currentStep.set('form');
      }
    } catch (error: any) {
      this.error.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async authenticateWithGitHub(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      const authResponse = await this.githubService.initiateGitHubAuth(user.id);
      
      // Open GitHub OAuth in popup
      this.githubService.openGitHubAuth(authResponse.authUrl);
      
      // Poll for authentication completion
      await this.pollForAuthCompletion();
      
    } catch (error: any) {
      this.error.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async pollForAuthCompletion(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    const maxAttempts = 30; // 30 seconds
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const authStatus = await this.githubService.checkGitHubAuthStatus(user.id);
        
        if (authStatus.isAuthenticated) {
          this.githubAuthStatus.set(authStatus);
          this.success.set('GitHub authentication successful! 🎉');
          
          if (authStatus.githubUsername) {
            this.analysisForm.update(form => ({ 
              ...form, 
              gitHubUsername: authStatus.githubUsername || '' 
            }));
          }
          
          this.currentStep.set('form');
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          this.error.set('Authentication timeout. Please try again.');
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        }
      }
    };

    poll();
  }

  async logoutFromGitHub(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    try {
      await this.githubService.logoutFromGitHub(user.id);
      this.githubAuthStatus.set({
        isAuthenticated: false,
        message: 'Logged out from GitHub'
      });
      this.currentStep.set('auth');
      this.success.set('Logged out from GitHub successfully');
    } catch (error: any) {
      this.error.set(error.message);
    }
  }

  // Analysis Methods
  async startAnalysis(): Promise<void> {
    if (!this.canStartAnalysis()) return;

    try {
      this.isLoading.set(true);
      this.error.set(null);
      this.currentStep.set('analyzing');
      this.analysisProgress.set(0);

      // Simulate progress
      this.simulateProgress();

      const analysis = await this.githubService.analyzeRepositories(this.analysisForm());
      
      this.currentAnalysis.set(analysis);
      this.currentStep.set('results');
      this.success.set('Analysis completed successfully! 🎉');
      
      // Refresh history
      await this.loadAnalysisHistory();
      
    } catch (error: any) {
      this.error.set(error.message);
      this.currentStep.set('form');
    } finally {
      this.isLoading.set(false);
      this.analysisProgress.set(100);
    }
  }

  private simulateProgress(): void {
    const interval = setInterval(() => {
      const current = this.analysisProgress();
      if (current < 90) {
        this.analysisProgress.set(current + Math.random() * 10);
      } else {
        clearInterval(interval);
      }
    }, 500);
  }

  async loadAnalysisHistory(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    try {
      const historyResponse = await this.githubService.getUserAnalysisHistory(user.id, 1, 10);
      this.analysisHistory.set(historyResponse.data || []);
    } catch (error: any) {
      console.error('Failed to load analysis history:', error);
    }
  }

  // UI Actions
  updateAnalysisForm(updates: Partial<GitHubAnalysisRequest>): void {
    this.analysisForm.update(form => ({ ...form, ...updates }));
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.update(show => !show);
  }

  goToStep(step: AnalysisStep): void {
    this.currentStep.set(step);
    this.clearMessages();
  }

  clearMessages(): void {
    this.error.set(null);
    this.success.set(null);
  }

  // Social Features
  async toggleFavorite(analysisId: number): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    try {
      const isFavorited = await this.githubService.toggleFavorite(analysisId, user.id);
      this.success.set(isFavorited ? 'Added to favorites ❤️' : 'Removed from favorites');
      
      // Update the analysis in current results or history
      this.updateAnalysisFavoriteStatus(analysisId, isFavorited);
      
    } catch (error: any) {
      this.error.set(error.message);
    }
  }

  private updateAnalysisFavoriteStatus(analysisId: number, isFavorited: boolean): void {
    // Update history
    this.analysisHistory.update(history =>
      history.map(analysis => 
        analysis.id === analysisId 
          ? { ...analysis }
          : analysis
      )
    );
  }

  async shareAnalysis(analysis: GitHubAnalysisResponse, platform: 'twitter' | 'linkedin' | 'facebook'): Promise<void> {
    try {
      const shareCard = await this.githubService.getShareableCard(analysis.id);
      this.githubService.shareOnSocial(platform, shareCard.socialShareUrls[platform]);
      this.success.set(`Shared on ${platform}! 🚀`);
    } catch (error: any) {
      this.error.set(error.message);
    }
  }

  async copyShareLink(analysis: GitHubAnalysisResponse): Promise<void> {
    try {
      const shareCard = await this.githubService.getShareableCard(analysis.id);
      const success = await this.githubService.copyToClipboard(shareCard.shareableCardUrl);
      
      if (success) {
        this.success.set('Share link copied to clipboard! 📋');
      } else {
        this.error.set('Failed to copy link to clipboard');
      }
    } catch (error: any) {
      this.error.set(error.message);
    }
  }

  // Utility Methods
  getScoreColor(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPersonalityEmoji(personalityType: string): string {
    // Extract emoji-like patterns or return default
    if (personalityType.includes('Chaotic')) return '🌪️';
    if (personalityType.includes('Creative')) return '🎨';
    if (personalityType.includes('Methodical')) return '🔧';
    if (personalityType.includes('Perfectionist')) return '💎';
    if (personalityType.includes('Pragmatic')) return '⚡';
    return '🚀';
  }

  // Fix for the template arrow function issue
  getCelebrityInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(part => part[0]).join('');
  }
}