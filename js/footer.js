/* ==========================================================================
   MC ROYAL SCHOOLS - FOOTER
   Newsletter is a front-end demo: it validates the address and shows a
   success state in the browser. Nothing is sent or stored anywhere.
   ========================================================================== */
(function () {
  'use strict';

  var year = document.querySelector('[data-current-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  var form = document.querySelector('.footer-newsletter-form');
  if (!form) return;

  var row = form.querySelector('.footer-form-row');
  var label = form.querySelector('.footer-form-label');
  var input = form.querySelector('.footer-input');
  var note = form.querySelector('.footer-form-note');
  var defaultNote = note ? note.innerHTML : '';
  var success = null;

  function setError(text) {
    input.setAttribute('aria-invalid', 'true');
    note.textContent = text;
    note.classList.add('is-error');
  }

  function clearError() {
    input.removeAttribute('aria-invalid');
    note.innerHTML = defaultNote;
    note.classList.remove('is-error');
  }

  function buildSuccess(email) {
    success = document.createElement('div');
    success.className = 'footer-success';
    success.setAttribute('tabindex', '-1');
    success.innerHTML =
      '<span class="footer-success-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '</span>' +
      '<div class="footer-success-copy">' +
        '<p class="footer-success-title">You’re on the list.</p>' +
        '<p class="footer-success-text"></p>' +
        '<button type="button" class="footer-success-reset">Use another email</button>' +
      '</div>';
    success.querySelector('.footer-success-text').textContent =
      'We’ll keep ' + email + ' posted on school events and announcements.';
    success.querySelector('.footer-success-reset').addEventListener('click', reset);
    return success;
  }

  function showSuccess(email) {
    label.hidden = true;
    row.hidden = true;
    note.innerHTML = '<span class="footer-demo-tag">Demo</span>No email was sent; this is a front-end demonstration.';
    note.classList.remove('is-error');
    form.insertBefore(buildSuccess(email), note);
    success.focus();
  }

  function reset() {
    if (success) success.remove();
    success = null;
    label.hidden = false;
    row.hidden = false;
    input.value = '';
    clearError();
    input.focus();
  }

  input.addEventListener('input', function () {
    if (input.getAttribute('aria-invalid') === 'true') clearError();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();

    if (!email || !input.checkValidity()) {
      setError('Please enter a valid email address.');
      input.focus();
      return;
    }

    showSuccess(email);
  });
})();
