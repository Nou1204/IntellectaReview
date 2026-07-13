export interface PaperResponse {
  id: number;
  title?: string;
  abstrakt?: string;
  authors: string[];
  keywords: string[];
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'FINISHED_REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'REVISION' | 'PORTFOLIO';
  assignmentStatus?: 'INVITED' | 'PENDING' | 'IN_REVIEW' | 'SUBMITTED' | 'DECLINED' | 'ACCEPTED' | 'COMPLETED';
  assignmentType?: 'AUTO' | 'MANUAL';
  assignedAt?: string;
  submittedById?: number;
  submittedByName?: string;
  correspondingAuthorEmail?: string;
  reviewConsensusSummary?: string;
  createdAt: string;
}
