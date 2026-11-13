export type PrintColor = 'Black & White' | 'Colour';

export type JobStatus = 'Pending' | 'Printing' | 'Ready';

export interface PrintJob {
  id: string;
  token: string;
  documentName: string;
  pages: number;
  copies: number;
  color: PrintColor;
  status: JobStatus;
  isUrgent: boolean;
  createdAt: string;
}

export interface ComputedPrintJob extends PrintJob {
  totalPages: number;
  ratePerPage: number;
  processingMinutes: number;
  aheadMinutes: number;
  estimatedWaitMinutes: number;
  estimatedPickupTime: string;
  activeQueuePosition: number | null;
}

export interface QueueState {
  jobs: PrintJob[];
  nextTokenNumber: number;
}

export interface AffectedJobImpact {
  id: string;
  token: string;
  documentName: string;
  oldWaitMinutes: number;
  newWaitMinutes: number;
  delayMinutes: number;
}

export interface UrgentImpactPreview {
  targetJob: ComputedPrintJob;
  newTargetWaitMinutes: number;
  timeSavedMinutes: number;
  newTargetPosition: number;
  previousUrgentJob: ComputedPrintJob | null;
  affectedJobs: AffectedJobImpact[];
}
