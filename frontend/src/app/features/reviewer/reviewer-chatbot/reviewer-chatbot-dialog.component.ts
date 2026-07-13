import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaperService } from '../../../core/services/paper';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  sources?: Array<{ paperId?: number | null; title?: string | null; snippet?: string | null; score?: number | null }>;
}

interface DialogData {
  paperId: number;
  paperTitle: string;
  paperAbstract: string;
  paperKeywords: string[];
  initialMessages: ChatMessage[];
  onMessageAdded: (message: ChatMessage) => void;
}

@Component({
  selector: 'app-reviewer-chatbot-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h2>Paper Assistant</h2>
        <p class="paper-title">{{ data.paperTitle }}</p>
        <button mat-icon-button [mat-dialog-close]>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="chat-messages" #messagesContainer>
        @if (messages().length === 0) {
          <div class="empty-state">
            <mat-icon>help_outline</mat-icon>
            <p>Ask me anything about this paper</p>
            <small>Your conversation will be saved</small>
          </div>
        }

        @for (msg of messages(); track msg.timestamp) {
          <div class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            <div class="message-content">
              <div class="message-text" [innerHTML]="formatMessage(msg.text)"></div>
              @if (msg.sources && msg.sources.length > 0) {
                <div class="message-sources">
                  <small>Sources:</small>
                  @for (source of msg.sources; track source.score) {
                    <div class="source-item">
                      <strong>{{ source.title }}</strong>
                      @if (source.snippet) {
                        <p>{{ source.snippet }}</p>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (chatLoading()) {
          <div class="message assistant">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p class="thinking-text">AI is thinking...</p>
            </div>
          </div>
        }
      </div>

      <div class="chat-input-area">
        <mat-form-field appearance="outline" class="chat-input-field">
          <mat-label>Ask about this paper...</mat-label>
          <input
            matInput
            [(ngModel)]="inputText"
            (keyup.enter)="sendMessage()"
            [disabled]="chatLoading()"
            placeholder="What would you like to know?"
          />
          <button
            mat-icon-button
            matSuffix
            (click)="sendMessage()"
            [disabled]="!inputText.trim() || chatLoading()"
          >
            <mat-icon>send</mat-icon>
          </button>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      font-family: 'Roboto', sans-serif;
    }

    .chat-header {
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
      }

      .paper-title {
        margin: 4px 0 0 0;
        font-size: 0.85rem;
        opacity: 0.9;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      button {
        color: white;
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #fafafa;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }

      p {
        margin: 8px 0;
        font-weight: 500;
      }

      small {
        color: #bbb;
      }
    }

    .message {
      display: flex;
      animation: slideIn 0.3s ease-out;

      &.user {
        justify-content: flex-end;
      }

      &.assistant {
        justify-content: flex-start;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-content {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      word-wrap: break-word;

      .user & {
        background: #667eea;
        color: white;
        border-bottom-right-radius: 2px;
      }

      .assistant & {
        background: white;
        color: #333;
        border: 1px solid #ddd;
        border-bottom-left-radius: 2px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }

    .message-text {
      font-size: 0.95rem;
      line-height: 1.5;
      white-space: pre-wrap;

      ::ng-deep {
        b, strong {
          font-weight: 600;
        }
      }
    }

    .message-sources {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      font-size: 0.85rem;

      small {
        display: block;
        margin-bottom: 8px;
        color: #666;
        font-weight: 500;
      }
    }

    .source-item {
      margin-bottom: 8px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;

      strong {
        display: block;
        color: #333;
        margin-bottom: 4px;
      }

      p {
        margin: 0;
        color: #666;
        font-size: 0.8rem;
      }
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      align-items: center;

      span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #999;
        animation: pulse 1.4s infinite;

        &:nth-child(1) {
          animation-delay: 0s;
        }
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 1;
      }
    }

    .thinking-text {
      margin: 8px 0 0 0;
      font-size: 0.85rem;
      color: #999;
      font-style: italic;
    }

    .chat-input-area {
      padding: 16px;
      background: white;
      border-top: 1px solid #ddd;
      border-radius: 0 0 8px 8px;
    }

    .chat-input-field {
      width: 100%;
    }

    ::ng-deep {
      .chat-input-field {
        .mat-mdc-form-field-focus-overlay {
          background-color: rgba(102, 126, 234, 0.04);
        }
      }
    }
  `]
})
export class ReviewerChatbotDialogComponent implements OnInit {
  messages = signal<ChatMessage[]>([]);
  inputText = '';
  chatLoading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<ReviewerChatbotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private paperService: PaperService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.messages.set(this.data.initialMessages);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendMessage(): void {
    const query = this.inputText.trim();
    if (!query || this.chatLoading()) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      text: query,
      timestamp: Date.now()
    };
    this.messages.update(m => [...m, userMessage]);
    this.data.onMessageAdded(userMessage);
    this.inputText = '';
    this.scrollToBottom();

    // Send to AI service
    this.chatLoading.set(true);
    this.paperService.chatReviewerPaper(this.data.paperId, {
      query,
      topK: 0
    }).subscribe({
      next: (response) => {
        this.chatLoading.set(false);
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          text: response.answer || 'Could not generate a response.',
          timestamp: Date.now(),
          sources: response.sources || []
        };
        this.messages.update(m => [...m, assistantMessage]);
        this.data.onMessageAdded(assistantMessage);
        this.scrollToBottom();
      },
      error: (err: HttpErrorResponse) => {
        this.chatLoading.set(false);
        const msg = err.error?.message || 'Failed to get AI response';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      }
    });
  }

  formatMessage(text: string): string {
    // Convert markdown-style formatting to HTML
    let formatted = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/^- (.*?)(<br>|$)/gm, '• $1$2');
    return formatted;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
