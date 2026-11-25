import React from 'react';

export type AppRoute = 'home' | 'modules' | 'results' | 'checklist' | 'quiz';

interface TopBarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onQuickStart: () => void;
  hasProgress: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRoute,
  onNavigate,
  onQuickStart,
  hasProgress,
}) => {
  const navItems: { id: AppRoute; label: string }[] = [
    { id: 'home', label: 'Beranda' },
    { id: 'modules', label: 'Daftar Modul' },
    { id: 'results', label: 'Hasil & Progres' },
    { id: 'checklist', label: 'Checklist Hari-H' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-sky-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
        >
          Assessment Perumda
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  isActive
                    ? 'text-sky-700 border-sky-700 font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onQuickStart}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
          >
            {hasProgress ? 'Lanjutkan Latihan' : 'Mulai Bagian 1'}
          </button>
        </div>
      </div>

      {/* Mobile secondary nav row kept compact */}
      <nav className="flex md:hidden items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-white">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2 py-1 text-xs font-medium whitespace-nowrap shrink-0 rounded transition-colors ${
                isActive ? 'text-sky-700 bg-sky-50 font-semibold' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
