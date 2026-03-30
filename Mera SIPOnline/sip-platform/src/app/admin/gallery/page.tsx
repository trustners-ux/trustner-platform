'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload, Trash2, Image as ImageIcon, X, Check, Loader2,
  Filter, RefreshCw, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface GalleryImageItem {
  filename: string;
  src: string;
  caption: string;
  category: string;
  size: number;
  uploadedAt: string;
}

const CATEGORIES = [
  { id: 'team', label: 'Our Team' },
  { id: 'events', label: 'Events' },
  { id: 'office', label: 'Our Offices' },
  { id: 'milestones', label: 'Milestones' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCategory, setUploadCategory] = useState('team');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/gallery');
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
      }
    } catch {
      setError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  async function handleUpload(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setError(null);

    let uploadedCount = 0;
    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', uploadCaption || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
      formData.append('category', uploadCategory);

      try {
        const res = await fetch('/api/admin/gallery/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Upload failed');
        } else {
          uploadedCount++;
        }
      } catch {
        setError('Upload failed — check file size and format');
      }
    }

    if (uploadedCount > 0) {
      setSuccessMsg(`${uploadedCount} image${uploadedCount > 1 ? 's' : ''} uploaded successfully`);
      setUploadCaption('');
      fetchImages();
    }
    setUploading(false);
  }

  async function handleDelete(src: string) {
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: src }),
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.src !== src));
        setSuccessMsg('Image deleted');
        setDeleteConfirm(null);
      } else {
        setError('Failed to delete image');
      }
    } catch {
      setError('Delete failed');
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  const filteredImages = filterCategory === 'all'
    ? images
    : images.filter((img) => img.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Gallery Manager</h1>
          <p className="text-sm text-slate-500">Upload and manage photos for the website gallery</p>
        </div>
        <button
          onClick={fetchImages}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div className="card-base p-5 space-y-4">
        <h3 className="text-sm font-bold text-primary-700">Upload Photos</h3>

        {/* Caption & Category inputs */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Caption (optional)</label>
            <input
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="Describe the photo..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            dragActive
              ? 'border-brand bg-brand-50/50'
              : 'border-surface-300 hover:border-brand/50 hover:bg-surface-50'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
              <p className="text-sm font-semibold text-primary-700">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
                <Upload className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-700">
                  Drag & drop photos here or click to browse
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  JPEG, PNG, WebP, GIF — Max 10MB per file
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => {
              if (e.target.files) handleUpload(e.target.files);
              e.target.value = '';
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilterCategory('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                filterCategory === 'all'
                  ? 'bg-brand text-white'
                  : 'bg-surface-100 text-slate-500 hover:bg-surface-200'
              )}
            >
              All ({images.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = images.filter((img) => img.category === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    filterCategory === c.id
                      ? 'bg-brand text-white'
                      : 'bg-surface-100 text-slate-500 hover:bg-surface-200'
                  )}
                >
                  {c.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="card-base p-12 text-center">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            {images.length === 0 ? 'No photos uploaded yet' : 'No photos in this category'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {images.length === 0
              ? 'Use the upload area above to add photos'
              : 'Try a different category filter'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <div key={img.src} className="card-base overflow-hidden group">
              {/* Image Preview */}
              <div className="relative aspect-[3/2] bg-surface-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.caption}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Delete overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
                  {deleteConfirm === img.src ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(img.src)}
                        className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Confirm delete"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:bg-white transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(img.src)}
                      className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-primary-700 line-clamp-1">
                  {img.caption || img.filename}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-brand bg-brand-50 px-2 py-0.5 rounded-full capitalize">
                    {img.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatFileSize(img.size)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="card-base p-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-500">How it works:</strong> Photos uploaded here are saved to the website&apos;s gallery folder.
          They appear on the public <a href="/gallery" target="_blank" className="text-brand hover:underline">Gallery page</a> automatically.
          To update captions or categories for existing photos, delete and re-upload with the correct details.
        </p>
      </div>
    </div>
  );
}
