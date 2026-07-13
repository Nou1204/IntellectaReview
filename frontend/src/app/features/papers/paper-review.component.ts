import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperResponse } from '../../core/models/paper.model';
import {
  ExtractedMetadataResponse,
  PaperCommentResponse,
  PaperService,
  UpdateMetadataRequest
} from '../../core/services/paper';

@Component({
  selector: 'app-paper-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './paper-review.component.html',
  styleUrl: './paper-review.component.scss'
})
export class PaperReviewComponent implements OnInit {
  form: FormGroup;
  paper = signal<PaperResponse | null>(null);
  extracted = signal<ExtractedMetadataResponse | null>(null);
  extracting = signal(false);
  saving = signal(false);
  submitting = signal(false);
  withdrawing = signal(false);
  deleting = signal(false);
  commenting = signal(false);
  comments = signal<PaperCommentResponse[]>([]);
  commentText = signal('');
  authors = signal<string[]>([]);
  keywords = signal<string[]>([]);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private paperService: PaperService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      abstrakt: [''],
      authorsCsv: [''],
      keywordsCsv: [''],
      correspondingAuthorEmail: ['', Validators.email]
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncPreviewLists());

    this.syncPreviewLists();
  }

  ngOnInit(): void {
    const paperId = Number(this.route.snapshot.paramMap.get('id'));
    if (!paperId) {
      this.snackBar.open('Invalid paper id', 'Close', { duration: 3500, panelClass: ['error-snack'] });
      this.router.navigate(['/researcher/papers']);
      return;
    }

    this.loadPaper(paperId);
    this.loadComments(paperId);
  }

  canEditDraft(): boolean {
    return this.paper()?.status === 'DRAFT';
  }

  canDeleteDraft(): boolean {
    return this.canEditDraft();
  }

  extractNow(): void {
    const paperId = this.paper()?.id;
    if (!paperId) {
      return;
    }

    this.extracting.set(true);
    this.paperService.extractMetadata(paperId).subscribe({
      next: metadata => {
        this.extracting.set(false);
        this.extracted.set(metadata);
        this.patchFormFromExtracted(metadata);
        this.snackBar.open('Metadata extracted. Please review before confirming.', 'Close', { duration: 3500, panelClass: ['success-snack'] });
      },
      error: (err: HttpErrorResponse) => {
        this.extracting.set(false);
        const msg = err.error?.message || 'Metadata extraction failed';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  saveDraft(): void {
    const paperId = this.paper()?.id;
    if (!paperId || this.form.invalid || !this.canEditDraft()) {
      return;
    }

    this.saving.set(true);
    this.paperService.updateMetadata(paperId, this.buildMetadataPayload()).subscribe({
      next: updated => {
        this.saving.set(false);
        this.paper.set(updated);
        this.snackBar.open('Draft metadata saved', 'Close', { duration: 2500, panelClass: ['success-snack'] });
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Failed to save metadata';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  confirmSubmit(): void {
    const paperId = this.paper()?.id;
    if (!paperId || this.form.invalid || !this.canEditDraft()) {
      return;
    }

    this.submitting.set(true);
    this.paperService.updateMetadata(paperId, this.buildMetadataPayload()).subscribe({
      next: () => {
        this.paperService.submitPaper(paperId).subscribe({
          next: submitted => {
            this.submitting.set(false);
            this.paper.set(submitted);
            this.snackBar.open('Paper submitted successfully. It is now in review queue.', 'Close', { duration: 3500, panelClass: ['success-snack'] });
            this.router.navigate(['/researcher/papers']);
          },
          error: (err: HttpErrorResponse) => {
            this.submitting.set(false);
            const msg = err.error?.message || 'Submit failed';
            this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const msg = err.error?.message || 'Failed to save metadata before submit';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  private loadPaper(paperId: number): void {
    this.paperService.getPaperById(paperId).subscribe({
      next: paper => {
        this.paper.set(paper);
        this.patchFormFromPaper(paper);
        if (paper.status === 'DRAFT') {
          this.extractNow();
        }
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to load paper';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
        this.router.navigate(['/researcher/papers']);
      }
    });
  }

  downloadPaper(): void {
    const paper = this.paper();
    if (!paper) return;

    this.paperService.downloadPaper(paper.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = paper.fileName || 'paper.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Download failed';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  canWithdraw(): boolean {
    const status = this.paper()?.status;
    return status === 'SUBMITTED' || status === 'UNDER_REVIEW';
  }

  withdrawPaper(): void {
    const paper = this.paper();
    if (!paper || !this.canWithdraw() || this.withdrawing()) return;

    const ok = window.confirm('Are you sure? This will notify the reviewer and admin.');
    if (!ok) return;

    this.withdrawing.set(true);
    this.paperService.withdrawPaper(paper.id).subscribe({
      next: updated => {
        this.withdrawing.set(false);
        this.paper.set(updated);
        this.snackBar.open('Paper withdrawn to draft status.', 'Close', { duration: 3500, panelClass: ['success-snack'] });
      },
      error: (err: HttpErrorResponse) => {
        this.withdrawing.set(false);
        const msg = err.error?.message || 'Withdraw failed';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  deleteDraft(): void {
    const paper = this.paper();
    if (!paper || !this.canDeleteDraft() || this.deleting()) return;

    const ok = window.confirm('Delete this draft permanently? This cannot be undone.');
    if (!ok) return;

    this.deleting.set(true);
    this.paperService.deleteDraft(paper.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.snackBar.open('Draft deleted', 'Close', { duration: 3000, panelClass: ['success-snack'] });
        this.router.navigate(['/researcher/papers']);
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        const msg = err.error?.message || 'Failed to delete draft';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  addComment(): void {
    const paper = this.paper();
    const content = this.commentText().trim();
    if (!paper || !content || this.commenting()) return;

    this.commenting.set(true);
    this.paperService.addComment(paper.id, content).subscribe({
      next: () => {
        this.commenting.set(false);
        this.commentText.set('');
        this.loadComments(paper.id);
      },
      error: (err: HttpErrorResponse) => {
        this.commenting.set(false);
        const msg = err.error?.message || 'Failed to add comment';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  private loadComments(paperId: number): void {
    this.paperService.listComments(paperId).subscribe({
      next: comments => this.comments.set(comments || []),
      error: () => this.comments.set([])
    });
  }

  private patchFormFromPaper(paper: PaperResponse): void {
    this.form.patchValue({
      title: paper.title || '',
      abstrakt: paper.abstrakt || '',
      authorsCsv: (paper.authors || []).join(', '),
      keywordsCsv: (paper.keywords || []).join(', '),
      correspondingAuthorEmail: paper.correspondingAuthorEmail || ''
    });
    this.syncPreviewLists();
  }

  private patchFormFromExtracted(extracted: ExtractedMetadataResponse): void {
    this.form.patchValue({
      title: extracted.title || this.form.value.title,
      abstrakt: extracted.abstrakt || this.form.value.abstrakt,
      authorsCsv: (extracted.authors || []).join(', '),
      keywordsCsv: (extracted.keywords || []).join(', '),
      correspondingAuthorEmail: extracted.correspondingAuthorEmail || this.form.value.correspondingAuthorEmail
    });
    this.syncPreviewLists();
  }

  private syncPreviewLists(): void {
    const formValue = this.form.getRawValue();
    this.authors.set(this.csvToList(formValue.authorsCsv));
    this.keywords.set(this.csvToList(formValue.keywordsCsv));
  }

  private buildMetadataPayload(): UpdateMetadataRequest {
    return {
      title: this.cleanText(this.form.value.title),
      abstrakt: this.cleanText(this.form.value.abstrakt),
      authors: this.csvToList(this.form.value.authorsCsv),
      keywords: this.csvToList(this.form.value.keywordsCsv),
      correspondingAuthorEmail: this.cleanText(this.form.value.correspondingAuthorEmail)
    };
  }

  private csvToList(value: string): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private cleanText(value: string): string {
    return (value || '').trim();
  }
}
