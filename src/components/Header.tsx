export type ActiveView = 'student' | 'operator';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenFormula: () => void;
}

export function Header({ activeView, onSelectView, onOpenFormula }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectView('student')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          PrintQ
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium" aria-label="Primary Navigation">
          <button
            type="button"
            onClick={() => onSelectView('student')}
            className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeView === 'student'
                ? 'border-blue-700 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Student Dashboard
          </button>
          <button
            type="button"
            onClick={() => onSelectView('operator')}
            className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeView === 'operator'
                ? 'border-blue-700 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Shop Operator
          </button>
          <button
            type="button"
            onClick={onOpenFormula}
            className="py-5 border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Wait Formula
          </button>
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onSelectView(activeView === 'student' ? 'operator' : 'student')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {activeView === 'student' ? 'Operator Console' : 'Submit Print Job'}
          </button>
        </div>
      </div>

      {/* Compact mobile view switcher */}
      <div className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onSelectView('student')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeView === 'student' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => onSelectView('operator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeView === 'operator' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Operator
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenFormula}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
        >
          Wait Formula
        </button>
      </div>
    </header>
  );
}
