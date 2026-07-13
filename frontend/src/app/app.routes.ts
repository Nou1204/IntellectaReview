import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'researcher/papers',
    canActivate: [roleGuard(['RESEARCHER'])],
    loadComponent: () =>
      import('./features/researcher/researcher-papers.component').then(m => m.ResearcherPapersComponent)
  },
  {
    path: 'researcher/papers/:id',
    canActivate: [roleGuard(['RESEARCHER'])],
    loadComponent: () =>
      import('./features/papers/paper-review.component').then(m => m.PaperReviewComponent)
  },
  {
    path: 'researcher/upload',
    canActivate: [roleGuard(['RESEARCHER'])],
    loadComponent: () =>
      import('./features/papers/upload-paper.component').then(m => m.UploadPaperComponent)
  },
  {
    path: 'researcher/profile',
    canActivate: [roleGuard(['RESEARCHER'])],
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'reviewer/assignments',
    canActivate: [roleGuard(['CHECKER'])],
    loadComponent: () =>
      import('./features/reviewer/my-reviews/my-reviews.component').then(m => m.MyReviewsComponent)
  },
  {
    path: 'reviewer/history',
    canActivate: [roleGuard(['CHECKER'])],
    loadComponent: () =>
      import('./features/reviewer/papers/reviewer-papers.component').then(m => m.ReviewerPapersComponent)
  },
  {
    path: 'reviewer/profile',
    canActivate: [roleGuard(['CHECKER'])],
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  { path: 'reviewer/my-reviews', redirectTo: '/reviewer/assignments', pathMatch: 'full' },
  { path: 'reviewer/papers', redirectTo: '/reviewer/history', pathMatch: 'full' },
  { path: 'checker/dashboard', redirectTo: '/reviewer/assignments', pathMatch: 'full' },
  { path: 'checker/reviews', redirectTo: '/reviewer/assignments', pathMatch: 'full' },
  { path: 'checker/profile', redirectTo: '/reviewer/profile', pathMatch: 'full' },
  {
    path: 'admin/dashboard',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'admin/papers',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/admin-papers.component').then(m => m.AdminPapersComponent)
  },
  {
    path: 'admin/reviews',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/reviews/admin-reviews.component').then(m => m.AdminReviewsComponent)
  },
  {
    path: 'admin/users',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/admin-panel.component').then(m => m.AdminPanelComponent)
  },
  {
    path: 'admin/profile',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'reviewer/papers/:id/review',
    canActivate: [roleGuard(['CHECKER'])],
    loadComponent: () =>
      import('./features/reviewer/review-form/review-form.component').then(m => m.ReviewFormComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { path: '**', redirectTo: '/auth/login' }
];