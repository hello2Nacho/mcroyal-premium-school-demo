/* ==========================================================================
   ADMISSIONS PORTAL (demo)
   Front-end only: nothing is uploaded, submitted or emailed. Application
   state is kept in localStorage so a refresh resumes where you left off.
   All school-specific values come from window.SCHOOL_CONFIG
   (js/school-config.js).
   ========================================================================== */
(function () {
  'use strict';

  var SCHOOL = window.SCHOOL_CONFIG;
  if (!SCHOOL) return;
  var ADM = SCHOOL.admissions;

  var STEP_NAMES = ['Student', 'Parent / Guardian', 'Academic', 'Documents', 'Review'];
  var TOTAL_STEPS = STEP_NAMES.length;
  var STORAGE_KEY = ADM.storageKey;
  var COUNTER_KEY = ADM.storageKey + '-counter';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var form = $('[data-form]');
  var previews = {}; // object URLs for image thumbnails (this page visit only)

  /* ------------------------------------------------------------------------
     STATE + STORAGE
     ------------------------------------------------------------------------ */
  function blankState() {
    return { screen: 'landing', step: 1, furthest: 1, data: {}, docs: {}, reference: null, submittedAt: null, editingFromReview: false };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return blankState();
      var s = JSON.parse(raw);
      return Object.assign(blankState(), s);
    } catch (e) {
      return blankState();
    }
  }

  var state = load();
  var saveTimer = null;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 250);
  }

  function hasProgress() {
    return Object.keys(state.data).some(function (k) { return state.data[k]; }) || Object.keys(state.docs).length > 0;
  }

  /* ------------------------------------------------------------------------
     BRANDING FROM CONFIG
     ------------------------------------------------------------------------ */
  function readPath(path) {
    return path.split('.').reduce(function (obj, key) { return obj == null ? obj : obj[key]; }, SCHOOL);
  }

  function applyBranding() {
    var root = document.documentElement.style;
    Object.keys(SCHOOL.colors || {}).forEach(function (k) {
      root.setProperty('--school-' + k, SCHOOL.colors[k]);
    });

    $$('[data-school]').forEach(function (el) {
      var value = readPath(el.getAttribute('data-school'));
      if (Array.isArray(value)) value = value.join(' · ');
      if (value != null) el.textContent = value;
    });
    $$('[data-school-href]').forEach(function (el) {
      el.setAttribute('href', readPath(el.getAttribute('data-school-href')));
    });
    $$('[data-school-logo]').forEach(function (img) {
      img.src = SCHOOL.logo;
      img.alt = SCHOOL.logoAlt || SCHOOL.name;
    });
    $$('[data-school-image]').forEach(function (img) {
      img.src = ADM.image;
      img.alt = ADM.imageAlt || '';
    });
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    document.title = 'Admissions — ' + SCHOOL.name;
  }

  /* ------------------------------------------------------------------------
     SELECT OPTIONS FROM CONFIG
     ------------------------------------------------------------------------ */
  function option(value, label) {
    var o = document.createElement('option');
    o.value = value;
    o.textContent = label || value;
    return o;
  }

  function fillSelects() {
    $$('select[data-options]').forEach(function (select) {
      var kind = select.getAttribute('data-options');
      var placeholder = {
        classes: 'Select a class',
        currentClass: 'Select current class',
        entryTerms: 'Select an entry session',
        relationships: 'Select relationship'
      }[kind] || 'Select';
      select.appendChild(option('', placeholder));

      if (kind === 'classes' || kind === 'currentClass') {
        if (kind === 'currentClass') select.appendChild(option('Not yet in school'));
        ADM.classGroups.forEach(function (group) {
          var og = document.createElement('optgroup');
          og.label = group.label;
          group.options.forEach(function (o) { og.appendChild(option(o)); });
          select.appendChild(og);
        });
      } else {
        (ADM[kind] || []).forEach(function (o) { select.appendChild(option(o)); });
      }
    });
  }

  /* ------------------------------------------------------------------------
     FIELDS: restore, capture, sync
     ------------------------------------------------------------------------ */
  function fieldElements() {
    return $$('input[name], select[name], textarea[name]', form).filter(function (el) {
      return el.type !== 'file' && el.name !== 'confirm';
    });
  }

  function restoreFields() {
    fieldElements().forEach(function (el) {
      var v = state.data[el.name];
      if (v == null) return;
      if (el.type === 'radio') el.checked = el.value === v;
      else el.value = v;
    });
    updateCounter();
  }

  function updateCounter() {
    var el = $('[data-count-for="notes"]');
    var notes = form.elements.notes;
    if (el && notes) el.textContent = notes.value.length;
  }

  function onFieldInput(e) {
    var el = e.target;
    if (!el.name || el.type === 'file') return;
    if (el.name === 'confirm') { clearError(el); return; }

    var value = el.type === 'radio' ? (el.checked ? el.value : state.data[el.name]) : el.value;
    state.data[el.name] = value;

    // Keep duplicated fields (class applying for, steps 1 and 3) in sync
    $$('[name="' + el.name + '"]', form).forEach(function (other) {
      if (other !== el && other.type !== 'radio') other.value = value;
    });

    if (el.name === 'notes') updateCounter();
    if (fieldWrap(el).classList.contains('is-invalid')) validateField(el);
    saveSoon();
  }

  /* ------------------------------------------------------------------------
     VALIDATION
     ------------------------------------------------------------------------ */
  var NAME_RE = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ' .-]*$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldWrap(el) {
    return el.closest('.field') || el.parentElement;
  }

  function labelText(el) {
    var wrap = fieldWrap(el);
    var label = $('.field-label', wrap);
    var text = label ? label.childNodes[0].textContent : el.name;
    return text.trim().toLowerCase();
  }

  function ageOn(dobStr) {
    var dob = new Date(dobStr + 'T00:00:00');
    if (isNaN(dob)) return null;
    var now = new Date();
    var age = now.getFullYear() - dob.getFullYear();
    var m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return { dob: dob, age: age };
  }

  function messageFor(el) {
    var value = (el.type === 'radio')
      ? ($$('[name="' + el.name + '"]', form).filter(function (r) { return r.checked; })[0] || {}).value
      : el.value.trim();
    var rule = el.getAttribute('data-rule');
    var required = el.required || (el.type === 'radio' && $$('[name="' + el.name + '"][required]', form).length);

    if (el.type === 'checkbox') {
      return el.checked ? '' : 'Please confirm that the information is accurate before submitting.';
    }
    if (!value) {
      if (!required) return '';
      if (el.tagName === 'SELECT' || el.type === 'radio') return 'Please select the ' + labelText(el) + '.';
      if (el.type === 'date') return 'Please enter the date of birth.';
      return 'Please enter the ' + labelText(el) + '.';
    }

    switch (rule) {
      case 'name':
        if (value.length < 2) return 'This looks too short. Please enter the full name.';
        if (!NAME_RE.test(value)) return 'Please use letters only. Hyphens and apostrophes are fine.';
        break;
      case 'dob': {
        var a = ageOn(value);
        if (!a) return 'Please enter a valid date.';
        if (a.dob > new Date()) return 'Date of birth can’t be in the future.';
        if (a.age < 1 || a.age > 20) return 'Please check the date. The student should be between 1 and 20 years old.';
        break;
      }
      case 'phone': {
        var digits = value.replace(/[\s()-]/g, '');
        if (!/^\+?\d{10,14}$/.test(digits)) return 'Please enter a valid phone number, for example 0803 000 0000.';
        break;
      }
      case 'email':
        if (!EMAIL_RE.test(value)) return 'Please enter a valid email address, for example name@example.com.';
        break;
      case 'address':
        if (value.length < 10) return 'Please enter the full address, including the area and city.';
        break;
    }
    return '';
  }

  function describedBy(el, add, id) {
    var ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    ids = ids.filter(function (x) { return x !== id; });
    if (add) ids.push(id);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  }

  function showError(el, msg) {
    var wrap = fieldWrap(el);
    var group = el.type === 'radio' ? $$('[name="' + el.name + '"]', form) : [el];
    var id = (el.id || ('f-' + el.name)) + '-error';
    var p = $('#' + id) || document.createElement('p');
    p.id = id;
    p.className = 'field-error';
    p.textContent = msg;
    if (!p.parentNode) wrap.appendChild(p);
    wrap.classList.add('is-invalid');
    group.forEach(function (g) {
      g.setAttribute('aria-invalid', 'true');
      describedBy(g, true, id);
    });
  }

  function clearError(el) {
    var wrap = fieldWrap(el);
    var group = el.type === 'radio' ? $$('[name="' + el.name + '"]', form) : [el];
    var id = (el.id || ('f-' + el.name)) + '-error';
    var p = $('#' + id);
    if (p) p.remove();
    wrap.classList.remove('is-invalid');
    group.forEach(function (g) {
      g.removeAttribute('aria-invalid');
      describedBy(g, false, id);
    });
  }

  function validateField(el) {
    var msg = messageFor(el);
    if (msg) showError(el, msg); else clearError(el);
    return !msg;
  }

  // Validate a step; returns the first invalid element (or null)
  function validateStep(n) {
    var panel = $('[data-step="' + n + '"]', form);
    var seen = {};
    var firstBad = null;
    $$('input[name], select[name], textarea[name]', panel).forEach(function (el) {
      if (el.type === 'file') return;
      if (el.type === 'radio') {
        if (seen[el.name]) return;
        seen[el.name] = true;
      }
      if (!validateField(el) && !firstBad) firstBad = el;
    });
    return firstBad;
  }

  function linkHelpText() {
    $$('.field-help[id]', form).forEach(function (help) {
      var field = fieldWrap(help);
      var input = $('input, select, textarea', field);
      if (input) describedBy(input, true, help.id);
    });
  }

  function limitDates() {
    var dob = form.elements.dob;
    if (!dob) return;
    var today = new Date();
    var iso = function (d) { return d.toISOString().slice(0, 10); };
    dob.max = iso(today);
    var min = new Date(today); min.setFullYear(today.getFullYear() - 20);
    dob.min = iso(min);
  }

  /* ------------------------------------------------------------------------
     DOCUMENT UPLOADS (kept in the browser only)
     ------------------------------------------------------------------------ */
  var ICONS = {
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    remove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
  };

  function docConfig(key) {
    return ADM.documents.filter(function (d) { return d.key === key; })[0];
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function extOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(name || '');
    return m ? m[1].toLowerCase() : '';
  }

  function buildUpload(doc, compact) {
    var wrap = document.createElement('div');
    wrap.className = 'upload' + (compact ? ' upload--compact' : '');
    wrap.setAttribute('data-doc', doc.key);
    var inputId = 'doc-' + doc.key + (compact ? '-compact' : '');
    wrap.innerHTML =
      '<div class="upload-head">' +
        '<p class="upload-title" id="' + inputId + '-title">' + doc.title + ' <span class="field-optional">Optional</span></p>' +
        '<p class="upload-desc">' + doc.description + '</p>' +
      '</div>' +
      '<div class="upload-body">' +
        '<label class="upload-drop" for="' + inputId + '">' +
          '<span class="upload-icon" aria-hidden="true">' + ICONS.upload + '</span>' +
          '<span class="upload-drop-text">' +
            '<strong><span class="upload-drag-copy">Drag and drop, or </span><span class="upload-browse">browse files</span></strong>' +
            '<span class="upload-drop-meta">' + doc.types + ' · up to ' + ADM.maxFileSizeMB + ' MB</span>' +
          '</span>' +
          '<input class="upload-input" type="file" id="' + inputId + '" accept="' + doc.accept + '" aria-label="' + doc.title + '">' +
        '</label>' +
        '<div class="upload-file" hidden></div>' +
      '</div>';

    var drop = $('.upload-drop', wrap);
    var input = $('.upload-input', wrap);

    input.addEventListener('change', function () {
      if (input.files && input.files[0]) attachFile(doc.key, input.files[0], wrap);
      input.value = '';
    });

    ['dragenter', 'dragover'].forEach(function (type) {
      drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.add('is-dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (type) {
      drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.remove('is-dragover'); });
    });
    drop.addEventListener('drop', function (e) {
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) attachFile(doc.key, file, wrap);
    });

    return wrap;
  }

  function uploadError(wrap, msg) {
    var existing = $('.field-error', wrap);
    if (existing) existing.remove();
    var input = $('.upload-input', wrap);
    if (!msg) { if (input) describedBy(input, false, input.id + '-error'); return; }
    var p = document.createElement('p');
    p.className = 'field-error';
    p.id = input.id + '-error';
    p.textContent = msg;
    $('.upload-body', wrap).appendChild(p);
    describedBy(input, true, p.id);
  }

  function attachFile(key, file, sourceWrap) {
    var doc = docConfig(key);
    var allowed = doc.accept.split(',').map(function (a) { return a.replace('.', '').trim(); });
    var ext = extOf(file.name);

    if (allowed.indexOf(ext) === -1) {
      uploadError(sourceWrap, 'This file type isn’t accepted here. Please choose ' + doc.types + '.');
      return;
    }
    if (file.size > ADM.maxFileSizeMB * 1024 * 1024) {
      uploadError(sourceWrap, 'This file is larger than ' + ADM.maxFileSizeMB + ' MB. Please choose a smaller file.');
      return;
    }
    uploadError(sourceWrap, '');

    if (previews[key]) URL.revokeObjectURL(previews[key]);
    previews[key] = /^(jpg|jpeg|png)$/.test(ext) ? URL.createObjectURL(file) : null;

    state.docs[key] = { name: file.name, size: file.size, ext: ext };
    save();
    renderUploads(key, true, sourceWrap);
  }

  function removeFile(key, sourceWrap) {
    delete state.docs[key];
    if (previews[key]) { URL.revokeObjectURL(previews[key]); delete previews[key]; }
    save();
    renderUploads(key, false);
    var input = $('.upload-input', sourceWrap);
    if (input) input.focus();
  }

  // Render one document's state into every component showing it
  function renderUploads(key, justAttached, focusWrap) {
    $$('.upload[data-doc="' + key + '"]').forEach(function (wrap) {
      var file = state.docs[key];
      var drop = $('.upload-drop', wrap);
      var box = $('.upload-file', wrap);

      if (!file) {
        drop.hidden = false;
        box.hidden = true;
        box.innerHTML = '';
        return;
      }

      drop.hidden = true;
      box.hidden = false;
      var thumb = previews[key]
        ? '<img src="' + previews[key] + '" alt="">'
        : (file.ext || 'file').toUpperCase();
      box.innerHTML =
        '<span class="upload-thumb" aria-hidden="true">' + thumb + '</span>' +
        '<div class="upload-file-body">' +
          '<p class="upload-file-name"></p>' +
          '<p class="upload-file-meta"><span>' + (file.ext || 'file').toUpperCase() + ' · ' + formatSize(file.size) + '</span>' +
            '<span class="upload-status' + (justAttached ? ' is-pending' : '') + '" role="status">' +
              (justAttached ? 'Preparing…' : ICONS.check + 'Attached · demo only, not uploaded') +
            '</span></p>' +
          (justAttached ? '<div class="upload-bar" aria-hidden="true"><span></span></div>' : '') +
        '</div>' +
        '<button type="button" class="upload-remove" aria-label="Remove ' + docConfig(key).title + '">' + ICONS.remove + '</button>';
      $('.upload-file-name', box).textContent = file.name;
      $('.upload-remove', box).addEventListener('click', function () { removeFile(key, wrap); });

      if (justAttached) {
        var bar = $('.upload-bar span', box);
        var status = $('.upload-status', box);
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var finish = function () {
          status.classList.remove('is-pending');
          status.innerHTML = ICONS.check + 'Attached · demo only, not uploaded';
          var b = $('.upload-bar', box);
          if (b) b.remove();
        };
        if (reduce) finish();
        else {
          requestAnimationFrame(function () { bar.style.width = '100%'; });
          setTimeout(finish, 650);
        }
      }
      if (focusWrap === wrap) $('.upload-remove', box).focus();
    });
  }

  function buildAllUploads() {
    var list = $('[data-upload-list]');
    ADM.documents.forEach(function (doc) { list.appendChild(buildUpload(doc, false)); });
    $$('[data-upload-slot]').forEach(function (slot) {
      var doc = docConfig(slot.getAttribute('data-upload-slot'));
      if (doc) slot.appendChild(buildUpload(doc, slot.hasAttribute('data-compact')));
    });
    // Touch devices: no drag-and-drop wording
    if (window.matchMedia('(hover: none)').matches) {
      $$('.upload-drag-copy').forEach(function (el) { el.textContent = 'Tap to '; });
    }
    ADM.documents.forEach(function (doc) { renderUploads(doc.key, false); });
  }

  /* ------------------------------------------------------------------------
     REVIEW / SUMMARY
     ------------------------------------------------------------------------ */
  function fullName() {
    var d = state.data;
    return [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ');
  }

  function formatDate(v) {
    if (!v) return '';
    var d = new Date(v + 'T00:00:00');
    return isNaN(d) ? v : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function reviewSections() {
    var d = state.data;
    return [
      { step: 1, title: 'Student', items: [
        ['Name', fullName()], ['Date of birth', formatDate(d.dob)], ['Gender', d.gender],
        ['Class applying for', d.classApplying], ['Nationality', d.nationality], ['Current school', d.currentSchool]
      ] },
      { step: 2, title: 'Parent / Guardian', items: [
        ['Name', d.parentName], ['Relationship', d.relationship], ['Phone', d.phone], ['Email', d.email],
        ['Residential address', d.address, true], ['Alternative contact', d.altContact]
      ] },
      { step: 3, title: 'Academic', items: [
        ['Current class', d.currentClass], ['Class applying for', d.classApplying],
        ['Previous school', d.previousSchool], ['Preferred entry', d.entryTerm],
        ['Areas of interest', d.interests, true], ['Additional information', d.notes, true]
      ] },
      { step: 4, title: 'Documents', docs: true }
    ];
  }

  function renderReview(container, readonly) {
    container.innerHTML = '';
    reviewSections().forEach(function (sec) {
      var section = document.createElement('section');
      section.className = 'review-section';
      section.setAttribute('aria-labelledby', 'review-' + sec.step + (readonly ? '-ro' : ''));

      var head = document.createElement('div');
      head.className = 'review-head';
      var h = document.createElement('h3');
      h.className = 'review-title';
      h.id = 'review-' + sec.step + (readonly ? '-ro' : '');
      h.innerHTML = '<span>0' + sec.step + '</span>';
      h.appendChild(document.createTextNode(sec.title));
      head.appendChild(h);
      if (!readonly) {
        var edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'review-edit';
        edit.innerHTML = ICONS.edit + '<span>Edit</span>';
        edit.setAttribute('aria-label', 'Edit ' + sec.title + ' details');
        edit.addEventListener('click', function () {
          state.editingFromReview = true;
          goToStep(sec.step, { direction: -1 });
        });
        head.appendChild(edit);
      }
      section.appendChild(head);

      if (sec.docs) {
        var ul = document.createElement('ul');
        ul.className = 'review-docs';
        ADM.documents.forEach(function (doc) {
          var li = document.createElement('li');
          var name = document.createElement('span');
          name.className = 'doc-name';
          name.textContent = doc.title;
          var file = document.createElement('span');
          file.className = 'doc-file' + (state.docs[doc.key] ? '' : ' review-empty');
          file.textContent = state.docs[doc.key] ? state.docs[doc.key].name : 'Not attached';
          li.appendChild(name);
          li.appendChild(file);
          ul.appendChild(li);
        });
        section.appendChild(ul);
      } else {
        var dl = document.createElement('dl');
        dl.className = 'review-list';
        sec.items.forEach(function (item) {
          var div = document.createElement('div');
          div.className = 'review-item' + (item[2] ? ' review-item--wide' : '');
          var dt = document.createElement('dt');
          dt.textContent = item[0];
          var dd = document.createElement('dd');
          if (item[1]) dd.textContent = item[1];
          else { dd.textContent = 'Not provided'; dd.className = 'review-empty'; }
          div.appendChild(dt);
          div.appendChild(dd);
          dl.appendChild(div);
        });
        section.appendChild(dl);
      }
      container.appendChild(section);
    });
  }

  /* ------------------------------------------------------------------------
     SCREENS + STEPS
     ------------------------------------------------------------------------ */
  function showScreen(name, opts) {
    opts = opts || {};
    state.screen = name;
    $$('[data-screen]').forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== name; });

    if (name === 'landing') renderLanding();
    if (name === 'success') renderSuccess();
    if (name === 'summary') renderSummary();
    if (name === 'form') goToStep(state.step, { silent: true, noHistory: true });

    save();
    if (!opts.noHistory) pushHistory();
    if (!opts.noScroll) window.scrollTo(0, 0);
    if (opts.focus !== false) {
      var target = {
        landing: '#landing-heading',
        success: '#success-heading',
        summary: '#summary-heading'
      }[name];
      if (target) {
        var el = $(target);
        if (name === 'landing') { el.setAttribute('tabindex', '-1'); }
        el.focus({ preventScroll: true });
      }
    }
  }

  function goToStep(n, opts) {
    opts = opts || {};
    var dir = opts.direction || (n >= state.step ? 1 : -1);
    state.step = n;
    state.furthest = Math.max(state.furthest, n);

    if (state.screen !== 'form') {
      state.screen = 'form';
      $$('[data-screen]').forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== 'form'; });
    }

    $$('[data-step]', form).forEach(function (panel) {
      var on = Number(panel.getAttribute('data-step')) === n;
      panel.classList.toggle('is-back', dir < 0);
      panel.hidden = !on;
    });

    if (n === TOTAL_STEPS) renderReview($('[data-review]'), false);
    updateProgress();
    updateNavButtons();
    save();

    if (!opts.noHistory) pushHistory();
    if (!opts.silent) {
      var apply = $('[data-screen="form"]');
      var top = apply.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > top) window.scrollTo(0, top);
      var title = $('[data-step="' + n + '"] .portal-step-title', form);
      if (title) title.focus({ preventScroll: true });
    }
  }

  function updateProgress() {
    $$('[data-goto]').forEach(function (btn) {
      var n = Number(btn.getAttribute('data-goto'));
      var current = n === state.step;
      btn.disabled = n > state.furthest;
      btn.classList.toggle('is-done', n < state.furthest && !current);
      if (current) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
      var label = 'Step ' + n + ', ' + STEP_NAMES[n - 1] + (current ? ', current' : (n < state.furthest ? ', visited' : ''));
      btn.setAttribute('aria-label', label);
    });
    $('[data-progress-count]').textContent = 'Step ' + state.step + ' of ' + TOTAL_STEPS;
    $('[data-progress-name]').textContent = STEP_NAMES[state.step - 1];
    $('[data-progress-fill]').style.width = (state.step / TOTAL_STEPS * 100) + '%';
  }

  function updateNavButtons() {
    var label = $('[data-next-label]');
    var nextIcon = $('[data-action="next"] svg');
    if (state.step === TOTAL_STEPS) {
      label.textContent = 'Submit Application';
      nextIcon.style.display = 'none';
    } else {
      label.textContent = state.editingFromReview ? 'Save and return to review' : 'Continue';
      nextIcon.style.display = '';
    }
  }

  function renderLanding() {
    var resume = hasProgress() && !state.reference;
    $$('[data-resume]').forEach(function (el) { el.hidden = !resume; });
    $('[data-start-label]').textContent = resume ? 'Continue Application' : 'Start Application';
    if (resume) {
      $('[data-resume-step]').textContent = 'Step ' + state.step + ', ' + STEP_NAMES[state.step - 1];
    }
  }

  function renderSuccess() {
    $('[data-success="name"]').textContent = fullName();
    $('[data-success="reference"]').textContent = state.reference;
    $('[data-success="session"]').textContent = ADM.session;
  }

  function renderSummary() {
    $('[data-summary-title]').textContent = fullName();
    $('[data-summary-ref]').textContent = state.reference;
    renderReview($('[data-summary]'), true);
  }

  /* ------------------------------------------------------------------------
     SUBMIT FLOW
     ------------------------------------------------------------------------ */
  function announce(msg) {
    var live = $('[data-form-status]');
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);
  }

  function nextReference() {
    var n = 0;
    try { n = Number(localStorage.getItem(COUNTER_KEY)) || 0; } catch (e) { /* ignore */ }
    n += 1;
    try { localStorage.setItem(COUNTER_KEY, String(n)); } catch (e) { /* ignore */ }
    return ADM.referencePrefix + '-' + ADM.referenceYear + '-' + String(n).padStart(4, '0');
  }

  function invalidCount(n) {
    return $$('[data-step="' + n + '"] .field.is-invalid', form).length;
  }

  function onSubmit(e) {
    e.preventDefault();

    if (state.step < TOTAL_STEPS) {
      var bad = validateStep(state.step);
      if (bad) {
        var count = invalidCount(state.step);
        announce('Please correct ' + count + (count === 1 ? ' field' : ' fields') + ' to continue.');
        bad.focus();
        return;
      }
      if (state.editingFromReview) {
        state.editingFromReview = false;
        goToStep(TOTAL_STEPS, { direction: 1 });
      } else {
        goToStep(state.step + 1, { direction: 1 });
      }
      return;
    }

    // Final step: re-check earlier steps in case anything was skipped
    for (var s = 1; s < TOTAL_STEPS - 1; s++) {
      if (validateStep(s)) {
        state.editingFromReview = true;
        goToStep(s, { direction: -1 });
        announce('Some details in ' + STEP_NAMES[s - 1] + ' need attention.');
        var firstBad = $('[data-step="' + s + '"] [aria-invalid="true"]', form);
        if (firstBad) firstBad.focus();
        return;
      }
    }
    var confirm = form.elements.confirm;
    if (!validateField(confirm)) {
      confirm.focus();
      return;
    }

    state.reference = nextReference();
    state.submittedAt = new Date().toISOString();
    state.editingFromReview = false;
    showScreen('success');
  }

  function onBack() {
    if (state.step === 1) {
      showScreen('landing');
      return;
    }
    if (state.editingFromReview) {
      state.editingFromReview = false;
      goToStep(TOTAL_STEPS, { direction: 1 });
      return;
    }
    goToStep(state.step - 1, { direction: -1 });
  }

  /* ------------------------------------------------------------------------
     START NEW
     ------------------------------------------------------------------------ */
  var dialog = $('[data-dialog]');

  function resetApplication() {
    Object.keys(previews).forEach(function (k) { URL.revokeObjectURL(previews[k]); });
    previews = {};
    var keepScreen = state;
    state = blankState();
    form.reset();
    $$('.field.is-invalid', form).forEach(function (f) { f.classList.remove('is-invalid'); });
    $$('.field-error', form).forEach(function (p) { p.remove(); });
    $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
    ADM.documents.forEach(function (doc) { renderUploads(doc.key, false); });
    updateCounter();
    keepScreen = null;
    save();
    showScreen('form', { focus: false });
    goToStep(1, { noHistory: true });
  }

  function requestNew() {
    if (!hasProgress() || state.reference || !dialog || typeof dialog.showModal !== 'function') {
      resetApplication();
      return;
    }
    dialog.showModal();
    $('[data-dialog-cancel]', dialog).focus();
  }

  if (dialog) {
    $('[data-dialog-cancel]', dialog).addEventListener('click', function () { dialog.close(); });
    $('[data-dialog-confirm]', dialog).addEventListener('click', function () {
      dialog.close();
      resetApplication();
    });
  }

  /* ------------------------------------------------------------------------
     HISTORY (browser Back moves between steps, not out of the portal)
     ------------------------------------------------------------------------ */
  function pushHistory() {
    var entry = { screen: state.screen, step: state.step };
    var cur = history.state;
    if (cur && cur.screen === entry.screen && cur.step === entry.step) return;
    history.pushState(entry, '');
  }

  window.addEventListener('popstate', function (e) {
    var s = e.state;
    if (!s) return;
    if (s.screen === 'form') {
      // After submission the form is closed; keep showing the result
      if (state.reference) { showScreen('success', { noHistory: true }); return; }
      if (s.step > state.furthest) return;
      if (state.screen !== 'form') showScreen('form', { noHistory: true, focus: false });
      goToStep(s.step, { noHistory: true });
    } else {
      if ((s.screen === 'success' || s.screen === 'summary') && !state.reference) return;
      showScreen(s.screen, { noHistory: true });
    }
  });

  /* ------------------------------------------------------------------------
     EVENTS + INIT
     ------------------------------------------------------------------------ */
  function bind() {
    form.addEventListener('input', onFieldInput);
    form.addEventListener('change', onFieldInput);
    form.addEventListener('submit', onSubmit);
    form.addEventListener('focusout', function (e) {
      var el = e.target;
      // Validate on leaving a field the user has filled in
      if (el.name && el.type !== 'file' && el.type !== 'radio' && el.type !== 'checkbox' && el.value) validateField(el);
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action], [data-goto]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');

      if (btn.hasAttribute('data-goto')) {
        var n = Number(btn.getAttribute('data-goto'));
        if (n !== state.step && n <= state.furthest) {
          state.editingFromReview = false;
          goToStep(n);
        }
        return;
      }

      switch (action) {
        case 'start':
          if (state.reference) { resetApplication(); return; }
          showScreen('form', { focus: false });
          goToStep(state.step, { noHistory: true });
          break;
        case 'new':
          requestNew();
          break;
        case 'back':
          onBack();
          break;
        case 'summary':
          showScreen('summary');
          break;
        case 'back-to-success':
          showScreen('success');
          break;
        case 'print':
          window.print();
          break;
      }
    });
  }

  function init() {
    applyBranding();
    fillSelects();
    linkHelpText();
    limitDates();
    buildAllUploads();
    restoreFields();
    bind();

    // Resume where the visitor left off
    var screen = state.screen;
    if ((screen === 'success' || screen === 'summary') && !state.reference) screen = 'landing';
    history.replaceState({ screen: screen, step: state.step }, '');
    if (screen === 'form') {
      showScreen('form', { noHistory: true, focus: false, noScroll: true });
      goToStep(state.step, { noHistory: true, silent: true });
    } else {
      showScreen(screen, { noHistory: true, focus: false, noScroll: true });
    }
  }

  init();
})();
