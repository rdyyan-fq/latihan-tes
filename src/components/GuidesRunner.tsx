import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Square,
  Clock,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ModuleDefinition, ModuleProgress } from '../types/assessment';
import { useCountdown } from '../hooks/useCountdown';

interface GuidesRunnerProps {
  module: ModuleDefinition;
  savedProgress?: ModuleProgress;
  onSaveProgress: (progress: ModuleProgress) => void;
  onBack: () => void;
  onNextModule?: () => void;
}

const WarteggSymbolSvg: React.FC<{ symbol: string }> = ({ symbol }) => {
  switch (symbol) {
    case 'dot':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <circle cx="40" cy="40" r="3.5" fill="#0f172a" />
        </svg>
      );
    case 'curve':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <path d="M 18 32 Q 28 18 38 30" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'stairs':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <line x1="20" y1="62" x2="20" y2="46" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="34" y1="62" x2="34" y2="34" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="48" y1="62" x2="48" y2="20" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <rect x="46" y="18" width="14" height="14" fill="#0f172a" />
        </svg>
      );
    case 'diagonal':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <line x1="18" y1="58" x2="34" y2="42" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="28" y1="48" x2="44" y2="64" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );
    case 'lines':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <line x1="22" y1="24" x2="46" y2="24" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="54" y1="34" x2="54" y2="56" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );
    case 'arc':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <path d="M 28 46 A 14 14 0 1 0 52 46" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeDasharray="3 4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 border border-slate-300 bg-white rounded">
          <path d="M 18 38 Q 40 16 62 38" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
};

export const GuidesRunner: React.FC<GuidesRunnerProps> = ({
  module,
  savedProgress,
  onSaveProgress,
  onBack,
  onNextModule,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    savedProgress?.checkedItems ?? {}
  );
  const [warteggNotes, setWarteggNotes] = useState<Record<number, string>>(
    savedProgress?.warteggNotes ?? {}
  );
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    Boolean(savedProgress?.completed)
  );

  // 15-minute presentation rehearsal timer for 3E
  const presentationTimer = useCountdown(15, false);

  useEffect(() => {
    setCheckedItems(savedProgress?.checkedItems ?? {});
    setWarteggNotes(savedProgress?.warteggNotes ?? {});
    setIsCompleted(Boolean(savedProgress?.completed));
  }, [module.id]);

  const persistChecklist = (
    nextChecked: Record<string, boolean>,
    nextWartegg: Record<number, string>,
    completed = isCompleted
  ) => {
    let total = 0;
    let done = 0;
    if (module.checklistGroups) {
      for (const g of module.checklistGroups) {
        total += g.items.length;
        done += g.items.filter((i) => nextChecked[i.id]).length;
      }
    } else if (module.mcuGuide) {
      total = module.mcuGuide.prepSteps.length;
      done = module.mcuGuide.prepSteps.filter((_, idx) => nextChecked[`mcu-${idx}`]).length;
    } else if (module.projectiveGuide) {
      total = 8;
      done = Object.values(nextWartegg).filter((v) => v.trim().length > 0).length;
    } else if (module.presentationGuide) {
      total = module.presentationGuide.passChecklist.length;
      done = module.presentationGuide.passChecklist.filter(
        (_, idx) => nextChecked[`pres-${idx}`]
      ).length;
    }

    onSaveProgress({
      moduleId: module.id,
      completed: completed || (total > 0 && done === total),
      submittedAt: completed ? new Date().toISOString() : undefined,
      correctCount: done,
      totalCount: total,
      scorePercent: total > 0 ? Math.round((done / total) * 100) : 0,
      checkedItems: nextChecked,
      warteggNotes: nextWartegg,
    });
  };

  const toggleCheck = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    persistChecklist(next, warteggNotes, isCompleted);
  };

  const updateWarteggNote = (box: number, value: string) => {
    const next = { ...warteggNotes, [box]: value };
    setWarteggNotes(next);
    persistChecklist(checkedItems, next, isCompleted);
  };

  const markComplete = () => {
    setIsCompleted(true);
    persistChecklist(checkedItems, warteggNotes, true);
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

        {isCompleted && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Sudah Dipelajari / Selesai
          </span>
        )}
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-2">
        <p className="text-xs text-slate-500">
          {module.code} · {module.subtitle}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{module.title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{module.instructions}</p>
      </section>

      {/* 1E: Projective / Wartegg */}
      {module.projectiveGuide && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">
                Simulasi Rencana Gambar Wartegg (8 Kotak)
              </h2>
              <p className="text-sm text-slate-600">{module.projectiveGuide.intro}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {module.projectiveGuide.warteggPrompts.map((p) => (
                <div
                  key={p.box}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      Kotak {p.box}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <WarteggSymbolSvg symbol={p.symbol} />
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{p.hint}</p>
                  <input
                    type="text"
                    value={warteggNotes[p.box] ?? ''}
                    onChange={(e) => updateWarteggNote(p.box, e.target.value)}
                    placeholder="Rencana gambar Anda..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {module.projectiveGuide.sections.map((sec) => (
              <section
                key={sec.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
                <p className="text-xs text-slate-600">{sec.description}</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {sec.tips.map((t, i) => (
                    <li key={i} className="leading-relaxed">
                      • {t}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 text-sm text-emerald-950">
            <span className="font-bold">Kunci / Cara Dinilai: </span>
            {module.projectiveGuide.scoringPrinciple}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Cara Lolos Assessment Potensi / Psikologi
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              {module.projectiveGuide.passTips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* 3E: Makalah & Presentasi */}
      {module.presentationGuide && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Latihan Presentasi 15 Menit
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Latih penyampaian tanpa membaca slide — slide hanya panduan, Anda yang menjelaskan.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    presentationTimer.secondsLeft < 120 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1.5 text-sky-700" />
                  {presentationTimer.formatted}
                </span>
                <button
                  type="button"
                  onClick={presentationTimer.toggle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800"
                >
                  {presentationTimer.isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Jeda</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Mulai 15 Menit</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={presentationTimer.reset}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
              {module.presentationGuide.topics.map((topic, idx) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicIdx(idx)}
                  className={`flex-1 min-w-[200px] px-3 py-2 text-xs font-semibold rounded-md text-left transition-colors ${
                    selectedTopicIdx === idx
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Judul {topic.number}
                </button>
              ))}
            </div>

            {module.presentationGuide.topics[selectedTopicIdx] && (
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {module.presentationGuide.topics[selectedTopicIdx].title}
                </h3>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Kerangka Makalah (8–12 Halaman):
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {module.presentationGuide.topics[selectedTopicIdx].outline.map((line, i) => (
                      <li key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                {module.presentationGuide.topics[selectedTopicIdx].sampleSlides && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Contoh Susunan Slide Presentasi (11 Slide):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {module.presentationGuide.topics[selectedTopicIdx].sampleSlides?.map(
                        (s, i) => (
                          <div
                            key={i}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 bg-white"
                          >
                            {s}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Tips Presentasi yang Dinilai Tinggi
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {module.presentationGuide.presentationTips.map((t, i) => (
                  <li key={i} className="leading-relaxed">
                    • {t}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-emerald-900">
                  Contoh Kalimat Pembuka Presentasi
                </h3>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  {module.presentationGuide.sampleOpening}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-sm font-bold text-emerald-900">
                  Contoh Kalimat Penutup Presentasi
                </h3>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  {module.presentationGuide.sampleClosing}
                </p>
              </div>
            </section>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Checklist Lulus — Tes Tertulis Bidang + Makalah
            </h3>
            <div className="space-y-2">
              {module.presentationGuide.passChecklist.map((item, idx) => {
                const key = `pres-${idx}`;
                const checked = Boolean(checkedItems[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCheck(key)}
                    className={`w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                      checked
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm leading-relaxed">{item}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* 4D: MCU Guide */}
      {module.mcuGuide && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
              <h2 className="text-base font-bold text-slate-900">Yang Biasa Diperiksa</h2>
              <ul className="space-y-2.5 text-sm text-slate-700">
                {module.mcuGuide.examItems.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                Yang Sering Bikin Gagal MCU (& Cara Mencegahnya)
              </h2>
              <ul className="space-y-2.5 text-sm text-slate-700">
                {module.mcuGuide.commonFailures.map((item, i) => (
                  <li key={i} className="leading-relaxed bg-amber-50/60 border border-amber-200 rounded-lg p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Checklist Persiapan MCU (H-7 sampai Hari-H)
            </h2>
            <div className="space-y-2">
              {module.mcuGuide.prepSteps.map((step, idx) => {
                const key = `mcu-${idx}`;
                const checked = Boolean(checkedItems[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCheck(key)}
                    className={`w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                      checked
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm leading-relaxed">{step}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 text-sm text-rose-950 leading-relaxed">
            <span className="font-bold">Penting: </span>
            {module.mcuGuide.importantNotice}
          </section>
        </div>
      )}

      {/* 4E: Checklist Hari-H */}
      {module.checklistGroups && (
        <div className="space-y-5">
          {module.checklistGroups.map((group) => {
            const doneCount = group.items.filter((i) => checkedItems[i.id]).length;
            return (
              <section
                key={group.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3"
              >
                <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">{group.title}</h2>
                  <span className="text-xs font-mono tabular-nums text-sky-700 font-semibold">
                    {doneCount}/{group.items.length} selesai
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const checked = Boolean(checkedItems[item.id]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                          checked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm leading-relaxed ${checked ? 'line-through opacity-80' : ''}`}>
                          {item.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={markComplete}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Tandai Modul Selesai</span>
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
