import {
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Search,
  Zap,
  ZapOff,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { ComputedPrintJob, JobStatus } from '../types/printQueue';
import { StatusIndicator, UrgentIndicator } from './StatusIndicator';

type FilterTab = 'All' | JobStatus;

interface OperatorDashboardProps {
  jobs: ComputedPrintJob[];
  onChangeStatus: (jobId: string, status: JobStatus) => void;
  onMoveJob: (jobId: string, direction: 'up' | 'down') => void;
  onRequestMarkUrgent: (jobId: string) => void;
  onClearUrgent: (jobId: string) => void;
  onRequestResetQueue: () => void;
  onRestoreDemoQuick: () => void;
  onGoToStudent: () => void;
}

export function OperatorDashboard({
  jobs,
  onChangeStatus,
  onMoveJob,
  onRequestMarkUrgent,
  onClearUrgent,
  onRequestResetQueue,
  onRestoreDemoQuick,
  onGoToStudent,
}: OperatorDashboardProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    let pending = 0;
    let printing = 0;
    let ready = 0;
    let activeMinutes = 0;

    for (const job of jobs) {
      if (job.status === 'Pending') {
        pending += 1;
        activeMinutes += job.processingMinutes;
      } else if (job.status === 'Printing') {
        printing += 1;
        activeMinutes += job.processingMinutes;
      } else {
        ready += 1;
      }
    }

    return {
      all: jobs.length,
      pending,
      printing,
      ready,
      activeMinutes,
    };
  }, [jobs]);

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status !== 'Ready'),
    [jobs]
  );

  const firstActiveId = activeJobs[0]?.id ?? null;
  const lastActiveId = activeJobs[activeJobs.length - 1]?.id ?? null;

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filterTab !== 'All' && job.status !== filterTab) return false;
      if (!q) return true;
      return (
        job.token.toLowerCase().includes(q) ||
        job.documentName.toLowerCase().includes(q) ||
        job.color.toLowerCase().includes(q)
      );
    });
  }, [jobs, filterTab, searchQuery]);

  const urgentJob = useMemo(
    () => jobs.find((j) => j.isUrgent && j.status !== 'Ready') ?? null,
    [jobs]
  );

  const isFiltered = filterTab !== 'All' || searchQuery.trim() !== '';

  return (
    <div className="space-y-8">
      {/* Page Title & Reset Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Shop Operator Console
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Manage print statuses, reorder the live queue, and expedite rush-hour urgent jobs with
            instant waiting-time recalculation.
          </p>
        </div>

        <button
          type="button"
          onClick={onRequestResetQueue}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Reset Queue</span>
        </button>
      </div>

      {/* KPI Summary Grid */}
      <section
        aria-label="Queue Summary Metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Pending Jobs</div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {counts.pending}
          </div>
          <div className="mt-1 text-xs text-slate-500">Waiting to print</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Currently Printing</div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            {counts.printing}
          </div>
          <div className="mt-1 text-xs text-slate-500">Active on press</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Completed (Ready)</div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
            {counts.ready}
          </div>
          <div className="mt-1 text-xs text-slate-500">Ready for student pickup</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Active Queue Backlog</div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {counts.activeMinutes} <span className="text-base font-medium text-slate-500">min</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate">
            {urgentJob ? `Urgent active: ${urgentJob.token}` : 'Standard FIFO order'}
          </div>
        </div>
      </section>

      {/* Main Queue Table Container */}
      <section
        aria-label="Print Queue Management"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Interactive Status Filter Tabs */}
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
            role="tablist"
            aria-label="Filter jobs by status"
          >
            {(
              [
                { key: 'All', label: `All (${counts.all})` },
                { key: 'Pending', label: `Pending (${counts.pending})` },
                { key: 'Printing', label: `Printing (${counts.printing})` },
                { key: 'Ready', label: `Ready (${counts.ready})` },
              ] as { key: FilterTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={filterTab === tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  filterTab === tab.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token or document..."
              aria-label="Search queue jobs"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Empty States */}
        {jobs.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">
                No print jobs in the queue
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                The queue has been cleared. Submit a new print job from the Student Portal or restore
                the demonstration sample jobs.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onRestoreDemoQuick}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                Restore Sample Jobs
              </button>
              <button
                type="button"
                onClick={onGoToStudent}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Open Student Portal
              </button>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-800">
              No print jobs match your current filter or search.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterTab('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                    <th className="py-3 pl-5 pr-3 whitespace-nowrap">Pos</th>
                    <th className="py-3 px-3 whitespace-nowrap">Token</th>
                    <th className="py-3 px-3">Document</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Pages</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Copies</th>
                    <th className="py-3 px-3 whitespace-nowrap">Preference</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Est. Wait</th>
                    <th className="py-3 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3 pl-3 pr-5 text-right whitespace-nowrap">Queue Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredJobs.map((job) => {
                    const isActive = job.status !== 'Ready';
                    const isFirstActive = job.id === firstActiveId;
                    const isLastActive = job.id === lastActiveId;
                    const isHighlightedUrgent = job.isUrgent && isActive;

                    return (
                      <motion.tr
                        key={job.id}
                        layout="position"
                        transition={{ duration: 0.16 }}
                        className={
                          isHighlightedUrgent
                            ? 'bg-amber-50/80 hover:bg-amber-50 transition-colors'
                            : 'bg-white hover:bg-slate-50/80 transition-colors'
                        }
                      >
                        {/* Pos */}
                        <td className="py-3.5 pl-5 pr-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {job.activeQueuePosition !== null ? `#${job.activeQueuePosition}` : 'Done'}
                        </td>

                        {/* Token */}
                        <td className="py-3.5 px-3 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {job.token}
                        </td>

                        {/* Document */}
                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-900 truncate max-w-[260px]">
                              {job.documentName}
                            </span>
                            {isHighlightedUrgent && <UrgentIndicator />}
                          </div>
                          <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                            {job.totalPages} total pages · {job.processingMinutes}m job time
                          </div>
                        </td>

                        {/* Pages */}
                        <td className="py-3.5 px-3 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
                          {job.pages}
                        </td>

                        {/* Copies */}
                        <td className="py-3.5 px-3 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
                          {job.copies}
                        </td>

                        {/* Preference */}
                        <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                          {job.color}
                        </td>

                        {/* Est. Wait */}
                        <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                          {isActive ? (
                            <div>
                              <div className="font-mono font-semibold text-slate-900">
                                {job.estimatedWaitMinutes} min
                              </div>
                              <div className="font-mono text-xs text-slate-500">
                                ~{job.estimatedPickupTime}
                              </div>
                            </div>
                          ) : (
                            <span className="font-mono text-xs font-medium text-emerald-700">
                              0 min · Ready
                            </span>
                          )}
                        </td>

                        {/* Status Selector */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Change status for ${job.token}`}
                              value={job.status}
                              onChange={(e) =>
                                onChangeStatus(job.id, e.target.value as JobStatus)
                              }
                              className={`h-9 px-2.5 text-xs font-medium rounded-lg border bg-white focus:outline-none focus:ring-2 transition-colors ${
                                job.status === 'Ready'
                                  ? 'border-emerald-300 text-emerald-800 focus:ring-emerald-100'
                                  : job.status === 'Printing'
                                  ? 'border-blue-300 text-blue-800 focus:ring-blue-100'
                                  : 'border-amber-300 text-amber-900 focus:ring-amber-100'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Printing">Printing</option>
                              <option value="Ready">Ready</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions: Move Up / Move Down / Urgent */}
                        <td className="py-3.5 pl-3 pr-5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={!isActive || isFirstActive || isFiltered}
                              onClick={() => onMoveJob(job.id, 'up')}
                              title={
                                isFiltered
                                  ? 'Switch to All tab to reorder'
                                  : 'Move up in queue'
                              }
                              aria-label={`Move ${job.token} up in queue`}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={!isActive || isLastActive || isFiltered}
                              onClick={() => onMoveJob(job.id, 'down')}
                              title={
                                isFiltered
                                  ? 'Switch to All tab to reorder'
                                  : 'Move down in queue'
                              }
                              aria-label={`Move ${job.token} down in queue`}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>

                            {isHighlightedUrgent ? (
                              <button
                                type="button"
                                onClick={() => onClearUrgent(job.id)}
                                className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
                              >
                                <ZapOff className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Unmark Urgent</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!isActive}
                                onClick={() => onRequestMarkUrgent(job.id)}
                                className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-white border border-amber-300 hover:bg-amber-50 disabled:opacity-35 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                                <span>Mark Urgent</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-200">
              {filteredJobs.map((job) => {
                const isActive = job.status !== 'Ready';
                const isFirstActive = job.id === firstActiveId;
                const isLastActive = job.id === lastActiveId;
                const isHighlightedUrgent = job.isUrgent && isActive;

                return (
                  <div
                    key={job.id}
                    className={`p-4 space-y-3 ${
                      isHighlightedUrgent ? 'bg-amber-50/80' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {job.token}
                          </span>
                          {job.activeQueuePosition !== null && (
                            <>
                              <span className="text-slate-300" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-mono text-slate-600 tabular-nums">
                                Pos #{job.activeQueuePosition}
                              </span>
                            </>
                          )}
                          {isHighlightedUrgent && (
                            <>
                              <span className="text-slate-300" aria-hidden="true">
                                ·
                              </span>
                              <UrgentIndicator />
                            </>
                          )}
                        </div>
                        <h3 className="mt-1 font-medium text-slate-900 break-words">
                          {job.documentName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                          {job.pages}p × {job.copies} {job.copies === 1 ? 'copy' : 'copies'} ·{' '}
                          {job.color}
                        </p>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        <div className="font-mono text-sm font-bold text-slate-900">
                          {isActive ? `${job.estimatedWaitMinutes} min` : '0 min'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isActive ? `~${job.estimatedPickupTime}` : 'Ready'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={job.status} compact />
                        <select
                          aria-label={`Change status for ${job.token}`}
                          value={job.status}
                          onChange={(e) => onChangeStatus(job.id, e.target.value as JobStatus)}
                          className="h-10 px-2.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Printing">Printing</option>
                          <option value="Ready">Ready</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!isActive || isFirstActive || isFiltered}
                          onClick={() => onMoveJob(job.id, 'up')}
                          aria-label={`Move ${job.token} up`}
                          className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-35"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!isActive || isLastActive || isFiltered}
                          onClick={() => onMoveJob(job.id, 'down')}
                          aria-label={`Move ${job.token} down`}
                          className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-35"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        {isHighlightedUrgent ? (
                          <button
                            type="button"
                            onClick={() => onClearUrgent(job.id)}
                            className="h-10 px-3 inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <ZapOff className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Unmark</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!isActive}
                            onClick={() => onRequestMarkUrgent(job.id)}
                            className="h-10 px-3 inline-flex items-center gap-1 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded-lg disabled:opacity-35"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                            <span>Urgent</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {isFiltered && activeJobs.length > 1 && (
        <p className="text-xs text-slate-500">
          Tip: Queue reordering (Move Up / Move Down) is enabled on the &ldquo;All&rdquo; tab with
          no active search filter so queue positions remain unambiguous.
        </p>
      )}
    </div>
  );
}
