import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { PaperService } from '../../../core/services/paper';
import { PaperReviewGroupResponse, PaperReviewerWorkflowResponse, ReviewResponse } from '../../../core/models/review.model';

@Component({
  selector: 'app-review-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatProgressBarModule, MatButtonModule, MatDialogModule],
  templateUrl: './review-detail-dialog.component.html',
  styleUrl: './review-detail-dialog.component.scss'
})
export class ReviewDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ReviewResponse) {}

  plagiarismPercent(score?: number | null): number {
    return Math.round((score || 0) * 100);
  }

  plagiarismColor(score?: number | null): 'primary' | 'accent' | 'warn' {
    if (score === null || score === undefined) {
      return 'primary';
    }
    if (score > 0.4) {
      return 'warn';
    }
    if (score >= 0.2) {
      return 'accent';
    }
    return 'primary';
  }

  decisionClass(decision?: string): string {
    if (decision === 'STRONG_ACCEPT' || decision === 'WEAK_ACCEPT') return 'chip-accept';
    if (decision === 'WEAK_REJECT' || decision === 'STRONG_REJECT') return 'chip-reject';
    return 'chip-neutral';
  }
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './admin-reviews.component.html',
  styleUrl: './admin-reviews.component.scss'
})
export class AdminReviewsComponent implements OnInit {
  reviews = signal<PaperReviewGroupResponse[]>([]);
  loading = signal(false);
  finalizingPaperId = signal<number | null>(null);
  query = signal('');
  reviewStateFilter = signal<'ALL' | 'IN_PROGRESS' | 'FINALIZED'>('ALL');
  expandedPaperId = signal<number | null>(null);
  displayedColumns = ['expand', 'paperTitle', 'author', 'progress', 'status'];

  constructor(
    private paperService: PaperService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.paperService.listAdminReviews().subscribe({
      next: reviews => {
        this.reviews.set(reviews || []);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to load reviews';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  togglePaper(paperId: number): void {
    this.expandedPaperId.set(this.expandedPaperId() === paperId ? null : paperId);
  }

  isExpanded(paperId: number): boolean {
    return this.expandedPaperId() === paperId;
  }

  filteredReviews(): PaperReviewGroupResponse[] {
    const query = this.query().trim().toLowerCase();
    const filter = this.reviewStateFilter();

    return this.reviews().filter(group => {
      if (filter === 'IN_PROGRESS' && group.globalStatus !== 'UNDER_REVIEW') {
        return false;
      }

      if (filter === 'FINALIZED' && !['ACCEPTED', 'REJECTED', 'REVISION', 'FINISHED_REVIEWING'].includes(group.globalStatus || '')) {
        return false;
      }

      if (query) {
        const reviewerText = group.reviewerAllocations
          .map(allocation => `${allocation.reviewerName || ''} ${allocation.decision || ''} ${allocation.comments || ''}`)
          .join(' ')
          .toLowerCase();
        const haystack = `${group.paperTitle || ''} ${group.submittedByName || ''} ${reviewerText}`;
        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  reviewerStatusClass(allocation: PaperReviewerWorkflowResponse): string {
    if (allocation.assignmentStatus === 'SUBMITTED') return 'chip-submitted';
    if (allocation.assignmentStatus === 'IN_REVIEW') return 'chip-review';
    if (allocation.assignmentStatus === 'DECLINED') return 'chip-reject';
    return 'chip-neutral';
  }

  paperStatusClass(group: PaperReviewGroupResponse): string {
    if (group.globalStatus === 'ACCEPTED') return 'chip-accept';
    if (group.globalStatus === 'REJECTED') return 'chip-reject';
    if (group.globalStatus === 'REVISION') return 'chip-revision';
    if (group.globalStatus === 'UNDER_REVIEW') return 'chip-review';
    if (group.globalStatus === 'FINISHED_REVIEWING') return 'chip-accept';
    return 'chip-neutral';
  }

  canFinalize(group: PaperReviewGroupResponse): boolean {
    return group.submittedReviewsCount === 3 && group.globalStatus === 'UNDER_REVIEW';
  }

  finalizeDecision(group: PaperReviewGroupResponse, decision: 'ACCEPTED' | 'REJECTED' | 'REVISION'): void {
    if (this.finalizingPaperId()) {
      return;
    }

    this.finalizingPaperId.set(group.paperId);
    this.paperService.finalizePaperDecision(group.paperId, decision).subscribe({
      next: () => {
        this.finalizingPaperId.set(null);
        this.snackBar.open(`Final decision ${decision.toLowerCase()} saved`, 'Close', { duration: 3000, panelClass: ['success-snack'] });
        this.ngOnInit();
      },
      error: (err: HttpErrorResponse) => {
        this.finalizingPaperId.set(null);
        const msg = err.error?.message || 'Failed to save final decision';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  progressPercent(group: PaperReviewGroupResponse): number {
    const total = group.totalAssignments || 3;
    const submitted = group.submittedReviewsCount || 0;
    return Math.round((submitted / total) * 100);
  }

  resetFilters(): void {
    this.query.set('');
    this.reviewStateFilter.set('ALL');
    this.expandedPaperId.set(null);
  }
}
