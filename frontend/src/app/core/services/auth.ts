import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, UserResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private _currentUser = signal<UserResponse | null>(this.loadUser());
  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => !!this._currentUser());
  isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
  isChecker = computed(() => this._currentUser()?.role === 'CHECKER');

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this._currentUser.set(response.user);
      })
    );
  }

  register(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.apiUrl}/auth/register`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, request);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setCurrentUser(user: UserResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  hasAnyRole(roles: string[]): boolean {
    const role = this._currentUser()?.role;
    return !!role && roles.includes(role);
  }

  homeRouteForCurrentUser(): string {
    const role = this._currentUser()?.role;
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'CHECKER') return '/reviewer/assignments';
    if (role === 'RESEARCHER') return '/researcher/papers';
    return '/auth/login';
  }

  private loadUser(): UserResponse | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}