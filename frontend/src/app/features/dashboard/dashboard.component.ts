import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth';
import { PaperService } from '../../core/services/paper';
import { PaperResponse } from '../../core/models/paper.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule, MatTableModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private paperService = inject(PaperService);
  readonly loading = signal(false);
  readonly papers = signal<PaperResponse[]>([]);
  readonly checkerAssignments = signal<PaperResponse[]>([]);
  readonly displayedColumns = ['title', 'authors', 'date', 'status'];
  readonly checkerColumns = ['title', 'assignedDate', 'status', 'actions'];

  ngOnInit(): void {
    if (this.auth.isChecker()) {
      this.loadCheckerDashboard();
      return;
    }

    this.loadGeneralDashboard();
  }

  private loadGeneralDashboard(): void {
    this.loading.set(true);
    const request$ = this.auth.isAdmin()
      ? this.paperService.listAllPapers()
      : this.paperService.listMyPapers();

    request$.subscribe({
      next: (data) => {
        this.papers.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.papers.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadCheckerDashboard(): void {
    this.loading.set(true);
    this.paperService.listAssignedReviewerPapers().subscribe({
      next: (data) => {
        this.checkerAssignments.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.checkerAssignments.set([]);
        this.loading.set(false);
      }
    });
  }

  statCount(status?: PaperResponse['status']): number {
    if (!status) {
      return this.papers().length;
    }
    return this.papers().filter(paper => paper.status === status).length;
  }

  recentPapers(): PaperResponse[] {
    return [...this.papers()]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 7);
  }

  recentAssignments(): PaperResponse[] {
    return [...this.checkerAssignments()]
      .filter(p => ['INVITED', 'PENDING', 'IN_REVIEW', 'SUBMITTED', 'ACCEPTED'].includes(p.assignmentStatus || 'PENDING'))
      .sort((a, b) => +new Date(b.assignedAt || b.createdAt) - +new Date(a.assignedAt || a.createdAt))
      .slice(0, 7);
  }

  checkerAssignedCount(): number {
    return this.checkerAssignments().length;
  }

  checkerPendingCount(): number {
    return this.checkerAssignments().filter(item => ['INVITED', 'PENDING'].includes(item.assignmentStatus || 'PENDING')).length;
  }

  checkerRejectedCount(): number {
    return this.checkerAssignments().filter(item => item.status === 'REJECTED').length;
  }

  checkerInReviewCount(): number {
    return this.checkerAssignments().filter(item => item.status === 'UNDER_REVIEW').length;
  }

  checkerFinalizedCount(): number {
    return this.checkerAssignments().filter(item => ['ACCEPTED', 'REJECTED', 'REVISION'].includes(item.status)).length;
  }

  primaryActionRoute(): string {
    if (this.auth.isAdmin()) {
      return '/admin/papers';
    }
    if (this.auth.isChecker()) {
      return '/reviewer/assignments';
    }
    return '/researcher/upload';
  }

  statusClass(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'chip-submitted';
      case 'UNDER_REVIEW': return 'chip-under-review';
      case 'ACCEPTED': return 'chip-accepted';
      case 'REJECTED': return 'chip-rejected';
      default: return 'chip-draft';
    }
  }

  checkerStatusClass(paper: PaperResponse): string {
    if (paper.assignmentStatus === 'INVITED' || paper.assignmentStatus === 'PENDING') return 'chip-under-review';
    if (paper.status === 'ACCEPTED') return 'chip-accepted';
    if (paper.status === 'REJECTED') return 'chip-rejected';
    if (paper.status === 'UNDER_REVIEW') return 'chip-submitted';
    return 'chip-draft';
  }

  checkerStatusLabel(paper: PaperResponse): string {
    if (paper.assignmentStatus === 'INVITED' || paper.assignmentStatus === 'PENDING') {
      return 'PENDING';
    }
    if (paper.assignmentStatus === 'IN_REVIEW') return 'IN REVIEW';
    if (paper.assignmentStatus === 'SUBMITTED') return 'SUBMITTED';
    return paper.status;
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning — here\'s your workspace.';
    if (hour < 18) return 'Good afternoon — here\'s your workspace.';
    return 'Good evening — here\'s your workspace.';
  }
}
