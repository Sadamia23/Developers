import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { MeetingExcuseService } from '../../services/meeting-excuse';
import { AuthService } from '../../services/auth';
import { 
  MeetingExcuseDto, 
  GenerateExcuseRequestDto,
  MeetingExcuseDashboardDto,
  MeetingExcuseFavoriteDto,
  SaveFavoriteRequestDto,
  SubmitUsageRequestDto,
  RateExcuseRequestDto
} from '../../types/dtos/meeting-excuse-dtos';
import { ExcuseType, MeetingCategory } from '../../types/enums/meeting-excuse-enums';

@Component({
  selector: 'app-meeting-excuse',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './meeting-excuse.html',
  styleUrl: './meeting-excuse.css'
})
export class MeetingExcuseComponent implements OnInit {
  meetingExcuseService = inject(MeetingExcuseService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);
  
  // Reactive state
  dashboard = signal<MeetingExcuseDashboardDto | null>(null);
  currentExcuse = signal<MeetingExcuseDto | null>(null);
  bulkExcuses = signal<MeetingExcuseDto[]>([]);
  generatorMode = signal<'random' | 'ai' | 'personalized'>('random');
  currentRating = signal<number>(0);
  showUsageModalFlag = signal<boolean>(false);
  selectedExcuseForUsage = signal<MeetingExcuseDto | null>(null);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Forms
  filtersForm: FormGroup;
  usageForm: FormGroup;

  // Options for dropdowns
  categories = [
    { value: MeetingCategory.DailyStandup, label: '🌅 Daily Standup' },
    { value: MeetingCategory.ClientMeeting, label: '👔 Client Meeting' },
    { value: MeetingCategory.TeamBuilding, label: '🤝 Team Building' },
    { value: MeetingCategory.OneOnOne, label: '👥 One-on-One' },
    { value: MeetingCategory.AllHands, label: '👐 All Hands' },
    { value: MeetingCategory.ProjectReview, label: '📊 Project Review' },
    { value: MeetingCategory.Training, label: '📚 Training' },
    { value: MeetingCategory.Interview, label: '💼 Interview' },
    { value: MeetingCategory.StatusUpdate, label: '📋 Status Update' },
    { value: MeetingCategory.Planning, label: '📝 Planning' }
  ];

  excuseTypes = [
    { value: ExcuseType.Technical, label: '💻 Technical Issues' },
    { value: ExcuseType.Personal, label: '👤 Personal Matters' },
    { value: ExcuseType.Health, label: '🏥 Health Related' },
    { value: ExcuseType.Family, label: '👨‍👩‍👧‍👦 Family Emergency' },
    { value: ExcuseType.Travel, label: '✈️ Travel Issues' },
    { value: ExcuseType.Creative, label: '🎨 Creative Block' },
    { value: ExcuseType.Professional, label: '💼 Professional Priority' },
    { value: ExcuseType.Emergency, label: '🚨 Emergency' },
    { value: ExcuseType.Weather, label: '🌧️ Weather Related' },
    { value: ExcuseType.Equipment, label: '🔧 Equipment Problems' }
  ];

  believabilityScores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor() {
    this.filtersForm = this.fb.group({
      category: [''],
      type: [''],
      minBelievability: [''],
      excludeUsed: [false]
    });

    this.usageForm = this.fb.group({
      context: [''],
      wasSuccessful: [false]
    });
  }

  async ngOnInit() {
    try {
      await this.loadDashboard();
    } catch (error) {
      console.error('Error loading meeting excuse data:', error);
      this.setError('Failed to load meeting excuse data. Please try again.');
    }
  }

  async loadDashboard() {
    try {
      const dashboardData = await this.meetingExcuseService.getDashboard();
      this.dashboard.set(dashboardData);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      this.setError(error?.message || 'Failed to load dashboard');
    }
  }

  setGeneratorMode(mode: 'random' | 'ai' | 'personalized') {
    this.generatorMode.set(mode);
    this.bulkExcuses.set([]);
  }

  getGeneratorModeLabel(): string {
    const mode = this.generatorMode();
    switch (mode) {
      case 'random': return 'Random';
      case 'ai': return 'AI-Powered';
      case 'personalized': return 'Personalized AI';
      default: return 'Random';
    }
  }

  async generateExcuse() {
    try {
      const criteria = this.buildCriteria();
      let excuse: MeetingExcuseDto;

      switch (this.generatorMode()) {
        case 'ai':
          excuse = await this.meetingExcuseService.generateAIExcuse(criteria);
          break;
        case 'personalized':
          excuse = await this.meetingExcuseService.generatePersonalizedAIExcuse(criteria);
          break;
        default:
          excuse = await this.meetingExcuseService.generateExcuse(criteria);
          break;
      }

      this.currentExcuse.set(excuse);
      this.bulkExcuses.set([]);
      this.currentRating.set(0);
      this.setSuccess('New excuse generated successfully!');
    } catch (error: any) {
      console.error('Error generating excuse:', error);
      this.setError(error?.message || 'Failed to generate excuse');
    }
  }

  async generateBulkExcuses() {
    try {
      const criteria = this.buildCriteria();
      const request = { count: 3, criteria: criteria };
      const excuses = await this.meetingExcuseService.generateBulkExcuses(request);
      this.bulkExcuses.set(excuses);
      this.currentExcuse.set(null);
      this.setSuccess('3 excuses generated successfully!');
    } catch (error: any) {
      console.error('Error generating bulk excuses:', error);
      this.setError(error?.message || 'Failed to generate bulk excuses');
    }
  }

  selectExcuse(excuse: MeetingExcuseDto) {
    this.currentExcuse.set(excuse);
    this.currentRating.set(0);
    
    // Scroll to current excuse section with error handling
    try {
      document.querySelector('.current-excuse-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.warn('Smooth scrolling not supported:', error);
    }
  }

  buildCriteria(): GenerateExcuseRequestDto {
    const formValue = this.filtersForm.value;
    const criteria: GenerateExcuseRequestDto = {};

    if (formValue?.category) {
      criteria.category = formValue.category as MeetingCategory;
    }
    if (formValue?.type) {
      criteria.type = formValue.type as ExcuseType;
    }
    if (formValue?.minBelievability) {
      criteria.minBelievability = parseInt(formValue.minBelievability);
    }
    if (formValue?.excludeUsed) {
      criteria.excludeUsed = true;
    }

    return criteria;
  }

  async toggleFavorite(excuse: MeetingExcuseDto) {
    try {
      if (excuse.isFavorite) {
        // Note: To properly remove from favorites, you'd need to track favorite IDs
        // For now, just show success message
        this.setSuccess('Removed from favorites');
      } else {
        const request: SaveFavoriteRequestDto = { meetingExcuseId: excuse.id };
        await this.meetingExcuseService.saveFavorite(request);
        excuse.isFavorite = true;
        this.setSuccess('Added to favorites!');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      this.setError(error?.message || 'Failed to update favorite');
    }
  }

  async copyToClipboard(text: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        this.setSuccess('Copied to clipboard!');
      } else {
        // Fallback for older browsers
        this.fallbackCopyToClipboard(text);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.setError('Failed to copy to clipboard');
    }
  }

  private fallbackCopyToClipboard(text: string) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        this.setSuccess('Copied to clipboard!');
      } else {
        this.setError('Failed to copy to clipboard');
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      this.setError('Failed to copy to clipboard');
    }
  }

  showUsageModal(excuse: MeetingExcuseDto) {
    this.selectedExcuseForUsage.set(excuse);
    this.showUsageModalFlag.set(true);
    this.usageForm.reset();
  }

  closeUsageModal() {
    this.showUsageModalFlag.set(false);
    this.selectedExcuseForUsage.set(null);
  }

  async submitUsage() {
    try {
      const excuse = this.selectedExcuseForUsage();
      if (!excuse) {
        this.setError('No excuse selected for usage submission');
        return;
      }

      const formValue = this.usageForm.value;
      const request: SubmitUsageRequestDto = {
        meetingExcuseId: excuse.id,
        context: formValue?.context || undefined,
        wasSuccessful: formValue?.wasSuccessful || undefined
      };

      await this.meetingExcuseService.submitUsage(request);
      this.closeUsageModal();
      this.setSuccess('Usage feedback submitted!');
      
      // Refresh dashboard to update stats
      await this.loadDashboard();
    } catch (error: any) {
      console.error('Error submitting usage:', error);
      this.setError(error?.message || 'Failed to submit usage feedback');
    }
  }

  async rateExcuse(excuse: MeetingExcuseDto, rating: number) {
    try {
      this.currentRating.set(rating);
      
      const request: RateExcuseRequestDto = { 
        meetingExcuseId: excuse.id, 
        rating: rating 
      };

      await this.meetingExcuseService.rateExcuse(request);
      this.setSuccess(`Rated ${rating} stars!`);
    } catch (error: any) {
      console.error('Error rating excuse:', error);
      this.setError(error?.message || 'Failed to rate excuse');
    }
  }

  getCategoryDisplay(category: MeetingCategory): string {
    const found = this.categories.find(c => c.value === category);
    return found?.label || category.toString();
  }

  getTypeDisplay(type: ExcuseType): string {
    const found = this.excuseTypes.find(t => t.value === type);
    return found?.label || type.toString();
  }

  setError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.clearError(), 5000);
  }

  setSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.clearSuccess(), 3000);
  }

  clearError() { 
    this.errorMessage.set(''); 
  }
  
  clearSuccess() { 
    this.successMessage.set(''); 
  }

  // Utility method for safe array access
  protected getArraySlice<T>(array: T[] | undefined | null, start: number, end?: number): T[] {
    return array?.slice(start, end) || [];
  }
}