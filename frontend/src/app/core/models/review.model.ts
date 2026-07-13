export type ReviewDecision = 'STRONG_ACCEPT' | 'WEAK_ACCEPT' | 'WEAK_REJECT' | 'STRONG_REJECT';

export interface SubmitReviewRequest {
  overallScore: number;
  originalityScore: number;
  clarityScore: number;
  methodologyScore: number;
  comments: string;
  decision: ReviewDecision;
}

export interface ReviewResponse {
  id: number;
  paperId: number;
  paperTitle?: string;
  reviewerId: number;
  reviewerName?: string;
  overallScore: number;
  originalityScore: number;
  clarityScore: number;
  methodologyScore: number;
  comments?: string;
  reviewFileUrl?: string;
  reviewFileName?: string;
  reviewFileSize?: number;
  decision?: ReviewDecision;
  aiSummary?: string;
  plagiarismScore?: number | null;
  submittedAt?: string;
  createdAt?: string;
}

export interface PlagiarismResult {
  paperId?: number | null;
  paperTitle?: string | null;
  similarityScore?: number | null;
  flagged: boolean;
}

export interface PaperReviewerWorkflowResponse {
  assignmentId?: number;
  reviewerId?: number;
  reviewerName?: string;
  reviewerEmail?: string;
  assignmentStatus?: 'INVITED' | 'PENDING' | 'IN_REVIEW' | 'SUBMITTED' | 'DECLINED' | 'ACCEPTED' | 'COMPLETED';
  assignmentType?: 'AUTO' | 'MANUAL';
  assignedAt?: string;
  reviewId?: number | null;
  decision?: ReviewDecision | string | null;
  comments?: string | null;
  overallScore?: number | null;
  originalityScore?: number | null;
  clarityScore?: number | null;
  methodologyScore?: number | null;
  submittedAt?: string | null;
  reviewFileUrl?: string | null;
  reviewFileName?: string | null;
}

export interface PaperReviewGroupResponse {
  paperId: number;
  paperTitle?: string;
  submittedById?: number | null;
  submittedByName?: string | null;
  paperStatus?: string | null;
  overallReviewProgress?: string | null;
  globalStatus?: string | null;
  submittedReviewsCount?: number;
  totalAssignments?: number;
  reviewerAllocations: PaperReviewerWorkflowResponse[];
}
