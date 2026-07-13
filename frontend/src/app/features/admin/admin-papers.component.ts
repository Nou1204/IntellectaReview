import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PaperService } from '../../core/services/paper';
import { PaperResponse } from '../../core/models/paper.model';
import { AssignReviewersDialogComponent } from './assign-reviewers-dialog.component';

@Component({
  selector: 'app-admin-papers',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-papers.component.html',
  styleUrl: './admin-papers.component.scss'
})
export class AdminPapersComponent implements OnInit {
  papers = signal<PaperResponse[]>([]);
  loading = signal(false);
  statusFilter = signal('');
  expandedPaperId = signal<number | null>(null);
  assigning = signal(false);
  displayedColumns = ['title', 'author', 'date', 'status', 'actions'];

  statusClass(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'chip-submitted';
      case 'UNDER_REVIEW': return 'chip-under-review';
      case 'ACCEPTED': return 'chip-accepted';
      case 'REJECTED': return 'chip-rejected';
      case 'REVISION': return 'chip-revision';
      default: return 'chip-draft';
    }
  }

  constructor(
    private paperService: PaperService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPapers();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.loadPapers();
  }

  toggleDetail(paperId: number | null): void {
    this.expandedPaperId.set(this.expandedPaperId() === paperId ? null : paperId);
  }

  getExpandedPaper(): PaperResponse | undefined {
    return this.papers().find(p => p.id === this.expandedPaperId());
  }

  loadPapers(): void {
    this.loading.set(true);
    this.paperService.listAllPapers(this.statusFilter() || undefined).subscribe({
      next: data => {
        this.papers.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to load papers';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  canAssignReviewers(paper: PaperResponse): boolean {
    return paper.status === 'SUBMITTED' || paper.status === 'UNDER_REVIEW';
  }

  openManageAssignmentsDialog(paper: PaperResponse): void {
    const dialogRef = this.dialog.open(AssignReviewersDialogComponent, {
      width: '960px',
      maxHeight: '90vh',
      data: { paper }
    });

    dialogRef.afterClosed().subscribe(selectedReviewerIds => {
      if (selectedReviewerIds && selectedReviewerIds.length > 0) {
        this.assigning.set(true);
        this.paperService.bulkAssignReviewers(paper.id, selectedReviewerIds).subscribe({
          next: assignments => {
            this.assigning.set(false);
            this.snackBar.open(`${assignments.length} reviewer(s) assigned`, 'Close', { duration: 3000, panelClass: ['success-snack'] });
            this.loadPapers();
          },
          error: (err: HttpErrorResponse) => {
            this.assigning.set(false);
            const msg = err.error?.message || 'Failed to assign reviewers';
            this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
          }
        });
      }
    });
  }
}
