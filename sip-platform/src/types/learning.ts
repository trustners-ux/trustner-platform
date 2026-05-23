export interface FAQ {
  question: string;
  answer: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface SectionContent {
  definition: string;
  explanation: string;
  realLifeExample: string;
  keyPoints: string[];
  formula?: string;
  numericalExample?: string;
  faq: FAQ[];
  mcqs: MCQ[];
  summaryNotes: string[];
  relatedTopics: string[];
}

export interface Section {
  id: string;
  title: string;
  slug: string;
  content: SectionContent;
}

/** Top-level learning track / product segment */
export type LearnTrack =
  | 'mutual-funds'
  | 'sif'
  | 'pms'
  | 'aif'
  | 'gift-city'
  | 'international'
  | 'insurance';

export interface LearningModule {
  id: string;
  title: string;
  slug: string;
  icon: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  color: string;
  estimatedTime: string;
  sections: Section[];
  /** Which top-level Learn segment this module belongs to. Defaults to 'mutual-funds' if absent. */
  track?: LearnTrack;
}

export interface LearnTrackInfo {
  id: LearnTrack;
  name: string;
  shortName: string;
  description: string;
  icon: string;          // lucide icon name
  gradient: string;      // tailwind gradient classes
  accentColor: string;
  /** Audience scope for the FOUNDATION track (this is what we publish today). */
  audienceFoundation: string;
  /** Audience scope reserved for the ADVANCED track (sub-broker / certification level). */
  audienceAdvanced: string;
  /** Minimum investment in INR (where regulator-mandated). */
  minimumInvestment?: string;
  /** Top-level regulator name. */
  regulator: string;
  /** True when Trustner is empanelled / authorised to distribute this product. */
  trustnerEmpanelled: boolean;
}

export interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  category: string;
  relatedTerms: string[];
}
