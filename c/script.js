/* Club ULM de Saint-Lieux-lès-Lavaur — proposition c « La place de droite »
   Signature : l'horizon s'incline puis se remet à plat (hero, scène du vol, révélations). */
(() => {
  const d = document;
  const root = d.documentElement;

  /* Menu mobile */
  const btn = d.querySelector('.menu-btn');
  const menu = d.getElementById('menu');
  const setMenu = (open) => {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    root.classList.toggle('menu-open', open);
  };
  if (btn && menu) {
    btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
    });
  }

  /* En-tête : fond plein dès qu'on quitte le haut de la page (sans écouteur scroll) */
  const hdr = d.querySelector('.hdr');
  const sentinel = d.getElementById('sentinel');
  if (hdr && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => hdr.classList.toggle('is-solid', !e.isIntersecting)).observe(sentinel);
  }

  /* Formulaire de démonstration */
  const form = d.getElementById('form');
  if (form) {
    const status = d.getElementById('f-status');
    const champ = (id) => d.getElementById(id);
    const erreur = (input, idErr, msg) => {
      const el = champ(idErr);
      if (el) el.textContent = msg || '';
      [].concat(input).forEach((i) => i.setAttribute('aria-invalid', msg ? 'true' : 'false'));
      return !msg;
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nom = champ('f-nom'), tel = champ('f-tel'), mail = champ('f-mail'), dem = champ('f-dem');
      const telOk = tel.value.replace(/\D/g, '').length >= 10;
      const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim());
      const ok = [
        erreur(nom, 'e-nom', nom.value.trim() ? '' : 'Indiquez votre nom.'),
        erreur([tel, mail], 'e-contact', telOk || mailOk ? '' : 'Indiquez un téléphone à 10 chiffres ou un e-mail valide.'),
        erreur(dem, 'e-dem', dem.value ? '' : 'Choisissez le sujet de votre demande.'),
      ];
      if (ok.includes(false)) {
        status.textContent = '';
        const premier = [nom, tel, dem][ok.indexOf(false)];
        if (premier) premier.focus();
        return;
      }
      status.textContent = 'Démo — formulaire non actif.';
    });
  }

  /* Mouvement : seulement si GSAP est chargé (sinon tout reste visible) */
  if (!window.gsap || !window.ScrollTrigger) return;
  root.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  /* Ordinateur : hero épinglé qui s'incline, puis le vol complet en scène épinglée */
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=80%', pin: true, scrub: 0.6 },
    })
      .to('.hero-img', { rotation: -9, scale: 1.75, ease: 'sine.inOut' }, 0)
      .to('.hero-copy', { y: '-10vh', opacity: 0, duration: 0.6, ease: 'power1.in' }, 0.05);

    root.classList.add('vol-pin');
    const steps = gsap.utils.toArray('.vol-step');
    const figs = steps.map((s) => s.querySelector('.vol-fig'));
    const cards = steps.map((s) => s.querySelector('.vol-card'));
    const marks = gsap.utils.toArray('.vol-index li');
    const horizon = d.querySelector('.vol .horizon');
    // inclinaison (degrés) et tangage (yPercent) de chaque étape : [début, fin]
    const R = [[0, 0], [-1, -4], [-3, -11], [8, 2], [3, 0]];
    const Y = [[0, 0], [0, 5], [2, -2], [0, 0], [12, 7]];
    gsap.set(steps.slice(1), { autoAlpha: 0 });
    figs.forEach((f, i) => gsap.set(f, { rotation: R[i][0], yPercent: Y[i][0], scale: 1.04 }));
    gsap.set(horizon, { rotation: R[0][0], scaleX: 0.2, opacity: 0 });

    const setMark = (i) => marks.forEach((m, k) => m.classList.toggle('is-on', k === i));
    setMark(0);
    const SEG = 1.6;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.vol-stage',
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * steps.length * 0.85),
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => setMark(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999))),
      },
    });
    tl.to(horizon, { scaleX: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0);
    steps.forEach((s, i) => {
      const t = i * SEG;
      tl.to(figs[i], { rotation: R[i][1], yPercent: Y[i][1], scale: 1.12, duration: SEG, ease: 'sine.inOut' }, t);
      tl.to(horizon, { rotation: R[i][1], duration: SEG * 0.7, ease: 'sine.inOut' }, t);
      if (i < steps.length - 1) {
        const x = t + SEG * 0.72;
        tl.to(cards[i], { autoAlpha: 0, y: -24, duration: 0.3 }, x)
          .to(steps[i + 1], { autoAlpha: 1, duration: 0.45, ease: 'power1.inOut' }, x)
          .fromTo(cards[i + 1], { y: 36, rotation: -1.5 }, { y: 0, rotation: 0, duration: 0.45, ease: 'power2.out' }, x + 0.1)
          .to(horizon, { rotation: R[i + 1][0], duration: 0.45, ease: 'sine.inOut' }, x);
      }
    });
    tl.to(horizon, { opacity: 0, scaleX: 0.4, duration: 0.4 }, steps.length * SEG - 0.4);

    return () => root.classList.remove('vol-pin');
  });

  /* Entrée du hero : l'image se pose, le texte monte en cascade (texte lisible dès le départ) */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('.hero-img', { scale: 1.2, duration: 1.8, ease: 'expo.out' });
    gsap.from('.hero .hi', { y: 24, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out', delay: 0.05 });

    /* Révélations : chaque bloc arrive légèrement incliné et se remet à l'horizontale */
    ScrollTrigger.batch('.lv', {
      once: true,
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, rotation: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out', overwrite: true }),
    });
  });

  /* Téléphone : pas d'épinglage, l'horizon de chaque photo bascule doucement pendant qu'elle traverse l'écran */
  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.to('.hero-img', {
      rotation: -5, scale: 1.25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.utils.toArray('.vol-step').forEach((s) => {
      gsap.fromTo(s.querySelector('.vol-fig'), { rotation: -7 }, {
        rotation: 5, ease: 'none',
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
