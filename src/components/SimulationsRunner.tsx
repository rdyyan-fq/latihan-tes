import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  InBasketDraft,
  LgdDraft,
  ModuleDefinition,
  ModuleProgress,
} from '../types/assessment';
import { useCountdown } from '../hooks/useCountdown';

interface SimulationsRunnerProps {
  module: ModuleDefinition;
  savedProgress?: ModuleProgress;
  onSaveProgress: (progress: ModuleProgress) => void;
  onBack: () => void;
  onNextModule?: () => void;
}

export const SimulationsRunner: React.FC<SimulationsRunnerProps> = ({
  module,
  savedProgress,
  onSaveProgress,
  onBack,
  onNextModule,
}) => {
  const isLgd = module.kind === 'lgd';
  const [lgdDrafts, setLgdDrafts] = useState<Record<string, LgdDraft>>(
    savedProgress?.lgdDrafts ?? {}
  );
  const [inBasketDrafts, setInBasketDrafts] = useState<Record<string, InBasketDraft>>(
    savedProgress?.inBasketDrafts ?? {}
  );
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(
    Boolean(savedProgress?.completed)
  );

  const timer = useCountdown(module.durationMinutes, false);

  useEffect(() => {
    setLgdDrafts(savedProgress?.lgdDrafts ?? {});
    setInBasketDrafts(savedProgress?.inBasketDrafts ?? {});
    setRevealedIds({});
    setIsCompleted(Boolean(savedProgress?.completed));
  }, [module.id]);

  const persist = (
    nextLgd: Record<string, LgdDraft>,
    nextInBasket: Record<string, InBasketDraft>,
    completed = isCompleted
  ) => {
    const total = isLgd
      ? (module.lgdCases ?? []).length
      : (module.inBasketCases ?? []).length;

    const doneCount = isLgd
      ? (module.lgdCases ?? []).filter((c) => {
          const d = nextLgd[c.id];
          return Boolean(d && (d.selectedOptions.length > 0 || d.statement.trim()));
        }).length
      : (module.inBasketCases ?? []).filter((c) => {
          const d = nextInBasket[c.id];
          return Boolean(d && (d.orderIds.length > 0 || d.delegationNote.trim()));
        }).length;

    onSaveProgress({
      moduleId: module.id,
      completed,
      submittedAt: completed ? new Date().toISOString() : undefined,
      correctCount: doneCount,
      totalCount: total,
      scorePercent: total > 0 ? Math.round((doneCount / total) * 100) : 0,
      lgdDrafts: nextLgd,
      inBasketDrafts: nextInBasket,
    });
  };

  const toggleLgdOption = (caseId: string, optionText: string, maxPick: number) => {
    const prev = lgdDrafts[caseId] ?? { selectedOptions: [], statement: '' };
    const exists = prev.selectedOptions.includes(optionText);
    let nextSelected: string[];
    if (exists) {
      nextSelected = prev.selectedOptions.filter((o) => o !== optionText);
    } else if (prev.selectedOptions.length < maxPick) {
      nextSelected = [...prev.selectedOptions, optionText];
    } else {
      nextSelected = [...prev.selectedOptions.slice(1), optionText];
    }
    const next = {
      ...lgdDrafts,
      [caseId]: { ...prev, selectedOptions: nextSelected },
    };
    setLgdDrafts(next);
    persist(next, inBasketDrafts, isCompleted);
  };

  const updateLgdStatement = (caseId: string, statement: string) => {
    const prev = lgdDrafts[caseId] ?? { selectedOptions: [], statement: '' };
    const next = {
      ...lgdDrafts,
      [caseId]: { ...prev, statement },
    };
    setLgdDrafts(next);
    persist(next, inBasketDrafts, isCompleted);
  };

  const getInBasketOrder = (caseId: string, defaultIds: string[]): string[] => {
    const saved = inBasketDrafts[caseId]?.orderIds;
    if (saved && saved.length === defaultIds.length) return saved;
    return defaultIds;
  };

  const moveInBasketItem = (
    caseId: string,
    defaultIds: string[],
    index: number,
    direction: -1 | 1
  ) => {
    const currentOrder = [...getInBasketOrder(caseId, defaultIds)];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIndex];
    currentOrder[targetIndex] = temp;

    const prev = inBasketDrafts[caseId] ?? { orderIds: currentOrder, delegationNote: '' };
    const next = {
      ...inBasketDrafts,
      [caseId]: { ...prev, orderIds: currentOrder },
    };
    setInBasketDrafts(next);
    persist(lgdDrafts, next, isCompleted);
  };

  const updateInBasketNote = (caseId: string, defaultIds: string[], note: string) => {
    const currentOrder = getInBasketOrder(caseId, defaultIds);
    const next = {
      ...inBasketDrafts,
      [caseId]: { orderIds: currentOrder, delegationNote: note },
    };
    setInBasketDrafts(next);
    persist(lgdDrafts, next, isCompleted);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const markComplete = () => {
    setIsCompleted(true);
    persist(lgdDrafts, inBasketDrafts, true);
  };

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

        <div className="flex items-center gap-3 text-sm font-mono tabular-nums text-slate-800">
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
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {module.code} · {module.subtitle}
          </p>
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Simulasi Selesai
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-slate-900">{module.title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{module.instructions}</p>
      </section>

      {isLgd &&
        (module.lgdCases ?? []).map((lgdCase) => {
          const draft = lgdDrafts[lgdCase.id] ?? { selectedOptions: [], statement: '' };
          const isRevealed = Boolean(revealedIds[lgdCase.id]);

          return (
            <section
              key={lgdCase.id}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-5"
            >
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <p className="text-xs font-mono text-sky-700 font-semibold">
                  Kasus {lgdCase.number} · Target Diskusi {lgdCase.durationMinutes} Menit
                </p>
                <h2 className="text-lg font-bold text-slate-900">{lgdCase.title}</h2>
                <p className="text-sm text-slate-700 leading-relaxed">{lgdCase.theme}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Pilih {lgdCase.requiredPickCount} Prioritas Utama Anda:
                  </span>
                  <span className="font-mono tabular-nums text-sky-700 font-semibold">
                    {draft.selectedOptions.length} / {lgdCase.requiredPickCount} dipilih
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {lgdCase.options.map((opt) => {
                    const checked = draft.selectedOptions.includes(opt);
                    const pickRank = draft.selectedOptions.indexOf(opt) + 1;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          toggleLgdOption(lgdCase.id, opt, lgdCase.requiredPickCount)
                        }
                        className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 ${
                          checked
                            ? 'bg-sky-50 border-sky-600 text-sky-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span>{opt}</span>
                        {checked && (
                          <span className="text-xs font-mono font-bold text-sky-700 shrink-0">
                            #{pickRank}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Draft Kalimat Pembuka / Argumen Kesepakatan Anda
                </label>
                <textarea
                  rows={4}
                  value={draft.statement}
                  onChange={(e) => updateLgdStatement(lgdCase.id, e.target.value)}
                  placeholder="Tulis usulan kriteria, data pendukung, urutan prioritas, dan kalimat mengajak kelompok sepakat..."
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleReveal(lgdCase.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
                >
                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>
                    {isRevealed
                      ? 'Sembunyikan Contoh & Kunci LGD'
                      : 'Lihat Contoh Kalimat & Kunci Penilaian'}
                  </span>
                </button>

                {isRevealed && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5 text-sm space-y-3 text-slate-800">
                    <div>
                      <p className="font-semibold text-emerald-900">
                        Contoh Kalimat yang Dinilai Tinggi:
                      </p>
                      <p className="mt-1 leading-relaxed">{lgdCase.sampleOpening}</p>
                    </div>
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="font-semibold text-emerald-900">Kunci / Cara Dinilai:</p>
                      <p className="mt-1 leading-relaxed">{lgdCase.rubric}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}

      {!isLgd &&
        (module.inBasketCases ?? []).map((ibCase) => {
          const defaultIds = ibCase.items.map((item) => item.id);
          const orderIds = getInBasketOrder(ibCase.id, defaultIds);
          const note = inBasketDrafts[ibCase.id]?.delegationNote ?? '';
          const isRevealed = Boolean(revealedIds[ibCase.id]);

          return (
            <section
              key={ibCase.id}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-6"
            >
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <p className="text-xs font-mono text-sky-700 font-semibold">
                  Simulasi {ibCase.number}
                </p>
                <h2 className="text-lg font-bold text-slate-900">{ibCase.title}</h2>
                <p className="text-sm text-slate-700">{ibCase.context}</p>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-700">
                  Urutkan Prioritas (1 = Ditangani Paling Awal, 6 = Paling Akhir):
                </p>
                {orderIds.map((itemId, idx) => {
                  const item = ibCase.items.find((x) => x.id === itemId);
                  if (!item) return null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-lg border border-slate-200 bg-slate-50/70"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-7 h-7 rounded-md bg-sky-700 text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="text-xs sm:text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveInBasketItem(ibCase.id, defaultIds, idx, -1)}
                          aria-label={`Naikkan ${item.label}`}
                          className="p-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderIds.length - 1}
                          onClick={() => moveInBasketItem(ibCase.id, defaultIds, idx, 1)}
                          aria-label={`Turunkan ${item.label}`}
                          className="p-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Rencana Tindakan & Delegasi (Yang dikerjakan sendiri, didelegasikan, atau ditunda):
                </label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => updateInBasketNote(ibCase.id, defaultIds, e.target.value)}
                  placeholder="Contoh: Yang saya kerjakan sendiri adalah..., yang saya delegasikan ke tim adalah..., yang saya tunda dengan alasan..."
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleReveal(ibCase.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
                >
                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>
                    {isRevealed
                      ? 'Sembunyikan Kunci In-Basket'
                      : 'Bandingkan dengan Urutan Ideal & Kunci'}
                  </span>
                </button>

                {isRevealed && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5 text-sm text-slate-800 leading-relaxed space-y-2">
                    <p className="font-semibold text-emerald-900">Kunci / Cara Dinilai:</p>
                    <p>{ibCase.idealExplanation}</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}

      {module.rubricNotes && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">{module.rubricNotes.title}</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {module.rubricNotes.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="font-mono text-xs text-sky-700 font-semibold mt-0.5">
                  0{i + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {module.rubricNotes.warnings?.map((warn, i) => (
            <div
              key={i}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-950"
            >
              {warn}
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={markComplete}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Simpan & Tandai Selesai</span>
        </button>
        {onNextModule && (
          <button
            type="button"
            onClick={onNextModule}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
          >
            <span>Sub-Tes Berikutnya</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
