import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperService } from '../../core/services/paper';
import { PaperResponse } from '../../core/models/paper.model';
import { ReviewResponse } from '../../core/models/review.model';

@Component({
  selector: 'app-researcher-papers',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatChipsModule],
  templateUrl: './researcher-papers.component.html',
  styleUrl: './researcher-papers.component.scss'
})
export class ResearcherPapersComponent implements OnInit {
  papers = signal<PaperResponse[]>([]);
  loading = signal(false);
  loadingReviews = signal(false);
  selectedPaper = signal<PaperResponse | null>(null);
  selectedPaperReviews = signal<ReviewResponse[]>([]);

  readonly papersByLifecycle = computed(() => {
    const order = new Map(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION', 'ACCEPTED', 'REJECTED', 'PORTFOLIO', 'FINISHED_REVIEWING'].map((status, index) => [status, index] as const));
    return [...this.papers()].sort((left, right) => {
      const leftOrder = order.get(left.status || '') ?? 999;
      const rightOrder = order.get(right.status || '') ?? 999;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return new Date(right.createdAt || '').getTime() - new Date(left.createdAt || '').getTime();
    });
  });

  constructor(private paperService: PaperService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.paperService.listMyPapers().subscribe({
      next: items => {
        this.papers.set(items || []);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to load papers';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  selectPaper(paper: PaperResponse): void {
    this.toggleDetails(paper);
  }

  toggleDetails(paper: PaperResponse): void {
    if (this.selectedPaper()?.id === paper.id) {
      this.closeDetails();
      return;
    }

    this.selectedPaper.set(paper);
    this.selectedPaperReviews.set([]);
    this.loadReviews(paper.id);
  }

  closeDetails(): void {
    this.selectedPaper.set(null);
    this.selectedPaperReviews.set([]);
    this.loadingReviews.set(false);
  }

  loadReviews(paperId: number): void {
    this.loadingReviews.set(true);
    this.paperService.listPaperReviews(paperId).subscribe({
      next: reviews => {
        this.selectedPaperReviews.set(reviews || []);
        this.loadingReviews.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingReviews.set(false);
        this.selectedPaperReviews.set([]);
        const msg = err.error?.message || 'Failed to load review details';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'chip-draft';
      case 'SUBMITTED': return 'chip-submitted';
      case 'UNDER_REVIEW': return 'chip-under-review';
      case 'REVISION': return 'chip-revision';
      case 'ACCEPTED': return 'chip-accepted';
      case 'REJECTED': return 'chip-rejected';
      case 'PORTFOLIO': return 'chip-draft';
      case 'FINISHED_REVIEWING': return 'chip-submitted';
      default: return 'chip-draft';
    }
  }

  totalCount(): number {
    return this.papers().length;
  }

  acceptedCount(): number {
    return this.papers().filter(paper => paper.status === 'ACCEPTED').length;
  }

  rejectedCount(): number {
    return this.papers().filter(paper => paper.status === 'REJECTED').length;
  }

  revisionCount(): number {
    return this.papers().filter(paper => paper.status === 'REVISION').length;
  }

  pendingCount(): number {
    return this.papers().filter(paper => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PORTFOLIO', 'FINISHED_REVIEWING'].includes(paper.status || '')).length;
  }

  openReviewPdf(url?: string | null): void {
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  }

  reviewDecisionLabel(review: ReviewResponse): string {
    return review.decision || 'Pending';
  }
}
