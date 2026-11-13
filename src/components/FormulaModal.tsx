import { Calculator, X } from 'lucide-react';
import { useEffect } from 'react';
import {
  BW_MINUTES_PER_PAGE,
  COLOUR_MINUTES_PER_PAGE,
  SETUP_MINUTES_PER_JOB,
} from '../utils/queueLogic';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaModal({ isOpen, onClose }: FormulaModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-blue-700 shrink-0" aria-hidden="true" />
            <h2 id="formula-modal-title" className="text-lg font-semibold text-slate-900">
              Waiting Time Calculation Formula
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-700">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs sm:text-sm text-slate-900 leading-relaxed">
            <div>Total Pages = Pages × Copies</div>
            <div>Job Time = (Total Pages × Page Rate) + {SETUP_MINUTES_PER_JOB} min Setup</div>
            <div className="mt-1 pt-1 border-t border-slate-200 font-semibold">
              Est. Wait = Sum(Jobs Ahead) + Job Time
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-semibold text-slate-900">Standard Shop Assumptions</h3>
            <ul className="space-y-1.5 text-slate-600 tabular-nums">
              <li className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Black &amp; White printing speed</span>
                <span className="font-mono font-medium text-slate-900">
                  {BW_MINUTES_PER_PAGE} min / page
                </span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Colour printing speed</span>
                <span className="font-mono font-medium text-slate-900">
                  {COLOUR_MINUTES_PER_PAGE} min / page
                </span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Setup &amp; paper calibration per job</span>
                <span className="font-mono font-medium text-slate-900">
                  +{SETUP_MINUTES_PER_JOB} min / job
                </span>
              </li>
              <li className="flex items-center justify-between py-1">
                <span>Completed (&ldquo;Ready&rdquo;) jobs</span>
                <span className="font-mono font-medium text-emerald-700">0 min remaining</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/70 border border-blue-200 rounded-lg p-3.5">
            <span className="font-semibold text-slate-900">Example:</span> A 5-page document with 2
            copies in Colour takes <span className="font-mono">(5 × 2 × 2) + 2 = 22 mins</span>.
            If active jobs ahead take 12 mins total, your estimated wait is{' '}
            <span className="font-mono font-semibold text-slate-900">34 mins</span>. Reordering,
            marking Urgent, or marking earlier jobs Ready updates every estimate immediately.
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
