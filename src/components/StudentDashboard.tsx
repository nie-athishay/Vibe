import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useMemo, useState } from 'react';
import { ComputedPrintJob, PrintColor } from '../types/printQueue';
import {
  BW_MINUTES_PER_PAGE,
  COLOUR_MINUTES_PER_PAGE,
  SETUP_MINUTES_PER_JOB,
  formatPickupClockTime,
  getJobProcessingMinutes,
} from '../utils/queueLogic';
import { StatusIndicator, UrgentIndicator } from './StatusIndicator';

interface StudentDashboardProps {
  jobs: ComputedPrintJob[];
  lastSubmittedToken: string | null;
  trackedToken: string;
  onChangeTrackedToken: (token: string) => void;
  onSubmitJob: (input: {
    documentName: string;
    pages: number;
    copies: number;
    color: PrintColor;
  }) => { success: boolean; token?: string; error?: string };
  onClearReceipt: () => void;
  onOpenFormula: () => void;
}

export function StudentDashboard({
  jobs,
  lastSubmittedToken,
  trackedToken,
  onChangeTrackedToken,
  onSubmitJob,
  onClearReceipt,
  onOpenFormula,
}: StudentDashboardProps) {
  const [documentName, setDocumentName] = useState('');
  const [pagesInput, setPagesInput] = useState('5');
  const [copiesInput, setCopiesInput] = useState('1');
  const [color, setColor] = useState<PrintColor>('Black & White');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    documentName?: string;
    pages?: string;
    copies?: string;
  }>({});

  const [lookupInput, setLookupInput] = useState(trackedToken);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const parsedPages = Number(pagesInput);
  const parsedCopies = Number(copiesInput);
  const validPreviewNumbers =
    Number.isInteger(parsedPages) &&
    parsedPages >= 1 &&
    Number.isInteger(parsedCopies) &&
    parsedCopies >= 1;

  const activeBacklogMinutes = useMemo(
    () =>
      jobs
        .filter((j) => j.status !== 'Ready')
        .reduce((sum, j) => sum + j.processingMinutes, 0),
    [jobs]
  );

  const activeJobsCount = useMemo(
    () => jobs.filter((j) => j.status !== 'Ready').length,
    [jobs]
  );

  const livePreview = useMemo(() => {
    if (!validPreviewNumbers) return null;
    const { totalPages, processingMinutes } = getJobProcessingMinutes(
      parsedPages,
      parsedCopies,
      color
    );
    const totalWait = activeBacklogMinutes + processingMinutes;
    return {
      totalPages,
      processingMinutes,
      totalWait,
      pickupTime: formatPickupClockTime(totalWait),
    };
  }, [validPreviewNumbers, parsedPages, parsedCopies, color, activeBacklogMinutes]);

  const submittedJob = useMemo(() => {
    if (!lastSubmittedToken) return null;
    return jobs.find((j) => j.token === lastSubmittedToken) ?? null;
  }, [jobs, lastSubmittedToken]);

  const trackedJob = useMemo(() => {
    const normalized = trackedToken.trim().toUpperCase();
    if (!normalized) return null;
    return jobs.find((j) => j.token.toUpperCase() === normalized) ?? null;
  }, [jobs, trackedToken]);

  const handleStep = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    current: string,
    delta: number,
    field: 'pages' | 'copies'
  ) => {
    const num = parseInt(current, 10);
    const base = Number.isNaN(num) ? 1 : num;
    const next = Math.max(1, Math.min(500, base + delta));
    setter(String(next));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { documentName?: string; pages?: string; copies?: string } = {};

    const trimmedName = documentName.trim();
    if (!trimmedName) {
      errors.documentName = 'Enter a document name to identify your print job.';
    } else if (trimmedName.length < 2) {
      errors.documentName = 'Document name must be at least 2 characters.';
    }

    const p = Number(pagesInput);
    if (!pagesInput.trim() || Number.isNaN(p) || !Number.isInteger(p) || p <= 0) {
      errors.pages = 'Pages must be a whole number of 1 or more.';
    } else if (p > 500) {
      errors.pages = 'Maximum 500 pages per single print job.';
    }

    const c = Number(copiesInput);
    if (!copiesInput.trim() || Number.isNaN(c) || !Number.isInteger(c) || c <= 0) {
      errors.copies = 'Copies must be a whole number of 1 or more.';
    } else if (c > 200) {
      errors.copies = 'Maximum 200 copies per single print job.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the highlighted fields before submitting your print job.');
      return;
    }

    const result = onSubmitJob({
      documentName: trimmedName,
      pages: p,
      copies: c,
      color,
    });

    if (!result.success) {
      setFormError(result.error ?? 'Could not submit print job.');
      return;
    }

    setFormError(null);
    setFieldErrors({});
    setDocumentName('');
    setPagesInput('5');
    setCopiesInput('1');
    setColor('Black & White');
    if (result.token) {
      setLookupInput(result.token);
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupInput.trim().toUpperCase();
    if (!trimmed) {
      setLookupError('Enter a token number such as PQ001.');
      return;
    }
    const found = jobs.find((j) => j.token.toUpperCase() === trimmed);
    if (!found) {
      setLookupError(`No job found for token "${trimmed}". Check the queue list below.`);
      return;
    }
    setLookupError(null);
    onChangeTrackedToken(found.token);
  };

  const handleQuickSelectToken = (token: string) => {
    setLookupInput(token);
    setLookupError(null);
    onChangeTrackedToken(token);
  };

  const activeStepIndex = (job: ComputedPrintJob) => {
    if (job.status === 'Ready') return 2;
    if (job.status === 'Printing') return 1;
    return 0;
  };

  return (
    <div className="space-y-8">
      {/* Page Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Student Print Portal
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Submit your print request to receive a unique queue token, live waiting time estimate,
            and real-time pickup status.
          </p>
        </div>

        {/* Clean inline summary strip (unboxed text, tabular figures) */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 tabular-nums shrink-0">
          <div>
            Active Queue:{' '}
            <span className="font-semibold text-slate-900">{activeJobsCount} jobs</span>
          </div>
          <span className="text-slate-300" aria-hidden="true">
            |
          </span>
          <div>
            Current Backlog:{' '}
            <span className="font-mono font-semibold text-slate-900">
              {activeBacklogMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Success Receipt Banner when a job was just submitted */}
      <AnimatePresence>
        {submittedJob && (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            aria-live="polite"
            className="bg-white border border-emerald-300 rounded-xl p-6 shadow-xs"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>Print job submitted successfully — your token is confirmed</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {submittedJob.token}
                  </span>
                  <span className="text-base font-semibold text-slate-800">
                    {submittedJob.documentName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600 tabular-nums">
                  <span>
                    {submittedJob.pages} {submittedJob.pages === 1 ? 'page' : 'pages'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {submittedJob.copies} {submittedJob.copies === 1 ? 'copy' : 'copies'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{submittedJob.color}</span>
                  <span aria-hidden="true">·</span>
                  <StatusIndicator status={submittedJob.status} compact />
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6 tabular-nums shrink-0">
                <div>
                  <div className="text-xs font-medium text-slate-500">Est. Waiting Time</div>
                  <div className="font-mono text-2xl font-bold text-slate-900">
                    {submittedJob.status === 'Ready'
                      ? '0 min'
                      : `${submittedJob.estimatedWaitMinutes} min`}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Est. Pickup Time</div>
                  <div className="font-mono text-lg font-semibold text-blue-700">
                    {submittedJob.estimatedPickupTime}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClearReceipt}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main 2-column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Print Job Form */}
        <section
          aria-labelledby="submit-job-heading"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
        >
          <div className="mb-6">
            <h2 id="submit-job-heading" className="text-lg font-semibold text-slate-900">
              Submit Print Job
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter your document specifications. No file upload required — bring or send your file
              with your token at pickup.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Document Name */}
            <div>
              <label
                htmlFor="doc-name"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Document Name
              </label>
              <div className="relative">
                <FileText
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="doc-name"
                  type="text"
                  maxLength={100}
                  value={documentName}
                  onChange={(e) => {
                    setDocumentName(e.target.value);
                    if (fieldErrors.documentName) {
                      setFieldErrors((prev) => ({ ...prev, documentName: undefined }));
                    }
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. CS301 Data Structures Assignment.pdf"
                  aria-invalid={Boolean(fieldErrors.documentName)}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.documentName
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
              </div>
              {fieldErrors.documentName && (
                <p className="mt-1.5 text-xs text-red-700">{fieldErrors.documentName}</p>
              )}
            </div>

            {/* Pages & Copies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="num-pages"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Number of Pages
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label="Decrease pages"
                    onClick={() => handleStep(setPagesInput, pagesInput, -1, 'pages')}
                    className="h-10 w-10 shrink-0 flex items-center justify-center border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                  >
                    −
                  </button>
                  <input
                    id="num-pages"
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={pagesInput}
                    onChange={(e) => {
                      setPagesInput(e.target.value);
                      if (fieldErrors.pages) {
                        setFieldErrors((prev) => ({ ...prev, pages: undefined }));
                      }
                      if (formError) setFormError(null);
                    }}
                    aria-invalid={Boolean(fieldErrors.pages)}
                    className={`w-full h-10 px-3 text-center font-mono text-sm tabular-nums bg-white border text-slate-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.pages
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="Increase pages"
                    onClick={() => handleStep(setPagesInput, pagesInput, 1, 'pages')}
                    className="h-10 w-10 shrink-0 flex items-center justify-center border border-l-0 border-slate-300 rounded-r-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
                {fieldErrors.pages && (
                  <p className="mt-1.5 text-xs text-red-700">{fieldErrors.pages}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="num-copies"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Number of Copies
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label="Decrease copies"
                    onClick={() => handleStep(setCopiesInput, copiesInput, -1, 'copies')}
                    className="h-10 w-10 shrink-0 flex items-center justify-center border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                  >
                    −
                  </button>
                  <input
                    id="num-copies"
                    type="number"
                    min={1}
                    max={200}
                    step={1}
                    value={copiesInput}
                    onChange={(e) => {
                      setCopiesInput(e.target.value);
                      if (fieldErrors.copies) {
                        setFieldErrors((prev) => ({ ...prev, copies: undefined }));
                      }
                      if (formError) setFormError(null);
                    }}
                    aria-invalid={Boolean(fieldErrors.copies)}
                    className={`w-full h-10 px-3 text-center font-mono text-sm tabular-nums bg-white border text-slate-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.copies
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="Increase copies"
                    onClick={() => handleStep(setCopiesInput, copiesInput, 1, 'copies')}
                    className="h-10 w-10 shrink-0 flex items-center justify-center border border-l-0 border-slate-300 rounded-r-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
                {fieldErrors.copies && (
                  <p className="mt-1.5 text-xs text-red-700">{fieldErrors.copies}</p>
                )}
              </div>
            </div>

            {/* Printing Preference */}
            <div>
              <span className="block text-sm font-medium text-slate-800 mb-1.5">
                Printing Preference
              </span>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Printing Preference">
                <button
                  type="button"
                  role="radio"
                  aria-checked={color === 'Black & White'}
                  onClick={() => setColor('Black & White')}
                  className={`px-4 py-3 text-left border rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    color === 'Black & White'
                      ? 'border-blue-700 bg-blue-50/70 text-slate-900 ring-1 ring-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-semibold">Black &amp; White</div>
                  <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {BW_MINUTES_PER_PAGE} min / page
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={color === 'Colour'}
                  onClick={() => setColor('Colour')}
                  className={`px-4 py-3 text-left border rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    color === 'Colour'
                      ? 'border-blue-700 bg-blue-50/70 text-slate-900 ring-1 ring-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <span>Colour</span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {COLOUR_MINUTES_PER_PAGE} min / page
                  </div>
                </button>
              </div>
            </div>

            {/* Live Pre-Submission Calculation Preview */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-sm tabular-nums">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Print Volume</span>
                <span className="font-mono font-medium text-slate-900">
                  {livePreview ? `${livePreview.totalPages} pages` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>This Job Processing (+{SETUP_MINUTES_PER_JOB}m setup)</span>
                <span className="font-mono font-medium text-slate-900">
                  {livePreview ? `${livePreview.processingMinutes} min` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Active Queue Ahead</span>
                <span className="font-mono font-medium text-slate-900">
                  {activeBacklogMinutes} min ({activeJobsCount}{' '}
                  {activeJobsCount === 1 ? 'job' : 'jobs'})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Estimated Total Wait</span>
                <span className="font-mono text-base font-bold text-blue-700">
                  {livePreview
                    ? `${livePreview.totalWait} min (${livePreview.pickupTime})`
                    : 'Enter valid counts'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Submit Print Job
            </button>
          </form>

          {/* Visible Waiting Time Formula Summary */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Formula: (Pages × Copies × {color === 'Colour' ? '2m' : '1m'}) + 2m setup + queue
              ahead
            </span>
            <button
              type="button"
              onClick={onOpenFormula}
              className="text-blue-700 hover:underline font-medium text-left sm:text-right whitespace-nowrap"
            >
              View full formula
            </button>
          </div>
        </section>

        {/* Right Column: Live Job Status Tracker + Active Queue Snapshot */}
        <section
          aria-labelledby="track-job-heading"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <h2 id="track-job-heading" className="text-lg font-semibold text-slate-900">
              Track Your Print Status
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter your token number or select a token from the live campus queue below.
            </p>
          </div>

          {/* Token Search Bar */}
          <form onSubmit={handleLookupSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={lookupInput}
                  onChange={(e) => {
                    setLookupInput(e.target.value);
                    if (lookupError) setLookupError(null);
                  }}
                  placeholder="Enter token (e.g. PQ002)"
                  aria-label="Token lookup"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Track Token
              </button>
            </div>
            {lookupError && <p className="text-xs text-red-700">{lookupError}</p>}
          </form>

          {/* Tracked Job Details */}
          {trackedJob ? (
            <div
              className={`pt-5 border-t border-slate-200 space-y-5 ${
                trackedJob.isUrgent && trackedJob.status !== 'Ready'
                  ? 'bg-amber-50/50 -mx-6 sm:-mx-8 px-6 sm:px-8 py-5 border-b border-amber-200'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                      {trackedJob.token}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <StatusIndicator status={trackedJob.status} />
                    {trackedJob.isUrgent && trackedJob.status !== 'Ready' && (
                      <>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <UrgentIndicator />
                      </>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-slate-900 break-words">
                    {trackedJob.documentName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    {trackedJob.pages} {trackedJob.pages === 1 ? 'page' : 'pages'} ·{' '}
                    {trackedJob.copies} {trackedJob.copies === 1 ? 'copy' : 'copies'} (
                    {trackedJob.totalPages} total) · {trackedJob.color}
                  </p>
                </div>

                <div className="text-right shrink-0 tabular-nums">
                  <div className="text-xs text-slate-500">
                    {trackedJob.status === 'Ready' ? 'Pickup' : 'Est. Wait'}
                  </div>
                  <div
                    className={`font-mono text-xl font-bold ${
                      trackedJob.status === 'Ready' ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {trackedJob.status === 'Ready'
                      ? 'Ready'
                      : `${trackedJob.estimatedWaitMinutes} min`}
                  </div>
                  {trackedJob.status !== 'Ready' && (
                    <div className="text-xs text-slate-500 font-mono">
                      ~{trackedJob.estimatedPickupTime}
                    </div>
                  )}
                </div>
              </div>

              {/* 3-Step Status Stepper */}
              <div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Pending', icon: Clock },
                    { label: 'Printing', icon: Printer },
                    { label: 'Ready', icon: CheckCircle2 },
                  ].map((step, index) => {
                    const currentIdx = activeStepIndex(trackedJob);
                    const reached = index <= currentIdx;
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-colors ${
                            reached
                              ? currentIdx === 2
                                ? 'bg-emerald-600'
                                : 'bg-blue-700'
                              : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            reached ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{step.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wait breakdown or Ready message */}
              {trackedJob.status === 'Ready' ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 font-medium">
                  Your print job is complete and ready for collection at the Print Shop counter.
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 tabular-nums pt-1">
                  <span>
                    Queue Position:{' '}
                    <strong className="font-mono text-slate-900">
                      #{trackedJob.activeQueuePosition}
                    </strong>
                  </span>
                  <span>
                    Breakdown:{' '}
                    <span className="font-mono text-slate-800">
                      {trackedJob.aheadMinutes}m ahead + {trackedJob.processingMinutes}m print &amp;
                      setup
                    </span>
                  </span>
                </div>
              )}

              {trackedJob.isUrgent && trackedJob.status !== 'Ready' && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                  <Zap className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
                  <span>Expedited to priority position by the shop operator.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-5 border-t border-slate-200 text-sm text-slate-500">
              Select a token below or submit a new print job to view live progress.
            </div>
          )}

          {/* Live Queue Snapshot (clickable token buttons for quick inspection) */}
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Live Campus Queue ({jobs.length})
              </h3>
              <span className="text-xs text-slate-500">Click any job to track</span>
            </div>

            {jobs.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                No jobs currently in the queue. Submit a print job on the left to begin.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                {jobs.map((job) => {
                  const isSelected = trackedJob?.token === job.token;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => handleQuickSelectToken(job.token)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                        job.isUrgent && job.status !== 'Ready'
                          ? 'bg-amber-50/70 hover:bg-amber-50'
                          : isSelected
                          ? 'bg-blue-50/60 hover:bg-blue-50/80'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            {job.token}
                          </span>
                          {job.activeQueuePosition !== null && (
                            <>
                              <span className="text-slate-300" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-mono text-slate-500 tabular-nums">
                                #{job.activeQueuePosition}
                              </span>
                            </>
                          )}
                          {job.isUrgent && job.status !== 'Ready' && (
                            <>
                              <span className="text-slate-300" aria-hidden="true">
                                ·
                              </span>
                              <UrgentIndicator />
                            </>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-slate-800 truncate">
                          {job.documentName}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-xs tabular-nums">
                        <StatusIndicator status={job.status} compact />
                        <span className="font-mono font-semibold text-slate-700 w-14 text-right">
                          {job.status === 'Ready' ? '0m' : `${job.estimatedWaitMinutes}m`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
