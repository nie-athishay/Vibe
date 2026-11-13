import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormulaModal } from './components/FormulaModal';
import { ActiveView, Header } from './components/Header';
import { OperatorDashboard } from './components/OperatorDashboard';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { StudentDashboard } from './components/StudentDashboard';
import { UrgentConfirmModal } from './components/UrgentConfirmModal';
import { JobStatus, PrintColor, PrintJob, QueueState } from './types/printQueue';
import {
  STORAGE_KEY,
  buildUrgentReorderedJobs,
  computeQueueJobs,
  createSampleQueueState,
  formatToken,
  getNextSafeTokenNumber,
  loadQueueState,
  moveActiveJob,
  previewUrgentImpact,
  saveQueueState,
  updateJobStatusInList,
} from './utils/queueLogic';

export default function App() {
  const [queueState, setQueueState] = useState<QueueState>(() => loadQueueState());
  const [activeView, setActiveView] = useState<ActiveView>('student');
  const [lastSubmittedToken, setLastSubmittedToken] = useState<string | null>(null);
  const [trackedToken, setTrackedToken] = useState<string>(() => {
    const initial = loadQueueState();
    return initial.jobs[0]?.token ?? '';
  });
  const [urgentCandidateId, setUrgentCandidateId] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [nowTick, setNowTick] = useState<Date>(() => new Date());

  // Persist state to localStorage whenever queueState changes
  useEffect(() => {
    saveQueueState(queueState);
  }, [queueState]);

  // Keep pickup clock times fresh every 30s
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(new Date());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Sync across multiple browser tabs if opened side-by-side
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as QueueState;
          if (Array.isArray(parsed.jobs) && typeof parsed.nextTokenNumber === 'number') {
            setQueueState(parsed);
          }
        } catch {
          // Ignore malformed storage events
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const computedJobs = useMemo(
    () => computeQueueJobs(queueState.jobs, nowTick),
    [queueState.jobs, nowTick]
  );

  const urgentImpactPreview = useMemo(() => {
    if (!urgentCandidateId) return null;
    return previewUrgentImpact(queueState.jobs, urgentCandidateId, nowTick);
  }, [queueState.jobs, urgentCandidateId, nowTick]);

  const handleSubmitJob = useCallback(
    (input: {
      documentName: string;
      pages: number;
      copies: number;
      color: PrintColor;
    }): { success: boolean; token?: string; error?: string } => {
      const trimmedName = input.documentName.trim();
      if (!trimmedName) {
        return { success: false, error: 'Document name is required.' };
      }
      if (!Number.isInteger(input.pages) || input.pages <= 0) {
        return { success: false, error: 'Number of pages must be at least 1.' };
      }
      if (!Number.isInteger(input.copies) || input.copies <= 0) {
        return { success: false, error: 'Number of copies must be at least 1.' };
      }

      let generatedToken = '';
      setQueueState((prev) => {
        const safeNum = getNextSafeTokenNumber(prev.jobs, prev.nextTokenNumber);
        generatedToken = formatToken(safeNum);
        const newJob: PrintJob = {
          id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          token: generatedToken,
          documentName: trimmedName,
          pages: input.pages,
          copies: input.copies,
          color: input.color,
          status: 'Pending',
          isUrgent: false,
          createdAt: new Date().toISOString(),
        };

        // Insert new active job after existing active jobs and before completed (Ready) jobs
        const active = prev.jobs.filter((j) => j.status !== 'Ready');
        const ready = prev.jobs.filter((j) => j.status === 'Ready');
        return {
          jobs: [...active, newJob, ...ready],
          nextTokenNumber: safeNum + 1,
        };
      });

      setLastSubmittedToken(generatedToken);
      setTrackedToken(generatedToken);
      setNowTick(new Date());
      return { success: true, token: generatedToken };
    },
    []
  );

  const handleChangeStatus = useCallback((jobId: string, status: JobStatus) => {
    setQueueState((prev) => ({
      ...prev,
      jobs: updateJobStatusInList(prev.jobs, jobId, status),
    }));
    setNowTick(new Date());
  }, []);

  const handleMoveJob = useCallback((jobId: string, direction: 'up' | 'down') => {
    setQueueState((prev) => ({
      ...prev,
      jobs: moveActiveJob(prev.jobs, jobId, direction),
    }));
    setNowTick(new Date());
  }, []);

  const handleRequestMarkUrgent = useCallback((jobId: string) => {
    setUrgentCandidateId(jobId);
  }, []);

  const handleConfirmUrgent = useCallback((jobId: string) => {
    setQueueState((prev) => ({
      ...prev,
      jobs: buildUrgentReorderedJobs(prev.jobs, jobId),
    }));
    setUrgentCandidateId(null);
    setNowTick(new Date());
  }, []);

  const handleClearUrgent = useCallback((jobId: string) => {
    setQueueState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) => (j.id === jobId ? { ...j, isUrgent: false } : j)),
    }));
  }, []);

  const handleClearAllJobs = useCallback(() => {
    setQueueState({
      jobs: [],
      nextTokenNumber: 1,
    });
    setLastSubmittedToken(null);
    setTrackedToken('');
    setUrgentCandidateId(null);
    setIsResetModalOpen(false);
  }, []);

  const handleRestoreDemo = useCallback(() => {
    const sample = createSampleQueueState();
    setQueueState(sample);
    setLastSubmittedToken(null);
    setTrackedToken(sample.jobs[0]?.token ?? '');
    setUrgentCandidateId(null);
    setIsResetModalOpen(false);
    setNowTick(new Date());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenFormula={() => setIsFormulaModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'student' ? (
          <StudentDashboard
            jobs={computedJobs}
            lastSubmittedToken={lastSubmittedToken}
            trackedToken={trackedToken}
            onChangeTrackedToken={setTrackedToken}
            onSubmitJob={handleSubmitJob}
            onClearReceipt={() => setLastSubmittedToken(null)}
            onOpenFormula={() => setIsFormulaModalOpen(true)}
          />
        ) : (
          <OperatorDashboard
            jobs={computedJobs}
            onChangeStatus={handleChangeStatus}
            onMoveJob={handleMoveJob}
            onRequestMarkUrgent={handleRequestMarkUrgent}
            onClearUrgent={handleClearUrgent}
            onRequestResetQueue={() => setIsResetModalOpen(true)}
            onRestoreDemoQuick={handleRestoreDemo}
            onGoToStudent={() => setActiveView('student')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>PrintQ Campus Printing Queue</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsFormulaModalOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Waiting Time Formula
            </button>
            <span aria-hidden="true">·</span>
            <span>Queue saved in browser storage</span>
          </div>
        </div>
      </footer>

      <UrgentConfirmModal
        preview={urgentImpactPreview}
        onCancel={() => setUrgentCandidateId(null)}
        onConfirm={handleConfirmUrgent}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        totalJobsCount={queueState.jobs.length}
        onCancel={() => setIsResetModalOpen(false)}
        onClearAll={handleClearAllJobs}
        onRestoreDemo={handleRestoreDemo}
      />

      <FormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />
    </div>
  );
}
