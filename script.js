/* ==========================================================================
   PORTFOLIO CYBERSECURITY — script.js
   JavaScript vanilla · Sin frameworks · Sin dependencias

   Funcionalidad:
   1.  Modo oscuro / claro con persistencia en LocalStorage
   2.  Bilingüe ES / EN con persistencia en LocalStorage
   3.  Navegación: estado scroll, menú móvil, enlace activo
   4.  Barra de progreso de scroll
   5.  Animaciones de entrada (reveal on scroll)
   6.  Efecto typing en la frase principal
   7.  Filtros dinámicos de experiencia y competencias
   8.  Pestañas de la terminal interactiva (solo visual)
   9.  Fallbacks de imagen (foto y badges Credly)
   10. Descargar CV PDF vía window.print()
   11. Botón volver arriba y año dinámico
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Utilidades
  ------------------------------------------------------------------ */
  const $  = (selector, ctx) => (ctx || document).querySelector(selector);
  const $$ = (selector, ctx) => Array.from((ctx || document).querySelectorAll(selector));

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STORAGE = {
    theme: 'avm-theme',
    lang: 'avm-lang'
  };

  /** Guarda un valor en LocalStorage sin lanzar excepciones (modo privado) */
  function safeStore(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* LocalStorage no disponible: se ignora silenciosamente */
    }
  }

  /** Lee un valor de LocalStorage sin lanzar excepciones */
  function safeRead(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  /* ==================================================================
     1. MODO OSCURO / CLARO  (persistencia con LocalStorage)
  ================================================================== */
  const themeToggle = $('#theme-toggle');
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    safeStore(STORAGE.theme, theme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ==================================================================
     2. BILINGÜE ES / EN  (persistencia con LocalStorage)
     Todos los textos traducibles usan los atributos data-es / data-en.
  ================================================================== */
  const langButtons = $$('.lang-btn');
  const translatables = () => $$('[data-es]'); // se consulta en cada cambio (DOM estable)

  function setLang(lang) {
    lang = lang === 'en' ? 'en' : 'es';

    // Atributo de idioma del documento
    html.setAttribute('lang', lang);
    html.setAttribute('data-lang', lang);

    // Estado visual de los botones (navbar escritorio + menú móvil)
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Intercambio de textos
    translatables().forEach(el => {
      const text = el.getAttribute('data-' + lang);
      if (text !== null) {
        el.textContent = text;
      }
    });

    // Etiquetas ARIA traducidas
    $$('[data-es-aria]').forEach(el => {
      const label = el.getAttribute('data-' + lang + '-aria');
      if (label) {
        el.setAttribute('aria-label', label);
      }
    });

    safeStore(STORAGE.lang, lang);
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // Aplica el idioma persistido (el bootstrap del <head> ya evitó el parpadeo)
  setLang(safeRead(STORAGE.lang, 'es'));

  /* ==================================================================
     3. NAVEGACIÓN
  ================================================================== */
  const navbar    = $('#navbar');
  const navLinks  = $('#nav-links');
  const navBurger = $('#nav-burger');

  // 3a. Sombra / fondo del navbar al hacer scroll
  function onHeaderScroll() {
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }
    toggleBackToTop();
    updateScrollProgress();
  }

  // 3b. Menú móvil (hamburguesa)
  function closeMobileMenu() {
    if (!navLinks || !navBurger) return;
    navLinks.classList.remove('open');
    navBurger.classList.remove('active');
    navBurger.setAttribute('aria-expanded', 'false');
  }

  if (navBurger && navLinks) {
    navBurger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navBurger.classList.toggle('active', isOpen);
      navBurger.setAttribute('aria-expanded', String(isOpen));
    });

    // Cierra el menú al navegar a una sección
    $$('.nav-link', navLinks).forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Cierra el menú si se supera el breakpoint de escritorio
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMobileMenu();
    });

    // Cierra el menú con la tecla Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  // 3c. Enlace activo según la sección visible (IntersectionObserver)
  const sectionLinks = $$('.nav-link').filter(l => (l.getAttribute('href') || '').startsWith('#'));
  const observedSections = sectionLinks
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  function activateLink(id) {
    sectionLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && observedSections.length) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activateLink(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    observedSections.forEach(section => navObserver.observe(section));
  }

  /* ==================================================================
     4. BARRA DE PROGRESO DE SCROLL
  ================================================================== */
  const scrollProgress = $('.scroll-progress');

  function updateScrollProgress() {
    if (!scrollProgress) return;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - window.innerHeight) || 1;
    const pct = Math.min(100, (window.scrollY / max) * 100);
    scrollProgress.style.width = pct + '%';
  }

  /* ==================================================================
     5. ANIMACIONES DE ENTRADA (reveal on scroll)
  ================================================================== */
  const revealItems = $$('[data-reveal]');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    // Sin soporte o movimiento reducido: todo visible de inmediato
    revealItems.forEach(item => item.classList.add('revealed'));
  }

  /* ==================================================================
     6. EFECTO TYPING — "Build. Break. Detect. Learn. Automate. Lead."
  ================================================================== */
  const typedText = $('#typed-text');
  const PHRASES = ['Build.', 'Break.', 'Detect.', 'Learn.', 'Automate.', 'Lead.'];

  function runTyping() {
    if (!typedText) return;

    // Movimiento reducido: se muestra la frase completa y estática
    if (prefersReducedMotion) {
      typedText.textContent = PHRASES.join(' ');
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const word = PHRASES[phraseIndex];

      if (!deleting) {
        charIndex++;
        typedText.textContent = word.slice(0, charIndex);

        if (charIndex === word.length) {
          deleting = true;
          window.setTimeout(tick, 1500); // pausa con la palabra completa
        } else {
          window.setTimeout(tick, 95);   // velocidad de escritura
        }
      } else {
        charIndex--;
        typedText.textContent = word.slice(0, charIndex);

        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % PHRASES.length;
          window.setTimeout(tick, 350);  // pausa antes de la siguiente palabra
        } else {
          window.setTimeout(tick, 42);   // velocidad de borrado
        }
      }
    }

    tick();
  }

  runTyping();

  /* ==================================================================
     7. FILTROS DINÁMICOS (experiencia y competencias)
  ================================================================== */
  /**
   * Configura un grupo de filtros.
   * @param {string} groupId    id del contenedor de botones
   * @param {string} itemSelector selector de los elementos filtrables
   * @param {string} containerId id del contenedor de los elementos (animación)
   */
  function setupFilters(groupId, itemSelector, containerId) {
    const group = document.getElementById(groupId);
    const container = document.getElementById(containerId);
    if (!group || !container) return;

    const buttons = $$('.filter-btn', group);
    const items = $$(itemSelector, container);

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        buttons.forEach(b => b.classList.toggle('active', b === btn));

        items.forEach(item => {
          const categories = (item.dataset.cats || item.dataset.cat || '').split(/\s+/);
          const show = filter === 'all' || categories.indexOf(filter) !== -1;
          item.classList.toggle('is-hidden', !show);

          // Garantiza visibilidad aunque el elemento aún no se haya revelado
          if (show) item.classList.add('revealed');
        });

        // Reinicia la animación de entrada del conjunto visible
        container.classList.remove('filtering');
        void container.offsetWidth; // fuerza reflow para relanzar la animación
        container.classList.add('filtering');
        window.setTimeout(() => container.classList.remove('filtering'), 520);
      });
    });
  }

  setupFilters('exp-filters', '.tl-item', 'exp-timeline');
  setupFilters('skill-filters', '.skill-card', 'skills-grid');

  /** Restablece ambos filtros a "Todas" (usado antes de imprimir el CV) */
  function resetAllFilters() {
    ['exp-filters', 'skill-filters'].forEach(id => {
      const group = document.getElementById(id);
      if (!group) return;
      const allBtn = $('.filter-btn[data-filter="all"]', group);
      if (allBtn && !allBtn.classList.contains('active')) allBtn.click();
    });
  }

  window.addEventListener('beforeprint', resetAllFilters);

  /* ==================================================================
     8. TERMINAL INTERACTIVA (solo visual — no ejecuta nada)
  ================================================================== */
  const terminalTabs = $$('.t-tab');

  terminalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      terminalTabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });

      $$('.t-pane').forEach(pane => {
        const match = pane.id === 'pane-' + target;
        pane.classList.toggle('active', match);
        pane.hidden = !match;
      });
    });
  });

  /* ==================================================================
     9. FALLBACKS DE IMAGEN
  ================================================================== */

  // 9a. Fotografía profesional (assets/foto.jpg → monograma AV)
  const photo = $('#profile-photo');
  if (photo) {
    const showPhotoFallback = () => {
      photo.hidden = true;
      const fallback = $('.photo-fallback', photo.parentElement);
      if (fallback) fallback.hidden = false;
    };
    photo.addEventListener('error', showPhotoFallback);
    if (photo.complete && photo.naturalWidth === 0) showPhotoFallback();
  }

  // 9b. Badges Credly (images/*.png → icono de medalla)
  $$('.cert-img').forEach(img => {
    const showCertFallback = () => {
      img.hidden = true;
      const wrap = img.closest('.cert-img-wrap');
      const fallback = wrap ? $('.cert-fallback', wrap) : null;
      if (fallback) fallback.hidden = false;
    };
    img.addEventListener('error', showCertFallback);
    if (img.complete && img.naturalWidth === 0) showCertFallback();
  });

  /* ==================================================================
     10. DESCARGAR CV PDF — window.print() + estilos @media print
  ================================================================== */
  const printBtn = $('#btn-print-cv');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  /* ==================================================================
     11. BOTÓN VOLVER ARRIBA + AÑO DINÁMICO
  ================================================================== */
  const backToTop = $('#back-to-top');

  function toggleBackToTop() {
    if (backToTop) {
      backToTop.classList.toggle('show', window.scrollY > 600);
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }

  const yearSpan = $('#year');
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------
     Estado inicial
  ------------------------------------------------------------------ */
  onHeaderScroll();
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
})();
