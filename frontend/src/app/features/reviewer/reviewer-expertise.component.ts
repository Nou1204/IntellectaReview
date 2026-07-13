import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-reviewer-expertise',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './reviewer-expertise.component.html',
  styleUrl: './reviewer-expertise.component.scss'
})
export class ReviewerExpertiseComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      expertiseRaw: ['']
    });
  }

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: user => {
        this.authService.setCurrentUser(user);
        this.form.patchValue({
          expertiseRaw: (user.expertise || []).join(', ')
        });
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to load expertise';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  save(): void {
    if (this.loading()) return;

    const raw = this.form.value.expertiseRaw as string;
    const expertise = (raw || '')
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    this.loading.set(true);
    this.userService.updateCurrentUserExpertise({ expertise }).subscribe({
      next: user => {
        this.loading.set(false);
        this.authService.setCurrentUser(user);
        this.snackBar.open('Expertise updated', 'Close', { duration: 2500, panelClass: ['success-snack'] });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to update expertise';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }
}
