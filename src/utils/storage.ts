import { ModuleProgress, QuizMode } from '../types/assessment';

const STORAGE_KEY = 'perumda_assessment_progress_v1';
const MODE_KEY = 'perumda_assessment_mode_v1';

export function loadAllProgress(): Record<string, ModuleProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ModuleProgress>;
  } catch {
    return {};
  }
}

export function saveModuleProgress(progress: ModuleProgress): Record<string, ModuleProgress> {
  const all = loadAllProgress();
  const next = {
    ...all,
    [progress.moduleId]: progress,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function clearAllProgress(): Record<string, ModuleProgress> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  return {};
}

export function loadQuizMode(): QuizMode {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    if (raw === 'study' || raw === 'exam') return raw;
  } catch {
    // Ignore
  }
  return 'exam';
}

export function saveQuizMode(mode: QuizMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Ignore
  }
}
