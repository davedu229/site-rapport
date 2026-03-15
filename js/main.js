/**
 * MERIDIAN RESEARCH — Main JS
 * Navigation, scroll effects, animations
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Initialize i18n ---
  if (window.i18n) {
    window.i18n.init();
  }

  // --- Header scroll effect ---
  const header = document.querySelector('.site-header');
  if (header) {
    const handleScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // --- Mobile menu ---
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const headerNav = document.querySelector('.header-nav');
  if (mobileBtn && headerNav) {
    mobileBtn.addEventListener('click', () => {
      mobileBtn.classList.toggle('is-active');
      headerNav.classList.toggle('is-open');
      document.body.style.overflow = headerNav.classList.contains('is-open') ? 'hidden' : '';
    });

    // Close on nav link click
    headerNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileBtn.classList.remove('is-active');
        headerNav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Language toggle ---
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (window.i18n) {
        window.i18n.switchLang(lang);
      }
    });
  });

  // --- Scroll animations ---
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  if (animateElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    animateElements.forEach(el => observer.observe(el));
  }

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');

      // Close all
      document.querySelectorAll('.faq-item.is-open').forEach(openItem => {
        openItem.classList.remove('is-open');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('is-open');
      }
    });
  });

  // --- Active nav link highlighting ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --- Smooth scrolling for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Counter animation for stats ---
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.countSuffix || '';
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = current.toLocaleString('fr-FR') + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }
});
