import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperResponse } from '../../../core/models/paper.model';
import { PlagiarismResult, ReviewDecision, ReviewResponse } from '../../../core/models/review.model';
import { PaperService } from '../../../core/services/paper';
import { ReviewerChatbotComponent } from '../reviewer-chatbot/reviewer-chatbot.component';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatSnackBarModule,
    ReviewerChatbotComponent
  ],
  templateUrl: './review-form.component.html',
  styleUrl: './review-form.component.scss'
})
export class ReviewFormComponent implements OnInit {
  form: FormGroup;
  paper = signal<PaperResponse | null>(null);
  loadingPaper = signal(false);
  checkingPlagiarism = signal(false);
  plagiarismChecked = signal(false);
  plagiarismResult = signal<PlagiarismResult | null>(null);
  generatingSummary = signal(false);
  aiSummary = signal('');
  submitting = signal(false);
  existingReview = signal<ReviewResponse | null>(null);
  reviewFile = signal<File | null>(null);

  paperId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private paperService: PaperService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      overallScore: [5, [Validators.required]],
      originalityScore: [5, [Validators.required]],
      clarityScore: [5, [Validators.required]],
      methodologyScore: [5, [Validators.required]],
      decision: ['', [Validators.required]]
    });
  }

  decisionOptions = [
    { value: 'WEAK_ACCEPT', label: 'Weak Accept', tone: 'accept' },
    { value: 'STRONG_ACCEPT', label: 'Accept', tone: 'accept' },
    { value: 'WEAK_REJECT', label: 'Weak Reject', tone: 'reject' },
    { value: 'STRONG_REJECT', label: 'Reject', tone: 'reject' }
  ];

  ngOnInit(): void {
    this.paperId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.paperId) {
      this.snackBar.open('Invalid paper id', 'Close', { duration: 3000, panelClass: ['error-snack'] });
      this.router.navigate(['/reviewer/assignments']);
      return;
    }

    this.loadPaper();
  }

  loadPaper(): void {
    this.loadingPaper.set(true);
    this.paperService.getPaperById(this.paperId).subscribe({
      next: (paper) => {
        this.loadingPaper.set(false);
        this.paper.set(paper);
        this.loadExistingReview();
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPaper.set(false);
        const msg = err.error?.message || 'Failed to load paper';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
        this.router.navigate(['/reviewer/assignments']);
      }
    });
  }

  private loadExistingReview(): void {
    this.paperService.getReviewerReview(this.paperId).subscribe({
      next: review => {
        this.existingReview.set(review);
        this.form.patchValue({
          overallScore: review.overallScore,
          originalityScore: review.originalityScore,
          clarityScore: review.clarityScore,
          methodologyScore: review.methodologyScore,
          decision: review.decision || ''
        });
      },
      error: () => {
        this.existingReview.set(null);
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

  openPaper(): void {
    this.openOrDownloadPaper(true);
  }

  downloadPaper(): void {
    this.openOrDownloadPaper(false);
  }

  private openOrDownloadPaper(openInNewTab: boolean): void {
    const paper = this.paper();
    if (!paper) {
      return;
    }

    this.paperService.downloadPaper(this.paperId).subscribe({
      next: blob => {
        const blobUrl = URL.createObjectURL(blob);
        if (openInNewTab) {
          window.open(blobUrl, '_blank', 'noopener');
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
          return;
        }

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = paper.fileName || `paper-${paper.id}.pdf`;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      },
      error: () => {
        const fallbackUrl = paper.fileUrl;
        if (!fallbackUrl) {
          this.snackBar.open('Unable to open the paper PDF', 'Close', { duration: 3000, panelClass: ['error-snack'] });
          return;
        }

        if (openInNewTab) {
          window.open(fallbackUrl, '_blank', 'noopener');
          return;
        }

        const anchor = document.createElement('a');
        anchor.href = fallbackUrl;
        anchor.download = paper.fileName || `paper-${paper.id}.pdf`;
        anchor.click();
      }
    });
  }

  checkPlagiarism(): void {
    this.checkingPlagiarism.set(true);
    this.paperService.checkReviewerPlagiarism(this.paperId).subscribe({
      next: (result) => {
        this.checkingPlagiarism.set(false);
        this.plagiarismChecked.set(true);
        this.plagiarismResult.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.checkingPlagiarism.set(false);
        this.plagiarismChecked.set(true);
        this.plagiarismResult.set({ flagged: false, similarityScore: null, paperId: null, paperTitle: null });
        const msg = err.error?.message || 'Plagiarism check failed';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  generateAiSummary(): void {
    this.generatingSummary.set(true);
    this.paperService.generateReviewerSummary(this.paperId).subscribe({
      next: (res) => {
        this.generatingSummary.set(false);
        this.aiSummary.set(res.summary || '');
      },
      error: (err: HttpErrorResponse) => {
        this.generatingSummary.set(false);
        const msg = err.error?.message || 'Failed to generate AI summary';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  submitReview(): void {
    if (this.form.invalid || this.submitting() || !this.reviewFile()) {
      return;
    }

    this.submitting.set(true);
    const payload = new FormData();
    payload.append('overallScore', String(this.form.value.overallScore));
    payload.append('originalityScore', String(this.form.value.originalityScore));
    payload.append('clarityScore', String(this.form.value.clarityScore));
    payload.append('methodologyScore', String(this.form.value.methodologyScore));
    payload.append('decision', String(this.form.value.decision as ReviewDecision));
    payload.append('reviewFile', this.reviewFile() as File);

    this.paperService.submitReviewerReview(this.paperId, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open(this.existingReview() ? 'Review updated successfully' : 'Review submitted successfully', 'Close', { duration: 3000, panelClass: ['success-snack'] });
        this.router.navigate(['/reviewer/history']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const msg = err.error?.message || 'Failed to submit review';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  plagiarismPercent(): number {
    return Math.round((this.plagiarismResult()?.similarityScore || 0) * 100);
  }

  plagiarismColor(): 'primary' | 'accent' | 'warn' {
    const value = this.plagiarismResult()?.similarityScore;
    if (value === null || value === undefined) {
      return 'primary';
    }
    if (value > 0.4) {
      return 'warn';
    }
    if (value >= 0.2) {
      return 'accent';
    }
    return 'primary';
  }

}
