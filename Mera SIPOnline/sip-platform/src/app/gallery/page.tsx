'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, ArrowLeft, X, ChevronLeft, ChevronRight, ImageIcon, Loader2 } from 'lucide-react';
import { galleryImages as staticImages, galleryCategories } from '@/data/gallery';

interface GalleryImage {
  src: string;
  caption: string;
  category: string;
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [dynamicImages, setDynamicImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Merge static images with dynamic (Vercel Blob) images
  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch('/api/gallery');
        const data = await res.json();
        if (data.images) {
          setDynamicImages(data.images);
        }
      } catch {
        // Fall back to static only
      } finally {
        setLoading(false);
      }
    }
    loadImages();
  }, []);

  const allImages: GalleryImage[] = [...staticImages, ...dynamicImages];

  const filteredImages =
    activeCategory === 'all'
      ? allImages
      : allImages.filter((img) => img.category === activeCategory);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    dialogRef.current?.showModal();
  };

  const closeLightbox = () => {
    dialogRef.current?.close();
    setLightboxIndex(-1);
  };

  const goToPrevious = useCallback(() => {
    if (filteredImages.length === 0) return;
    setLightboxIndex((prev) =>
      prev <= 0 ? filteredImages.length - 1 : prev - 1
    );
  }, [filteredImages.length]);

  const goToNext = useCallback(() => {
    if (filteredImages.length === 0) return;
    setLightboxIndex((prev) =>
      prev >= filteredImages.length - 1 ? 0 : prev + 1
    );
  }, [filteredImages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex < 0) return;
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, goToPrevious, goToNext]);

  const currentImage: GalleryImage | undefined =
    lightboxIndex >= 0 ? filteredImages[lightboxIndex] : undefined;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />

        <div className="container-custom relative z-10 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <Camera className="w-3.5 h-3.5 text-accent" />
              <span>Life at Trustner</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-display font-extrabold leading-tight mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                Photo Gallery
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              A glimpse into our journey, team, and milestones
            </p>
          </div>
        </div>
      </section>

      {/* GALLERY CONTENT */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            {galleryCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand text-white shadow-md'
                    : 'bg-surface-200 text-slate-600 hover:bg-surface-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : allImages.length === 0 ? (
            /* Empty State */
            <div className="card-base p-16 text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center mx-auto mb-8">
                <ImageIcon className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Gallery Coming Soon
              </h2>
              <p className="text-slate-500 leading-relaxed">
                Our gallery is being set up! Photos of our team, events, and offices
                will be available here soon.
              </p>
            </div>
          ) : filteredImages.length === 0 ? (
            /* No images in category */
            <div className="card-base p-12 text-center max-w-lg mx-auto">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary-700 mb-2">
                No photos in this category
              </h3>
              <p className="text-sm text-slate-500">
                Try selecting a different category or check back later.
              </p>
            </div>
          ) : (
            /* Image Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image, index) => (
                <div
                  key={`${image.src}-${index}`}
                  className="card-base overflow-hidden group cursor-pointer hover-lift"
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative aspect-[3/2] overflow-hidden">
                    {image.src.startsWith('http') ? (
                      // External URL (Vercel Blob)
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.src}
                        alt={image.caption}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      // Local file
                      <Image
                        src={image.src}
                        alt={image.caption}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    {/* Caption Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-10">
                      <p className="text-white text-sm font-medium leading-snug">
                        {image.caption}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      <dialog
        ref={dialogRef}
        className="fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-0 bg-transparent backdrop:bg-black/80"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            closeLightbox();
          }
        }}
      >
        {currentImage && (
          <div className="flex items-center justify-center w-full h-full p-4 sm:p-8">
            <div className="relative max-w-5xl w-full">
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 sm:right-0 text-white/80 hover:text-white transition-colors z-50"
                aria-label="Close lightbox"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Image */}
              <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-black">
                {currentImage.src.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage.src}
                    alt={currentImage.caption}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={currentImage.src}
                    alt={currentImage.caption}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    priority
                  />
                )}
              </div>

              {/* Caption */}
              <p className="text-center text-white text-sm sm:text-base font-medium mt-4">
                {currentImage.caption}
              </p>

              {/* Counter */}
              <p className="text-center text-white/50 text-xs mt-1">
                {lightboxIndex + 1} of {filteredImages.length}
              </p>

              {/* Previous Button */}
              {filteredImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-14 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Next Button */}
              {filteredImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-14 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
