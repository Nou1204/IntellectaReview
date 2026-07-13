import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
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
    MatSnackBarModule
  ],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  done = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  private token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.snackBar.open('Reset token is missing', 'Close', { duration: 3500, panelClass: ['error-snack'] });
      this.router.navigate(['/auth/login']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    const newPassword = this.form.value.newPassword as string;
    const confirmPassword = this.form.value.confirmPassword as string;
    if (newPassword !== confirmPassword) {
      this.snackBar.open('Passwords do not match', 'Close', { duration: 3000, panelClass: ['error-snack'] });
      return;
    }

    this.loading.set(true);
    this.authService.resetPassword({ token: this.token, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to reset password';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
