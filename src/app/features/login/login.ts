import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { LoginDto } from '../../types/dtos/dtos';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  async ngOnInit() {
    await this.authService.waitForAuthInit();
    
    if (this.authService.isAuthenticated()) {
      console.log('User already authenticated, redirecting to profile...');
      await this.router.navigate(['/profile']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit() {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      try {
        const formValue = this.loginForm.value;
        const loginDto: LoginDto = {
          username: formValue.username.trim()
        };

        console.log('Attempting login with:', loginDto);
        const result = await this.authService.login(loginDto);
        
        if (result.success) {
          console.log('Login successful, redirecting to profile...');
          // Redirect to profile page on successful login
          await this.router.navigate(['/profile']);
        } else {
          this.errorMessage.set(result.message || 'Login failed');
        }
      } catch (error) {
        this.errorMessage.set('An unexpected error occurred. Please try again.');
        console.error('Login error:', error);
      } finally {
        this.isLoading.set(false);
      }
    }
  }
}