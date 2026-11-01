/* Club ULM de Saint-Lieux-lès-Lavaur — maquette d « Premier vol »
   Signature : la diagonale de la manche à air (rouge et blanc) qui balaie, découpe et révèle. */
(() => {
  const d = document;

  /* Menu mobile */
  const menuBtn = d.querySelector('.menu-btn');
  const navMob = d.getElementById('nav-mob');
  const fermer = () => { menuBtn.setAttribute('aria-expanded', 'false'); navMob.hidden = true; };
  if (menuBtn && navMob) {
    menuBtn.addEventListener('click', () => {
      const ouvert = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!ouvert));
      navMob.hidden = ouvert;
    });
    navMob.addEventListener('click', (e) => { if (e.target.closest('a')) fermer(); });
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !navMob.hidden) { fermer(); menuBtn.focus(); }
    });
  }

  /* En-tête : fond plein dès que le héros est passé */
  const hdr = d.querySelector('.hdr');
  const sentinelle = d.querySelector('.sentinelle');
  if (hdr && sentinelle && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => hdr.classList.toggle('is-solid', !e.isIntersecting)).observe(sentinelle);
  }

  /* Formulaire de démonstration */
  const form = d.getElementById('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      d.getElementById('f-status').textContent = 'Démo — formulaire non actif.';
    });
  }

  /* La copie du titre dans la bande prend exactement la largeur du vrai titre (mêmes retours à la ligne) */
  const h1 = d.getElementById('h1');
  const copie = d.querySelector('.manche-txt > span');
  if (h1 && copie) {
    const caler = () => {
      copie.style.maxWidth = 'none';
      copie.style.width = h1.getBoundingClientRect().width + 'px';
    };
    caler();
    if ('ResizeObserver' in window) new ResizeObserver(caler).observe(h1);
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  d.documentElement.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  const etroit = window.matchMedia('(max-width: 767px)').matches;
  const BANDE = etroit ? 'polygon(0% 86%, 100% 83%, 100% 94%, 0% 100%)' : 'polygon(0% 71%, 100% 34%, 100% 61%, 0% 98%)';
  const BANDE_0 = etroit ? 'polygon(0% 86%, 0% 86%, 0% 100%, 0% 100%)' : 'polygon(0% 71%, 0% 71%, 0% 98%, 0% 98%)';
  const BANDE_FIN = etroit ? 'polygon(100% 83%, 100% 83%, 100% 94%, 100% 94%)' : 'polygon(100% 34%, 100% 34%, 100% 61%, 100% 61%)';

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    /* Héros : la manche à air se déploie de gauche à droite, la photo se pose */
    gsap.fromTo('.manche', { clipPath: BANDE_0 },
      { clipPath: BANDE, duration: 1.15, ease: 'expo.out', delay: 0.2 });
    gsap.from('.hero-media img', { scale: 1.08, duration: 1.8, ease: 'expo.out' });

    /* Premier défilement : la manche à air se replie vers la droite comme emportée par le vent
       (le titre redevient blanc), la photo vire et se rapproche, le texte remonte */
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 } })
      .fromTo('.manche', { clipPath: BANDE }, { clipPath: BANDE_FIN, ease: 'power1.in', duration: 0.7, immediateRender: false }, 0)
      .to('.hero-media', { scale: 1.16, rotation: 3.5, ease: 'none', duration: 1 }, 0)
      .to('.titre', { y: -70, ease: 'none' }, 0)
      .to('.hero-bas', { y: -30, ease: 'none' }, 0);

    /* Révélations en cascade */
    ScrollTrigger.batch('.rv', {
      once: true,
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out', overwrite: true }),
    });
  });

  /* Photos de section : dévoilées par une diagonale */
  mm.add({
    large: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    etroit: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
  }, (ctx) => {
    const fin = ctx.conditions.large
      ? 'polygon(0% 0%, 100% 0%, 86% 100%, 0% 100%)'
      : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    gsap.utils.toArray('.rv-img').forEach((el) => {
      gsap.fromTo(el, { clipPath: 'polygon(0% 0%, 0% 0%, -14% 100%, 0% 100%)' }, {
        clipPath: fin, duration: 1.3, ease: 'expo.inOut',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      });
    });
  });

  /* La scène des mots */
  const scene = d.querySelector('.scene');
  const cites = gsap.utils.toArray('.cite');
  if (!scene || !cites.length) return;
  const photos = cites.map((c) => c.querySelector('.cite-photo'));
  const textes = cites.map((c) => c.querySelector('.cite-texte'));

  mm.add('(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)', () => {
    /* Ordinateur : la scène s'épingle ; à chaque cran, la manche à air traverse la photo,
       la photo suivante apparaît derrière elle et la citation change sur place */
    scene.classList.add('is-pin');
    const vent = scene.querySelector('.vent');
    const anneaux = gsap.utils.toArray('.anneaux li');
    const P = (x) => `polygon(18% 0%, ${x}% 0%, ${x - 18}% 100%, 0% 100%)`;
    const V = (x) => `polygon(${x}% 0%, ${x + 3}% 0%, ${x - 15}% 100%, ${x - 18}% 100%)`;

    gsap.set(photos.slice(1), { clipPath: P(18) });
    gsap.set(textes.slice(1), { clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set(textes[0], { clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set(vent, { clipPath: V(18) });
    gsap.set(anneaux[0], { opacity: 1 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: () => '+=' + Math.round((cites.length - 1) * window.innerHeight * 0.85),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.6 }, delay: 0.12, ease: 'power2.inOut' },
      },
    });
    tl.addLabel('c0', 0);
    for (let i = 1; i < cites.length; i++) {
      const t = tl.duration() + 0.3;
      tl.fromTo(vent, { clipPath: V(18) }, { clipPath: V(118), duration: 1, ease: 'power2.inOut', immediateRender: false }, t)
        .fromTo(photos[i], { clipPath: P(18) }, { clipPath: P(118), duration: 1, ease: 'power2.inOut', immediateRender: false }, t)
        /* relève sur place : une ligne descend, la nouvelle citation remplace l'ancienne au-dessus d'elle,
           il y a toujours une citation à l'écran */
        .fromTo(textes[i - 1], { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut', immediateRender: false }, t + 0.15)
        .fromTo(textes[i - 1], { opacity: 1 }, { opacity: 0.2, duration: 0.25, ease: 'power1.out', immediateRender: false }, t + 0.1)
        .set(textes[i - 1], { opacity: 1 }, t + 0.9)
        .fromTo(textes[i], { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut', immediateRender: false }, t + 0.15)
        .to(anneaux[i], { opacity: 1, duration: 0.3 }, t + 0.55)
        .fromTo(vent, { clipPath: V(-4) }, { clipPath: V(18), duration: 0.4, ease: 'power2.out', immediateRender: false }, t + 1)
        .addLabel('c' + i, t + 1.4);
    }
    tl.to({}, { duration: 0.3 });

    return () => scene.classList.remove('is-pin');
  });

  mm.add('(max-width: 1023px), (max-height: 599px)', () => {
    /* Téléphone et tablette : enchaînement simple, sans épinglage */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cites.forEach((c, i) => {
      gsap.fromTo(photos[i], { clipPath: 'polygon(0% 0%, 0% 0%, -30% 100%, 0% 100%)' }, {
        clipPath: 'polygon(0% 0%, 130% 0%, 100% 100%, 0% 100%)', duration: 1.1, ease: 'expo.inOut',
        scrollTrigger: { trigger: c, start: 'top 85%', once: true },
      });
      gsap.fromTo(textes[i], { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.35,
        scrollTrigger: { trigger: c, start: 'top 85%', once: true },
      });
    });
  });
})();
