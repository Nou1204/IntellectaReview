import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperService } from '../../../core/services/paper';
import { PaperResponse } from '../../../core/models/paper.model';

@Component({
  selector: 'app-reviewer-papers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './reviewer-papers.component.html',
  styleUrl: './reviewer-papers.component.scss'
})
export class ReviewerPapersComponent implements OnInit {
  papers = signal<PaperResponse[]>([]);
  loading = signal(false);
  expandedPaperId = signal<number | null>(null);
  displayedColumns = ['title', 'status', 'assignmentType', 'assignedDate', 'actions'];
  assignedPapers = computed(() => this.papers().filter(paper => ['INVITED', 'PENDING', 'ACCEPTED', 'IN_REVIEW'].includes(paper.assignmentStatus || 'INVITED')));
  reviewHistory = computed(() => this.papers().filter(paper => ['DECLINED', 'COMPLETED', 'SUBMITTED'].includes(paper.assignmentStatus || '')));

  statusClass(paper: PaperResponse): string {
    const status = paper.assignmentStatus || paper.status;
    if (status === 'INVITED' || status === 'PENDING') return 'chip-under-review';
    if (status === 'ACCEPTED' || paper.status === 'UNDER_REVIEW') return 'chip-submitted';
    if (status === 'DECLINED') return 'chip-rejected';
    if (paper.status === 'ACCEPTED') return 'chip-accepted';
    if (paper.status === 'REJECTED') return 'chip-rejected';
    return 'chip-draft';
  }

  assignmentLabel(paper: PaperResponse): string {
    return paper.assignmentStatus || 'INVITED';
  }

  toggleDetail(paperId: number | null): void {
    this.expandedPaperId.set(this.expandedPaperId() === paperId ? null : paperId);
  }

  getExpandedPaper(): PaperResponse | undefined {
    return this.papers().find(p => p.id === this.expandedPaperId());
  }

  constructor(
    private paperService: PaperService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.expandedPaperId.set(null);
    this.paperService.listAssignedReviewerPapers().subscribe({
      next: papers => {
        this.papers.set(papers || []);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to load assigned papers';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  acceptInvitation(paper: PaperResponse): void {
    this.paperService.acceptReviewerInvitation(paper.id).subscribe({
      next: () => {
        this.snackBar.open('Invitation accepted', 'Close', { duration: 2500, panelClass: ['success-snack'] });
        this.ngOnInit();
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
        this.ngOnInit();
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to decline invitation';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }
}
