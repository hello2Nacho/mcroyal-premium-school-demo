/* ==========================================================================
   MC ROYAL SCHOOLS - SCHOOL LIFE TABS
   WAI-ARIA tabs with arrow/Home/End keys. Without JS all panels are shown.
   Header links #activities / #sports / #music open the matching tab.
   ========================================================================== */
(function () {
  'use strict';

  var section = document.querySelector('.school-life-section');
  if (!section) return;

  var tabs = Array.prototype.slice.call(section.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (tab) {
    return document.getElementById(tab.getAttribute('aria-controls'));
  });
  var indicator = section.querySelector('.school-life-tab-indicator');

  var hashToTab = {
    '#activities': 'sl-tab-social',
    '#sports': 'sl-tab-athletics',
    '#music': 'sl-tab-music'
  };

  section.classList.add('sl-js');

  function moveIndicator(tab) {
    if (!indicator) return;
    var padRight = parseFloat(window.getComputedStyle(tab).paddingRight) || 0;
    indicator.style.width = tab.offsetWidth - padRight + 'px';
    indicator.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
  }

  function select(index, focus) {
    tabs.forEach(function (tab, i) {
      var active = i === index;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
      panels[i].classList.toggle('is-active', active);
      panels[i].hidden = false;
      panels[i].setAttribute('aria-hidden', active ? 'false' : 'true');
      panels[i].tabIndex = active ? 0 : -1;
    });
    moveIndicator(tabs[index]);
    if (focus) tabs[index].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(i, false); });

    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, true);
    });
  });

  function openFromHash() {
    var id = hashToTab[window.location.hash];
    if (!id) return;
    var index = tabs.findIndex(function (t) { return t.id === id; });
    if (index < 0) return;
    select(index, false);
    section.scrollIntoView({ block: 'start' });
  }

  window.addEventListener('hashchange', openFromHash);

  // Repeat clicks on the same alias don't fire hashchange, so handle clicks too
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link || !hashToTab[link.getAttribute('href')]) return;
    e.preventDefault();
    history.pushState(null, '', link.getAttribute('href'));
    openFromHash();
  });
  window.addEventListener('resize', function () {
    var current = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    moveIndicator(tabs[current < 0 ? 0 : current]);
  });

  select(0, false);
  openFromHash();
})();
