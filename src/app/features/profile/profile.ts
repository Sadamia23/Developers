// components/profile.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth';
import { TechnologyStack, ExperienceLevel, ZodiacSign } from '../../types/enums/enums';
import { UserProfileDto } from '../../types/dtos/dtos';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private router = inject(Router);
  authService = inject(AuthService);

  ngOnInit() {
    // Ensure user profile is loaded
    if (!this.authService.currentUser()) {
      this.authService.getProfile();
    }
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

  getPersonalAdvice(zodiacSign: ZodiacSign): string {
    const zodiacAdvice: Record<ZodiacSign, string> = {
      [ZodiacSign.Aries]: 'Your bold nature makes you a natural leader in coding projects!',
      [ZodiacSign.Taurus]: 'Your patience and persistence are perfect for debugging complex issues!',
      [ZodiacSign.Gemini]: 'Your adaptability makes you excellent at learning new programming languages!',
      [ZodiacSign.Cancer]: 'Your intuitive nature helps you write user-friendly and empathetic code!',
      [ZodiacSign.Leo]: 'Your confidence and creativity shine through in your elegant code architecture!',
      [ZodiacSign.Virgo]: 'Your attention to detail makes you the master of clean, well-documented code!',
      [ZodiacSign.Libra]: 'Your sense of balance helps you create harmonious and well-structured applications!',
      [ZodiacSign.Scorpio]: 'Your intensity and focus make you unstoppable when solving complex algorithms!',
      [ZodiacSign.Sagittarius]: 'Your adventurous spirit drives you to explore cutting-edge technologies!',
      [ZodiacSign.Capricorn]: 'Your disciplined approach ensures you build robust and scalable systems!',
      [ZodiacSign.Aquarius]: 'Your innovative thinking leads you to create revolutionary tech solutions!',
      [ZodiacSign.Pisces]: 'Your imaginative nature helps you build creative and inspiring applications!'
    };
    return zodiacAdvice[zodiacSign] || 'The stars align for your coding journey!';
  }

  formatDate(dateString: Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}