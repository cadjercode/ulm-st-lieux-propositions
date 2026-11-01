(function () {
  var root = document.documentElement;
  var form = document.getElementById('form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      document.getElementById('f-status').textContent = 'Démo — formulaire non actif.';
    });
  }

  // Remplissage des boutons depuis le bord d'entrée de la souris
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('pointerenter', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--from', e.clientX - r.left < r.width / 2 ? 'left' : 'right');
    });
  });

  // Sans GSAP : on retire la classe js, tout le contenu redevient visible
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('js'); return; }
  root.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  var EASE = 'power4.out';

  // ---------- Hero (ordinateur) : au premier défilement, le cartouche sort et la photo prend tout l'écran ----------
  // (l'ouverture des portes au chargement est en CSS : elle n'attend pas la librairie)
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=70%', pin: true, scrub: 1 }
    })
      .to('.hero-panel', { xPercent: -112, ease: 'power2.in' }, 0)
      .to('.prix', { autoAlpha: 0, y: 40, ease: 'power2.in' }, 0)
      .fromTo('.hero-media > img', { scale: 1 }, { scale: 1.08, ease: 'none' }, 0);
  });

  // ---------- Signature « le glissement » ----------
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    ScrollTrigger.batch('.slide', {
      once: true, start: 'top 88%',
      onEnter: function (els) { gsap.to(els, { autoAlpha: 1, x: 0, duration: 0.9, stagger: 0.06, ease: EASE, overwrite: true }); }
    });
    gsap.utils.toArray('.reveal-img').forEach(function (el) {
      gsap.to(el, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    gsap.utils.toArray('.rule').forEach(function (el) {
      gsap.to(el, { scaleX: 1, duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  });

  // ---------- Moment waouh : le décollage (ordinateur, épinglé) ----------
  // 1. les numéraux sortent d'abord (jamais de chiffres sur la photo)
  // 2. la photo du sol s'ouvre jusqu'au plein écran
  // 3. la vue du ciel monte par un volet net (bord orange), pas de fondu croisé
  // 4. voile + titre
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
    var media = document.querySelector('.tk-media');
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.takeoff', start: 'top top', end: '+=200%', pin: true, scrub: 1, invalidateOnRefresh: true }
    });
    tl.to('.tk-nums li', { yPercent: -60, autoAlpha: 0, stagger: 0.02, duration: 0.18, ease: 'power2.in' }, 0)
      .to('.tk-media', { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power2.inOut' }, 0.18)
      .fromTo('.tk-sol', { scale: 1 }, { scale: 1.12, duration: 1 }, 0.18)
      .to('.tk-sol', { yPercent: 5, duration: 0.6, ease: 'power2.in' }, 1.2)
      .fromTo('.tk-ciel', { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.6, ease: 'power2.inOut' }, 1.2)
      .fromTo('.tk-edge', { y: 0, autoAlpha: 1 }, { y: function () { return -media.offsetHeight - 4; }, duration: 0.6, ease: 'power2.inOut' }, 1.2)
      .to('.tk-scrim', { opacity: 1, duration: 0.25 }, 1.75)
      .fromTo('.tk-title', { autoAlpha: 0, x: -32 }, { autoAlpha: 1, x: 0, ease: 'power3.out', duration: 0.3 }, 1.85)
      .to({}, { duration: 0.25 });
  });

  // Version mobile : la photo s'élargit puis la vue du ciel monte par un volet, une fois, à l'entrée
  mm.add('(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)', function () {
    gsap.set('.tk-media', { clipPath: 'inset(0% 18% 0% 18%)' });
    gsap.set('.tk-ciel', { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.timeline({ scrollTrigger: { trigger: '.tk-media', start: 'top 80%', once: true } })
      .to('.tk-media', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: EASE })
      .to('.tk-ciel', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, 0.7);
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
