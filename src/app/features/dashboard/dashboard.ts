import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth';
import { TechnologyStack, ExperienceLevel, ZodiacSign } from '../../types/enums/enums';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);

  ngOnInit() {
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
}