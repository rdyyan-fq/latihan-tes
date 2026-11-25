import { useState, useMemo } from 'react';
import { TopBar, AppRoute } from './components/TopBar';
import { ModuleCatalog } from './components/ModuleCatalog';
import { McqQuizRunner } from './components/McqQuizRunner';
import { LikertQuizRunner } from './components/LikertQuizRunner';
import { StarPracticeRunner } from './components/StarPracticeRunner';
import { SimulationsRunner } from './components/SimulationsRunner';
import { GuidesRunner } from './components/GuidesRunner';
import { ResultsOverview } from './components/ResultsOverview';
import { allModules, getModuleById } from './data';
import { ModuleProgress, QuizMode } from './types/assessment';
import {
  clearAllProgress,
  loadAllProgress,
  loadQuizMode,
  saveModuleProgress,
  saveQuizMode,
} from './utils/storage';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [activeModuleId, setActiveModuleId] = useState<string>('b1-tpa');
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgress>>(() =>
    loadAllProgress()
  );
  const [quizMode, setQuizMode] = useState<QuizMode>(() => loadQuizMode());

  const hasProgress = useMemo(
    () => Object.keys(progressMap).length > 0,
    [progressMap]
  );

  const handleChangeQuizMode = (mode: QuizMode) => {
    setQuizMode(mode);
    saveQuizMode(mode);
  };

  const handleSaveProgress = (progress: ModuleProgress) => {
    const updated = saveModuleProgress(progress);
    setProgressMap(updated);
  };

  const handleResetAll = () => {
    const cleared = clearAllProgress();
    setProgressMap(cleared);
  };

  const openModule = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setRoute(moduleId === 'b4-checklist' ? 'checklist' : 'quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (nextRoute: AppRoute) => {
    if (nextRoute === 'checklist') {
      setActiveModuleId('b4-checklist');
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickStart = () => {
    const nextUnfinished = allModules.find((m) => !progressMap[m.id]?.completed);
    const target = nextUnfinished ?? allModules[0];
    if (target) {
      openModule(target.id);
    }
  };

  const activeModule = getModuleById(activeModuleId);
  const activeIndex = allModules.findIndex((m) => m.id === activeModuleId);
  const nextModule =
    activeIndex >= 0 && activeIndex < allModules.length - 1
      ? allModules[activeIndex + 1]
      : undefined;

  const renderActiveModule = () => {
    if (!activeModule) return null;
    const saved = progressMap[activeModule.id];
    const onBack = () => handleNavigate('modules');
    const onNext = nextModule ? () => openModule(nextModule.id) : undefined;

    switch (activeModule.kind) {
      case 'mcq':
        return (
          <McqQuizRunner
            module={activeModule}
            quizMode={quizMode}
            onChangeMode={handleChangeQuizMode}
            savedProgress={saved}
            onSaveProgress={handleSaveProgress}
            onBack={onBack}
            onNextModule={onNext}
          />
        );
      case 'likert':
        return (
          <LikertQuizRunner
            module={activeModule}
            savedProgress={saved}
            onSaveProgress={handleSaveProgress}
            onBack={onBack}
            onNextModule={onNext}
          />
        );
      case 'star':
      case 'essay':
        return (
          <StarPracticeRunner
            module={activeModule}
            savedProgress={saved}
            onSaveProgress={handleSaveProgress}
            onBack={onBack}
            onNextModule={onNext}
          />
        );
      case 'lgd':
      case 'inbasket':
        return (
          <SimulationsRunner
            module={activeModule}
            savedProgress={saved}
            onSaveProgress={handleSaveProgress}
            onBack={onBack}
            onNextModule={onNext}
          />
        );
      case 'projective':
      case 'presentation':
      case 'mcu':
      case 'checklist':
        return (
          <GuidesRunner
            module={activeModule}
            savedProgress={saved}
            onSaveProgress={handleSaveProgress}
            onBack={onBack}
            onNextModule={onNext}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <TopBar
        currentRoute={route}
        onNavigate={handleNavigate}
        onQuickStart={handleQuickStart}
        hasProgress={hasProgress}
      />

      <main className="flex-1">
        {(route === 'home' || route === 'modules') && (
          <ModuleCatalog
            mode={route}
            quizMode={quizMode}
            onChangeQuizMode={handleChangeQuizMode}
            progressMap={progressMap}
            onSelectModule={openModule}
          />
        )}

        {route === 'results' && (
          <ResultsOverview
            progressMap={progressMap}
            onSelectModule={openModule}
            onResetAll={handleResetAll}
          />
        )}

        {(route === 'quiz' || route === 'checklist') && renderActiveModule()}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Paket Lengkap Assessment Jabatan Pegawai Perumda Air Minum (Bagian 1–4)</span>
          <span>Progres tersimpan otomatis di perangkat Anda</span>
        </div>
      </footer>
    </div>
  );
}
