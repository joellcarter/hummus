/* =================================================================
   HUMMUS VILLAGE — MAIN.JS
   No frameworks. No dependencies. Vanilla.
   ================================================================= */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------
     1. Navigation scroll behavior
     ----------------------------------------------------------------- */
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let ticking = false;

    function update() {
      if (window.scrollY > 60) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* -----------------------------------------------------------------
     2. Mobile menu toggle
     ----------------------------------------------------------------- */
  function initMobileMenu() {
    const burger = document.querySelector('.nav__burger');
    const menu = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;
    const backdrop = menu.querySelector('.mobile-menu__backdrop');
    const links = menu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta');

    function open() {
      menu.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    function toggle() {
      if (menu.classList.contains('is-open')) close();
      else open();
    }

    burger.addEventListener('click', toggle);
    if (backdrop) backdrop.addEventListener('click', close);
    links.forEach(function (l) { l.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* -----------------------------------------------------------------
     3. Scroll reveal — IntersectionObserver
     ----------------------------------------------------------------- */
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, idx) {
        if (entry.isIntersecting) {
          // Stagger siblings within their immediate parent
          const target = entry.target;
          const siblings = target.parentElement
            ? Array.prototype.filter.call(target.parentElement.children, function (c) {
                return c.classList.contains('reveal');
              })
            : [target];
          const localIdx = siblings.indexOf(target);
          const delay = Math.min(localIdx * 120, 600);
          target.style.transitionDelay = delay + 'ms';
          target.classList.add('is-visible');
          observer.unobserve(target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -48px 0px'
    });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* -----------------------------------------------------------------
     4. Stat counters
     ----------------------------------------------------------------- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el, target, duration) {
    if (prefersReduced) {
      el.textContent = target;
      return;
    }
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      const current = Math.round(target * eased);
      el.textContent = current;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;
    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (c) { c.textContent = c.dataset.counter; });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.counter, 10);
          animateCounter(entry.target, target, 1800);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { observer.observe(c); });
  }

  /* -----------------------------------------------------------------
     5. Hero parallax — subtle decorative element only
     ----------------------------------------------------------------- */
  function initParallax() {
    if (prefersReduced) return;
    const el = document.querySelector('[data-parallax]');
    if (!el) return;
    let ticking = false;

    function update() {
      const scroll = window.scrollY;
      const offset = Math.min(scroll * 0.4, 40);
      el.style.transform = 'translateY(' + offset + 'px)';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  /* -----------------------------------------------------------------
     6. Smooth scroll with nav offset for anchor links
     ----------------------------------------------------------------- */
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const navH = window.innerWidth >= 768 ? 72 : 60;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({
          top: top,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });
      });
    });
  }

  /* -----------------------------------------------------------------
     7. Active nav link detection
     ----------------------------------------------------------------- */
  function initActiveLink() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link, .mobile-menu__link').forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* -----------------------------------------------------------------
     8. Hero load choreography
     ----------------------------------------------------------------- */
  function initHeroLoad() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add('is-loaded');
      });
    });
  }

  /* -----------------------------------------------------------------
     INIT ON DOM READY
     ----------------------------------------------------------------- */
  function init() {
    initNavScroll();
    initMobileMenu();
    initScrollReveal();
    initCounters();
    initParallax();
    initSmoothScroll();
    initActiveLink();
    initHeroLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
