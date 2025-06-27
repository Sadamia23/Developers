// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { RegistrationComponent } from './features/registration/registration';
import { authGuard, guestGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/profile',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Login - DevLife'
  },
  {
    path: 'register',
    component: RegistrationComponent,
    canActivate: [guestGuard],
    title: 'Register - DevLife'
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'Profile - DevLife'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Dashboard - DevLife'
  },
  {
    path: 'code-casino',
    loadComponent: () => import('./features/code-casino/code-casino').then(m => m.CodeCasinoComponent),
    canActivate: [authGuard],
    title: 'Code Casino 🎰 - DevLife'
  },
  {
    path: 'code-roast',
    loadComponent: () => import('./features/code-roast/code-roast').then(m => m.CodeRoastComponent),
    canActivate: [authGuard],
    title: 'Code Roast 🔥 - DevLife'
  },
  {
    path: 'bug-chase',
    loadComponent: () => import('./features/bug-chase/bug-chase').then(m => m.BugChaseComponent),
    canActivate: [authGuard],
    title: 'Bug Chase Game 🏃 - DevLife'
  },
  {
    path: 'code-analyzer',
    // loadComponent: () => import('./components/code-analyzer.component').then(m => m.CodeAnalyzerComponent),
    loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'Code Analyzer 🔍 - DevLife'
  },
  {
    path: 'dev-dating',
    // loadComponent: () => import('./components/dev-dating.component').then(m => m.DevDatingComponent),
    loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'Dev Dating Room 💑 - DevLife'
  },
  {
    path: 'escape-meeting',
    loadComponent: () => import('./features/meeting-excuse/meeting-excuse').then(m => m.MeetingExcuseComponent),
    canActivate: [authGuard],
    title: 'Escape Meeting 🏃‍♂️ - DevLife'
  },
  {
    path: '**',
    redirectTo: '/profile'
  }
];