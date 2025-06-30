import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ExperienceLevel, TechnologyStack } from '../../types/enums/enums';
import { RegisterDto } from '../../types/dtos/dtos';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css'
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  registrationForm: FormGroup;

  techStacks = [
    { value: TechnologyStack.React, label: 'React' },
    { value: TechnologyStack.Angular, label: 'Angular' },
    { value: TechnologyStack.Vue, label: 'Vue.js' },
    { value: TechnologyStack.DotNet, label: '.NET' },
    { value: TechnologyStack.Python, label: 'Python' },
    { value: TechnologyStack.Java, label: 'Java' },
    { value: TechnologyStack.JavaScript, label: 'JavaScript' },
    { value: TechnologyStack.TypeScript, label: 'TypeScript' },
    { value: TechnologyStack.PHP, label: 'PHP' },
    { value: TechnologyStack.Ruby, label: 'Ruby' },
    { value: TechnologyStack.Go, label: 'Go' },
    { value: TechnologyStack.Rust, label: 'Rust' },
    { value: TechnologyStack.Swift, label: 'Swift' },
    { value: TechnologyStack.Kotlin, label: 'Kotlin' }
  ];

  experienceLevels = [
    { 
      value: ExperienceLevel.Junior, 
      label: 'Junior Developer',
      description: '0-2 years of experience'
    },
    { 
      value: ExperienceLevel.Middle, 
      label: 'Middle Developer',
      description: '2-5 years of experience'
    },
    { 
      value: ExperienceLevel.Senior, 
      label: 'Senior Developer',
      description: '5+ years of experience'
    }
  ];

  constructor() {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(50)]],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      dateOfBirth: ['', [Validators.required, this.ageValidator]],
      techStack: ['', Validators.required],
      experience: ['', Validators.required]
    });
  }

  ageValidator(control: any) {
    if (!control.value) return null;
    
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 16 ? null : { ageValidator: true };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit() {
    if (this.registrationForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      try {
        const formValue = this.registrationForm.value;
        const registerDto: RegisterDto = {
          username: formValue.username,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          dateOfBirth: new Date(formValue.dateOfBirth),
          techStack: parseInt(formValue.techStack),
          experience: parseInt(formValue.experience)
        };

        const result = await this.authService.register(registerDto);
        
        if (result.success) {
          await this.router.navigate(['/profile']);
        } else {
          this.errorMessage.set(result.message || 'Registration failed');
        }
      } catch (error) {
        this.errorMessage.set('An unexpected error occurred. Please try again.');
        console.error('Registration error:', error);
      } finally {
        this.isLoading.set(false);
      }
    }
  }
}