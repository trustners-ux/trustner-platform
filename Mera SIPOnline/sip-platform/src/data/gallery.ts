/**
 * Gallery Data
 *
 * HOW TO ADD PHOTOS:
 * 1. Place your image files in the /public/gallery/ folder
 * 2. Add an entry below with the path, caption, and category
 * 3. Supported formats: .jpg, .jpeg, .png, .webp
 * 4. Recommended size: 1200x800px or larger for best quality
 *
 * Categories: 'team' | 'events' | 'office' | 'milestones'
 */

export interface GalleryImage {
  src: string;
  caption: string;
  category: 'team' | 'events' | 'office' | 'milestones';
}

export const galleryCategories = [
  { id: 'all', label: 'All Photos' },
  { id: 'team', label: 'Our Team' },
  { id: 'events', label: 'Events' },
  { id: 'office', label: 'Our Offices' },
  { id: 'milestones', label: 'Milestones' },
] as const;

// Add your images here — place files in /public/gallery/
export const galleryImages: GalleryImage[] = [
  // Example entries (replace with actual photos):
  // { src: '/gallery/team-guwahati.jpg', caption: 'Team Trustner - Guwahati HQ', category: 'team' },
  // { src: '/gallery/bangalore-office.jpg', caption: 'Bangalore Corporate Office', category: 'office' },
  // { src: '/gallery/annual-meet-2024.jpg', caption: 'Annual Meet 2024', category: 'events' },
  // { src: '/gallery/first-100-clients.jpg', caption: 'Celebrating 100 Clients', category: 'milestones' },
];
