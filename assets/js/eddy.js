/* Pink Eddy · JS propio, sin dependencias ni terceros.
   Todo es mejora progresiva: sin este archivo la página se lee y se compra igual. */
(function () {
  'use strict';
  window.__eddy = true;
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var hasIO = 'IntersectionObserver' in window;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function euros(n) { return n.toFixed(2).replace('.', ',') + ' €'; }
  var escritorio = window.matchMedia('(min-width: 900px)');

  /* ---------- Cabecera: cápsula con desenfoque al salir de arriba ---------- */
  var cab = $('[data-cab]');
  if (cab && hasIO) {
    var cent = d.createElement('div');
    cent.setAttribute('aria-hidden', 'true');
    cent.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none';
    d.body.prepend(cent);
    new IntersectionObserver(function (e) { cab.classList.toggle('is-flotando', !e[0].isIntersecting); }).observe(cent);
  }

  /* ---------- Menú móvil: aria-expanded, Esc, foco atrapado ---------- */
  var menuBtn = $('[data-menu-btn]'), menu = $('#menu-movil');
  if (menuBtn && menu) {
    var fuera = $$('main, footer, .barra, .salto');
    var abierto = false;
    var focables = function () { return [menuBtn].concat($$('a[href], button:not([disabled])', menu)); };
    var abrir = function () {
      abierto = true;
      menu.hidden = false;
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.querySelector('span').textContent = 'Cerrar';
      d.body.classList.add('sin-scroll');
      fuera.forEach(function (el) { el.setAttribute('inert', ''); });
      requestAnimationFrame(function () { menu.classList.add('is-abierto'); });
      var primero = $('a', menu); if (primero) primero.focus();
    };
    var cerrar = function (devolverFoco) {
      if (!abierto) return;
      abierto = false;
      menu.classList.remove('is-abierto');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.querySelector('span').textContent = 'Menú';
      d.body.classList.remove('sin-scroll');
      fuera.forEach(function (el) { el.removeAttribute('inert'); });
      setTimeout(function () { if (!abierto) menu.hidden = true; }, reduce.matches ? 0 : 450);
      if (devolverFoco !== false) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () { abierto ? cerrar() : abrir(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) cerrar(false); });
    d.addEventListener('keydown', function (e) {
      if (!abierto) return;
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      if (e.key === 'Tab') {
        var f = focables(), i = f.indexOf(d.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1000px)').addEventListener('change', function (m) { if (m.matches) cerrar(false); });
  }

  /* ---------- Selector de idioma (<details>): Esc y clic fuera lo cierran ---------- */
  $$('details.idioma').forEach(function (det) {
    d.addEventListener('click', function (e) { if (det.open && !det.contains(e.target)) det.open = false; });
    det.addEventListener('keydown', function (e) { if (e.key === 'Escape' && det.open) { det.open = false; $('summary', det).focus(); } });
  });

  /* ---------- Entradas al hacer scroll: opacity + 20 px, escalonadas ---------- */
  $$('[data-stagger]').forEach(function (g) {
    var paso = Number(g.getAttribute('data-stagger')) || 110;
    Array.prototype.forEach.call(g.children, function (c, i) {
      if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', '');
      c.style.setProperty('--d', (i * paso) + 'ms');
    });
  });
  var io = hasIO ? new IntersectionObserver(function (ents) {
    ents.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      if (e.target.__alEntrar) e.target.__alEntrar();
    });
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0 }) : null;
  function observar(el) { if (io) io.observe(el); else { el.classList.add('is-in'); if (el.__alEntrar) el.__alEntrar(); } }
  $$('[data-reveal]').forEach(observar);

  /* ---------- Frase editorial revelada por líneas ---------- */
  function partir(el) {
    if (!el.__orig) el.__orig = el.innerHTML;
    if (reduce.matches) { el.classList.add('is-partida', 'is-in'); return; }
    // Palabras = lo que va entre espacios; la puntuación pegada viaja con su palabra
    var palabras = [[]];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { if (palabras[palabras.length - 1].length) palabras.push([]); return; }
          palabras[palabras.length - 1].push(d.createTextNode(p));
        });
      } else if (n.nodeType === 1) {
        palabras[palabras.length - 1].push(n.cloneNode(true));
      }
    });
    palabras = palabras.filter(function (w) { return w.length; });
    el.textContent = '';
    var spans = palabras.map(function (w, i) {
      var s = d.createElement('span'); s.style.display = 'inline-block';
      w.forEach(function (x) { s.appendChild(x); });
      el.appendChild(s);
      if (i < palabras.length - 1) el.appendChild(d.createTextNode(' '));
      return s;
    });
    var lineas = [], top = null;
    spans.forEach(function (s) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lineas.push([]); top = t; }
      lineas[lineas.length - 1].push(s);
    });
    el.textContent = '';
    lineas.forEach(function (l, i) {
      if (i) el.appendChild(d.createTextNode(' ')); // el espacio entre líneas: que el texto no se lea «minutosy»
      var ln = d.createElement('span'); ln.className = 'linea';
      var inn = d.createElement('span'); inn.className = 'linea__in';
      inn.style.setProperty('--d', (i * 120) + 'ms');
      l.forEach(function (s, k) {
        if (k) inn.appendChild(d.createTextNode(' '));
        while (s.firstChild) inn.appendChild(s.firstChild);
      });
      ln.appendChild(inn); el.appendChild(ln);
    });
    el.classList.add('is-partida');
    // Al terminar la entrada se devuelve el texto original: así text-wrap:balance vuelve a mandar si se gira el móvil
    el.__alEntrar = function () {
      var n = el.querySelectorAll('.linea__in').length;
      setTimeout(function () { el.innerHTML = el.__orig; el.__restaurada = true; }, 900 + Math.max(0, n - 1) * 120 + 150);
    };
    observar(el);
  }
  var frases = $$('[data-lineas]');
  if (frases.length) {
    var listo = false;
    var hecho = function () { if (listo) return; listo = true; frases.forEach(partir); };
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(hecho);
    setTimeout(hecho, 1600);
    // Si cambia el ancho antes de que la frase entre, se vuelve a partir con el ancho nuevo
    var anchoFrase = window.innerWidth, tFrase;
    window.addEventListener('resize', function () {
      if (window.innerWidth === anchoFrase) return;
      anchoFrase = window.innerWidth;
      clearTimeout(tFrase);
      tFrase = setTimeout(function () {
        frases.forEach(function (el) {
          if (!el.__orig || el.__restaurada || !el.classList.contains('is-partida')) return;
          el.innerHTML = el.__orig;
          if (el.classList.contains('is-in')) el.__restaurada = true; else partir(el);
        });
      }, 150);
    }, { passive: true });
  }

  /* ---------- Cifras que cuentan una vez (ease cúbica) ---------- */
  $$('[data-contar]').forEach(function (el) {
    var fin = Number(el.getAttribute('data-contar'));
    var lanzar = function () {
      el.classList.add('is-listo');
      if (reduce.matches) { el.textContent = fin; return; }
      var t0 = null, dur = 1500;
      var paso = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(fin * e);
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    if (reduce.matches) { el.classList.add('is-listo'); return; }
    el.textContent = '0';
    el.__alEntrar = lanzar;
    observar(el);
  });

  /* ---------- Parallax: scroll (6 %) y puntero (máx. 6 px) ---------- */
  var par = $$('[data-parallax]');
  var pendiente = false;
  // Tope del héroe: la escena nunca baja más que el hueco que la separa de la banda de cifras
  var topeHeroe = 0;
  function medirTope() {
    var e = $('[data-escena]'), b = $('.banda');
    topeHeroe = (e && b) ? Math.max(0, b.getBoundingClientRect().top - e.getBoundingClientRect().bottom - 6) : 0;
  }
  function moverScroll() {
    pendiente = false;
    var vh = window.innerHeight;
    par.forEach(function (el) {
      var heroe = el.hasAttribute('data-parallax-heroe');
      if (heroe && !escritorio.matches) { el.style.transform = ''; return; } // en el móvil la escena va encima del texto: quieta
      var caja = (el.closest('[data-parallax-marco]') || el.parentElement).getBoundingClientRect();
      if (caja.bottom < -200 || caja.top > vh + 200) return;
      var f = Number(el.getAttribute('data-parallax'));
      var y = heroe ? Math.min(window.scrollY * f, topeHeroe) : -((caja.top + caja.height / 2) - vh / 2) * f;
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    });
  }
  if (par.length) {
    window.addEventListener('scroll', function () {
      if (reduce.matches || pendiente) return;
      pendiente = true; requestAnimationFrame(moverScroll);
    }, { passive: true });
    medirTope();
    window.addEventListener('resize', function () { medirTope(); if (!reduce.matches) moverScroll(); }, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { medirTope(); if (!reduce.matches) moverScroll(); });
    if (!reduce.matches) moverScroll();
  }
  var escena = $('[data-escena]');
  if (escena) {
    var capas = $$('[data-prof]', escena), px = 0, py = 0, pend = false;
    var pintar = function () {
      pend = false;
      capas.forEach(function (c) {
        var k = Number(c.getAttribute('data-prof')) * 6;
        c.style.transform = 'translate3d(' + (px * k).toFixed(2) + 'px,' + (py * k).toFixed(2) + 'px,0)';
      });
    };
    var zona = escena.closest('.heroe') || escena;
    zona.addEventListener('pointermove', function (e) {
      if (reduce.matches || !finePointer.matches) return;
      var r = zona.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!pend) { pend = true; requestAnimationFrame(pintar); }
    }, { passive: true });
    zona.addEventListener('pointerleave', function () { px = 0; py = 0; if (!pend) { pend = true; requestAnimationFrame(pintar); } });
  }

  /* ---------- Las 10 familias: pestañas accesibles + indicador FLIP ---------- */
  var fam = $('[data-familias]');
  if (fam) {
    var lista = $('[data-familias-indice]', fam);
    var tabs = $$('a[data-fam]', lista);
    var paneles = tabs.map(function (t) { return d.getElementById(t.getAttribute('href').slice(1)); });
    var ind = d.createElement('span'); ind.className = 'familias__ind'; ind.setAttribute('aria-hidden', 'true');
    lista.appendChild(ind);
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-label', 'Familias de cartas');
    $$('li', lista).forEach(function (li) { li.setAttribute('role', 'presentation'); });
    var actual = -1;
    var colocar = function (t, animar) {
      var lr = lista.getBoundingClientRect(), r = t.getBoundingClientRect();
      var antes = ind.getBoundingClientRect();
      ind.style.width = r.width + 'px'; ind.style.height = r.height + 'px';
      ind.style.left = (r.left - lr.left + lista.scrollLeft) + 'px'; ind.style.top = (r.top - lr.top + lista.scrollTop) + 'px';
      ind.classList.add('is-listo');
      if (!animar || reduce.matches || !ind.animate || !antes.width) return;
      var dx = antes.left - r.left, dy = antes.top - r.top, sx = antes.width / r.width, sy = antes.height / r.height;
      ind.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
        { transform: 'none' }
      ], { duration: 560, easing: 'cubic-bezier(.22,.61,.36,1)' });
    };
    var elegir = function (i, foco, animar) {
      if (i === actual) return;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        paneles[j].hidden = !on;
      });
      actual = i;
      colocar(tabs[i], animar);
      if (foco) tabs[i].focus({ preventScroll: true });
      // En el móvil las fichas van en una fila que se desliza: la elegida se trae a la vista
      if (animar && lista.scrollWidth > lista.clientWidth + 1) {
        var lr = lista.getBoundingClientRect(), tr = tabs[i].getBoundingClientRect();
        if (tr.left < lr.left + 16 || tr.right > lr.right - 16) lista.scrollBy({ left: tr.left - lr.left - 16, behavior: reduce.matches ? 'auto' : 'smooth' });
      }
      if (animar && !reduce.matches) {
        $$('.rejilla-cartas > li', paneles[i]).forEach(function (li, k) {
          li.classList.remove('carta-entra');
          li.style.setProperty('--d', Math.min(k * 40, 600) + 'ms');
          void li.offsetWidth; li.classList.add('carta-entra');
        });
      }
    };
    tabs.forEach(function (t, i) {
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', paneles[i].id);
      t.id = 'tab-' + paneles[i].id;
      paneles[i].setAttribute('role', 'tabpanel');
      paneles[i].setAttribute('aria-labelledby', t.id);
      paneles[i].setAttribute('tabindex', '0');
      t.addEventListener('click', function (e) { e.preventDefault(); elegir(i, false, true); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = e.key, j = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % n;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + n) % n;
        else if (k === 'Home') j = 0; else if (k === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); elegir(j, true, true); }
      });
    });
    elegir(0, false, false);
    var cajaPaneles = $('[data-familias-paneles]', fam); if (cajaPaneles) cajaPaneles.classList.add('is-listo');
    var reColocar = function () { if (actual > -1) colocar(tabs[actual], false); };
    window.addEventListener('resize', reColocar, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(reColocar);
  }

  /* ---------- Pruébalo: ¿Dónde está la carta? ---------- */
  var juego = $('[data-juego]');
  if (juego) {
    var baraja = JSON.parse($('[data-baraja]', juego).textContent);
    var ruta = juego.getAttribute('data-ruta');
    var huecos = $$('.juego__carta', juego);
    var preg = $('[data-pregunta]', juego), estado = $('[data-estado]', juego);
    var bVuelta = $('[data-vuelta]', juego), bOtra = $('[data-otra]', juego);
    var mano = [], buscada = null, fase = 'mirar', repartiendo = false;
    // «Dar la vuelta» se desactiva con aria-disabled y no con disabled: así no pierde el foco del teclado
    var activo = function (b, on) { b.setAttribute('aria-disabled', on ? 'false' : 'true'); };
    var pos = ['a la izquierda', 'en el centro', 'a la derecha'];
    var mayus = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    var espera = function (ms) { return new Promise(function (r) { setTimeout(r, reduce.matches ? Math.min(ms, 350) : ms); }); };
    var barajar = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var pintarCarta = function (h, c) {
      var cara = $('.carta__cara', h);
      cara.style.setProperty('--c', c.color);
      var img = $('img', cara); img.src = ruta + c.svg;
      $('.carta__nombre', cara).textContent = c.nombre;
    };
    var voltear = function (h, abajo) { h.classList.toggle('is-abajo', abajo); };
    var etiquetar = function () {
      huecos.forEach(function (h, i) {
        var abajo = h.classList.contains('is-abajo');
        h.setAttribute('aria-label', abajo ? 'Carta boca abajo, ' + pos[i] : 'Carta: ' + mano[i].nombre.toLowerCase() + ', ' + pos[i]);
      });
    };
    var repartir = async function (primera) {
      fase = 'mirar'; repartiendo = true;
      var teniaFoco = !primera && juego.contains(d.activeElement);
      bVuelta.hidden = false; activo(bVuelta, false);
      if (teniaFoco) bVuelta.focus({ preventScroll: true }); // el foco pasa a «Dar la vuelta» antes de esconder «Otra vez»
      bOtra.hidden = true;
      huecos.forEach(function (h) { h.disabled = true; h.classList.remove('is-bien'); });
      if (!primera) { huecos.forEach(function (h) { voltear(h, true); }); await espera(700); }
      if (primera) {
        // La primera mano son las cartas que ya vienen en el HTML: no se cambia ningún src ni se descarga nada al cargar
        mano = huecos.map(function (h) { var s = $('img', h).getAttribute('src'); return baraja.filter(function (c) { return s.slice(-c.svg.length) === c.svg; })[0]; });
        if (mano.some(function (c) { return !c; })) { mano = barajar(baraja).slice(0, 3); huecos.forEach(function (h, i) { pintarCarta(h, mano[i]); }); }
      } else {
        mano = barajar(baraja).slice(0, 3);
        huecos.forEach(function (h, i) { pintarCarta(h, mano[i]); });
      }
      if (!primera) {
        for (var i = 0; i < huecos.length; i++) { voltear(huecos[i], false); await espera(120); }
      }
      preg.textContent = 'Mira bien estas tres cartas.';
      estado.textContent = 'Cuando las tengas, dales la vuelta.';
      etiquetar();
      activo(bVuelta, true); repartiendo = false;
    };
    var ocultar = async function () {
      if (fase !== 'mirar' || repartiendo) return;
      fase = 'buscar';
      activo(bVuelta, false);
      for (var i = 0; i < huecos.length; i++) { voltear(huecos[i], true); await espera(110); }
      await espera(500);
      buscada = Math.floor(Math.random() * 3);
      var c = mano[buscada];
      preg.textContent = '¿Dónde está ' + c.art + ' ' + c.nombre.toLowerCase() + '?';
      estado.textContent = 'Toca la carta que creas.';
      bVuelta.hidden = true;
      huecos.forEach(function (h) { h.disabled = false; });
      etiquetar();
      huecos[0].focus({ preventScroll: true });
    };
    var responder = async function (i) {
      if (fase !== 'buscar') return;
      fase = 'fin';
      huecos.forEach(function (h) { h.disabled = true; });
      var c = mano[buscada];
      voltear(huecos[i], false);
      await espera(650);
      if (i === buscada) {
        huecos[i].classList.add('is-bien');
        preg.textContent = '¡Muy bien!';
        estado.textContent = mayus(c.art) + ' ' + c.nombre.toLowerCase() + ' estaba ' + pos[i] + '.';
      } else {
        var o = mano[i];
        preg.textContent = '¡Casi!';
        estado.textContent = 'Esa carta es ' + o.art + ' ' + o.nombre.toLowerCase() + '. ' + mayus(c.art) + ' ' + c.nombre.toLowerCase() + ' estaba ' + pos[buscada] + '.';
        await espera(350);
        voltear(huecos[buscada], false);
        huecos[buscada].classList.add('is-bien');
      }
      await espera(300);
      huecos.forEach(function (h) { voltear(h, false); });
      etiquetar();
      bOtra.hidden = false;
      bOtra.focus({ preventScroll: true });
    };
    huecos.forEach(function (h, i) { h.addEventListener('click', function () { responder(i); }); });
    bVuelta.addEventListener('click', ocultar);
    bOtra.addEventListener('click', function () { repartir(false); });
    juego.classList.add('is-listo');
    repartir(true);
  }

  /* ---------- Vídeo: fachada ligera, YouTube sin cookies solo al pulsar ---------- */
  $$('[data-video]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = a.getAttribute('data-video');
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      f.title = a.getAttribute('data-titulo') || 'Vídeo de YouTube';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      a.parentNode.replaceChild(f, a);
      f.focus();
    });
  });

  /* ---------- Galería de compra: miniaturas que desplazan la pista ---------- */
  var gal = $('[data-galeria]');
  if (gal) {
    var pista = $('.galeria__pista', gal), fotos = $$('.galeria__foto', gal), minis = $$('.galeria__mini', gal);
    var marcar = function (i) { minis.forEach(function (m, j) { m.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); };
    minis.forEach(function (m, i) {
      m.addEventListener('click', function () {
        pista.scrollTo({ left: fotos[i].offsetLeft - pista.offsetLeft, behavior: reduce.matches ? 'auto' : 'smooth' });
        marcar(i);
      });
    });
    if (hasIO) {
      var gio = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) marcar(fotos.indexOf(e.target)); });
      }, { root: pista, threshold: 0.6 });
      fotos.forEach(function (f) { gio.observe(f); });
    }
  }

  /* ---------- Compra: Storefront API (cartCreate) y salto al checkout ---------- */
  var TIENDA = {
    api: 'https://k54s1v-0k.myshopify.com/api/2026-07/graphql.json',
    token: '3b39e06e91d9bc5b5be03dcf33f69f6b', // token público de Storefront (solo lectura y carrito)
    variante: 'gid://shopify/ProductVariant/57204503085381',
    ficha: 'https://tienda.eddy.es/products/pinkeddy'
  };
  var precio = Number(d.body.getAttribute('data-precio-eur')) || 24.9;
  var demo = d.body.hasAttribute('data-demo');
  function gql(query, variables, ms) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms || 8000) : null;
    return fetch(TIENDA.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TIENDA.token },
      body: JSON.stringify({ query: query, variables: variables || {} }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { if (t) clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  var fijarPrecio = null;
  var form = $('[data-compra]');
  if (form) {
    var input = $('input[name=cantidad]', form), menos = $('[data-menos]', form), mas = $('[data-mas]', form);
    var boton = $('[data-comprar]', form), total = $('[data-total]', form), est = $('[data-estado-compra]', form), desc = $('#compra-desc');
    var fijar = function (n) {
      n = Math.max(1, Math.min(5, Math.round(Number(n) || 1)));
      // aria-disabled y no disabled: al llegar a 1 o a 5 el botón conserva el foco del teclado
      input.value = n; menos.setAttribute('aria-disabled', n <= 1 ? 'true' : 'false'); mas.setAttribute('aria-disabled', n >= 5 ? 'true' : 'false');
      total.textContent = euros(precio * n);
      if (desc) desc.textContent = n + (n === 1 ? ' caja' : ' cajas') + '. El pago se hace en la tienda oficial, tienda.eddy.es.';
      return n;
    };
    menos.addEventListener('click', function () { if (menos.getAttribute('aria-disabled') !== 'true') fijar(Number(input.value) - 1); });
    mas.addEventListener('click', function () { if (mas.getAttribute('aria-disabled') !== 'true') fijar(Number(input.value) + 1); });
    fijarPrecio = fijar;
    input.addEventListener('change', function () { fijar(input.value); });
    fijar(1);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = fijar(input.value);
      if (demo) {
        // Demo pública: no crea carritos en la tienda real, solo lleva a la ficha
        est.textContent = 'Te llevamos a la ficha de la tienda oficial. Allí eliges ' + (n === 1 ? '1 caja.' : n + ' cajas.');
        setTimeout(function () { window.location.href = TIENDA.ficha; }, 900);
        return;
      }
      boton.disabled = true; boton.classList.add('is-cargando'); boton.setAttribute('aria-busy', 'true');
      var txt = $('[data-btn-txt]', boton), antes = txt.textContent;
      txt.textContent = 'Abriendo la tienda…';
      est.textContent = 'Preparando tu carrito en la tienda oficial…';
      gql('mutation Crear($lines:[CartLineInput!]!) @inContext(country: ES, language: ES) { cartCreate(input:{lines:$lines}) { cart { checkoutUrl } userErrors { message } } }',
        { lines: [{ merchandiseId: TIENDA.variante, quantity: n }] })
        .then(function (r) {
          var c = r && r.data && r.data.cartCreate;
          if (!c || !c.cart || !c.cart.checkoutUrl || (c.userErrors && c.userErrors.length)) throw new Error('sin checkout');
          window.location.href = c.cart.checkoutUrl;
        })
        .catch(function () {
          est.textContent = 'No hemos podido preparar el carrito. Te llevamos a la ficha de la tienda.';
          setTimeout(function () { window.location.href = TIENDA.ficha; }, 1200);
        })
        .finally(function () {
          setTimeout(function () { boton.disabled = false; boton.classList.remove('is-cargando'); boton.removeAttribute('aria-busy'); txt.textContent = antes; }, 4000);
        });
    });
  }
  // Precio y disponibilidad confirmados con la tienda al acercarse a un precio (una lectura, sin carrito).
  // En la portada se espera a la ficha de compra; en las subpáginas, al cierre con el precio. La barra fija no cuenta.
  var precios = $$('[data-precio]').filter(function (el) { return !el.closest('[data-barra]'); });
  var vigiladosPrecio = $('#comprar') ? [$('#comprar')] : precios;
  if (vigiladosPrecio.length && hasIO) {
    var pio = new IntersectionObserver(function (ents) {
      if (!ents.some(function (x) { return x.isIntersecting; })) return;
      pio.disconnect();
      gql('query($id:ID!){ node(id:$id){ ... on ProductVariant { availableForSale price { amount } } } }', { id: TIENDA.variante }, 6000)
        .then(function (r) {
          var v = r && r.data && r.data.node; if (!v) return;
          var p = Number(v.price.amount);
          if (p && Math.abs(p - precio) > 0.001) {
            precio = p;
            $$('[data-precio]').forEach(function (el) { el.textContent = euros(p); });
            if (fijarPrecio) fijarPrecio($('input[name=cantidad]').value);
          }
          var boton = $('[data-comprar]');
          if (v.availableForSale === false && boton) {
            boton.disabled = true; $('[data-btn-txt]', boton).textContent = 'Agotado por ahora';
            $('[data-estado-compra]').textContent = 'Escríbenos a hola@eddy.es y te avisamos cuando vuelva.';
          }
        }).catch(function () {});
    }, { rootMargin: '600px 0px' });
    vigiladosPrecio.forEach(function (el) { pio.observe(el); });
  }

  /* ---------- Barra de compra fija (móvil): aparece al pasar el héroe ---------- */
  // En el móvil solo hay un «Comprar» a la vista: el del héroe, el de la barra, el de la ficha (o el cierre
  // de las subpáginas) o, si no hay ninguno, el de la cabecera
  var barra = $('[data-barra]'), cabComprar = $('[data-comprar-cab]'), ctaHeroe = $('[data-cta-heroe]');
  if (hasIO && (barra || cabComprar)) {
    var vis = { heroe: true, compra: false, pie: false };
    var comprasVistas = [];
    var aplicar = function () {
      var on = !!barra && !vis.heroe && !vis.compra && !vis.pie;
      if (barra) {
        barra.classList.toggle('is-visible', on);
        if (on) { barra.removeAttribute('inert'); barra.removeAttribute('aria-hidden'); }
        else { barra.setAttribute('inert', ''); barra.setAttribute('aria-hidden', 'true'); }
      }
      if (cabComprar) cabComprar.toggleAttribute('data-oculto', on || vis.compra || (!!ctaHeroe && vis.heroe));
    };
    var vigilar = function (el, k) {
      if (!el) return;
      new IntersectionObserver(function (e) { vis[k] = e[0].isIntersecting; aplicar(); }).observe(el);
    };
    // En la portada manda el CTA del héroe; en las subpáginas, el bloque del titular (en /juegos/ la lista de juegos va dentro)
    vigilar(ctaHeroe || $('[data-heroe] .pag-cab__rejilla') || $('[data-heroe] h1') || $('[data-heroe]'), 'heroe'); vigilar($('.pie'), 'pie');
    // Cuenta el botón de compra en sí (no toda la sección): mientras se ve la galería, la barra sigue
    var compras = $$('[data-comprar], [data-cta-compra]');
    if (compras.length) {
      var cio = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          var k = comprasVistas.indexOf(e.target);
          if (e.isIntersecting && k < 0) comprasVistas.push(e.target); else if (!e.isIntersecting && k > -1) comprasVistas.splice(k, 1);
        });
        vis.compra = comprasVistas.length > 0; aplicar();
      });
      compras.forEach(function (el) { cio.observe(el); });
    }
    aplicar();
  }

  /* ---------- Juegos: filtro por objetivo ---------- */
  var filtros = $$('[data-filtro]');
  if (filtros.length) {
    var filas = $$('[data-objetivos]');
    var aviso = $('[data-filtro-estado]');
    var filtrar = function (obj, boton) {
      filtros.forEach(function (b) { b.setAttribute('aria-pressed', b === boton ? 'true' : 'false'); });
      var n = 0;
      filas.forEach(function (f, i) {
        var ok = obj === 'todos' || f.getAttribute('data-objetivos').split(' ').indexOf(obj) > -1;
        f.classList.toggle('is-oculta', !ok);
        if (ok) {
          n++;
          if (!reduce.matches) { f.classList.remove('carta-entra'); f.style.setProperty('--d', Math.min(n * 60, 480) + 'ms'); void f.offsetWidth; f.classList.add('carta-entra'); }
        }
      });
      if (aviso) aviso.textContent = obj === 'todos' ? 'Se ven los 14 juegos.' : (n === 1 ? 'Se ve 1 juego.' : 'Se ven ' + n + ' juegos.');
    };
    filtros.forEach(function (b) { b.addEventListener('click', function () { filtrar(b.getAttribute('data-filtro'), b); }); });
  }
})();
