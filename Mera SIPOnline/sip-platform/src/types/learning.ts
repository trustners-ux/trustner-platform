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
}

export interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  category: string;
  relatedTerms: string[];
}
