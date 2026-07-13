import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaperResponse } from '../models/paper.model';
import { PaperReviewGroupResponse, PlagiarismResult, ReviewResponse, SubmitReviewRequest } from '../models/review.model';

export interface UploadPaperRequest {
  title?: string;
  abstrakt?: string;
  authors?: string;
  keywords?: string;
  correspondingAuthorEmail?: string;
  file: File;
}

export interface ExtractedMetadataResponse {
  title: string;
  abstrakt: string;
  authors: string[];
  keywords: string[];
  correspondingAuthorEmail?: string;
  publicationDate: string;
  arxivId: string;
}

export interface UpdateMetadataRequest {
  title?: string;
  abstrakt?: string;
  authors?: string[];
  keywords?: string[];
  correspondingAuthorEmail?: string;
  publicationDate?: string;
}

export interface SemanticSearchRequest {
  query: string;
  topK?: number;
}

export interface SemanticSearchHit {
  paperId: number;
  title?: string;
  snippet?: string;
  score?: number;
}

export interface SemanticSearchResponse {
  query: string;
  hits: SemanticSearchHit[];
}

export interface SummaryResponse {
  summary: string;
}

export interface FinalizePaperDecisionRequest {
  decision: 'ACCEPTED' | 'REJECTED' | 'REVISION';
}

export interface ChatSource {
  paperId?: number | null;
  title?: string | null;
  snippet?: string | null;
  score?: number | null;
}

export interface ReviewerChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ReviewerChatRequest {
  query: string;
  topK?: number;
}

export interface PaperCommentResponse {
  id: number;
  paperId: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ReviewerSuggestionResponse {
  checkerId: number;
  checkerName: string;
  expertise: string[];
  matchedExpertise: string[];
  activeAssignments: number;
  matchScore: number;
}

export interface AssignmentHistoryResponse {
  id: number;
  paperId: number;
  paperTitle: string;
  researcherName: string;
  checkerId: number;
  checkerName: string;
  assignedById: number;
  assignedByName: string;
  assignedAt: string;
  status: string;
  notes?: string;
}

export interface AssignmentResponse {
  id: number;
  paperId: number;
  paperTitle: string;
  reviewerId: number;
  reviewerName: string;
  reviewerEmail: string;
  assignedAt: string;
  assignmentType: 'AUTO' | 'MANUAL';
  status: 'INVITED' | 'PENDING' | 'IN_REVIEW' | 'SUBMITTED' | 'DECLINED' | 'ACCEPTED' | 'COMPLETED';
}

@Injectable({ providedIn: 'root' })
export class PaperService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadPaper(payload: UploadPaperRequest): Observable<PaperResponse> {
    const formData = new FormData();
    if (payload.title) formData.append('title', payload.title);
    if (payload.abstrakt) formData.append('abstrakt', payload.abstrakt);
    if (payload.authors) formData.append('authors', payload.authors);
    if (payload.keywords) formData.append('keywords', payload.keywords);
    if (payload.correspondingAuthorEmail) formData.append('correspondingAuthorEmail', payload.correspondingAuthorEmail);
    formData.append('file', payload.file);

    return this.http.post<PaperResponse>(`${this.baseUrl}/papers/upload`, formData);
  }

  listMyPapers(): Observable<PaperResponse[]> {
    return this.http.get<PaperResponse[]>(`${this.baseUrl}/papers/me`);
  }

  listPaperReviews(paperId: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.baseUrl}/papers/${paperId}/reviews`);
  }

  getPaperById(paperId: number): Observable<PaperResponse> {
    return this.http.get<PaperResponse>(`${this.baseUrl}/papers/${paperId}`);
  }

  extractMetadata(paperId: number): Observable<ExtractedMetadataResponse> {
    return this.http.post<ExtractedMetadataResponse>(`${this.baseUrl}/papers/${paperId}/extract`, {});
  }

  updateMetadata(paperId: number, payload: UpdateMetadataRequest): Observable<PaperResponse> {
    return this.http.put<PaperResponse>(`${this.baseUrl}/papers/${paperId}/metadata`, payload);
  }

  submitPaper(paperId: number): Observable<PaperResponse> {
    return this.http.put<PaperResponse>(`${this.baseUrl}/papers/${paperId}/submit`, {});
  }

  deleteDraft(paperId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/papers/${paperId}`);
  }

  withdrawPaper(paperId: number): Observable<PaperResponse> {
    return this.http.put<PaperResponse>(`${this.baseUrl}/papers/${paperId}/withdraw`, {});
  }

  downloadPaper(paperId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/papers/${paperId}/download`, { responseType: 'blob' });
  }

  addComment(paperId: number, content: string): Observable<PaperCommentResponse> {
    return this.http.post<PaperCommentResponse>(`${this.baseUrl}/papers/${paperId}/comments`, { content });
  }

  listComments(paperId: number): Observable<PaperCommentResponse[]> {
    return this.http.get<PaperCommentResponse[]>(`${this.baseUrl}/papers/${paperId}/comments`);
  }

  semanticSearch(payload: SemanticSearchRequest): Observable<SemanticSearchResponse> {
    return this.http.post<SemanticSearchResponse>(`${this.baseUrl}/search/semantic`, payload);
  }

  // ── Admin methods ──────────────────────────────────────────────────────────

  listAssignedReviewerPapers(): Observable<PaperResponse[]> {
    return this.http.get<PaperResponse[]>(`${this.baseUrl}/reviewer/papers`);
  }

  submitReviewerReview(paperId: number, payload: FormData): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.baseUrl}/reviewer/papers/${paperId}/review`, payload);
  }

  getReviewerReview(paperId: number): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.baseUrl}/reviewer/papers/${paperId}/review`);
  }

  acceptReviewerInvitation(paperId: number): Observable<AssignmentResponse> {
    return this.http.post<AssignmentResponse>(`${this.baseUrl}/reviewer/papers/${paperId}/accept`, {});
  }

  declineReviewerInvitation(paperId: number, reason?: string): Observable<AssignmentResponse> {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http.post<AssignmentResponse>(`${this.baseUrl}/reviewer/papers/${paperId}/decline`, {}, { params });
  }

  checkReviewerPlagiarism(paperId: number): Observable<PlagiarismResult> {
    return this.http.post<PlagiarismResult>(`${this.baseUrl}/reviewer/papers/${paperId}/plagiarism`, {});
  }

  generateReviewerSummary(paperId: number): Observable<SummaryResponse> {
    return this.http.post<SummaryResponse>(`${this.baseUrl}/reviewer/papers/${paperId}/summary`, {});
  }

  chatReviewerPaper(paperId: number, payload: ReviewerChatRequest): Observable<ReviewerChatResponse> {
    return this.http.post<ReviewerChatResponse>(`${this.baseUrl}/reviewer/papers/${paperId}/chat`, payload);
  }

  listAdminReviews(): Observable<PaperReviewGroupResponse[]> {
    return this.http.get<PaperReviewGroupResponse[]>(`${this.baseUrl}/admin/reviews/grouped`);
  }

  listAssignmentHistory(status?: string, checkerId?: number): Observable<AssignmentHistoryResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (checkerId) params = params.set('checkerId', checkerId);
    return this.http.get<AssignmentHistoryResponse[]>(`${this.baseUrl}/admin/reviews`, { params });
  }

  suggestReviewers(paperId: number): Observable<ReviewerSuggestionResponse[]> {
    return this.http.get<ReviewerSuggestionResponse[]>(`${this.baseUrl}/admin/papers/${paperId}/suggest-reviewers`);
  }

  assignChecker(paperId: number, checkerId: number, notes?: string): Observable<AssignmentResponse> {
    return this.http.post<AssignmentResponse>(`${this.baseUrl}/admin/papers/${paperId}/assign/manual`, { reviewerId: checkerId, notes });
  }

  autoAssignReviewers(paperId: number, desiredCount: number): Observable<AssignmentResponse[]> {
    return this.http.post<AssignmentResponse[]>(`${this.baseUrl}/admin/papers/${paperId}/assign/auto-many`, null, {
      params: { desiredCount }
    });
  }

  getReviewerSuggestions(paperId: number): Observable<ReviewerSuggestionResponse[]> {
    return this.http.get<ReviewerSuggestionResponse[]>(`${this.baseUrl}/admin/papers/${paperId}/suggest-reviewers`);
  }

  bulkAssignReviewers(paperId: number, reviewerIds: number[]): Observable<AssignmentResponse[]> {
    return this.http.post<AssignmentResponse[]>(`${this.baseUrl}/admin/papers/${paperId}/assign/bulk`, { reviewerIds });
  }

  listPaperAssignments(paperId: number): Observable<AssignmentResponse[]> {
    return this.http.get<AssignmentResponse[]>(`${this.baseUrl}/admin/papers/${paperId}/assignments`);
  }

  listAdminReviewsByPaper(paperId: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.baseUrl}/admin/papers/${paperId}/reviews`);
  }

  listAllPapers(status?: string): Observable<PaperResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<PaperResponse[]>(`${this.baseUrl}/admin/papers`, { params });
  }

  updatePaperStatus(paperId: number, status: string): Observable<PaperResponse> {
    return this.http.patch<PaperResponse>(
      `${this.baseUrl}/admin/papers/${paperId}/status`,
      null,
      { params: { value: status } }
    );
  }

  finalizePaperDecision(paperId: number, decision: FinalizePaperDecisionRequest['decision']): Observable<PaperResponse> {
    return this.http.post<PaperResponse>(`${this.baseUrl}/admin/papers/${paperId}/final-decision`, { decision });
  }
}
