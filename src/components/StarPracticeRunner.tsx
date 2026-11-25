import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ModuleDefinition, ModuleProgress, StarDraft } from '../types/assessment';
import { useCountdown } from '../hooks/useCountdown';

interface StarPracticeRunnerProps {
  module: ModuleDefinition;
  savedProgress?: ModuleProgress;
  onSaveProgress: (progress: ModuleProgress) => void;
  onBack: () => void;
  onNextModule?: () => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export const StarPracticeRunner: React.FC<StarPracticeRunnerProps> = ({
  module,
  savedProgress,
  onSaveProgress,
  onBack,
  onNextModule,
}) => {
  const isEssay = module.kind === 'essay';
  const items = isEssay
    ? (module.essayQuestions ?? []).map((q) => ({
        id: q.id,
        number: q.number,
        prompt: q.prompt,
        sample: q.sampleFramework,
        minWords: q.minWords,
        maxWords: q.maxWords,
      }))
    : (module.starQuestions ?? []).map((q) => ({
        id: q.id,
        number: q.number,
        prompt: q.prompt,
        sample: q.sampleAnswer,
        minWords: 0,
        maxWords: 0,
      }));

  const [currentIdx, setCurrentIdx] = useState(0);
  const [starDrafts, setStarDrafts] = useState<Record<string, StarDraft>>(
    savedProgress?.starDrafts ?? {}
  );
  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>(
    savedProgress?.essayDrafts ?? {}
  );
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(
    Boolean(savedProgress?.completed)
  );

  const timer = useCountdown(module.durationMinutes, false);

  useEffect(() => {
    setCurrentIdx(0);
    setStarDrafts(savedProgress?.starDrafts ?? {});
    setEssayDrafts(savedProgress?.essayDrafts ?? {});
    setRevealedIds({});
    setIsCompleted(Boolean(savedProgress?.completed));
  }, [module.id]);

  const currentItem = items[currentIdx];

  const filledCount = items.filter((item) => {
    if (isEssay) {
      return (essayDrafts[item.id] ?? '').trim().length > 0;
    }
    const d = starDrafts[item.id];
    return Boolean(
      d && (d.s.trim() || d.t.trim() || d.a.trim() || d.r.trim())
    );
  }).length;

  const persist = (
    nextStar: Record<string, StarDraft>,
    nextEssay: Record<string, string>,
    completed = isCompleted
  ) => {
    const doneCount = items.filter((item) => {
      if (isEssay) return (nextEssay[item.id] ?? '').trim().length > 0;
      const d = nextStar[item.id];
      return Boolean(d && (d.s.trim() || d.t.trim() || d.a.trim() || d.r.trim()));
    }).length;

    onSaveProgress({
      moduleId: module.id,
      completed,
      submittedAt: completed ? new Date().toISOString() : undefined,
      correctCount: doneCount,
      totalCount: items.length,
      scorePercent: items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0,
      starDrafts: nextStar,
      essayDrafts: nextEssay,
    });
  };

  const handleStarField = (field: keyof StarDraft, value: string) => {
    if (!currentItem) return;
    const prev = starDrafts[currentItem.id] ?? { s: '', t: '', a: '', r: '' };
    const next = {
      ...starDrafts,
      [currentItem.id]: { ...prev, [field]: value },
    };
    setStarDrafts(next);
    persist(next, essayDrafts, isCompleted);
  };

  const handleEssayChange = (value: string) => {
    if (!currentItem) return;
    const next = { ...essayDrafts, [currentItem.id]: value };
    setEssayDrafts(next);
    persist(starDrafts, next, isCompleted);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFinishModule = () => {
    setIsCompleted(true);
    persist(starDrafts, essayDrafts, true);
  };

  if (!currentItem) return null;

  const currentStar = starDrafts[currentItem.id] ?? { s: '', t: '', a: '', r: '' };
  const currentEssay = essayDrafts[currentItem.id] ?? '';
  const wordCount = countWords(currentEssay);
  const isRevealed = Boolean(revealedIds[currentItem.id]);

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
            <button
              type="button"
              onClick={timer.reset}
              className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {filledCount} / {items.length} terisi
          </span>
        </div>
      </div>

      {/* Header & Item Stepper */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <p className="text-xs text-slate-500">
              {module.code} · {module.subtitle}
            </p>
            <h1 className="text-xl font-bold text-slate-900">{module.title}</h1>
            <p className="text-sm text-slate-600">{module.instructions}</p>
          </div>

          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Selesai Dilatih
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {items.map((item, idx) => {
            const hasContent = isEssay
              ? (essayDrafts[item.id] ?? '').trim().length > 0
              : Boolean(
                  starDrafts[item.id] &&
                    (starDrafts[item.id].s.trim() ||
                      starDrafts[item.id].t.trim() ||
                      starDrafts[item.id].a.trim() ||
                      starDrafts[item.id].r.trim())
                );
            const active = idx === currentIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`w-10 h-9 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                  active
                    ? 'bg-sky-700 border-sky-700 text-white'
                    : hasContent
                      ? 'bg-sky-50 border-sky-300 text-sky-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {item.number}
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Prompt & Draft Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-6">
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <p className="text-xs font-mono font-semibold text-sky-700">
            Pertanyaan {currentItem.number} dari {items.length}
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
            {currentItem.prompt}
          </h2>
          {module.starFormatHint && !isEssay && (
            <p className="text-xs text-slate-500">{module.starFormatHint}</p>
          )}
        </div>

        {isEssay ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="essay-input" className="font-semibold text-slate-700">
                Uraian Jawaban Strategis Anda
              </label>
              <span
                className={`font-mono tabular-nums font-semibold ${
                  wordCount >= currentItem.minWords && wordCount <= currentItem.maxWords
                    ? 'text-emerald-700'
                    : wordCount > 0
                      ? 'text-amber-700'
                      : 'text-slate-500'
                }`}
              >
                {wordCount} kata (Target: {currentItem.minWords}–{currentItem.maxWords} kata)
              </span>
            </div>
            <textarea
              id="essay-input"
              rows={9}
              value={currentEssay}
              onChange={(e) => handleEssayChange(e.target.value)}
              placeholder="Tuliskan analisis data, target bertahap, program konkret, anggaran/SDM, risiko & mitigasi, serta indikator keberhasilan..."
              className="w-full rounded-xl border border-slate-300 p-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 leading-relaxed"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                S — Situation (Situasi Nyata + Konteks)
              </label>
              <textarea
                rows={3}
                value={currentStar.s}
                onChange={(e) => handleStarField('s', e.target.value)}
                placeholder="Kapan, di cabang/bagian mana, dan masalah apa yang terjadi?"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                T — Task (Tugas & Target Anda)
              </label>
              <textarea
                rows={3}
                value={currentStar.t}
                onChange={(e) => handleStarField('t', e.target.value)}
                placeholder="Apa tanggung jawab atau target spesifik Anda saat itu?"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                A — Action (Tindakan Konkret Anda)
              </label>
              <textarea
                rows={3}
                value={currentStar.a}
                onChange={(e) => handleStarField('a', e.target.value)}
                placeholder="Langkah nyata yang ANDA lakukan (bukan hanya 'kami')..."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                R — Result (Hasil Nyata + Angka)
              </label>
              <textarea
                rows={3}
                value={currentStar.r}
                onChange={(e) => handleStarField('r', e.target.value)}
                placeholder="Hasil terukur: turun berapa %, selesai jam berapa, berapa keluhan?"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>
        )}

        {/* Reveal Sample Answer Toggle */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => toggleReveal(currentItem.id)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
          >
            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>
              {isRevealed
                ? 'Sembunyikan Contoh Jawaban'
                : isEssay
                  ? 'Buka Kerangka Jawaban Ideal'
                  : 'Buka Contoh Jawaban / Cara Jawab'}
            </span>
          </button>

          {isRevealed && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5 text-sm text-slate-800 leading-relaxed space-y-1.5">
              <p className="font-semibold text-emerald-900">
                {isEssay ? 'Contoh Kerangka Jawaban yang Dinilai Tinggi:' : 'Contoh Jawaban / Cara Jawab:'}
              </p>
              <p>{currentItem.sample}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex items-center gap-3">
            {currentIdx < items.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(items.length - 1, i + 1))}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleFinishModule}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Tandai Selesai</span>
                </button>
                {onNextModule && (
                  <button
                    type="button"
                    onClick={onNextModule}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
                  >
                    <span>Sub-Tes Berikutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
