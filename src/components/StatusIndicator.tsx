import { CheckCircle2, Clock, Printer, Zap } from 'lucide-react';
import { JobStatus } from '../types/printQueue';

interface StatusIndicatorProps {
  status: JobStatus;
  compact?: boolean;
}

export function StatusIndicator({ status, compact = false }: StatusIndicatorProps) {
  if (status === 'Printing') {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-blue-700 whitespace-nowrap">
        <Printer className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
        <span>Printing</span>
      </span>
    );
  }

  if (status === 'Ready') {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
        <span>Ready</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 whitespace-nowrap">
      <Clock className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span>Pending</span>
    </span>
  );
}

export function UrgentIndicator() {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-red-700 whitespace-nowrap">
      <Zap className="w-3.5 h-3.5 shrink-0 fill-red-600 text-red-600" aria-hidden="true" />
      <span>Urgent</span>
    </span>
  );
}
