import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { allModules, bagianMetaList } from '../data';
import { BagianId, ModuleProgress, QuizMode } from '../types/assessment';

interface ModuleCatalogProps {
  mode: 'home' | 'modules';
  quizMode: QuizMode;
  onChangeQuizMode: (mode: QuizMode) => void;
  progressMap: Record<string, ModuleProgress>;
  onSelectModule: (moduleId: string) => void;
}

export const ModuleCatalog: React.FC<ModuleCatalogProps> = ({
  mode,
  quizMode,
  onChangeQuizMode,
  progressMap,
  onSelectModule,
}) => {
  const [selectedBagian, setSelectedBagian] = useState<'all' | BagianId>('all');

  const completedCount = allModules.filter((m) => progressMap[m.id]?.completed).length;

  const visibleBagian =
    selectedBagian === 'all'
      ? bagianMetaList
      : bagianMetaList.filter((b) => b.id === selectedBagian);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {mode === 'home' && (
        <>
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-4">
                <p className="text-xs font-medium text-sky-700">
                  Full Set — 4 Bagian · Semua Kunci & Cara Jawab
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight text-balance">
                  Assessment Jabatan Pegawai Perumda Air Minum
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                  Sistem kuis dan simulasi interaktif lengkap untuk berlatih Potensi Psikologi,
                  Kompetensi Jabatan, Tes Tertulis Bidang, Wawancara STAR, hingga Checklist MCU.
                </p>
                <p className="text-sm text-slate-500 pt-1">
                  Semangat! Assessment itu bukan untuk mencari yang paling pintar, tapi yang paling siap memimpin.
                </p>
              </div>

              <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Cara Pakai & Mode Latihan</h2>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li>01. Kerjakan berurutan dari Bagian 1 sampai Bagian 4.</li>
                  <li>02. Jangan lihat kunci sebelum selesai satu bagian.</li>
                  <li>03. Latihan 2–3x sampai jawaban STAR mengalir natural, bukan hafalan.</li>
                </ul>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="block text-xs font-semibold text-slate-700">
                    Pilih Mode Kuis Pilihan Ganda:
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-lg">
                    <button
                      type="button"
                      onClick={() => onChangeQuizMode('exam')}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                        quizMode === 'exam'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Mode Ujian
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeQuizMode('study')}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                        quizMode === 'study'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Mode Belajar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-column KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Total Sub-Tes</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {allModules.length} Modul
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Soal Pilihan Ganda</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  149 Soal
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kepribadian & Kasus</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  98 Latihan
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Progres Anda</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-sky-700 mt-1">
                  {completedCount} / {allModules.length} Selesai
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Filter Bar */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'home' ? 'Daftar Sub-Tes Assessment' : 'Semua Modul Latihan (Bagian 1–4)'}
            </h2>
            <p className="text-sm text-slate-600">
              Pilih sub-tes untuk langsung memulai simulasi interaktif beserta timer dan pembahasan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedBagian('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedBagian === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Bagian
            </button>
            {bagianMetaList.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBagian(b.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  selectedBagian === b.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bagian {b.number}
              </button>
            ))}
          </div>
        </div>

        {/* Bagian Groups */}
        <div className="space-y-8">
          {visibleBagian.map((bagian) => {
            const modules = allModules.filter((m) => m.bagianId === bagian.id);
            const bagianDone = modules.filter((m) => progressMap[m.id]?.completed).length;

            return (
              <div key={bagian.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-medium text-sky-700">
                      Bagian {bagian.number} · {bagian.subtitle}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">{bagian.title}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">{bagian.description}</p>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-600 shrink-0">
                    {bagianDone} / {modules.length} selesai
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map((mod) => {
                    const prog = progressMap[mod.id];
                    const isDone = Boolean(prog?.completed);

                    return (
                      <article
                        key={mod.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5 hover:border-sky-300 transition-colors"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="font-mono font-semibold text-slate-700">
                              {mod.code}
                            </span>
                            <div className="flex items-center gap-1.5 font-mono tabular-nums">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{mod.durationMinutes} mnt</span>
                            </div>
                          </div>

                          <h4 className="text-base font-bold text-slate-900 leading-snug">
                            {mod.title}
                          </h4>

                          <p className="text-xs text-slate-500 font-medium">
                            {mod.questionCountLabel}
                          </p>

                          <p className="text-sm text-slate-600 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 font-mono tabular-nums">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                Selesai
                                {typeof prog?.scorePercent === 'number'
                                  ? ` · ${prog.scorePercent}%`
                                  : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Belum dikerjakan</span>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectModule(mod.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>{isDone ? 'Buka Lagi' : 'Mulai'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
