/* ==========================================================================
   MC ROYAL SCHOOLS - ADMISSIONS SECTION REVEAL
   Adds restrained scroll reveals. Content stays fully visible without JS,
   without IntersectionObserver, or when the user prefers reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  var section = document.querySelector('.admissions-section');
  if (!section || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  section.classList.add('adm-js');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  section.querySelectorAll('.adm-reveal').forEach(function (el) {
    observer.observe(el);
  });
})();
