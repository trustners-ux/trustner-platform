/**
 * Gallery Data
 *
 * Photos uploaded via /admin/gallery are stored in Vercel Blob under the
 * `gallery/` prefix. Captions, categories, and object-position values are
 * stored in `gallery/metadata.json` (a single JSON manifest in the same blob
 * store) and merged in by /api/gallery on read.
 *
 * Categories supported (must match the metadata.json values):
 *   - team           : group / portrait shots of Trustner staff
 *   - team-moments   : candid in-the-moment shots
 *   - office-life    : visiting AMC CEOs, internal events, office culture
 *   - awards         : industry awards, recognition, felicitations
 *   - events         : public events, summits, conferences
 *   - milestones     : firm milestones (anniversaries, AUM crossings, etc.)
 */

export interface GalleryImage {
  src: string;
  caption: string;
  category: GalleryCategory;
  /** CSS object-position value (e.g. "48% 29%") for proper cropping */
  objectPosition?: string;
}

export type GalleryCategory =
  | 'team'
  | 'team-moments'
  | 'office-life'
  | 'awards'
  | 'events'
  | 'milestones';

export const galleryCategories = [
  { id: 'all', label: 'All Photos' },
  { id: 'office-life', label: 'Office Life' },
  { id: 'awards', label: 'Awards' },
  { id: 'team', label: 'Our Team' },
  { id: 'team-moments', label: 'Team Moments' },
  { id: 'events', label: 'Events' },
  { id: 'milestones', label: 'Milestones' },
] as const;

// Static images are not used in production — every photo is loaded from
// Vercel Blob via /api/gallery. This array is kept empty as the seed list.
export const galleryImages: GalleryImage[] = [];
