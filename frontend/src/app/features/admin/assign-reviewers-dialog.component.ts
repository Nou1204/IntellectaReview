import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AssignmentResponse, PaperService, ReviewerSuggestionResponse } from '../../core/services/paper';
import { PaperResponse } from '../../core/models/paper.model';
import { UserResponse } from '../../core/models/auth.model';
import { UserService } from '../../core/services/user';

export interface AssignReviewersDialogData {
  paper: PaperResponse;
}

interface SelectedReviewer {
  id: number;
  name: string;
  email: string;
  expertise: string[];
  matchScore: number;
  selected: boolean;
  assigned: boolean;
  rank: number;
  matchedExpertise: string[];
  activeAssignments: number;
}

@Component({
  selector: 'app-assign-reviewers-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-shell">
      <header class="dialog-head">
        <div>
          <p class="eyebrow">Administration</p>
          <h2 mat-dialog-title>Manage Assignments with AI Matching</h2>
          <p class="paper-title"><strong>Paper:</strong> {{ data.paper.title || data.paper.fileName }}</p>
        </div>
        <button mat-icon-button type="button" mat-dialog-close aria-label="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-dialog-content>
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading active reviewers and AI rankings...</p>
          </div>
        } @else {
          <p class="helper-text">AI-ranked reviewers appear first. Select 3 reviewers whose expertise matches the paper.</p>

          <div class="reviewer-list">
            @for (reviewer of reviewerRows(); track reviewer.id) {
              <article class="reviewer-card" [class.selected]="reviewer.selected" [class.assigned]="reviewer.assigned" (click)="toggleReviewer(reviewer.id)">
                <div class="rank-pill">#{{ reviewer.rank }}</div>

                <div class="reviewer-main">
                  <div class="reviewer-topline">
                    <div>
                      <h3>{{ reviewer.name }}</h3>
                      <p>{{ reviewer.email }}</p>
                    </div>

                    @if (reviewer.assigned) {
                      <span class="assignment-badge assigned">Already assigned</span>
                    } @else {
                      <span class="assignment-badge available">Available</span>
                    }
                  </div>

                  <div class="expertise-block">
                    <span class="section-label">Expertise</span>
                    @if (reviewer.expertise.length > 0) {
                      <div class="expertise-chips">
                        @for (exp of reviewer.expertise; track exp) {
                          <span class="expertise-chip" [class.match]="reviewer.matchedExpertise.includes(exp)">{{ exp }}</span>
                        }
                      </div>
                    } @else {
                      <span class="muted">No expertise listed</span>
                    }
                  </div>

                  <div class="reviewer-footer">
                    <span class="match-state" [class.matched]="reviewer.matchScore > 0">
                      {{ reviewer.matchScore > 0 ? 'Expertise matched' : 'No direct match' }}
                    </span>

                    <mat-checkbox
                      [checked]="reviewer.selected"
                      [disabled]="reviewer.assigned || (remainingReviewerSlots() === 0 && !reviewer.selected)"
                      (click)="$event.stopPropagation()"
                      (change)="toggleReviewer(reviewer.id)"
                    >
                      Select
                    </mat-checkbox>
                  </div>
                </div>
              </article>
            }

            @if (reviewerRows().length === 0) {
              <p class="no-reviewers">No active reviewers found.</p>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]>Cancel</button>
        <button 
          mat-raised-button 
          color="primary"
          [disabled]="selectedCount() === 0 || selectedCount() > remainingReviewerSlots() || loading()"
          (click)="confirmAssignment()"
        >
          Assign Selected Reviewer(s)
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-shell {
      box-sizing: border-box;
      width: min(980px, calc(100vw - 32px));
      max-width: 100%;
    }

    .dialog-head {
      align-items: flex-start;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px 0;
    }

    .eyebrow {
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin: 0 0 6px;
      text-transform: uppercase;
    }

    mat-dialog-content {
      box-sizing: border-box;
      max-height: 70vh;
      overflow-y: auto;
      padding: 16px 24px 20px;
      width: 100%;
    }

    .paper-title {
      color: #555;
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 16px;
      color: #999;
    }

    .helper-text,
    .paper-title {
      color: #64748b;
      font-size: 0.9rem;
    }

    .helper-text {
      margin: 8px 0 16px;
    }

    .reviewer-list {
      display: grid;
      gap: 12px;
      width: 100%;
    }

    .reviewer-card {
      box-sizing: border-box;
      align-items: flex-start;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      display: flex;
      gap: 14px;
      padding: 16px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      cursor: pointer;
    }

    .reviewer-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
      transform: translateY(-1px);
    }

    .reviewer-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .reviewer-card.assigned {
      opacity: 0.82;
      cursor: default;
    }

    .rank-pill {
      align-items: center;
      background: #0f172a;
      border-radius: 999px;
      color: #fff;
      display: inline-flex;
      font-size: 0.8rem;
      font-weight: 700;
      justify-content: center;
      min-width: 46px;
      padding: 7px 10px;
      flex: 0 0 auto;
    }

    .reviewer-main {
      min-width: 0;
      display: grid;
      gap: 12px;
      flex: 1;
    }

    .reviewer-topline {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .reviewer-topline h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .reviewer-topline p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 0.88rem;
    }

    .assignment-badge,
    .match-state {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .assignment-badge.available {
      background: #ecfdf5;
      color: #047857;
    }

    .assignment-badge.assigned {
      background: #fef3c7;
      color: #b45309;
    }

    .match-state {
      background: #f1f5f9;
      color: #475569;
    }

    .match-state.matched {
      background: #dcfce7;
      color: #166534;
    }

    .expertise-block {
      display: grid;
      gap: 8px;
    }

    .section-label {
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .expertise-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .expertise-chip {
      align-items: center;
      background: #f8fafc;
      border: 1px solid #dbe4ee;
      border-radius: 999px;
      color: #334155;
      display: inline-flex;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 6px 10px;
    }

    .expertise-chip.match {
      background: #dcfce7;
      border-color: #86efac;
      color: #166534;
    }

    .reviewer-footer {
      align-items: center;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .no-reviewers {
      padding: 20px;
      text-align: center;
      color: #999;
    }

    .muted {
      color: #64748b;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 12px;

      button {
        min-width: 100px;
      }
    }

    @media (max-width: 900px) {
      .dialog-shell {
        min-width: 0;
      }

      .reviewer-card,
      .reviewer-topline,
      .reviewer-footer {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class AssignReviewersDialogComponent implements OnInit {
  loading = signal(true);
  reviewerRows = signal<SelectedReviewer[]>([]);
  suggestions = signal<ReviewerSuggestionResponse[]>([]);
  private activeAssignments = signal<AssignmentResponse[]>([]);

  constructor(
    public dialogRef: MatDialogRef<AssignReviewersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignReviewersDialogData,
    private paperService: PaperService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReviewers();
  }

  loadReviewers(): void {
    this.loading.set(true);
    forkJoin({
      users: this.userService.listUsers('CHECKER', 'ACTIVE'),
      assignments: this.paperService.listPaperAssignments(this.data.paper.id),
      suggestions: this.paperService.getReviewerSuggestions(this.data.paper.id).pipe(
        catchError(() => of([] as ReviewerSuggestionResponse[]))
      )
    }).subscribe({
      next: ({ users, assignments, suggestions }) => {
        this.suggestions.set(suggestions || []);
        this.activeAssignments.set(assignments || []);
        this.buildReviewersList(users || [], suggestions || [], assignments || []);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to load reviewers';
        this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['error-snack'] });
      }
    });
  }

  private buildReviewersList(users: UserResponse[], suggestions: ReviewerSuggestionResponse[], assignments: AssignmentResponse[]): void {
    const suggestionMap = new Map(suggestions.map((suggestion, index) => [suggestion.checkerId, { suggestion, index }] as const));
    const assignedReviewerIds = new Set(assignments.map(assignment => assignment.reviewerId));

    const reviewersList = users
      .map(u => {
        const matched = suggestionMap.get(u.id)?.suggestion;
        const matchedIndex = suggestionMap.get(u.id)?.index ?? 0;
        return {
          id: u.id,
          name: u.name || 'Unknown',
          email: u.email,
          expertise: u.expertise || [],
          matchScore: matched?.matchScore || 0,
          selected: false,
          assigned: assignedReviewerIds.has(u.id),
          rank: matchedIndex + 1,
          matchedExpertise: matched?.matchedExpertise || [],
          activeAssignments: assignments.filter(item => item.reviewerId === u.id && item.status !== 'DECLINED').length
        };
      })
      .sort((a, b) => {
        if (a.assigned !== b.assigned) {
          return a.assigned ? 1 : -1;
        }
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        if (a.activeAssignments !== b.activeAssignments) {
          return a.activeAssignments - b.activeAssignments;
        }
        return a.name.localeCompare(b.name);
      });

    this.reviewerRows.set(reviewersList);
  }

  toggleReviewer(reviewerId: number): void {
    this.reviewerRows.update(list =>
      list.map(r =>
        r.id === reviewerId && !r.assigned ? { ...r, selected: !r.selected } : r
      )
    );
  }

  isMatchedExpertise(reviewer: SelectedReviewer, expertise: string): boolean {
    const suggestion = this.suggestions().find(s => s.checkerId === reviewer.id);
    return suggestion?.matchedExpertise?.includes(expertise) || false;
  }

  selectedCount(): number {
    return this.reviewerRows().filter(r => r.selected).length;
  }

  activeAssignmentCount(): number {
    return this.activeAssignments()
      .filter(assignment => assignment.status !== 'DECLINED')
      .length;
  }

  remainingReviewerSlots(): number {
    return Math.max(0, 3 - this.activeAssignmentCount());
  }

  clearAll(): void {
    this.reviewerRows.update(list =>
      list.map(r => ({ ...r, selected: false }))
    );
  }

  confirmAssignment(): void {
    const selectedIds = this.reviewerRows()
      .filter(r => r.selected)
      .map(r => r.id);

    this.dialogRef.close(selectedIds);
  }
}
