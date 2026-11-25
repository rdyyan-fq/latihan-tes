import React, { useState } from 'react';
import { CheckCircle2, Circle, RotateCcw, ArrowRight } from 'lucide-react';
import { allModules, bagianMetaList } from '../data';
import { ModuleProgress } from '../types/assessment';

interface ResultsOverviewProps {
  progressMap: Record<string, ModuleProgress>;
  onSelectModule: (moduleId: string) => void;
  onResetAll: () => void;
}

export const ResultsOverview: React.FC<ResultsOverviewProps> = ({
  progressMap,
  onSelectModule,
  onResetAll,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const completedModules = allModules.filter((m) => progressMap[m.id]?.completed);
  const scoredModules = allModules.filter(
    (m) =>
      (m.kind === 'mcq' || m.kind === 'likert') &&
      progressMap[m.id]?.completed &&
      typeof progressMap[m.id]?.scorePercent === 'number'
  );

  const averageScore =
    scoredModules.length > 0
      ? Math.round(
          scoredModules.reduce(
            (acc, m) => acc + (progressMap[m.id]?.scorePercent ?? 0),
            0
          ) / scoredModules.length
        )
      : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-900">Rekap Hasil & Progres Latihan</h1>
          <p className="text-sm text-slate-600">
            Semua jawaban Anda tersimpan otomatis di browser ini. Kerjakan berurutan dari Bagian 1 sampai 4.
          </p>
        </div>

        <div className="flex items-baseline gap-8">
          <div>
            <p className="text-xs text-slate-500">Modul Selesai</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {completedModules.length} / {allModules.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Rata-rata Skor Kuis</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-sky-700">
              {scoredModules.length > 0 ? `${averageScore}%` : '—'}
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {bagianMetaList.map((bagian) => {
          const mods = allModules.filter((m) => m.bagianId === bagian.id);
          return (
            <section
              key={bagian.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Bagian {bagian.number} — {bagian.title}
                  </h2>
                  <p className="text-xs text-slate-500">{bagian.subtitle}</p>
                </div>
                <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                  {mods.filter((m) => progressMap[m.id]?.completed).length}/{mods.length} selesai
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {mods.map((mod) => {
                  const prog = progressMap[mod.id];
                  const isDone = Boolean(prog?.completed);
                  return (
                    <div
                      key={mod.id}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono font-semibold text-slate-700">
                              {mod.code}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{mod.questionCountLabel}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">
                            {mod.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 pl-8 sm:pl-0">
                        {prog && typeof prog.scorePercent === 'number' && (
                          <span className="text-sm font-mono tabular-nums font-bold text-slate-800">
                            {prog.scorePercent}%
                            {typeof prog.correctCount === 'number' &&
                            typeof prog.totalCount === 'number'
                              ? ` (${prog.correctCount}/${prog.totalCount})`
                              : ''}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectModule(mod.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                        >
                          <span>{isDone ? 'Review / Ulangi' : 'Kerjakan'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Reset Progress Control */}
      <div className="pt-4 flex justify-end">
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-950">
            <span>Hapus semua jawaban dan skor yang tersimpan?</span>
            <button
              type="button"
              onClick={() => {
                onResetAll();
                setConfirmReset(false);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 rounded-lg hover:bg-rose-800"
            >
              Ya, Reset Semua
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Progres</span>
          </button>
        )}
      </div>
    </div>
  );
};
