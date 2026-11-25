export type QuizMode = 'exam' | 'study';

export type BagianId = 'bagian1' | 'bagian2' | 'bagian3' | 'bagian4';

export type ModuleKind =
  | 'mcq'
  | 'likert'
  | 'star'
  | 'lgd'
  | 'inbasket'
  | 'essay'
  | 'projective'
  | 'presentation'
  | 'mcu'
  | 'checklist';

export interface McqOption {
  key: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface McqQuestion {
  id: string;
  number: number;
  question: string;
  options: McqOption[];
  correctKey: string;
  explanation: string;
}

export type LikertValue = 'SS' | 'S' | 'R' | 'TS' | 'STS';

export interface LikertQuestion {
  id: string;
  number: number;
  cluster: string;
  statement: string;
  idealValues: LikertValue[];
  note?: string;
}

export interface StarQuestion {
  id: string;
  number: number;
  prompt: string;
  sampleAnswer: string;
  keyTip?: string;
}

export interface LgdCase {
  id: string;
  number: number;
  title: string;
  theme: string;
  durationMinutes: number;
  options: string[];
  requiredPickCount: number;
  sampleOpening: string;
  rubric: string;
}

export interface InBasketItem {
  id: string;
  label: string;
  description: string;
}

export interface InBasketCase {
  id: string;
  number: number;
  title: string;
  context: string;
  items: InBasketItem[];
  idealOrderIds?: string[];
  idealExplanation: string;
}

export interface EssayQuestion {
  id: string;
  number: number;
  prompt: string;
  minWords: number;
  maxWords: number;
  sampleFramework: string;
}

export interface ProjectiveSection {
  id: string;
  title: string;
  description: string;
  tips: string[];
}

export interface PresentationTopic {
  id: string;
  number: number;
  title: string;
  outline: string[];
  sampleSlides?: string[];
}

export interface ChecklistGroup {
  id: string;
  title: string;
  subtitle?: string;
  items: { id: string; text: string }[];
}

export interface ModuleDefinition {
  id: string;
  bagianId: BagianId;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  kind: ModuleKind;
  durationMinutes: number;
  questionCountLabel: string;
  instructions: string;
  passingScore?: number;
  mcqQuestions?: McqQuestion[];
  likertQuestions?: LikertQuestion[];
  likertSummaryNote?: string;
  starQuestions?: StarQuestion[];
  starFormatHint?: string;
  lgdCases?: LgdCase[];
  inBasketCases?: InBasketCase[];
  essayQuestions?: EssayQuestion[];
  projectiveGuide?: {
    intro: string;
    sections: ProjectiveSection[];
    scoringPrinciple: string;
    warteggPrompts: { box: number; hint: string; symbol: 'dot' | 'curve' | 'stairs' | 'square' | 'diagonal' | 'lines' | 'arc' | 'circle' }[];
    passTips: string[];
  };
  presentationGuide?: {
    intro: string;
    topics: PresentationTopic[];
    presentationTips: string[];
    sampleOpening: string;
    sampleClosing: string;
    passChecklist: string[];
  };
  mcuGuide?: {
    intro: string;
    examItems: string[];
    prepSteps: string[];
    commonFailures: string[];
    importantNotice: string;
  };
  checklistGroups?: ChecklistGroup[];
  rubricNotes?: {
    title: string;
    items: string[];
    warnings?: string[];
  };
}

export interface BagianMeta {
  id: BagianId;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  totalMinutes: number;
  closingNote: string;
}

export interface StarDraft {
  s: string;
  t: string;
  a: string;
  r: string;
}

export interface LgdDraft {
  selectedOptions: string[];
  statement: string;
}

export interface InBasketDraft {
  orderIds: string[];
  delegationNote: string;
}

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  submittedAt?: string;
  scorePercent?: number;
  correctCount?: number;
  totalCount?: number;
  mcqAnswers?: Record<string, string>;
  flaggedIds?: string[];
  likertAnswers?: Record<string, LikertValue>;
  starDrafts?: Record<string, StarDraft>;
  essayDrafts?: Record<string, string>;
  lgdDrafts?: Record<string, LgdDraft>;
  inBasketDrafts?: Record<string, InBasketDraft>;
  checkedItems?: Record<string, boolean>;
  warteggNotes?: Record<number, string>;
}
