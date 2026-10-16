/**
 * MC Royal Schools - Navigation Controller
 * Handles accessible dropdowns, mobile drawer, scroll state, in-page
 * navigation and the active-section highlight.
 */

(function () {
  'use strict';

  // Hashes that js/school-life.js resolves onto its tabs (no element id).
  const TAB_ALIASES = ['#activities', '#sports', '#music'];

  // Which top-level nav entry represents each homepage section.
  const SECTION_TO_NAV = {
    'how-we-learn': '#',
    about: '#about',
    admissions: '#admissions',
    'school-life': '#school-life',
    academics: '#academics',
    facilities: '#school-life',
    'our-staff': '#about',
    secondary: '#academics',
    graduation: '#academics',
    primary: '#academics',
    contact: '#contact'
  };

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initDesktopNavigation();
    initMobileDrawer();
    initScrollSpy();
  });

  /* ------------------------------------------------------------------------
     Shared: scroll to an in-page section, clearing the sticky header
     ------------------------------------------------------------------------ */
  function headerOffset() {
    const header = document.querySelector('.site-header');
    return (header ? header.getBoundingClientRect().height : 0) + 12;
  }

  // Returns true when this navigation handled the link itself.
  function navigateToHash(hash) {
    if (hash === '#') {
      window.scrollTo({ top: 0 });
      history.pushState(null, '', location.pathname + location.search);
      return true;
    }
    if (TAB_ALIASES.indexOf(hash) !== -1) return false; // school-life.js
    let target = null;
    try { target = document.querySelector(hash); } catch (e) { return false; }
    if (!target) return false; // js/demo.js shows its notice

    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top: Math.max(0, top) });
    history.pushState(null, '', hash);
    return true;
  }

  // Clicks on plain in-page links inside a nav container.
  function handleNavLinkClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('data-demo-message')) return false;
    if (navigateToHash(link.getAttribute('href'))) {
      e.preventDefault();
      return true;
    }
    return false;
  }

  /**
   * 1. Header scroll elevation effect
   */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /**
   * 2. Desktop Dropdowns with Keyboard, Mouse & Touch Support
   *    - Mouse: hover opens the dropdown; clicking the parent goes to its section.
   *    - Touch: first tap opens the dropdown, second tap goes to the section.
   *    - Keyboard: focus reveals the dropdown, ArrowDown enters it, Enter goes
   *      to the section, Escape closes.
   */
  function initDesktopNavigation() {
    const nav = document.querySelector('.nav-desktop');
    const navItems = document.querySelectorAll('.nav-desktop .nav-item');
    if (!nav || !navItems.length) return;

    let lastPointerType = 'mouse';
    nav.addEventListener('pointerdown', (e) => { lastPointerType = e.pointerType || 'mouse'; });

    navItems.forEach((item) => {
      const trigger = item.querySelector('.nav-link[aria-expanded]');
      const dropdown = item.querySelector('.nav-dropdown');

      // Let a closed-by-navigation dropdown reopen once the pointer leaves
      item.addEventListener('mouseleave', () => item.classList.remove('is-suppressed'));

      if (!trigger || !dropdown) return;

      trigger.addEventListener('click', (e) => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const target = trigger.getAttribute('data-nav-target');
        const isTouch = lastPointerType === 'touch' && e.detail !== 0;
        lastPointerType = 'mouse';

        // Touch has no hover: first tap reveals the dropdown
        if (isTouch && !isExpanded) {
          closeAllDropdowns(item);
          openDropdown(trigger, item);
          return;
        }

        closeAllDropdowns();
        if (target) {
          dismiss(item);
          navigateToHash(target);
        } else if (!isExpanded) {
          openDropdown(trigger, item);
        }
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown(trigger, item);
          // Wait until the fade-in has begun: a still-hidden item can't take focus
          const first = dropdown.querySelector('a, button');
          if (first) requestAnimationFrame(() => requestAnimationFrame(() => first.focus()));
        }
      });

      // Escape closes and returns focus to the parent
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeDropdown(trigger, item);
          item.classList.add('is-suppressed');
          item.dataset.keepClosed = 'true';
          trigger.focus();
          delete item.dataset.keepClosed;
        }
      });
      // Tabbing back onto a parent reveals its dropdown again (unless Escape put it there)
      trigger.addEventListener('focus', () => {
        if (!item.dataset.keepClosed) item.classList.remove('is-suppressed');
      });
    });

    // Dropdown items and plain top-level links (Home, Contact)
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const item = link.closest('.nav-item');
      handleNavLinkClick(e);
      closeAllDropdowns();
      if (item) dismiss(item);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-desktop')) {
        closeAllDropdowns();
      }
    });

    // Close the dropdown and drop focus so :hover/:focus-within can't hold it open
    function dismiss(item) {
      item.classList.add('is-suppressed');
      if (item.contains(document.activeElement)) document.activeElement.blur();
    }

    function openDropdown(trigger, item) {
      item.classList.remove('is-suppressed');
      trigger.setAttribute('aria-expanded', 'true');
      item.classList.add('is-open');
    }

    function closeDropdown(trigger, item) {
      trigger.setAttribute('aria-expanded', 'false');
      item.classList.remove('is-open');
    }

    function closeAllDropdowns(exceptItem = null) {
      navItems.forEach((item) => {
        if (item === exceptItem) return;
        const trigger = item.querySelector('.nav-link[aria-expanded]');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
        item.classList.remove('is-open');
      });
    }
  }

  /**
   * 3. Mobile Slide-out Drawer & Accordions
   */
  function initMobileDrawer() {
    const toggleBtn = document.querySelector('.menu-toggle-btn');
    const closeBtn = document.querySelector('.mobile-drawer-close');
    const drawer = document.querySelector('.mobile-drawer');
    const scrim = document.querySelector('.mobile-scrim');
    const accordionToggles = document.querySelectorAll('.mobile-accordion-toggle');

    if (!toggleBtn || !drawer || !scrim) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      scrim.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Focus close button
      if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 150);
      }
    }

    function closeDrawer(returnFocus = true) {
      drawer.classList.remove('is-open');
      scrim.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (returnFocus) toggleBtn.focus({ preventScroll: true });
    }

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('is-open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeDrawer());
    }

    scrim.addEventListener('click', () => closeDrawer());

    // Any link in the drawer closes it, then the page scrolls (or a demo
    // notice shows, via js/demo.js)
    drawer.addEventListener('click', (e) => {
      if (!e.target.closest('a[href]')) return;
      closeDrawer(false);
      handleNavLinkClick(e);
    });

    // Escape key closes drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Close drawer on large screen resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Mobile Accordion functionality
    accordionToggles.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const parentItem = btn.closest('.mobile-nav-item');
        if (!parentItem) return;

        const isExpanded = parentItem.classList.contains('is-expanded');
        parentItem.classList.toggle('is-expanded', !isExpanded);
        btn.setAttribute('aria-expanded', String(!isExpanded));
      });
    });
  }

  /**
   * 4. Active-section highlight (desktop + drawer) using the existing
   *    .is-active styles
   */
  function initScrollSpy() {
    const desktopLinks = [...document.querySelectorAll('.nav-desktop > .nav-item > .nav-link')];
    const drawerLinks = [...document.querySelectorAll('.mobile-drawer .mobile-nav-link')];
    const sections = Object.keys(SECTION_TO_NAV)
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return;

    const keyOf = (el) => el.getAttribute('data-nav-target') || el.getAttribute('href');
    let current = null;

    function setActive(key) {
      if (key === current) return;
      current = key;
      desktopLinks.concat(drawerLinks).forEach((el) => {
        const active = keyOf(el) === key;
        el.classList.toggle('is-active', active);
        if (active) el.setAttribute('aria-current', 'location');
        else el.removeAttribute('aria-current');
      });
    }

    let ticking = false;
    function update() {
      ticking = false;
      const line = headerOffset() + window.innerHeight * 0.25;
      let key = '#';
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= line) key = SECTION_TO_NAV[section.id];
      });
      // At the very bottom the footer may never reach the line
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) key = '#contact';
      setActive(key);
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
