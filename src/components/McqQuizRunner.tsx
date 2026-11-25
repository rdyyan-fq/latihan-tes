import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ModuleDefinition, ModuleProgress, QuizMode } from '../types/assessment';
import { useCountdown } from '../hooks/useCountdown';

interface McqQuizRunnerProps {
  module: ModuleDefinition;
  quizMode: QuizMode;
  onChangeMode: (mode: QuizMode) => void;
  savedProgress?: ModuleProgress;
  onSaveProgress: (progress: ModuleProgress) => void;
  onBack: () => void;
  onNextModule?: () => void;
}

export const McqQuizRunner: React.FC<McqQuizRunnerProps> = ({
  module,
  quizMode,
  onChangeMode,
  savedProgress,
  onSaveProgress,
  onBack,
  onNextModule,
}) => {
  const questions = module.mcqQuestions ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    savedProgress?.mcqAnswers ?? {}
  );
  const [flaggedIds, setFlaggedIds] = useState<string[]>(
    savedProgress?.flaggedIds ?? []
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(
    Boolean(savedProgress?.completed)
  );
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');

  const timer = useCountdown(module.durationMinutes, !savedProgress?.completed);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers(savedProgress?.mcqAnswers ?? {});
    setFlaggedIds(savedProgress?.flaggedIds ?? []);
    setIsSubmitted(Boolean(savedProgress?.completed));
    setShowConfirmFinish(false);
    setReviewFilter('all');
  }, [module.id]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const passingScore = module.passingScore ?? 75;

  const stats = useMemo(() => {
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctKey) correct += 1;
    }
    const percent = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    return { correct, total: questions.length, percent };
  }, [questions, answers]);

  const persistDraft = (
    nextAnswers: Record<string, string>,
    nextFlagged: string[],
    completed = isSubmitted
  ) => {
    let correct = 0;
    for (const q of questions) {
      if (nextAnswers[q.id] === q.correctKey) correct += 1;
    }
    const percent = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    onSaveProgress({
      moduleId: module.id,
      completed,
      submittedAt: completed ? new Date().toISOString() : undefined,
      scorePercent: completed ? percent : undefined,
      correctCount: completed ? correct : undefined,
      totalCount: questions.length,
      mcqAnswers: nextAnswers,
      flaggedIds: nextFlagged,
    });
  };

  const handleSelectOption = (optionKey: string) => {
    if (isSubmitted || !currentQuestion) return;
    const next = { ...answers, [currentQuestion.id]: optionKey };
    setAnswers(next);
    persistDraft(next, flaggedIds, false);
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    const exists = flaggedIds.includes(currentQuestion.id);
    const next = exists
      ? flaggedIds.filter((id) => id !== currentQuestion.id)
      : [...flaggedIds, currentQuestion.id];
    setFlaggedIds(next);
    persistDraft(answers, next, isSubmitted);
  };

  const handleSubmit = () => {
    timer.pause();
    setIsSubmitted(true);
    setShowConfirmFinish(false);
    persistDraft(answers, flaggedIds, true);
  };

  const handleReset = () => {
    setAnswers({});
    setFlaggedIds([]);
    setIsSubmitted(false);
    setShowConfirmFinish(false);
    setCurrentIndex(0);
    setReviewFilter('all');
    timer.reset();
    timer.start();
    persistDraft({}, [], false);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSubmitted) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (currentQuestion) {
        const upper = e.key.toUpperCase();
        const numMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        const chosen = numMap[e.key] ?? upper;
        if (currentQuestion.options.some((o) => o.key === chosen)) {
          handleSelectOption(chosen);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, isSubmitted, currentQuestion, answers]);

  if (!currentQuestion) return null;

  const selectedKey = answers[currentQuestion.id];
  const revealCurrentAnswer = isSubmitted || (quizMode === 'study' && Boolean(selectedKey));
  const isCurrentCorrect = selectedKey === currentQuestion.correctKey;
  const isCurrentFlagged = flaggedIds.includes(currentQuestion.id);

  // Results & Full Review screen after submission
  if (isSubmitted) {
    const passed = stats.percent >= passingScore;
    const filteredQuestions =
      reviewFilter === 'wrong'
        ? questions.filter((q) => answers[q.id] !== q.correctKey)
        : questions;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Modul</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">
            {module.code} · {module.title}
          </span>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500">{module.subtitle}</p>
              <h1 className="text-2xl font-bold text-slate-900">{module.title}</h1>
              <div className="flex items-center gap-2 text-sm pt-1">
                {passed ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Memenuhi Target (≥ {passingScore}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                    <XCircle className="w-4 h-4" />
                    Perlu Latihan Ulang (Target ≥ {passingScore}%)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-6 sm:text-right">
              <div>
                <p className="text-xs text-slate-500">Skor Akhir</p>
                <p className="text-4xl font-bold font-mono tabular-nums text-slate-900">
                  {stats.percent}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Jawaban Benar</p>
                <p className="text-2xl font-semibold font-mono tabular-nums text-sky-700">
                  {stats.correct} / {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  reviewFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Soal ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('wrong')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  reviewFilter === 'wrong'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Salah / Kosong ({questions.length - stats.correct})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Sub-Tes</span>
              </button>
              {onNextModule && (
                <button
                  type="button"
                  onClick={onNextModule}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors"
                >
                  <span>Sub-Tes Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-base font-semibold text-emerald-700">
              Semua jawaban pada sub-tes ini sudah benar!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const userChoice = answers[q.id];
              const isOk = userChoice === q.correctKey;
              return (
                <article
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono tabular-nums font-semibold text-slate-700">
                          Soal {q.number}
                        </span>
                        <span aria-hidden="true">·</span>
                        {isOk ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Benar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                            <XCircle className="w-3.5 h-3.5" />
                            {userChoice ? `Salah (Dipilih: ${userChoice})` : 'Belum Dijawab'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 leading-relaxed">
                        {q.question}
                      </h3>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {q.options.map((opt) => {
                      const isCorrectOpt = opt.key === q.correctKey;
                      const isUserOpt = opt.key === userChoice;
                      let optionStyle = 'border-slate-200 bg-white text-slate-700';
                      if (isCorrectOpt) {
                        optionStyle = 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium';
                      } else if (isUserOpt && !isCorrectOpt) {
                        optionStyle = 'border-rose-300 bg-rose-50 text-rose-950';
                      }
                      return (
                        <div
                          key={opt.key}
                          className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border text-sm ${optionStyle}`}
                        >
                          <span className="font-mono font-semibold shrink-0">{opt.key}.</span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrectOpt && (
                            <span className="text-xs font-semibold text-emerald-700 shrink-0">
                              Kunci
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Kunci / Cara Dinilai: </span>
                    {q.explanation}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top breadcrumb + Mode switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Modul</span>
        </button>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onChangeMode('exam')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              quizMode === 'exam'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode Ujian (Kunci Tersembunyi)
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('study')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              quizMode === 'study'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode Belajar (Lihat Kunci Langsung)
          </button>
        </div>
      </div>

      {/* Main Two-Zone Quiz Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Zone: Active Question */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500">
                {module.code} · {module.title}
              </p>
              <h2 className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                Soal {currentQuestion.number} dari {questions.length}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleToggleFlag}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isCurrentFlagged
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isCurrentFlagged ? 'Ditandai Ragu' : 'Tandai Ragu'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            {module.instructions}
          </p>

          <div className="space-y-5">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3" role="radiogroup" aria-label={`Pilihan soal ${currentQuestion.number}`}>
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedKey === opt.key;
                const isCorrectOpt = opt.key === currentQuestion.correctKey;

                let cardClass =
                  'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/40 text-slate-800';

                if (revealCurrentAnswer) {
                  if (isCorrectOpt) {
                    cardClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium';
                  } else if (isSelected && !isCorrectOpt) {
                    cardClass = 'border-rose-400 bg-rose-50 text-rose-950';
                  } else {
                    cardClass = 'border-slate-200 bg-white text-slate-500';
                  }
                } else if (isSelected) {
                  cardClass = 'border-sky-600 bg-sky-50 text-sky-950 font-medium ring-1 ring-sky-600';
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left flex items-start gap-4 px-4 py-3.5 min-h-[52px] rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${cardClass}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-mono font-semibold shrink-0 border ${
                        isSelected
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="flex-1 text-sm sm:text-base leading-relaxed pt-0.5">
                      {opt.text}
                    </span>
                    {revealCurrentAnswer && isCorrectOpt && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {revealCurrentAnswer && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {revealCurrentAnswer && (
              <div
                className={`rounded-xl border p-4 text-sm space-y-1 ${
                  isCurrentCorrect
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="font-semibold flex items-center gap-2">
                  {isCurrentCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Tepat · Kunci: {currentQuestion.correctKey}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-700" />
                      <span>Kurang Tepat · Kunci Seharusnya: {currentQuestion.correctKey}</span>
                    </>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (answeredCount < questions.length) {
                    setShowConfirmFinish(true);
                  } else {
                    handleSubmit();
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai & Nilai</span>
              </button>
            )}
          </div>
        </section>

        {/* Right Zone: Timer, Navigator & Submit */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-medium">Waktu Simulasi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={timer.toggle}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label={timer.isRunning ? 'Jeda waktu' : 'Lanjutkan waktu'}
                >
                  {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={timer.reset}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Reset waktu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <p
                className={`text-3xl font-bold font-mono tabular-nums ${
                  timer.secondsLeft < 120 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {timer.formatted}
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                {answeredCount} / {questions.length} dijawab
              </p>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-700 transition-all duration-200"
                style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Navigasi Nomor Soal</h3>
              <span className="text-xs text-slate-500">Shortcut: A–D / Panah</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = flaggedIds.includes(q.id);

                let btnClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400';
                if (isCurrent) {
                  btnClass = 'bg-sky-700 border-sky-700 text-white font-bold';
                } else if (isFlagged) {
                  btnClass = 'bg-amber-50 border-amber-400 text-amber-900 font-semibold';
                } else if (isAnswered) {
                  btnClass = 'bg-sky-50 border-sky-300 text-sky-900 font-semibold';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg border text-xs font-mono tabular-nums transition-colors ${btnClass}`}
                  >
                    {q.number}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Biru Gelap: Aktif</span>
              <span>Biru Muda: Terjawab</span>
              <span>Kuning: Ragu</span>
            </div>

            {showConfirmFinish ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-3 text-xs text-amber-950">
                <p className="font-medium leading-relaxed">
                  Masih ada {questions.length - answeredCount} soal yang belum dijawab. Yakin ingin mengakhiri dan melihat nilai?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 px-3 py-2 font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800"
                  >
                    Ya, Nilai Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmFinish(false)}
                    className="px-3 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (answeredCount < questions.length) {
                    setShowConfirmFinish(true);
                  } else {
                    handleSubmit();
                  }
                }}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Selesai & Lihat Nilai ({answeredCount}/{questions.length})
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
