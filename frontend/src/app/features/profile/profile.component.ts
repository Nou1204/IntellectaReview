import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { switchMap } from 'rxjs';
import { UserService } from '../../core/services/user';
import { AuthService } from '../../core/services/auth';
import { PaperService } from '../../core/services/paper';
import { PaperResponse } from '../../core/models/paper.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  expertiseLoading = signal(false);
  editMode = signal(false);
  myPapers = signal<PaperResponse[]>([]);
  

  currentUserName = signal('');
  currentUserEmail = signal('');
  currentUserRole = signal('');
  currentUserAffiliation = signal('');
  readonly reviewerStats = computed(() => {
    const papers = this.myPapers();
    return {
      totalAssigned: papers.length,
      pendingResponses: papers.filter(paper => ['PENDING', 'INVITED'].includes(paper.assignmentStatus || 'PENDING')).length,
      activeReviews: papers.filter(paper => ['ACCEPTED', 'IN_REVIEW'].includes(paper.assignmentStatus || '')).length,
      completedReviews: papers.filter(paper => ['SUBMITTED', 'COMPLETED'].includes(paper.assignmentStatus || '')).length,
      declinedReviews: papers.filter(paper => paper.assignmentStatus === 'DECLINED').length,
      researcherTotal: papers.length,
      researcherInReview: papers.filter(paper => paper.status === 'UNDER_REVIEW').length,
      researcherAccepted: papers.filter(paper => paper.status === 'ACCEPTED').length
    };
  });

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private paperService: PaperService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      bio: [''],
      affiliation: [''],
      expertiseCsv: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getCurrentUser().subscribe({
      next: user => {
        this.authService.setCurrentUser(user);
        this.currentUserName.set(user.name || '');
        this.currentUserEmail.set(user.email || '');
        this.currentUserRole.set(user.role || '');
        this.currentUserAffiliation.set(user.affiliation || '');
        this.form.patchValue({
          name: user.name ?? '',
          bio: user.bio ?? '',
          affiliation: user.affiliation ?? '',
          expertiseCsv: (user.expertise || []).join(', ')
        });
        this.loadRoleData();
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to load profile';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  private loadRoleData(): void {
    this.myPapers.set([]);
    if (this.isResearcher() || this.isChecker()) {
      this.loadMyPapers();
    }
  }

  loadMyPapers(): void {
    this.paperService.listMyPapers().subscribe({
      next: papers => this.myPapers.set(papers || []),
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Failed to load papers';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  isResearcher(): boolean {
    return this.currentUserRole() === 'RESEARCHER';
  }

  isChecker(): boolean {
    return this.currentUserRole() === 'CHECKER';
  }

  isAdmin(): boolean {
    return this.currentUserRole() === 'ADMIN';
  }

  validatedExpertise(): string[] {
    return this.authService.currentUser()?.expertise || [];
  }

  

  saveProfile(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    const profilePayload = {
      name: this.form.value.name,
      bio: this.form.value.bio,
      affiliation: this.form.value.affiliation
    };

    const request$ = this.isAdmin()
      ? this.userService.updateCurrentUserProfile(profilePayload)
      : this.userService.updateCurrentUserProfile(profilePayload).pipe(
          switchMap(() => this.userService.updateCurrentUserExpertise({ expertise: this.csvToList(this.form.value.expertiseCsv) }))
        );

    request$.subscribe({
      next: user => {
        this.loading.set(false);
        this.editMode.set(false);
        this.authService.setCurrentUser(user);
        this.currentUserName.set(user.name || '');
        this.currentUserAffiliation.set(user.affiliation || '');
        this.form.patchValue({ expertiseCsv: (user.expertise || []).join(', ') });
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000, panelClass: ['success-snack'] });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Profile update failed';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  saveExpertise(): void {
    if (this.expertiseLoading()) return;

    const expertise = this.csvToList(this.form.value.expertiseCsv);
    this.expertiseLoading.set(true);
    this.userService.updateCurrentUserExpertise({ expertise }).subscribe({
      next: user => {
        this.expertiseLoading.set(false);
        this.authService.setCurrentUser(user);
        this.form.patchValue({ expertiseCsv: (user.expertise || []).join(', ') });
        this.snackBar.open('Expertise updated successfully', 'Close', { duration: 3000, panelClass: ['success-snack'] });
      },
      error: (err: HttpErrorResponse) => {
        this.expertiseLoading.set(false);
        const msg = err.error?.message || 'Expertise update failed';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'chip-submitted';
      case 'UNDER_REVIEW': return 'chip-under-review';
      case 'FINISHED_REVIEWING': return 'chip-submitted';
      case 'ACCEPTED': return 'chip-accepted';
      case 'REJECTED': return 'chip-rejected';
      case 'REVISION': return 'chip-revision';
      default: return 'chip-draft';
    }
  }

  expertiseTags(): string[] {
    return this.validatedExpertise();
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
}
