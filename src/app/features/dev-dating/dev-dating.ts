import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { DevDatingService } from '../../services/dev-dating';
import { PotentialMatchDto, Match, ChatMessageDto, SwipeResponse, DatingSetupRequest, SwipeRequest, SendMessageRequest } from '../../types/dtos/dev-dating-dtos';
import { Gender } from '../../types/enums/dev-dating-enums';
import { NavbarComponent } from "../navbar/navbar";

@Component({
  selector: 'app-dev-dating',
  imports: [NavbarComponent],
  templateUrl: './dev-dating.html',
  styleUrl: './dev-dating.css'
})
export class DevDatingComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  datingService = inject(DevDatingService);
  router = inject(Router);

  // Reactive state
  isLoading = signal<boolean>(false);
  hasProfile = signal<boolean>(false);
  potentialMatches = signal<PotentialMatchDto[]>([]);
  currentMatch = signal<PotentialMatchDto | null>(null);
  currentMatchIndex = signal<number>(0);
  matches = signal<Match[]>([]);
  activeChat = signal<ChatMessageDto[]>([]);
  activeChatMatch = signal<Match | null>(null);

  // UI state
  activeTab = signal<'setup' | 'swipe' | 'matches' | 'chat'>('setup');
  
  // Setup form state
  selectedGender = signal<Gender>(Gender.Male);
  selectedPreference = signal<Gender>(Gender.Female);
  userBio = signal<string>('');

  // Chat state
  newMessage = signal<string>('');
  
  // Swipe state
  swipeResult = signal<SwipeResponse | null>(null);
  showSwipeResult = signal<boolean>(false);

  // Error handling
  errorMessage = signal<string | null>(null);
  retryAttempts = signal<number>(0);
  maxRetries = 3;

  // Enums for template access
  Gender = Gender;

  async ngOnInit() {
    console.log('💑 Dev Dating Component: Initializing...');
    await this.initializeWithRetry();
  }

  ngOnDestroy() {
    this.datingService.clearAll();
  }

  private async initializeWithRetry() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      this.retryAttempts.set(attempt);
      console.log(`💑 Dev Dating initialization attempt ${attempt}/${this.maxRetries}`);
      
      try {
        await this.performInitialization();
        console.log('✅ Dev Dating initialization successful');
        return;
      } catch (error: any) {
        console.error(`❌ Dev Dating initialization attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          this.errorMessage.set(`Failed to initialize Dev Dating after ${this.maxRetries} attempts. ${error.message}`);
          return;
        }
        
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async performInitialization() {
    console.log('💑 Starting Dev Dating initialization...');
    
    await this.authService.waitForAuthInit();
    
    if (!this.authService.isAuthenticated()) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    console.log('💑 User is authenticated:', this.authService.currentUser());
    
    await this.initializeDevDating();
    
    console.log('✅ Dev Dating initialization completed successfully');
  }

  async initializeDevDating() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      console.log('💑 Initializing Dev Dating...');
      
      // Check if user has a dating profile
      const profileStatus = await this.datingService.checkProfileStatus();
      this.hasProfile.set(profileStatus.hasProfile);
      
      if (profileStatus.hasProfile) {
        this.activeTab.set('swipe');
        await this.loadPotentialMatches();
      } else {
        this.activeTab.set('setup');
      }
      
      console.log('✅ Dev Dating initialized, hasProfile:', profileStatus.hasProfile);
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Dev Dating:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async setupProfile() {
    const bio = this.userBio().trim();
    
    if (!bio || bio.length < 10) {
      this.errorMessage.set('Please enter a bio with at least 10 characters.');
      return;
    }

    if (bio.length > 500) {
      this.errorMessage.set('Bio must be less than 500 characters.');
      return;
    }

    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const setupRequest: DatingSetupRequest = {
        gender: this.selectedGender(),
        preference: this.selectedPreference(),
        bio: bio
      };

      await this.datingService.setupDatingProfile(setupRequest);
      this.hasProfile.set(true);
      this.activeTab.set('swipe');
      
      // Load potential matches after setup
      await this.loadPotentialMatches();
      
    } catch (error: any) {
      console.error('Failed to setup profile:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPotentialMatches() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const matches = await this.datingService.getPotentialMatches();
      this.potentialMatches.set(matches);
      
      if (matches.length > 0) {
        this.currentMatch.set(matches[0]);
        this.currentMatchIndex.set(0);
      } else {
        this.currentMatch.set(null);
        this.currentMatchIndex.set(0);
      }
      
    } catch (error: any) {
      console.error('Failed to load potential matches:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async swipe(isLike: boolean) {
    const currentMatch = this.currentMatch();
    if (!currentMatch) {
      this.errorMessage.set('No match available to swipe on.');
      return;
    }

    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.showSwipeResult.set(false);

      const swipeRequest: SwipeRequest = {
        targetUserId: currentMatch.userId,
        isLike: isLike
      };

      const result = await this.datingService.processSwipe(swipeRequest);
      this.swipeResult.set(result);
      this.showSwipeResult.set(true);
      
      // Move to next match
      this.moveToNextMatch();
      
      // Hide result after 3 seconds
      setTimeout(() => {
        this.showSwipeResult.set(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to process swipe:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  private moveToNextMatch() {
    const matches = this.potentialMatches();
    const currentIndex = this.currentMatchIndex();
    
    if (currentIndex + 1 < matches.length) {
      this.currentMatchIndex.set(currentIndex + 1);
      this.currentMatch.set(matches[currentIndex + 1]);
    } else {
      // No more matches, reload
      this.currentMatch.set(null);
      this.loadPotentialMatches();
    }
  }

async loadMatches() {
  try {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const matches = await this.datingService.getUserMatches();
    this.matches.set(matches);
    this.activeTab.set('matches');
    
  } catch (error: any) {
    console.error('Failed to load matches:', error);
    this.errorMessage.set(error.message);
  } finally {
    this.isLoading.set(false);
  }
}

  async openChat(match: Match) {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      this.activeChatMatch.set(match);
      const chatHistory = await this.datingService.getChatHistory(match.id);
      this.activeChat.set(chatHistory);
      this.activeTab.set('chat');
      
    } catch (error: any) {
      console.error('Failed to open chat:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendMessage() {
    const message = this.newMessage().trim();
    const chatMatch = this.activeChatMatch();
    
    if (!message) {
      this.errorMessage.set('Please enter a message.');
      return;
    }

    if (!chatMatch) {
      this.errorMessage.set('No active chat selected.');
      return;
    }

    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const messageRequest: SendMessageRequest = {
        message: message
      };

      await this.datingService.sendMessage(chatMatch.id, messageRequest);
      this.newMessage.set('');
      
      // Update active chat from service state
      this.activeChat.set(this.datingService.activeChat());
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Manual retry function
  async retryInitialization() {
    this.errorMessage.set(null);
    this.retryAttempts.set(0);
    await this.initializeWithRetry();
  }

  // UI Helper Methods
  setActiveTab(tab: 'setup' | 'swipe' | 'matches' | 'chat') {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    
    // Load data for specific tabs
    if (tab === 'swipe' && this.potentialMatches().length === 0) {
      this.loadPotentialMatches();
    } else if (tab === 'matches') {
      this.loadMatches();
    } else if (tab === 'chat') {
      // Chat is opened via openChat method
    }
  }

  setGender(gender: Gender) {
    this.selectedGender.set(gender);
  }

  setPreference(preference: Gender) {
    this.selectedPreference.set(preference);
  }

  clearError() {
    this.errorMessage.set(null);
  }

  // Utility methods
  getGenderName(gender: Gender): string {
    switch (gender) {
      case Gender.Male: return 'Male';
      case Gender.Female: return 'Female';
      case Gender.NonBinary: return 'Non-Binary';
      case Gender.Other: return 'Other';
      default: return 'Unknown';
    }
  }

  getGenderEmoji(gender: Gender): string {
    switch (gender) {
      case Gender.Male: return '👨';
      case Gender.Female: return '👩';
      case Gender.NonBinary: return '🧑';
      case Gender.Other: return '👤';
      default: return '👤';
    }
  }

  getTechStackEmoji(techStack: string): string {
    const techEmojis: Record<string, string> = {
      'JavaScript': '🟨',
      'Python': '🐍',
      'CSharp': '🔷',
      'Java': '☕',
      'TypeScript': '🔷',
      'React': '⚛️',
      'Angular': '🅰️',
      'Vue': '💚'
    };
    return techEmojis[techStack] || '💻';
  }

  getExperienceEmoji(experience: string): string {
    const expEmojis: Record<string, string> = {
      'Junior': '🌱',
      'Middle': '🚀',
      'Senior': '👑',
      'Lead': '⭐'
    };
    return expEmojis[experience] || '💼';
  }

  getZodiacEmoji(zodiacSign: string): string {
    const zodiacEmojis: Record<string, string> = {
      'Aries': '♈',
      'Taurus': '♉',
      'Gemini': '♊',
      'Cancer': '♋',
      'Leo': '♌',
      'Virgo': '♍',
      'Libra': '♎',
      'Scorpio': '♏',
      'Sagittarius': '♐',
      'Capricorn': '♑',
      'Aquarius': '♒',
      'Pisces': '♓'
    };
    return zodiacEmojis[zodiacSign] || '⭐';
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

  isOwnMessage(message: ChatMessageDto): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === message.senderId;
  }
}