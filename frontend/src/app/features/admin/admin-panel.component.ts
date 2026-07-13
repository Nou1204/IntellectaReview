import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user';
import { UserResponse } from '../../core/models/auth.model';

interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit {
  private dialog = inject(MatDialog);
  users = signal<UserResponse[]>([]);
  roleFilter = signal('');
  statusFilter = signal('');
  displayedColumns = ['user', 'email', 'role', 'status', 'actions'];

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  countByStatus(status: string): number {
    return this.users().filter(u => u.status === status).length;
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(value);
    this.loadUsers();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.listUsers(this.roleFilter() || undefined, this.statusFilter() || undefined).subscribe({
      next: data => this.users.set(data),
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to load users';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }



  setStatus(user: UserResponse, status: string): void {
    const actionLabel = status === 'SUSPENDED' ? 'Suspend user account?' : 'Activate user account?';
    this.openConfirmDialog(actionLabel, 'This change affects immediate platform access.').afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.userService.updateUserStatus(user.id, status).subscribe({
        next: () => {
          this.snackBar.open('User status updated', 'Close', { duration: 2500, panelClass: ['success-snack'] });
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message || 'Failed to update status';
          this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
        }
      });
    });
  }

  setRole(user: UserResponse, role: string): void {
    this.openConfirmDialog(`Change role to ${role}?`, 'Administrative permissions will update immediately.').afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.userService.updateUserRole(user.id, role).subscribe({
        next: () => {
          this.snackBar.open('User role updated', 'Close', { duration: 2500, panelClass: ['success-snack'] });
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message || 'Failed to update role';
          this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
        }
      });
    });
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return 'U';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  roleClass(role: string): string {
    if (role === 'ADMIN') return 'role-admin';
    if (role === 'CHECKER') return 'role-checker';
    return 'role-researcher';
  }

  statusClass(status: string): string {
    if (status === 'ACTIVE') return 'badge-active';
    if (status === 'SUSPENDED') return 'badge-suspended';
    return 'badge-pending';
  }

  private openConfirmDialog(title: string, description: string) {
    return this.dialog.open(AdminActionConfirmDialogComponent, {
      data: { title, description },
      width: '420px'
    });
  }
}

@Component({
  selector: 'app-admin-action-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <section class="confirm-dialog">
      <div class="warning-icon"><mat-icon>warning</mat-icon></div>
      <h2>{{ data.title }}</h2>
      <p>{{ data.description }}</p>
      <footer>
        <button mat-stroked-button (click)="dialogRef.close(false)">Cancel</button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)">Confirm</button>
      </footer>
    </section>
  `,
  styles: [`
    .confirm-dialog {
      display: grid;
      gap: 14px;
      text-align: center;
      padding: 6px;
    }

    .warning-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      margin: 0 auto;
      display: grid;
      place-items: center;
      background: #fff4eb;
      color: var(--color-warning);
    }

    .warning-icon mat-icon {
      width: 28px;
      height: 28px;
      font-size: 28px;
    }

    h2 {
      font-family: var(--font-heading);
      font-size: var(--text-2xl);
      margin: 0;
    }

    p {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }

    footer {
      display: flex;
      justify-content: center;
      gap: 8px;
    }
  `]
})
export class AdminActionConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { title: string; description: string };
  dialogRef = inject(MatDialogRef<AdminActionConfirmDialogComponent>);
}
