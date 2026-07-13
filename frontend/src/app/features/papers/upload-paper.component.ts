import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PaperService } from '../../core/services/paper';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-upload-paper',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  templateUrl: './upload-paper.component.html',
  styleUrl: './upload-paper.component.scss'
})
export class UploadPaperComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  selectedFile: File | null = null;
  dragging = false;

  constructor(
    private fb: FormBuilder,
    private paperService: PaperService,
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      title: [''],
      abstrakt: [''],
      authors: [''],
      keywords: [''],
      correspondingAuthorEmail: ['', Validators.email]
    });
  }

  ngOnInit(): void {
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      this.selectedFile = null;
      input.value = '';
      this.snackBar.open('Only PDF files are accepted.', 'Close', { duration: 3000, panelClass: ['error-snack'] });
      return;
    }
    this.selectedFile = file;
  }

  fileSizeMb(): string {
    return this.selectedFile ? (this.selectedFile.size / 1024 / 1024).toFixed(2) : '0.00';
  }

  backRoute(): string {
    const role = this.authService.currentUser()?.role;
    if (role === 'CHECKER') return '/reviewer/assignments';
    return '/researcher/papers';
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

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file?.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      this.snackBar.open('Only PDF files are accepted.', 'Close', { duration: 3000, panelClass: ['error-snack'] });
    }
  }

  upload(): void {
    if (!this.selectedFile || this.loading() || this.form.invalid) return;

    this.loading.set(true);
    this.paperService.uploadPaper({ ...this.form.value, file: this.selectedFile }).subscribe({
      next: (paper) => {
        this.loading.set(false);
        this.selectedFile = null;
        this.form.reset();
        const role = this.authService.currentUser()?.role;
        if (role === 'CHECKER') {
          this.snackBar.open('Portfolio paper uploaded. Expertise will be refreshed from keywords.', 'Close', { duration: 4500, panelClass: ['success-snack'] });
        } else {
          this.snackBar.open('Paper uploaded as draft. Next step: extract and confirm metadata.', 'Close', { duration: 4500, panelClass: ['success-snack'] });
          this.router.navigate(['/researcher/papers', paper.id]);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Paper upload failed';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }
}
