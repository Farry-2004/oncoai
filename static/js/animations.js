/* OncoAI — Motion & Animation Engine */

(function () {
  'use strict';

  // ─── Scroll-triggered animations ───
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  function initScrollAnimations() {
    document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));
  }

  // ─── Counter animation for stat numbers ───
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      const duration = 1200;
      const start = performance.now();
      const initial = 0;

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(initial + (target - initial) * eased);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // ─── Ripple effect on buttons ───
  function initRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .quick-btn, .nav-btn');
      if (!btn) return;
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      const rect = btn.getBoundingClientRect();
      ripple.style.left = e.clientX - rect.left + 'px';
      ripple.style.top = e.clientY - rect.top + 'px';
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  // ─── Parallax on hero section ───
  function initHeroParallax() {
    const hero = document.querySelector('.dashboard-hero');
    if (!hero) return;
    const content = hero.querySelector('.hero-content');
    window.addEventListener(
      'scroll',
      () => {
        const scrolled = window.scrollY;
        if (scrolled < 500 && content) {
          content.style.transform = `translateY(${scrolled * 0.15}px)`;
          content.style.opacity = Math.max(1 - scrolled / 400, 0);
        }
      },
      { passive: true }
    );
  }

  // ─── Smooth tab transitions ───
  function initTabTransitions() {
    const origSwitch = window.switchTab;
    if (!origSwitch) return;
    window.switchTab = function (name) {
      const current = document.querySelector('.tab-content.active');
      if (current) {
        current.style.opacity = '0';
        current.style.transform = 'translateY(10px)';
      }
      setTimeout(() => {
        origSwitch(name);
        const next = document.querySelector('.tab-content.active');
        if (next) {
          next.style.opacity = '0';
          next.style.transform = 'translateY(20px) scale(0.99)';
          requestAnimationFrame(() => {
            next.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            next.style.opacity = '1';
            next.style.transform = 'translateY(0) scale(1)';
          });
          initScrollAnimations();
        }
      }, 150);
    };
  }

  // ─── Staggered card animations ───
  function initStaggeredCards() {
    document.querySelectorAll('.dashboard-grid, .quick-actions, .reviews-grid').forEach((grid) => {
      Array.from(grid.children).forEach((child, i) => {
        child.style.animationDelay = i * 80 + 'ms';
      });
    });
  }

  // ─── Sidebar hover glow ───
  function initSidebarEffects() {
    document.querySelectorAll('.sidebar .nav-btn').forEach((btn) => {
      btn.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    });
  }

  // ─── Typing effect for hero tagline ───
  function initTypingEffect() {
    const tagline = document.querySelector('.hero-tagline');
    if (!tagline) return;
    const text = tagline.textContent;
    tagline.textContent = '';
    tagline.style.borderRight = '2px solid var(--secondary)';
    let i = 0;
    function type() {
      if (i < text.length) {
        tagline.textContent += text.charAt(i);
        i++;
        setTimeout(type, 30);
      } else {
        setTimeout(() => {
          tagline.style.borderRight = 'none';
        }, 1000);
      }
    }
    setTimeout(type, 500);
  }

  // ─── Mouse glow on cards ───
  function initCardGlow() {
    document.addEventListener('mousemove', (e) => {
      document.querySelectorAll('.stat-card, .glass-card').forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          card.style.setProperty('--glow-x', x + 'px');
          card.style.setProperty('--glow-y', y + 'px');
          card.classList.add('card-glow-active');
        } else {
          card.classList.remove('card-glow-active');
        }
      });
    });
  }

  // ─── Init everything ───
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  function boot() {
    initScrollAnimations();
    initRipple();
    initHeroParallax();
    initStaggeredCards();
    initSidebarEffects();
    initTypingEffect();
    initCardGlow();
    setTimeout(initTabTransitions, 100);
    setTimeout(animateCounters, 300);
  }

  init();
})();
