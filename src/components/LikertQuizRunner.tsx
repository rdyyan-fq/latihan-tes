import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { LikertValue, ModuleDefinition, ModuleProgress } from '../types/assessment';
import { useCountdown } from '../hooks/useCountdown';

interface LikertQuizRunnerProps {
  module: ModuleDefinition;
  savedProgress?: ModuleProgress;
  onSaveProgress: (progress: ModuleProgress) => void;
  onBack: () => void;
  onNextModule?: () => void;
}

const SCALE_OPTIONS: { value: LikertValue; label: string }[] = [
  { value: 'STS', label: 'Sangat Tidak Setuju' },
  { value: 'TS', label: 'Tidak Setuju' },
  { value: 'R', label: 'Ragu' },
  { value: 'S', label: 'Setuju' },
  { value: 'SS', label: 'Sangat Setuju' },
];

export const LikertQuizRunner: React.FC<LikertQuizRunnerProps> = ({
  module,
  savedProgress,
  onSaveProgress,
  onBack,
  onNextModule,
}) => {
  const questions = module.likertQuestions ?? [];
  const clusters = useMemo(() => {
    const map = new Map<string, typeof questions>();
    for (const q of questions) {
      const existing = map.get(q.cluster) ?? [];
      existing.push(q);
      map.set(q.cluster, existing);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [questions]);

  const [clusterIdx, setClusterIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, LikertValue>>(
    savedProgress?.likertAnswers ?? {}
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(
    Boolean(savedProgress?.completed)
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const timer = useCountdown(module.durationMinutes, !savedProgress?.completed);

  useEffect(() => {
    setClusterIdx(0);
    setAnswers(savedProgress?.likertAnswers ?? {});
    setIsSubmitted(Boolean(savedProgress?.completed));
    setShowConfirm(false);
  }, [module.id]);

  const answeredCount = Object.keys(answers).length;
  const currentCluster = clusters[clusterIdx];

  const evaluation = useMemo(() => {
    let aligned = 0;
    let ssCount = 0;
    for (const q of questions) {
      const val = answers[q.id];
      if (val === 'SS') ssCount += 1;
      if (val && q.idealValues.includes(val)) {
        aligned += 1;
      }
    }
    const percent = questions.length > 0 ? Math.round((aligned / questions.length) * 100) : 0;
    const tooManySS = ssCount >= Math.floor(questions.length * 0.7);
    return { aligned, total: questions.length, percent, ssCount, tooManySS };
  }, [questions, answers]);

  const persist = (nextAnswers: Record<string, LikertValue>, completed = isSubmitted) => {
    let aligned = 0;
    for (const q of questions) {
      const val = nextAnswers[q.id];
      if (val && q.idealValues.includes(val)) aligned += 1;
    }
    const percent = questions.length > 0 ? Math.round((aligned / questions.length) * 100) : 0;
    onSaveProgress({
      moduleId: module.id,
      completed,
      submittedAt: completed ? new Date().toISOString() : undefined,
      scorePercent: completed ? percent : undefined,
      correctCount: completed ? aligned : undefined,
      totalCount: questions.length,
      likertAnswers: nextAnswers,
    });
  };

  const handleSelect = (qId: string, val: LikertValue) => {
    if (isSubmitted) return;
    const next = { ...answers, [qId]: val };
    setAnswers(next);
    persist(next, false);
  };

  const handleSubmit = () => {
    timer.pause();
    setIsSubmitted(true);
    setShowConfirm(false);
    persist(answers, true);
  };

  const handleReset = () => {
    setAnswers({});
    setIsSubmitted(false);
    setShowConfirm(false);
    setClusterIdx(0);
    timer.reset();
    timer.start();
    persist({}, false);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
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
              <h1 className="text-2xl font-bold text-slate-900">Hasil Profil Kepribadian Pimpinan</h1>
              <p className="text-sm text-slate-600">
                Kesesuaian dengan pola pimpinan yang dinilai tinggi oleh assessor.
              </p>
            </div>
            <div className="flex items-baseline gap-6 sm:text-right">
              <div>
                <p className="text-xs text-slate-500">Kesesuaian Pola</p>
                <p className="text-4xl font-bold font-mono tabular-nums text-slate-900">
                  {evaluation.percent}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Item Selaras</p>
                <p className="text-2xl font-semibold font-mono tabular-nums text-sky-700">
                  {evaluation.aligned} / {evaluation.total}
                </p>
              </div>
            </div>
          </div>

          {evaluation.tooManySS && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Peringatan Konsistensi (Terlalu Banyak SS: {evaluation.ssCount} kali)</p>
                <p className="text-amber-900 mt-0.5">
                  {module.likertSummaryNote}
                </p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Catatan Penilaian Assessor: </span>
            {module.likertSummaryNote}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Tes Kepribadian</span>
            </button>
            {onNextModule && (
              <button
                type="button"
                onClick={onNextModule}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800"
              >
                <span>Lanjut Sub-Tes 1D</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        <div className="space-y-6">
          {clusters.map((cluster) => (
            <section
              key={cluster.name}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                {cluster.name}
              </h2>
              <div className="divide-y divide-slate-100">
                {cluster.items.map((item) => {
                  const chosen = answers[item.id];
                  const isIdeal = Boolean(chosen && item.idealValues.includes(chosen));
                  return (
                    <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm text-slate-900">
                          <span className="font-mono font-semibold text-slate-500 mr-2">
                            {item.number}.
                          </span>
                          {item.statement}
                        </p>
                        {item.note && (
                          <p className="text-xs text-slate-500">{item.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                        <span className="text-slate-600">
                          Anda: <strong className="text-slate-900">{chosen ?? '-'}</strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={isIdeal ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          Pola Ideal: {item.idealValues.join('/')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Modul</span>
        </button>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 font-mono tabular-nums text-slate-800">
            <Clock className="w-4 h-4 text-sky-700" />
            <span>{timer.formatted}</span>
            <button
              type="button"
              onClick={timer.toggle}
              className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label={timer.isRunning ? 'Jeda' : 'Mulai'}
            >
              {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {answeredCount} / {questions.length} terisi
          </span>
        </div>
      </div>

      {/* Cluster Stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            {module.code} · {module.subtitle}
          </p>
          <h1 className="text-xl font-bold text-slate-900">{module.title}</h1>
          <p className="text-sm text-slate-600">{module.instructions}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {clusters.map((c, idx) => {
            const doneInCluster = c.items.filter((i) => Boolean(answers[i.id])).length;
            const active = idx === clusterIdx;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setClusterIdx(idx)}
                className={`flex-1 min-w-[160px] px-3 py-2 text-xs font-semibold rounded-md transition-colors text-left ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="truncate">{c.name}</div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                  {doneInCluster}/{c.items.length} dijawab
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions in current cluster */}
      {currentCluster && (
        <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          <div className="px-5 py-4 bg-slate-50 rounded-t-xl flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">{currentCluster.name}</h2>
            <span className="text-xs text-slate-500">STS · TS · R · S · SS</span>
          </div>

          {currentCluster.items.map((item) => {
            const chosen = answers[item.id];
            return (
              <div
                key={item.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <p className="text-sm sm:text-base text-slate-900 leading-relaxed flex-1">
                  <span className="font-mono font-semibold text-slate-500 mr-2">
                    {item.number}.
                  </span>
                  {item.statement}
                </p>

                <div className="flex items-center gap-1.5 shrink-0" role="radiogroup" aria-label={`Pernyataan ${item.number}`}>
                  {SCALE_OPTIONS.map((opt) => {
                    const active = chosen === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        title={opt.label}
                        onClick={() => handleSelect(item.id, opt.value)}
                        className={`w-12 h-11 rounded-lg border text-xs font-mono font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                          active
                            ? 'bg-sky-700 border-sky-700 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="button"
          disabled={clusterIdx === 0}
          onClick={() => {
            setClusterIdx((i) => Math.max(0, i - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Klaster Sebelumnya</span>
        </button>

        {clusterIdx < clusters.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              setClusterIdx((i) => Math.min(clusters.length - 1, i + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800"
          >
            <span>Klaster Berikutnya</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : showConfirm ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-950">
            <span>Masih ada {questions.length - answeredCount} kosong. Tetap lihat evaluasi?</span>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-3 py-1.5 font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800"
            >
              Ya, Selesai
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 rounded"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (answeredCount < questions.length) {
                setShowConfirm(true);
              } else {
                handleSubmit();
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesai & Cek Pola Jawaban</span>
          </button>
        )}
      </div>
    </div>
  );
};
