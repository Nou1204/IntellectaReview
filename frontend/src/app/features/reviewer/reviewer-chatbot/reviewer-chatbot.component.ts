import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperService } from '../../../core/services/paper';
import { ReviewerChatbotDialogComponent } from './reviewer-chatbot-dialog.component';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  sources?: Array<{ paperId?: number | null; title?: string | null; snippet?: string | null; score?: number | null }>;
}

@Component({
  selector: 'app-reviewer-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <button
      mat-fab
      class="chat-fab"
      (click)="openChatDialog()"
      [attr.aria-label]="'AI Assistant Chat for Paper ' + paperId"
    >
      <mat-icon>smart_toy</mat-icon>
    </button>
  `,
  styles: [`
    .chat-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .chat-fab:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      transform: scale(1.05);
    }

    @media (max-width: 600px) {
      .chat-fab {
        bottom: 16px;
        right: 16px;
      }
    }
  `]
})
export class ReviewerChatbotComponent implements OnInit {
  @Input() paperId!: number;
  @Input() paperTitle: string = '';
  @Input() paperAbstract: string = '';
  @Input() paperKeywords: string[] = [];

  private readonly chatStorageKey = `review_chat_history_`;

  constructor(
    private dialog: MatDialog,
    private paperService: PaperService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.paperId) {
      console.warn('ReviewerChatbotComponent requires paperId input');
    }
  }

  openChatDialog(): void {
    const storedHistory = this.loadChatHistory();
    this.dialog.open(ReviewerChatbotDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
      panelClass: 'reviewer-chat-dialog',
      data: {
        paperId: this.paperId,
        paperTitle: this.paperTitle,
        paperAbstract: this.paperAbstract,
        paperKeywords: this.paperKeywords,
        initialMessages: storedHistory,
        onMessageAdded: (message: ChatMessage) => this.saveChatHistory(message)
      }
    });
  }

  private loadChatHistory(): ChatMessage[] {
    try {
      const key = this.chatStorageKey + this.paperId;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }

  private saveChatHistory(message: ChatMessage): void {
    try {
      const key = this.chatStorageKey + this.paperId;
      const history = this.loadChatHistory();
      history.push(message);
      localStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }
}
