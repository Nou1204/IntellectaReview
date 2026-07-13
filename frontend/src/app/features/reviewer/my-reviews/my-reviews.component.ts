import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperService } from '../../../core/services/paper';
import { PaperResponse } from '../../../core/models/paper.model';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatDividerModule, MatIconModule, MatSnackBarModule, MatTableModule],
  templateUrl: './my-reviews.component.html',
  styleUrl: './my-reviews.component.scss'
})
export class MyReviewsComponent implements OnInit {
  readonly loading = signal(false);
  readonly assignments = signal<PaperResponse[]>([]);
  readonly expandedPaperId = signal<number | null>(null);

  readonly pendingInvitations = computed(() => this.assignments().filter(item => ['PENDING', 'INVITED'].includes(item.assignmentStatus || 'PENDING')));
  readonly activeReviews = computed(() => this.assignments().filter(item => ['ACCEPTED', 'IN_REVIEW'].includes(item.assignmentStatus || '')));
  readonly completedAssignments = computed(() => this.assignments().filter(item => ['SUBMITTED', 'COMPLETED'].includes(item.assignmentStatus || '')));

  constructor(
    private paperService: PaperService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  trackByPaperId(_: number, paper: PaperResponse): number {
    return paper.id;
  }

  togglePaperDetails(paperId: number): void {
    this.expandedPaperId.set(this.expandedPaperId() === paperId ? null : paperId);
  }

  isExpanded(paper: PaperResponse): boolean {
    return this.expandedPaperId() === paper.id;
  }

  statusLabel(paper: PaperResponse): string {
    const assignmentStatus = paper.assignmentStatus || 'PENDING';
    if (assignmentStatus === 'PENDING' || assignmentStatus === 'INVITED') return 'Invitation Pending';
    if (assignmentStatus === 'IN_REVIEW') return 'In Review';
    if (assignmentStatus === 'SUBMITTED') return 'Submitted';
    if (assignmentStatus === 'DECLINED') return 'Declined';
    return 'Assignment';
  }

  statusClass(paper: PaperResponse): string {
    const assignmentStatus = paper.assignmentStatus || 'PENDING';
    if (assignmentStatus === 'PENDING' || assignmentStatus === 'INVITED') return 'chip-pending';
    if (assignmentStatus === 'IN_REVIEW') return 'chip-review';
    if (assignmentStatus === 'SUBMITTED') return 'chip-submitted';
    if (assignmentStatus === 'DECLINED') return 'chip-rejected';
    return 'chip-neutral';
  }

  assignmentProgress(): string {
    return `${this.activeReviews().length} active · ${this.pendingInvitations().length} pending`;
  }

  openReview(paper: PaperResponse): void {
    this.router.navigate(['/reviewer/papers', paper.id, 'review']);
  }

  acceptInvitation(paper: PaperResponse): void {
    this.paperService.acceptReviewerInvitation(paper.id).subscribe({
      next: () => {
        this.snackBar.open('Invitation accepted', 'Close', { duration: 2500, panelClass: ['success-snack'] });
        this.loadAssignments();
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to accept invitation';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  declineInvitation(paper: PaperResponse): void {
    this.paperService.declineReviewerInvitation(paper.id).subscribe({
      next: () => {
        this.snackBar.open('Invitation declined', 'Close', { duration: 2500, panelClass: ['success-snack'] });
        this.loadAssignments();
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to decline invitation';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  private loadAssignments(): void {
    this.loading.set(true);
    this.paperService.listAssignedReviewerPapers().subscribe({
      next: papers => {
        this.assignments.set((papers || []).slice().sort((a, b) => +new Date(b.assignedAt || b.createdAt) - +new Date(a.assignedAt || a.createdAt)));
        this.expandedPaperId.set(null);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to load reviewer invitations';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }
}