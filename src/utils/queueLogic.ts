import {
  AffectedJobImpact,
  ComputedPrintJob,
  JobStatus,
  PrintColor,
  PrintJob,
  QueueState,
  UrgentImpactPreview,
} from '../types/printQueue';

export const STORAGE_KEY = 'printq_campus_queue_v1';

export const SETUP_MINUTES_PER_JOB = 2;
export const BW_MINUTES_PER_PAGE = 1;
export const COLOUR_MINUTES_PER_PAGE = 2;

export function formatToken(num: number): string {
  return `PQ${String(num).padStart(3, '0')}`;
}

export function getJobProcessingMinutes(
  pages: number,
  copies: number,
  color: PrintColor
): { totalPages: number; ratePerPage: number; processingMinutes: number } {
  const totalPages = pages * copies;
  const ratePerPage = color === 'Colour' ? COLOUR_MINUTES_PER_PAGE : BW_MINUTES_PER_PAGE;
  const processingMinutes = totalPages * ratePerPage + SETUP_MINUTES_PER_JOB;
  return { totalPages, ratePerPage, processingMinutes };
}

export function formatPickupClockTime(minutesFromNow: number, referenceDate = new Date()): string {
  const target = new Date(referenceDate.getTime() + minutesFromNow * 60_000);
  return target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function computeQueueJobs(jobs: PrintJob[], referenceDate = new Date()): ComputedPrintJob[] {
  let cumulativeAheadMinutes = 0;
  let activePositionCounter = 0;

  return jobs.map((job) => {
    const { totalPages, ratePerPage, processingMinutes } = getJobProcessingMinutes(
      job.pages,
      job.copies,
      job.color
    );

    if (job.status === 'Ready') {
      return {
        ...job,
        totalPages,
        ratePerPage,
        processingMinutes,
        aheadMinutes: 0,
        estimatedWaitMinutes: 0,
        estimatedPickupTime: 'Ready now',
        activeQueuePosition: null,
      };
    }

    activePositionCounter += 1;
    const aheadMinutes = cumulativeAheadMinutes;
    const estimatedWaitMinutes = aheadMinutes + processingMinutes;
    cumulativeAheadMinutes += processingMinutes;

    return {
      ...job,
      totalPages,
      ratePerPage,
      processingMinutes,
      aheadMinutes,
      estimatedWaitMinutes,
      estimatedPickupTime: formatPickupClockTime(estimatedWaitMinutes, referenceDate),
      activeQueuePosition: activePositionCounter,
    };
  });
}

/**
 * Reorders jobs to simulate marking a specific Pending job as Urgent.
 * Places the urgent job at the front of all Pending jobs (immediately after any currently Printing jobs).
 * Only one active job can hold Urgent status at a time.
 */
export function buildUrgentReorderedJobs(jobs: PrintJob[], targetJobId: string): PrintJob[] {
  const targetIndex = jobs.findIndex((j) => j.id === targetJobId);
  if (targetIndex === -1) return jobs;

  const targetJob = jobs[targetIndex];
  if (targetJob.status === 'Ready') return jobs;

  // Clear urgent flag on any other jobs so only one job is marked Urgent
  const cleared = jobs.map((j) =>
    j.id === targetJobId ? { ...j, isUrgent: true } : { ...j, isUrgent: false }
  );

  // Separate currently Printing jobs at top, then insert targetJob right after them
  const withoutTarget = cleared.filter((j) => j.id !== targetJobId);
  const updatedTarget = cleared.find((j) => j.id === targetJobId)!;

  // Find insertion index: right after the last 'Printing' job
  let insertIndex = 0;
  for (let i = 0; i < withoutTarget.length; i++) {
    if (withoutTarget[i].status === 'Printing') {
      insertIndex = i + 1;
    }
  }

  const reordered = [
    ...withoutTarget.slice(0, insertIndex),
    updatedTarget,
    ...withoutTarget.slice(insertIndex),
  ];

  return reordered;
}

export function previewUrgentImpact(
  jobs: PrintJob[],
  targetJobId: string,
  referenceDate = new Date()
): UrgentImpactPreview | null {
  const beforeComputed = computeQueueJobs(jobs, referenceDate);
  const targetBefore = beforeComputed.find((j) => j.id === targetJobId);
  if (!targetBefore || targetBefore.status === 'Ready') return null;

  const previousUrgentJob =
    beforeComputed.find((j) => j.isUrgent && j.id !== targetJobId && j.status !== 'Ready') ?? null;

  const afterJobs = buildUrgentReorderedJobs(jobs, targetJobId);
  const afterComputed = computeQueueJobs(afterJobs, referenceDate);
  const targetAfter = afterComputed.find((j) => j.id === targetJobId)!;

  const affectedJobs: AffectedJobImpact[] = [];
  for (const afterJob of afterComputed) {
    if (afterJob.id === targetJobId || afterJob.status === 'Ready') continue;
    const beforeJob = beforeComputed.find((b) => b.id === afterJob.id);
    if (!beforeJob) continue;
    const delayMinutes = afterJob.estimatedWaitMinutes - beforeJob.estimatedWaitMinutes;
    if (delayMinutes > 0) {
      affectedJobs.push({
        id: afterJob.id,
        token: afterJob.token,
        documentName: afterJob.documentName,
        oldWaitMinutes: beforeJob.estimatedWaitMinutes,
        newWaitMinutes: afterJob.estimatedWaitMinutes,
        delayMinutes,
      });
    }
  }

  return {
    targetJob: targetBefore,
    newTargetWaitMinutes: targetAfter.estimatedWaitMinutes,
    timeSavedMinutes: Math.max(0, targetBefore.estimatedWaitMinutes - targetAfter.estimatedWaitMinutes),
    newTargetPosition: targetAfter.activeQueuePosition ?? 1,
    previousUrgentJob,
    affectedJobs,
  };
}

export function createSampleQueueState(): QueueState {
  const now = Date.now();
  const sampleJobs: PrintJob[] = [
    {
      id: 'sample-1',
      token: 'PQ001',
      documentName: 'CS301 Operating Systems Lab Manual',
      pages: 8,
      copies: 1,
      color: 'Black & White',
      status: 'Printing',
      isUrgent: false,
      createdAt: new Date(now - 18 * 60_000).toISOString(),
    },
    {
      id: 'sample-2',
      token: 'PQ002',
      documentName: 'Engineering Mechanics Assignment 4',
      pages: 5,
      copies: 2,
      color: 'Black & White',
      status: 'Pending',
      isUrgent: false,
      createdAt: new Date(now - 12 * 60_000).toISOString(),
    },
    {
      id: 'sample-3',
      token: 'PQ003',
      documentName: 'Architecture Studio Portfolio Draft',
      pages: 6,
      copies: 1,
      color: 'Colour',
      status: 'Pending',
      isUrgent: false,
      createdAt: new Date(now - 8 * 60_000).toISOString(),
    },
    {
      id: 'sample-4',
      token: 'PQ004',
      documentName: 'Microeconomics Case Study Notes',
      pages: 4,
      copies: 3,
      color: 'Black & White',
      status: 'Pending',
      isUrgent: false,
      createdAt: new Date(now - 4 * 60_000).toISOString(),
    },
    {
      id: 'sample-5',
      token: 'PQ005',
      documentName: 'IEEE Conference Paper Final Print',
      pages: 10,
      copies: 1,
      color: 'Black & White',
      status: 'Ready',
      isUrgent: false,
      createdAt: new Date(now - 35 * 60_000).toISOString(),
    },
  ];

  return {
    jobs: sampleJobs,
    nextTokenNumber: 6,
  };
}

export function loadQueueState(): QueueState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createSampleQueueState();
      saveQueueState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<QueueState>;
    if (!Array.isArray(parsed.jobs) || typeof parsed.nextTokenNumber !== 'number') {
      const fallback = createSampleQueueState();
      saveQueueState(fallback);
      return fallback;
    }
    return {
      jobs: parsed.jobs,
      nextTokenNumber: parsed.nextTokenNumber,
    };
  } catch {
    return createSampleQueueState();
  }
}

export function saveQueueState(state: QueueState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function getNextSafeTokenNumber(jobs: PrintJob[], currentNext: number): number {
  let maxExisting = 0;
  for (const job of jobs) {
    const match = /^PQ(\d+)$/i.exec(job.token.trim());
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxExisting) {
        maxExisting = num;
      }
    }
  }
  return Math.max(currentNext, maxExisting + 1);
}

export function updateJobStatusInList(
  jobs: PrintJob[],
  jobId: string,
  newStatus: JobStatus
): PrintJob[] {
  const updated = jobs.map((job) => {
    if (job.id !== jobId) return job;
    return {
      ...job,
      status: newStatus,
      // Clear urgent highlight once completed/ready so active queue can accept a new urgent job
      isUrgent: newStatus === 'Ready' ? false : job.isUrgent,
    };
  });

  // Keep Ready jobs below active jobs so active queue order stays clean & contiguous
  const active = updated.filter((j) => j.status !== 'Ready');
  const ready = updated.filter((j) => j.status === 'Ready');
  return [...active, ...ready];
}

export function moveActiveJob(
  jobs: PrintJob[],
  jobId: string,
  direction: 'up' | 'down'
): PrintJob[] {
  const active = jobs.filter((j) => j.status !== 'Ready');
  const ready = jobs.filter((j) => j.status === 'Ready');
  const idx = active.findIndex((j) => j.id === jobId);
  if (idx === -1) return jobs;

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= active.length) return jobs;

  const nextActive = [...active];
  const temp = nextActive[idx];
  nextActive[idx] = nextActive[swapIdx];
  nextActive[swapIdx] = temp;

  return [...nextActive, ...ready];
}
