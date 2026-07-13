import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperService } from '../../../core/services/paper';
import { PaperResponse } from '../../../core/models/paper.model';

@Component({
  selector: 'app-reviewer-paper-review',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  styles: [`
    .page {
      min-height: 100vh;
      background: #f4f7fb;
    }
    .hero {
      background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%);
      color: white;
      padding: 32px 24px 64px;
    }
    .hero h1 { margin: 0 0 6px; font-size: 1.6rem; }
    .hero p { margin: 0; opacity: .85; }
    .content {
      max-width: 1100px;
      margin: -36px auto 40px;
      padding: 0 24px;
      display: grid;
      gap: 16px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .meta-box {
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px;
    }
    .ai-summary-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 14px;
    }
    .label {
      font-size: .75rem;
      text-transform: uppercase;
      letter-spacing: .4px;
      color: #607d8b;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .value {
      color: #1f2937;
      line-height: 1.6;
    }
  `],
  template: `
    <div class="page">
      <div class="hero">
        <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end;">
          <div>
            <h1>Review Paper</h1>
            <p>Read the assigned work and leave your review comment.</p>
          </div>
        </div>
      </div>

      <div class="content">
        @if (loading()) {
          <mat-card>
            <div style="padding: 40px; text-align:center;">
              <mat-spinner diameter="42" style="margin: 0 auto 12px;"></mat-spinner>
              <div>Loading paper details...</div>
            </div>
          </mat-card>
        } @else if (!paper()) {
          <mat-card>
            <div style="padding: 40px; text-align:center; color:#78909c;">
              <mat-icon style="font-size:48px;width:48px;height:48px;">search_off</mat-icon>
              <p style="margin:12px 0 0;">Paper not found in your assignments.</p>
            </div>
          </mat-card>
        } @else {
          <mat-card>
            <div style="padding: 20px; display:grid; gap:14px;">
              <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-start;">
                <div>
                  <h2 style="margin:0 0 4px;">{{ paper()?.title || paper()?.fileName }}</h2>
                  <div style="color:#607d8b;">Submitted by {{ paper()?.submittedByName || 'Unknown' }}</div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <a mat-button [href]="paper()?.fileUrl" target="_blank" rel="noopener">
                    <mat-icon>open_in_new</mat-icon>
                    Open PDF
                  </a>
                  <a mat-stroked-button [href]="paper()?.fileUrl" target="_blank" rel="noopener">
                    <mat-icon>download</mat-icon>
                    Download PDF
                  </a>
                </div>
              </div>

              <div class="meta-grid">
                <div class="meta-box">
                  <div class="label">Assigned Status</div>
                  <div class="value">{{ paper()?.assignmentStatus || 'PENDING' }}</div>
                </div>
                <div class="meta-box">
                  <div class="label">Assignment Type</div>
                  <div class="value">{{ paper()?.assignmentType || 'MANUAL' }}</div>
                </div>
                <div class="meta-box">
                  <div class="label">Assigned Date</div>
                  <div class="value">{{ paper()?.assignedAt | date:'MMM d, y, HH:mm' }}</div>
                </div>
              </div>

              <div class="meta-box">
                <div class="label">Abstract</div>
                <div class="value">{{ paper()?.abstrakt || 'No abstract available.' }}</div>
              </div>

              <div class="meta-box">
                <div class="label">Authors</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  @for (author of paper()?.authors || []; track author) {
                    <mat-chip>{{ author }}</mat-chip>
                  }
                </div>
              </div>

              <div class="meta-box">
                <div class="label">Keywords</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  @for (keyword of paper()?.keywords || []; track keyword) {
                    <mat-chip>{{ keyword }}</mat-chip>
                  }
                </div>
              </div>

              <div class="meta-box">
                <div class="label">Review PDF</div>
                <input type="file" accept="application/pdf,.pdf" (change)="onReviewFileSelected($event)" />
                @if (reviewFile()) {
                  <p class="value">Selected: {{ reviewFile()?.name }}</p>
                }
              </div>

              <mat-chip-listbox formControlName="decision" class="decision-group">
                <mat-chip-option value="STRONG_ACCEPT">Strong Accept</mat-chip-option>
                <mat-chip-option value="WEAK_ACCEPT">Weak Accept</mat-chip-option>
                <mat-chip-option value="WEAK_REJECT">Weak Reject</mat-chip-option>
                <mat-chip-option value="STRONG_REJECT">Strong Reject</mat-chip-option>
              </mat-chip-listbox>
            </div>
          </mat-card>

          <mat-card>
            <form [formGroup]="form" (ngSubmit)="submitReview()" style="padding: 20px; display: grid; gap: 14px;">
              <h3 style="margin:0;">Leave Review Comment</h3>
              <mat-form-field appearance="outline">
                <mat-label>Comment</mat-label>
                <textarea matInput rows="8" formControlName="comments" placeholder="Write your review comments here..."></textarea>
                @if (form.get('comments')?.touched && form.get('comments')?.invalid) {
                  <mat-error>Comment is required (min 10 characters)</mat-error>
                }
              </mat-form-field>

              <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
                <button mat-stroked-button type="button" (click)="form.reset()">Clear</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="saving() || form.invalid">
                  @if (saving()) {
                    <mat-spinner diameter="18" />
                  } @else {
                    Submit Review
                  }
                </button>
              </div>
            </form>
          </mat-card>
        }
      </div>
    </div>
  `
})
export class ReviewerPaperReviewComponent implements OnInit {
  paper = signal<PaperResponse | null>(null);
  aiSummary = signal('');
  loading = signal(false);
  generatingSummary = signal(false);
  saving = signal(false);
  reviewFile = signal<File | null>(null);
  form: FormGroup;
  private paperId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private paperService: PaperService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      comments: ['', [Validators.required, Validators.minLength(10)]],
      decision: ['STRONG_ACCEPT', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.paperId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.paperId) {
      this.snackBar.open('Invalid paper id', 'Close', { duration: 3000 });
      this.router.navigate(['/reviewer/papers']);
      return;
    }

    this.loadPaper();
  }

  loadPaper(): void {
    this.loading.set(true);
    this.paperService.listAssignedReviewerPapers().subscribe({
      next: papers => {
        this.loading.set(false);
        const paper = (papers || []).find(item => item.id === this.paperId);
        this.paper.set(paper || null);
        if (!paper) {
          this.snackBar.open('Paper not found in your assignments', 'Close', { duration: 3000 });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to load paper';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  generateAiSummary(): void {
    if (!this.paper() || this.generatingSummary()) {
      return;
    }

    this.generatingSummary.set(true);
    this.paperService.generateReviewerSummary(this.paperId).subscribe({
      next: response => {
        this.generatingSummary.set(false);
        this.aiSummary.set(response.summary || '');
        this.snackBar.open('AI summary generated. Please verify it before submitting.', 'Close', {
          duration: 3500,
          panelClass: ['success-snack']
        });
      },
      error: (err: HttpErrorResponse) => {
        this.generatingSummary.set(false);
        const msg = err.error?.message || 'Failed to generate AI summary';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  onReviewFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      this.snackBar.open('Only PDF review files are accepted', 'Close', { duration: 3000, panelClass: ['error-snack'] });
      input.value = '';
      this.reviewFile.set(null);
      return;
    }
    this.reviewFile.set(file);
  }

  submitReview(): void {
    if (this.form.invalid || this.saving() || !this.paper() || !this.reviewFile()) {
      return;
    }

    this.saving.set(true);
    const payload = new FormData();
    payload.append('overallScore', '5');
    payload.append('originalityScore', '5');
    payload.append('clarityScore', '5');
    payload.append('methodologyScore', '5');
    payload.append('decision', this.form.value.decision);
    payload.append('comments', this.form.value.comments || '');
    payload.append('reviewFile', this.reviewFile() as File);

    this.paperService.submitReviewerReview(this.paperId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Review submitted successfully', 'Close', { duration: 3000, panelClass: ['success-snack'] });
        this.router.navigate(['/reviewer/papers']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Failed to submit review';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }
}
