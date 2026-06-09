/* Mera SIF — main.js
 * Shared interactivity: mobile nav, reveal-on-scroll, FAQ accordion,
 * smooth anchor scrolling, current-year footer, simple form handler.
 */

(function () {
  'use strict';

  // ==========================================================
  // Mobile navigation toggle
  // ==========================================================
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.innerHTML = isOpen ? '✕' : '☰';
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close when a link is clicked (mobile)
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 1024 && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          navToggle.classList.remove('open');
          navToggle.innerHTML = '☰';
          document.body.style.overflow = '';
        }
      });
    });
  }

  // ==========================================================
  // Reveal-on-scroll
  // ==========================================================
  if ('IntersectionObserver' in window) {
    const reveals = document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale');
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale')
      .forEach(function (el) { el.classList.add('revealed'); });
  }

  // ==========================================================
  // FAQ accordion
  // ==========================================================
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      const item = q.closest('.faq-item');
      if (!item) return;
      const open = item.classList.contains('open');
      // Close siblings if you want single-open behaviour:
      // item.parentElement.querySelectorAll('.faq-item.open').forEach(s=>s.classList.remove('open'));
      item.classList.toggle('open', !open);
      q.setAttribute('aria-expanded', !open ? 'true' : 'false');
    });
  });

  // ==========================================================
  // Smooth scroll for anchor links
  // ==========================================================
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const href = a.getAttribute('href');
      if (href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 90;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ==========================================================
  // Footer year
  // ==========================================================
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ==========================================================
  // Highlight active nav link based on current path
  // ==========================================================
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // ==========================================================
  // Contact form (simple WhatsApp/email handoff — no backend)
  // ==========================================================
  const form = document.querySelector('[data-lead-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const phone = (data.get('phone') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const investment = (data.get('investment') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      if (!name || !phone) {
        alert('Please share your name and phone number so we can reach you.');
        return;
      }

      const lines = [
        'Hello Trustner — I am interested in learning about SIF investing.',
        '',
        'Name: ' + name,
        'Phone: ' + phone,
        email ? 'Email: ' + email : '',
        investment ? 'Investment Range: ' + investment : '',
        message ? 'Message: ' + message : ''
      ].filter(Boolean).join('\n');

      const wa = 'https://wa.me/916003903737?text=' + encodeURIComponent(lines);
      window.open(wa, '_blank');

      // Optional: show success state inline
      const success = form.querySelector('[data-form-success]');
      if (success) {
        success.style.display = 'block';
        form.querySelectorAll('input,select,textarea,button').forEach(function (el) { el.disabled = true; });
      }
    });
  }

  // ==========================================================
  // Tab switcher (used on fund-universe page)
  // ==========================================================
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    const tabs = group.querySelectorAll('[data-tab]');
    const panes = group.querySelectorAll('[data-pane]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const key = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        panes.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-pane') === key); });
      });
    });
  });
})();
