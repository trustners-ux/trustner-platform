/**
 * Client-safe letter catalogue — id / name / category / entity scope only.
 *
 * Client components (the letter form, the archive list) import THIS, never
 * letter-templates.ts, because letter-templates pulls in the base64 signature
 * images (server-only) via the render functions. Keep this list in sync with
 * LETTER_REGISTRY in letter-templates.ts (same ids, names, scope).
 */
export interface LetterCatalogEntry {
  id: string;
  name: string;
  category: 'Joining' | 'Compliance' | 'Tenure' | 'Discipline' | 'Exit';
  entityScoped: ('TAS' | 'TIB')[];
}

export const LETTER_CATALOG: readonly LetterCatalogEntry[] = [
  { id: 'offer', name: 'Offer Letter', category: 'Joining', entityScoped: ['TAS', 'TIB'] },
  { id: 'appointment_tas', name: 'Appointment Letter — TAS', category: 'Joining', entityScoped: ['TAS'] },
  { id: 'appointment_tib', name: 'Appointment Letter — TIB', category: 'Joining', entityScoped: ['TIB'] },
  { id: 'appointment_field_sales_tib', name: 'Appointment Letter — Field Sales (TIB)', category: 'Joining', entityScoped: ['TIB'] },
  { id: 'appointment_onsite', name: 'Appointment Letter — Onsite Deployment', category: 'Joining', entityScoped: ['TAS', 'TIB'] },
  { id: 'appointment_contractual', name: 'Appointment Letter — Contractual', category: 'Joining', entityScoped: ['TAS', 'TIB'] },
  { id: 'related_party_disclosure', name: 'Related-Party Disclosure', category: 'Compliance', entityScoped: ['TAS', 'TIB'] },
  { id: 'irdai_acknowledgement', name: 'IRDAI Compliance Acknowledgement', category: 'Compliance', entityScoped: ['TIB'] },
  { id: 'bgv_authorization', name: 'Background Verification Authorisation', category: 'Compliance', entityScoped: ['TAS', 'TIB'] },
  { id: 'nda', name: 'Non-Disclosure Agreement', category: 'Compliance', entityScoped: ['TAS', 'TIB'] },
  { id: 'non_compete', name: 'Non-Compete & Non-Solicitation', category: 'Compliance', entityScoped: ['TAS', 'TIB'] },
  { id: 'probation_confirmation', name: 'Probation Confirmation', category: 'Tenure', entityScoped: ['TAS', 'TIB'] },
  { id: 'increment', name: 'Increment Letter', category: 'Tenure', entityScoped: ['TAS', 'TIB'] },
  { id: 'promotion', name: 'Promotion Letter', category: 'Tenure', entityScoped: ['TAS', 'TIB'] },
  { id: 'warning', name: 'Warning Letter', category: 'Discipline', entityScoped: ['TAS', 'TIB'] },
  { id: 'show_cause', name: 'Show-Cause Notice', category: 'Discipline', entityScoped: ['TAS', 'TIB'] },
  { id: 'resignation_acceptance', name: 'Resignation Acceptance Letter', category: 'Exit', entityScoped: ['TAS', 'TIB'] },
  { id: 'termination', name: 'Termination Letter', category: 'Exit', entityScoped: ['TAS', 'TIB'] },
  { id: 'relieving', name: 'Relieving Letter', category: 'Exit', entityScoped: ['TAS', 'TIB'] },
  { id: 'experience', name: 'Experience Letter', category: 'Exit', entityScoped: ['TAS', 'TIB'] },
];

const NAME_BY_ID: Record<string, string> = LETTER_CATALOG.reduce<Record<string, string>>((acc, e) => {
  acc[e.id] = e.name;
  return acc;
}, {});

export function letterName(id: string): string {
  return NAME_BY_ID[id] || id;
}
