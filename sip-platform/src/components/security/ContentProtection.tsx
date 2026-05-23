'use client';

import { useEffect } from 'react';

export function ContentProtection() {
  useEffect(() => {
    // --- 1. Disable right-click context menu ---
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click in admin pages
      if (window.location.pathname.startsWith('/admin')) return;
      e.preventDefault();
    };

    // --- 2. Block developer tool shortcuts ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.location.pathname.startsWith('/admin')) return;

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return;
      }
      // F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return;
      }
      // Cmd+Option+I (Mac DevTools)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return;
      }
      // Cmd+Option+U (Mac View Source)
      if (e.metaKey && e.altKey && e.key === 'u') {
        e.preventDefault();
        return;
      }
      // Cmd+S (Mac Save)
      if (e.metaKey && e.key === 's') {
        e.preventDefault();
        return;
      }
    };

    // --- 3. Disable text selection via drag ---
    const handleSelectStart = (e: Event) => {
      if (window.location.pathname.startsWith('/admin')) return;
      const target = e.target as HTMLElement;
      // Allow selection in inputs, textareas, and contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
    };

    // --- 4. Disable copy ---
    const handleCopy = (e: ClipboardEvent) => {
      if (window.location.pathname.startsWith('/admin')) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
      ) {
        return;
      }
      e.preventDefault();
      // Set clipboard to copyright notice instead
      e.clipboardData?.setData(
        'text/plain',
        'Content protected by copyright. Visit merasip.com for original content. © 2026 Trustner Asset Services Pvt. Ltd.'
      );
    };

    // --- 5. Disable drag on images ---
    const handleDragStart = (e: DragEvent) => {
      if (window.location.pathname.startsWith('/admin')) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // --- 6. Console warning for developers ---
    const warningStyle = 'color: red; font-size: 24px; font-weight: bold;';
    const infoStyle = 'color: #1a1a2e; font-size: 14px;';
    console.log('%cSTOP!', warningStyle);
    console.log(
      '%cThis website and its content are protected by copyright law. Unauthorized copying, scraping, or reproduction of this website\'s content, design, or code is strictly prohibited and may result in legal action under the Indian Copyright Act, 1957 and IT Act, 2000.\n\n© 2026 Trustner Asset Services Pvt. Ltd. | ARN-286886\nmerasip.com',
      infoStyle
    );

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return null;
}
