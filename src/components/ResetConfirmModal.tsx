import { RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  totalJobsCount: number;
  onCancel: () => void;
  onClearAll: () => void;
  onRestoreDemo: () => void;
}

export function ResetConfirmModal({
  isOpen,
  totalJobsCount,
  onCancel,
  onClearAll,
  onRestoreDemo,
}: ResetConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 id="reset-modal-title" className="text-lg font-semibold text-slate-900">
            Reset Printing Queue
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-sm text-slate-600">
          <p>
            You currently have{' '}
            <span className="font-semibold text-slate-900 tabular-nums">{totalJobsCount}</span>{' '}
            {totalJobsCount === 1 ? 'job' : 'jobs'} saved in this browser&apos;s local queue.
          </p>
          <p className="leading-relaxed">
            Choose whether to clear the queue completely or restore the default campus sample jobs
            (<span className="font-mono text-xs text-slate-800">PQ001–PQ005</span>) for a fresh
            walkthrough.
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Clear All Jobs</span>
          </button>
          <button
            type="button"
            onClick={onRestoreDemo}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Restore Demo Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
