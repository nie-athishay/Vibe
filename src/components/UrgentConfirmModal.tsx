import { AlertTriangle, ArrowRight, X, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { UrgentImpactPreview } from '../types/printQueue';

interface UrgentConfirmModalProps {
  preview: UrgentImpactPreview | null;
  onCancel: () => void;
  onConfirm: (jobId: string) => void;
}

export function UrgentConfirmModal({
  preview,
  onCancel,
  onConfirm,
}: UrgentConfirmModalProps) {
  useEffect(() => {
    if (!preview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preview, onCancel]);

  if (!preview) return null;

  const {
    targetJob,
    newTargetWaitMinutes,
    timeSavedMinutes,
    newTargetPosition,
    previousUrgentJob,
    affectedJobs,
  } = preview;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
            <h2 id="urgent-modal-title" className="text-lg font-semibold text-slate-900">
              Confirm Urgent Rush-Hour Priority
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Warning notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            <p className="font-semibold mb-1">Other students&apos; print jobs may be delayed</p>
            <p className="text-amber-800 leading-relaxed">
              Marking <span className="font-mono font-semibold">{targetJob.token}</span> as Urgent
              moves it ahead of all standard pending jobs in the queue. Waiting times for students
              currently ahead of this request will increase automatically.
            </p>
          </div>

          {previousUrgentJob && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              Only one job can hold Urgent priority at a time.{' '}
              <span className="font-mono font-semibold text-slate-900">
                {previousUrgentJob.token}
              </span>{' '}
              ({previousUrgentJob.documentName}) will return to standard queue priority.
            </div>
          )}

          {/* Target job summary */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="font-mono font-semibold text-slate-900">{targetJob.token}</span>
                  <span aria-hidden="true">·</span>
                  <span>Target Urgent Job</span>
                </div>
                <p className="mt-1 font-medium text-slate-900 truncate">{targetJob.documentName}</p>
                <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                  {targetJob.pages} pages · {targetJob.copies}{' '}
                  {targetJob.copies === 1 ? 'copy' : 'copies'} · {targetJob.color}
                </p>
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <div className="text-xs text-slate-500">New Queue Pos</div>
                <div className="font-mono text-base font-bold text-slate-900">
                  #{newTargetPosition}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
              <div className="flex items-center gap-2 text-slate-700">
                <span>Estimated wait:</span>
                <span className="font-mono text-slate-500 line-through">
                  {targetJob.estimatedWaitMinutes} min
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span className="font-mono font-semibold text-emerald-700">
                  {newTargetWaitMinutes} min
                </span>
              </div>
              <span className="font-medium text-emerald-700">
                {timeSavedMinutes > 0 ? `Saves ${timeSavedMinutes} min` : 'Already first pending'}
              </span>
            </div>
          </div>

          {/* Affected students impact list */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Estimated Impact on Waiting Students ({affectedJobs.length})
            </h3>

            {affectedJobs.length === 0 ? (
              <p className="text-sm text-slate-600 py-3 border border-slate-200 rounded-lg px-4 bg-white">
                No other waiting jobs sit ahead of this request, so no other students&apos; waiting
                times will increase.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
                {affectedJobs.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {item.token}
                        </span>
                        <span className="text-slate-700 truncate">{item.documentName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 tabular-nums">
                      <span className="text-xs text-slate-500 font-mono">
                        {item.oldWaitMinutes}m → {item.newWaitMinutes}m
                      </span>
                      <span className="font-mono text-xs font-semibold text-red-700">
                        +{item.delayMinutes}m delay
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(targetJob.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          >
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span>Confirm Urgent Priority</span>
          </button>
        </div>
      </div>
    </div>
  );
}
