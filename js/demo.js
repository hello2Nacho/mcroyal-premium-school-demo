/* ==========================================================================
   DEMO MODE
   This site is a self-contained sales demo. Links that would leave the demo
   (portal, phone, email) or point at sections not built yet show a short
   notice instead of navigating.

   - [data-demo-message] on any link: always intercepted, shows that message.
   - In-page "#hash" links whose target does not exist yet: intercepted,
     shows the generic message (aliases handled elsewhere are skipped).
   ========================================================================== */
(function () {
  'use strict';

  var GENERIC_MESSAGE = 'This section is coming soon in this demo.';

  // Hashes another script resolves without a matching element id
  // (js/school-life.js maps these onto its tabs).
  var HANDLED_ALIASES = ['#activities', '#sports', '#music'];

  var toast = null;
  var hideTimer = null;

  function ensureToast() {
    if (toast) return toast;
    toast = document.createElement('div');
    toast.className = 'demo-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="demo-toast-tag">Demo</span><span class="demo-toast-text"></span>';
    document.body.appendChild(toast);
    return toast;
  }

  function showNotice(message) {
    var el = ensureToast();
    el.querySelector('.demo-toast-text').textContent = message;
    el.classList.remove('is-visible');
    // Restart the entrance transition when notices fire back to back
    void el.offsetWidth;
    el.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      el.classList.remove('is-visible');
    }, 3200);
  }

  function missingTarget(hash) {
    if (!hash || hash === '#') return false;
    if (HANDLED_ALIASES.indexOf(hash) !== -1) return false;
    try {
      return !document.querySelector(hash);
    } catch (e) {
      return true;
    }
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;

    var message = link.getAttribute('data-demo-message');
    var href = link.getAttribute('href');

    if (message) {
      e.preventDefault();
      showNotice(message);
      return;
    }

    if (href.charAt(0) === '#' && missingTarget(href)) {
      e.preventDefault();
      showNotice(GENERIC_MESSAGE);
    }
  });

  window.mcDemoNotice = showNotice;
})();
