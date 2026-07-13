import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { PaperService } from '../../core/services/paper';
import { PaperResponse } from '../../core/models/paper.model';

interface FilteredPapers {
  pendingPapers: PaperResponse[];
  reviewedPapers: PaperResponse[];
}

@Component({
  selector: 'app-reviewer-papers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule
  ],
  styles: [`
    .container {
      max-width: 1100px;
      margin: 24px auto;
      padding: 0 16px;
      display: grid;
      gap: 16px;
    }
    .paper-card {
      border-left: 4px solid #ff7043;
    }
    .meta-label {
      font-size: .75rem;
      text-transform: uppercase;
      letter-spacing: .4px;
      color: #757575;
      font-weight: 600;
    }
    .meta-value {
      color: #424242;
      line-height: 1.5;
    }
  `],
  template: `
    <div class="container">
      <mat-card>
        <div style="padding: 20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
          <div>
            <h2 style="margin:0;">Papers for Review</h2>
            <p style="margin:6px 0 0; color:#616161;">Pending assignments and your review history.</p>
          </div>
        </div>
      </mat-card>

      <section>
        <h3>Pending Assignments</h3>
        @if (pendingPapers().length === 0) {
          <mat-card>
            <div style="padding: 24px; color:#9e9e9e; text-align:center;">No pending assignments.</div>
          </mat-card>
        } @else {
          @for (paper of pendingPapers(); track paper.id) {
            <mat-card class="paper-card">
              <div style="padding:18px; display:grid; gap:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h4 style="margin:0">{{ paper.title || paper.fileName }}</h4>
                    <div style="color:#757575; font-size:.86rem;">Assigned: {{ (paper.assignedAt || paper.createdAt) | date:'MMM d, y' }}</div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <a mat-stroked-button color="primary" [routerLink]="['/reviewer/papers', paper.id, 'review']">Open</a>
                    <a mat-button [href]="paper.fileUrl" target="_blank">Open PDF</a>
                  </div>
                </div>
                <div class="meta-value">{{ paper.abstrakt || 'No abstract available.' }}</div>
              </div>
            </mat-card>
          }
        }
      </section>

      <section>
        <h3 style="margin-top:18px;">My Reviews (History)</h3>
        @if (reviewedPapers().length === 0) {
          <mat-card>
            <div style="padding:24px; color:#9e9e9e; text-align:center;">You have not submitted any reviews yet.</div>
          </mat-card>
        } @else {
          @for (paper of reviewedPapers(); track paper.id) {
            <mat-card class="paper-card">
              <div style="padding:18px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <div>
                  <h4 style="margin:0">{{ paper.title || paper.fileName }}</h4>
                  <div style="color:#757575; font-size:.86rem;">Reviewed: {{ paper.assignedAt ? (paper.assignedAt | date:'MMM d, y') : (paper.createdAt | date:'MMM d, y') }}</div>
                </div>
                <div style="display:flex; gap:8px;">
                  <a mat-stroked-button color="primary" [routerLink]="['/reviewer/papers', paper.id, 'review']">Open/Edit</a>
                  <a mat-button [href]="paper.fileUrl" target="_blank">Open PDF</a>
                </div>
              </div>
            </mat-card>
          }
        }
      </section>
    </div>
  `
})
export class ReviewerPapersComponent implements OnInit {
  // pending assignments (not yet reviewed)
  pendingPapers = signal<PaperResponse[]>([]);
  // reviewed / completed assignments (history)
  reviewedPapers = signal<PaperResponse[]>([]);
  savedComments = signal<Record<number, string>>({});
  commentForms: Record<number, FormGroup> = {};

  constructor(
    private paperService: PaperService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPapers();
  }

  loadPapers(): void {
    this.paperService.listAssignedReviewerPapers().subscribe({
      next: data => {
        const all = data || [];
        this.pendingPapers.set(all.filter(p => p.assignmentStatus === 'PENDING'));
        this.reviewedPapers.set(all.filter(p => p.assignmentStatus !== 'PENDING'));
        this.initializeForms(all);
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to load reviewer assignments';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  initializeForms(papers: PaperResponse[]): void {
    const forms: Record<number, FormGroup> = {};
    for (const paper of papers) {
      forms[paper.id] = this.fb.group({
        comment: [this.savedComments()[paper.id] || '', [Validators.required, Validators.minLength(10)]]
      });
    }
    this.commentForms = forms;
  }

  submitComment(paper: PaperResponse): void {
    const form = this.commentForms[paper.id];
    if (!form || form.invalid) return;

    const comment = String(form.value.comment || '').trim();
    this.savedComments.set({
      ...this.savedComments(),
      [paper.id]: comment
    });

    this.snackBar.open('Comment saved locally. Backend review endpoint can be added next.', 'Close', {
      duration: 3000,
      panelClass: ['success-snack']
    });
  }

  clearComment(paperId: number): void {
    const form = this.commentForms[paperId];
    if (form) {
      form.patchValue({ comment: '' });
    }
  }
}
