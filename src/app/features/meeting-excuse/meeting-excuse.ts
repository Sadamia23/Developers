import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { MeetingExcuseService } from '../../services/meeting-excuse';
import { AIExcuseResponse, AIExcuseRequest } from '../../types/enums/meeting-excuse-enums';

@Component({
  selector: 'app-meeting-excuse',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './meeting-excuse.html',
  styleUrl: './meeting-excuse.css'
})
export class MeetingExcuseComponent {
  meetingExcuseService = inject(MeetingExcuseService);
  fb = inject(FormBuilder);
  
  // Signals
  currentExcuse = signal<AIExcuseResponse | null>(null);
  bulkExcuses = signal<AIExcuseResponse[]>([]);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Form
  excuseForm: FormGroup;
  believabilityScores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor() {
    this.excuseForm = this.fb.group({
      category: [1], // Default to DailyStandup
      type: [1], // Default to Technical
      believability: [7],
      mood: ['funny'],
      techStack: ['Full Stack Developer'],
      experience: ['Mid-level'],
      context: ['']
    });
  }



async generateSingle() {
  try {
    const request = this.buildRequest();
    console.log('Sending request:', request); // Debug log
    
    const excuse = await this.meetingExcuseService.generateAIExcuse(request);
    this.currentExcuse.set(excuse);
    this.bulkExcuses.set([]); // Clear bulk results
    this.setSuccess('New AI excuse generated! 🎉');
    this.scrollToExcuse();
  } catch (error: any) {
    console.error('Generate single error:', error); // Debug log
    this.setError(error.message || 'Failed to generate excuse');
  }
}
async generateBulk() {
  try {
    const request = this.buildRequest();
    console.log('Sending bulk request:', request); // Debug log
    
    const excuses = await this.meetingExcuseService.generateBulkAIExcuses(request, 3);
    this.bulkExcuses.set(excuses);
    this.currentExcuse.set(null); // Clear single result
    this.setSuccess('3 AI excuses generated! 🎉');
    this.scrollToBulk();
  } catch (error: any) {
    console.error('Generate bulk error:', error); // Debug log
    this.setError(error.message || 'Failed to generate bulk excuses');
  }
}

  selectExcuse(excuse: AIExcuseResponse) {
    this.currentExcuse.set(excuse);
    this.scrollToExcuse();
  }

  buildRequest(): AIExcuseRequest {
  const form = this.excuseForm.value;
  
  // Ensure we're sending numbers for the enums
  const request: AIExcuseRequest = {
    category: Number(form.category) || 1,
    type: Number(form.type) || 1,
    targetBelievability: Number(form.believability) || 7,
    mood: form.mood || 'funny',
    userTechStack: form.techStack || 'Full Stack Developer',
    userExperience: form.experience || 'Mid-level',
    context: form.context || ''
  };

  console.log('Built request:', request); // Debug log
  return request;
}

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.setSuccess('Copied to clipboard! 📋');
    } catch (error) {
      this.setError('Failed to copy to clipboard');
    }
  }

  getCategoryLabel(value: number): string {
    const labels: { [key: number]: string } = {
      1: '🌅 Daily Standup',
      2: '📋 Sprint Planning',
      3: '👔 Client Meeting',
      4: '🤝 Team Building',
      5: '🔍 Code Review',
      6: '🔄 Retrospective',
      7: '📝 Planning',
      8: '👥 One-on-One',
      9: '👐 All Hands',
      10: '📚 Training'
    };
    return labels[value] || 'Unknown Category';
  }

  getTypeLabel(value: number): string {
    const labels: { [key: number]: string } = {
      1: '💻 Technical Issues',
      2: '👤 Personal Matters',
      3: '🎨 Creative Block',
      4: '🏥 Health Related',
      5: '🚨 Emergency',
      6: '❓ Mysterious'
    };
    return labels[value] || 'Unknown Type';
  }

  private scrollToExcuse() {
    setTimeout(() => {
      document.querySelector('.excuse-display')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  private scrollToBulk() {
    setTimeout(() => {
      document.querySelector('.bulk-excuses')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
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
}