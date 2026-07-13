import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/services/auth';
import { NotificationItem, NotificationService } from './core/services/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private notificationTimer: number | null = null;

  readonly auth = this.authService;
  readonly mobileNavOpen = signal(false);
  readonly collapsedSidebar = signal(false);
  readonly currentPath = signal('');
  readonly notificationPanelOpen = signal(false);
  readonly notifications = signal<NotificationItem[]>([]);
  readonly unreadCount = signal(0);

  readonly isAuthRoute = computed(() => {
    const path = this.currentPath();
    return path.startsWith('/auth/login') || path.startsWith('/auth/register');
  });

  readonly breadcrumb = computed(() => {
    const path = this.currentPath().split('?')[0];
    const map: Record<string, string> = {
      '/researcher/papers': 'Researcher / My Papers',
      '/researcher/upload': 'Researcher / Upload',
      '/researcher/profile': 'Researcher / Profile',
      '/reviewer/assignments': 'Reviewer / Assignments',
      '/reviewer/history': 'Reviewer / Reviewed History',
      '/reviewer/profile': 'Reviewer / Profile',
      '/checker/dashboard': 'Reviewer / Assignments',
      '/checker/reviews': 'Reviewer / Assignments',
      '/checker/profile': 'Reviewer / Profile',
      '/admin/dashboard': 'Admin / Dashboard',
      '/admin/profile': 'Admin / Profile',
      '/admin/users': 'Admin / User Management',
      '/admin/papers': 'Admin / Paper Submissions',
      '/admin/reviews': 'Admin / Reviews & Assignments'
    };

    if (path.startsWith('/researcher/papers/')) {
      return 'Researcher / Paper Detail';
    }
    if (path.startsWith('/reviewer/assignments')) {
      return 'Reviewer / Assignments';
    }
    if (path.startsWith('/reviewer/history')) {
      return 'Reviewer / Reviewed History';
    }
    if (path.startsWith('/reviewer/papers/') && path.endsWith('/review')) {
      return 'Reviews / Review Form';
    }
    return map[path] ?? 'IntellectaReview';
  });

  constructor() {
    this.currentPath.set(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentPath.set(event.urlAfterRedirects);
        this.mobileNavOpen.set(false);

        if (this.auth.isLoggedIn() && this.notificationTimer === null) {
          this.refreshNotifications();
          this.notificationTimer = window.setInterval(() => this.refreshNotifications(), 30000);
        }

        if (!this.auth.isLoggedIn() && this.notificationTimer !== null) {
          window.clearInterval(this.notificationTimer);
          this.notificationTimer = null;
          this.notifications.set([]);
          this.unreadCount.set(0);
        }
      });

    if (this.auth.isLoggedIn()) {
      this.refreshNotifications();
      this.notificationTimer = window.setInterval(() => this.refreshNotifications(), 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.notificationTimer !== null) {
      window.clearInterval(this.notificationTimer);
      this.notificationTimer = null;
    }
  }

  userInitials(): string {
    const name = this.auth.currentUser()?.name ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'IR';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  toggleSidebarCollapse(): void {
    this.collapsedSidebar.set(!this.collapsedSidebar());
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.set(!this.mobileNavOpen());
  }

  toggleNotificationPanel(): void {
    this.notificationPanelOpen.set(!this.notificationPanelOpen());
    if (this.notificationPanelOpen()) {
      this.refreshNotifications();
    }
  }

  markNotificationRead(id: number): void {
    this.notificationService.markRead(id).subscribe({
      next: () => this.refreshNotifications(),
      error: () => {}
    });
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => this.refreshNotifications(),
      error: () => {}
    });
  }

  private refreshNotifications(): void {
    if (!this.auth.isLoggedIn()) {
      this.notifications.set([]);
      this.unreadCount.set(0);
      return;
    }

    this.notificationService.list().subscribe({
      next: payload => {
        this.notifications.set(payload.items || []);
        this.unreadCount.set(payload.unreadCount || 0);
      },
      error: () => {
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }
}