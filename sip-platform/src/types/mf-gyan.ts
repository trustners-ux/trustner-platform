/* ═══════════════════════════════════════════════════════════════
   MF Gyan — Learning Module Types
   Employee training content derived from Prof. Simply Simple PPTs
   Updated for April 2026
   ═══════════════════════════════════════════════════════════════ */

export interface GyanTopic {
  id: string;             // kebab-case slug
  title: string;          // Display name
  description: string;    // 1-line summary (~15 words)
  readTime: string;       // e.g. "4 min"
  content: string[];      // Array of paragraphs (lesson body)
  keyTakeaways: string[]; // 3-5 bullet summary
}

export interface GyanCategory {
  id: string;             // kebab-case slug
  title: string;          // e.g. "Debt Market"
  description: string;    // 2-line category description
  icon: string;           // Lucide icon name
  color: string;          // Tailwind text color for icon
  bgColor: string;        // Light background for cards
  gradientFrom: string;   // Gradient start for header
  gradientTo: string;     // Gradient end for header
  topics: GyanTopic[];
}
