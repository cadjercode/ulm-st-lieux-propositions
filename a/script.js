(function () {
  var root = document.documentElement;
  var hdr = document.querySelector('.hdr');
  var hero = document.querySelector('.hero');

  // En-tête : fond plein dès qu'on quitte le haut de la page (sans écouteur scroll).
  // La sentinelle vit dans le document, pas dans le hero : le hero est épinglé au défilement.
  if ('IntersectionObserver' in window && hdr) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:4rem;pointer-events:none';
    document.body.appendChild(sentinel);
    new IntersectionObserver(function (e) {
      hdr.classList.toggle('is-solid', !e[0].isIntersecting);
    }).observe(sentinel);
  }

  // Formulaire de démonstration
  var form = document.getElementById('form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      document.getElementById('f-status').textContent = 'Démo — formulaire non actif.';
    });
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  root.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);

  var EASE = 'expo.out';
  var mm = gsap.matchMedia();
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Hero : décollage (zoom arrière + cascade) ----------
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from('.hero-media img', { scale: 1.08, duration: 1.6 })
      .from('.hero-in', { y: 32, rotation: -1.5, opacity: 0.15, duration: 0.9, stagger: 0.08 }, 0.15)
      .from('.trace-hero i', { scaleY: 0, duration: 1.2, ease: 'power2.inOut' }, 0.9);
  });

  // ---------- Hero épinglé : la photo plein cadre se pose en carte (ordinateur) ----------
  // Raison : le vol « se range » dans le plan de vol qui suit ; le texte reste en place et lisible.
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', function () {
    var media = hero.querySelector('.hero-media');
    var copy = hero.querySelector('.hero-copy');
    var card = {};

    function measure() {
      var W = hero.offsetWidth, H = hero.offsetHeight;
      var wrap = copy.parentNode;
      var pad = parseFloat(getComputedStyle(wrap).paddingRight) || 64;
      var rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      var top = 4.5 * rem + 1.25 * rem;                        // sous l'en-tête
      // haut du texte, sans tenir compte des transformations d'entrée
      var textTop = H - copy.offsetHeight + parseFloat(getComputedStyle(copy).paddingTop);
      var bottom = textTop - 1.75 * rem;
      var h = Math.max(bottom - top, 10 * rem);
      var w = h * W / H;                                     // même rapport que l'écran : réduction uniforme
      if (w > W * 0.46) { w = W * 0.46; h = w * H / W; }
      card.s = w / W;
      card.x = wrap.offsetLeft + wrap.offsetWidth - pad - w;   // aligné sur le bord droit du contenu
      card.y = top;
      card.r = 20 / card.s;                                  // 20 px une fois réduite
    }
    measure();

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero, start: 'top top', end: '+=75%', pin: true, scrub: 0.3,
        invalidateOnRefresh: true, onRefreshInit: measure
      }
    });
    tl.fromTo(media,
      { x: 0, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)' },
      { x: function () { return card.x; }, y: function () { return card.y; }, scale: function () { return card.s; },
        clipPath: function () { return 'inset(0% 0% 0% 0% round ' + card.r + 'px)'; }, ease: 'power2.inOut', duration: 1 }, 0)
      .to('.hero-voile', { opacity: 0, duration: 0.2 }, 0.8)   // le voile reste tant que la photo passe sous le texte
      .to('.trace-hero', { opacity: 0, duration: 0.3 }, 0);
  });

  // ---------- Signature « la montée » : tout décolle en entrant ----------
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    ScrollTrigger.batch('.rise', {
      once: true,
      start: 'top 88%',
      onEnter: function (els) {
        // cascade de 80 ms, plafonnée à 0,2 s au total : rien n'attend trop longtemps
        gsap.to(els, { opacity: 1, y: 0, rotation: 0, duration: 0.8, stagger: Math.min(0.08, 0.2 / els.length), ease: EASE, overwrite: true });
      }
    });
  });

  // ---------- Moment waouh : le plan de vol ----------
  // L'ULM vole à hauteur du regard (60 % de l'écran) : il suit le lecteur, survole chaque photo
  // et passe d'une étape à l'autre dans les intervalles, jamais sur le texte.
  var flight = document.querySelector('.flight');
  var svg = flight.querySelector('.flight-svg');
  var dash = svg.querySelector('.dash');
  var halo = svg.querySelector('.halo');
  var maskPath = svg.querySelector('.mask-path');
  var plane = flight.querySelector('.ulm');
  var steps = flight.querySelectorAll('.step');
  var len = 0, H = 0, table = [];
  var progress = { p: 0 };

  function rel(r, box) {
    return { l: r.left - box.left, t: r.top - box.top, r: r.right - box.left, b: r.bottom - box.top,
      cx: r.left - box.left + r.width / 2, cy: r.top - box.top + r.height / 2 };
  }

  // Courbe lisse (Catmull-Rom → Bézier) passant par tous les points
  function smooth(pts) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var t = 0.5 / 3 * 2;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) * t / 2) + ' ' + (p1[1] + (p2[1] - p0[1]) * t / 2) +
        ' ' + (p2[0] - (p3[0] - p1[0]) * t / 2) + ' ' + (p2[1] - (p3[1] - p1[1]) * t / 2) +
        ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }

  function buildPath() {
    var box = flight.getBoundingClientRect();
    var w = box.width;
    H = box.height;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + H);
    var mobile = !window.matchMedia('(min-width: 768px)').matches;
    var pts = [];
    if (mobile) {
      // Ligne verticale à gauche des étapes, par les pastilles
      var dots = flight.querySelectorAll('.step-dot');
      dots.forEach(function (dd) { dd.style.left = ''; dd.style.top = ''; dd.style.marginTop = ''; });
      var d0 = rel(dots[0].getBoundingClientRect(), box);
      pts.push([d0.cx, -40]);
      dots.forEach(function (dd) { var r = rel(dd.getBoundingClientRect(), box); pts.push([r.cx, r.cy]); });
      pts.push([d0.cx, H]);
      var dm = 'M' + pts[0][0] + ' ' + pts[0][1];
      for (var k = 1; k < pts.length; k++) dm += ' L' + pts[k][0] + ' ' + pts[k][1];
      dash.setAttribute('d', dm); halo.setAttribute('d', dm); maskPath.setAttribute('d', dm);
    } else {
      var rows = [];
      steps.forEach(function (st) {
        rows.push({ el: st, s: rel(st.getBoundingClientRect(), box),
          m: rel(st.querySelector('.step-media').getBoundingClientRect(), box),
          x: rel(st.querySelector('.step-txt').getBoundingClientRect(), box),
          dot: st.querySelector('.step-dot'), wide: st.classList.contains('step--wide') });
      });
      pts.push([rows[0].m.cx * 0.6, -60]);
      rows.forEach(function (r, i) {
        // Point de passage : au-dessus de la photo (centre légèrement décalé vers l'extérieur)
        var px = r.wide ? r.m.l + (r.m.r - r.m.l) * 0.3 : r.m.cx;
        var py = r.wide ? r.m.t + (r.m.b - r.m.t) * 0.4 : r.m.cy;
        pts.push([px, py]);
        // pastille posée sur le point de passage
        r.dot.style.left = (px - r.s.l - r.dot.offsetWidth / 2) + 'px';
        r.dot.style.top = (py - r.s.t - r.dot.offsetHeight / 2) + 'px';
        r.dot.style.marginTop = '0';
        if (r.wide) {
          // sort de la grande photo par la droite, à côté du texte
          pts.push([r.m.l + (r.m.r - r.m.l) * 0.88, r.m.b + (r.x.b - r.m.b) * 0.35]);
        }
        var next = rows[i + 1];
        if (next) {
          // virage dans l'intervalle entre deux étapes
          var gy = (Math.max(r.m.b, r.x.b) + Math.min(next.m.t, next.x.t)) / 2;
          var nx = next.wide ? next.m.l + (next.m.r - next.m.l) * 0.3 : next.m.cx;
          pts.push([(pts[pts.length - 1][0] + nx) / 2, gy]);
        }
      });
      var last = rows[rows.length - 1];
      pts.push([last.m.cx, last.m.b - 24]);
      var d = smooth(pts);
      dash.setAttribute('d', d); halo.setAttribute('d', d); maskPath.setAttribute('d', d);
    }
    len = dash.getTotalLength();
    maskPath.style.strokeDasharray = len + ' ' + len;
    // Table hauteur → longueur : l'ULM se place à la hauteur visée, quelle que soit la forme du tracé
    table = [];
    var n = 400, maxY = -Infinity;
    for (var i = 0; i <= n; i++) {
      var L = len * i / n, pt = dash.getPointAtLength(L);
      maxY = Math.max(maxY, pt.y);
      table.push([maxY, L]);
    }
    render();
  }

  function lengthAtY(y) {
    if (!table.length || y <= table[0][0]) return 0;
    var lo = 0, hi = table.length - 1;
    if (y >= table[hi][0]) return table[hi][1];
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (table[mid][0] < y) lo = mid; else hi = mid; }
    var a = table[lo], b = table[hi];
    return a[1] + (b[1] - a[1]) * ((y - a[0]) / ((b[0] - a[0]) || 1));
  }

  function render() {
    if (!len) return;
    var at = Math.max(0.5, Math.min(len - 0.5, lengthAtY(progress.p * H)));
    maskPath.style.strokeDashoffset = len - at;
    var pt = dash.getPointAtLength(at);
    var a = dash.getPointAtLength(Math.max(0, at - 14));
    var b = dash.getPointAtLength(Math.min(len, at + 14));
    var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
    // inclinaison dans les virages : les ailes se raccourcissent selon la courbure
    var a2 = dash.getPointAtLength(Math.max(0, at - 40));
    var b2 = dash.getPointAtLength(Math.min(len, at + 40));
    var turn = Math.atan2(b2.y - pt.y, b2.x - pt.x) - Math.atan2(pt.y - a2.y, pt.x - a2.x);
    if (turn > Math.PI) turn -= 2 * Math.PI;
    if (turn < -Math.PI) turn += 2 * Math.PI;
    var bank = Math.min(1, Math.abs(turn) / 1.2);
    gsap.set(plane, { x: pt.x, y: pt.y, rotation: ang, scaleX: 1 - bank * 0.16 });
  }

  if (reduce) {
    progress.p = 1;
  } else {
    gsap.to(progress, {
      p: 1, ease: 'none',
      onUpdate: render,
      scrollTrigger: { trigger: flight, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 }
    });
  }

  ScrollTrigger.addEventListener('refresh', buildPath);
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  buildPath();
})();
