/* Trident Studios — interactivity */

(() => {
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const menu = nav.querySelector('.nav__menu');

  /* Sticky nav reveal */
  const onScroll = () => {
    if (window.scrollY > 60) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Theme toggle */
  const root = document.documentElement;
  const themeBtn = nav.querySelector('.nav__theme');
  const syncPressed = () => themeBtn && themeBtn.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark');
  syncPressed();
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('ts-theme', next); } catch (e) {}
      syncPressed();
    });
  }

  /* Mobile menu */
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));

  /* Scroll reveal — tag every direct child of every <section> after the hero */
  const targets = document.querySelectorAll(
    '.intro__grid, .marquee, .featured .section-head, .couple, .quote-band .container, ' +
    '.experience .section-head, .service, .lookbook .section-head, .masonry__item, ' +
    '.about__media, .about__copy, .testimonials .section-head, .testimonial, ' +
    '.contact__intro, .contact__form, ' +
    '.faq .section-head, .faq__item'
  );
  targets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));

  /* ── Lightbox galleries ───────────────────────────────────
   * Clicking a .couple card opens that couple's photos in an
   * overlay with prev/next; clicking a lookbook frame opens the
   * whole lookbook from that frame. Image lists mirror the folders
   * under public/ (card thumbnail listed first); `base` defaults to
   * the weddings folder.
   * Paths are absolute: the location pages live at /brandon/ etc,
   * so a relative path would resolve to /brandon/public/... */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    /* Resolve the prefix up to `public/` from an image that already loads on
       this page, so the galleries match however the page references assets:
       relative on the homepage, root-absolute on /brandon/ etc, and correct
       under a local file:// preview. Falls back to the root-absolute path. */
    const publicPrefix = (() => {
      const imgs = document.querySelectorAll('img');
      for (let k = 0; k < imgs.length; k++) {
        const s = imgs[k].getAttribute('src') || '';
        const i = s.indexOf('public/');
        if (i !== -1) return s.slice(0, i) + 'public/';
      }
      return '/public/';
    })();

    const srcFor = (base, folder, file) =>
      publicPrefix + base + '/' + encodeURIComponent(folder) + '/' + encodeURIComponent(file);

    const GALLERIES = {
      'ashley-mayson': { title: 'Ashley & Mayson', folder: 'Ashley & Mayson', files: [
        'Ashley%2BMason-WeddingHR-26.jpg', 'Ashley%2BMason-WeddingHR-116.jpg', 'Ashley%2BMason-WeddingHR-124.jpg',
        'Ashley%2BMason-WeddingHR-147.jpg', 'Ashley%2BMason-WeddingHR-158.jpg', 'Ashley%2BMason-WeddingHR-179.jpg',
        'Ashley%2BMason-WeddingHR-185.jpg', 'Ashley%2BMason-WeddingHR-191.jpg', 'Ashley%2BMason-WeddingHR-213.jpg',
        'Ashley%2BMason-WeddingHR-248.jpg', 'Ashley%2BMason-WeddingHR-263.jpg', 'Ashley%2BMason-WeddingHR-270.jpg',
        'Ashley%2BMason-WeddingHR-58.jpg' ] },
      'shelby-jaydan': { title: 'Shelby & Jaydan', folder: 'Shelby & Jaydan', files: [
        'Shelby&Jaydan-9.jpg', 'Shelby&Jaydan-15.jpg', 'Shelby&Jaydan-17.jpg', 'Shelby&Jaydan-18.jpg',
        'Shelby&Jaydan-19.jpg', 'Shelby&Jaydan-2.jpg', 'Shelby&Jaydan-20.jpg', 'Shelby&Jaydan-3.jpg',
        'Shelby&Jaydan-8.jpg' ] },
      'desiree-ruhi': { title: 'Desiree & Ruhi', folder: 'Desiree and Ruhi', files: [
        'DesireeandRuhi-04994.jpg', 'DesireeandRuhi-03891.jpg', 'DesireeandRuhi-05054.jpg',
        'DesireeandRuhi-05177.jpg', 'DesireeandRuhi-05225.jpg', 'DesireeandRuhi-05290.jpg',
        'DesireeandRuhi-05332.jpg' ] },
      'ihuoma-christian': { title: 'Ihuoma & Christian', folder: 'Ihuoma & Christian', files: [
        'Ihuoma&Christian-062.jpg', 'Ihuoma&Christian-000.jpg', 'Ihuoma&Christian-050.jpg',
        'Ihuoma&Christian-057.jpg', 'Ihuoma&Christian-066.jpg', 'Ihuoma&Christian-087.jpg',
        'Ihuoma&Christian-124.jpg' ] },
      'vrajna-rutuj': { title: 'Vrajna & Rutuj', folder: 'Vrajna & Rutuj', files: [
        'Emma&Chad-46.jpg', 'Emma&Chad-195.jpg', 'Emma&Chad-20.jpg', 'Emma&Chad-27.jpg', 'Emma&Chad-294.jpg',
        'Emma&Chad-301.jpg', 'Emma&Chad-377.jpg', 'Emma&Chad-390.jpg', 'Emma&Chad-40.jpg', 'Emma&Chad-453.jpg',
        'Emma&Chad-47.jpg', 'Emma&Chad-83.jpg', 'Emma&Chad-90.jpg' ] },
      'laura-tim': { title: 'Laura & Tim', folder: 'Laura and Tim', files: [
        '8E2A2063A.jpg', '8E2A0088A.jpg', '8E2A2065A.jpg', '8E2A3280A.jpg', '8E2A3283A.jpg', '8E2A3350A.jpg',
        '8E2A3465A.jpg', '8E2A3562A.jpg', '8E2A3697A.jpg' ] },
      'divyaraj-nitasha': { title: 'Divyaraj & Nitasha', base: 'engagement', folder: 'Divyaraj & Nitasha', files: [
        'Nitasha&Divyraj-22.jpg', 'Nitasha&Divyraj-9.jpg', 'Nitasha&Divyraj-12.jpg', 'Nitasha&Divyraj-16.jpg',
        'Nitasha&Divyraj-21.jpg', 'Nitasha&Divyraj-27.jpg', 'Nitasha&Divyraj-32.jpg', 'Nitasha&Divyraj-40.jpg',
        'Nitasha&Divyraj-46.jpg', 'Nitasha&Divyraj-55.jpg', 'Nitasha&Divyraj-67.jpg' ] },
      'harsh-aesha': { title: 'Harsh & Aesha', base: 'engagement', folder: 'Harsh & Aesha', files: [
        'Harsh&Aesha-Engagement-140.jpg', 'Harsh&Aesha-Engagement-84.jpg', 'Harsh&Aesha-Engagement-85.jpg',
        'Harsh&Aesha-Engagement-133.jpg', 'Harsh&Aesha-Engagement-142.jpg', 'Harsh&Aesha-Engagement-144.jpg',
        'Harsh&Aesha-Engagement-167.jpg', 'Harsh&Aesha-Engagement-175.jpg' ] },
    };

    /* Normalise every gallery to a flat list of srcs, so a gallery can either
       mirror one folder (the couples) or gather frames from several (the
       lookbook). `labels` is per-photo; `title` is the fallback for all. */
    const galleries = {};
    Object.keys(GALLERIES).forEach((slug) => {
      const g = GALLERIES[slug];
      const base = g.base || 'Weddings';
      galleries[slug] = { title: g.title, srcs: g.files.map((f) => srcFor(base, g.folder, f)) };
    });

    /* The lookbook reads its srcs straight off the page, so it stays in step
       with the markup and works whatever prefix a page uses. */
    const lookbookImgs = Array.from(document.querySelectorAll('.masonry__item img'));
    if (lookbookImgs.length) {
      const folderOf = (src) => {
        const parts = src.split('/').filter(Boolean);
        return parts.length >= 2 ? decodeURIComponent(parts[parts.length - 2]) : 'Trident Studios';
      };
      galleries.lookbook = {
        title: 'Frames we love',
        srcs: lookbookImgs.map((im) => im.getAttribute('src')),
        labels: lookbookImgs.map((im) => folderOf(im.getAttribute('src'))),
      };
    }

    const imgEl = lightbox.querySelector('.lightbox__img');
    const titleEl = lightbox.querySelector('.lightbox__title');
    const countEl = lightbox.querySelector('.lightbox__count');
    const btnPrev = lightbox.querySelector('.lightbox__nav--prev');
    const btnNext = lightbox.querySelector('.lightbox__nav--next');
    const btnClose = lightbox.querySelector('.lightbox__close');

    let current = null;
    let index = 0;
    let lastFocus = null;

    const preload = (src) => { const im = new Image(); im.src = src; };

    const labelAt = (i) => (current.labels ? current.labels[i] : current.title);

    const show = (i) => {
      const n = current.srcs.length;
      index = (i + n) % n;
      imgEl.src = current.srcs[index];
      imgEl.alt = labelAt(index) + ' — photo ' + (index + 1);
      titleEl.textContent = labelAt(index);
      countEl.textContent = (index + 1) + ' / ' + n;
      const single = n < 2;
      btnPrev.hidden = single;
      btnNext.hidden = single;
      preload(current.srcs[(index + 1) % n]);
      preload(current.srcs[(index - 1 + n) % n]);
    };

    const open = (slug, start) => {
      const g = galleries[slug];
      if (!g || !g.srcs.length) return;
      current = g;
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      show(start || 0);
      btnClose.focus();
    };

    const close = () => {
      lightbox.hidden = true;
      imgEl.removeAttribute('src');
      current = null;
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    btnPrev.addEventListener('click', () => show(index - 1));
    btnNext.addEventListener('click', () => show(index + 1));
    btnClose.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
    });

    let touchX = null;
    lightbox.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });

    const wire = (el, slug, start, label) => {
      el.classList.add('has-gallery');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', label);
      el.addEventListener('click', () => open(slug, start));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(slug, start); }
      });
    };

    document.querySelectorAll('.couple[data-gallery]').forEach((card) => {
      const slug = card.getAttribute('data-gallery');
      if (!galleries[slug]) return;
      wire(card, slug, 0, 'Open ' + galleries[slug].title + ' photo gallery');
    });

    /* Each lookbook frame opens the whole lookbook, starting on itself. */
    lookbookImgs.forEach((im, i) => {
      wire(im.closest('.masonry__item'), 'lookbook', i,
        'Open lookbook gallery at photo ' + (i + 1) + ' of ' + lookbookImgs.length);
    });
  }

  /* Year stamp */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Subtle hero parallax */
  const heroImg = document.querySelector('.hero__img');
  if (heroImg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let raf = 0;
    const tick = () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      heroImg.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1 + y * 0.0001})`;
      raf = 0;
    };
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }
})();
