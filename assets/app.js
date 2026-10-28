/* Prevención del dengue | UNGET Rioja
   Toda la página se arma desde window.DATOS (data/datos.js), que genera herramientas/actualizar.py. */
(function () {
  'use strict';
  var D = window.DATOS;
  if (!D) { document.getElementById('contenido').insertAdjacentHTML('afterbegin', '<p class="marco">No se pudieron cargar los datos.</p>'); return; }

  // ------------------------------------------------------------ utilidades
  var MESES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  var MES_C = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  var ESP = ' '; // espacio fino para miles
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function nf(n, dec) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var s = Number(n).toFixed(dec || 0).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ESP);
    return s.length > 1 ? s[0] + ',' + s[1] : s[0];
  }
  function kg(g) { var k = g / 1000; return k < 0.1 ? nf(k, 2) : nf(k, 1); }
  function tn(t) { return Number.isInteger(t) ? nf(t) : (t < 1 ? nf(t, 2) : nf(t, 1)); }
  function pct(a, b, dec) { return b ? nf(100 * a / b, dec === undefined ? 1 : dec) + ' %' : '—'; }
  function fechaLarga(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? (+p[2]) + ' de ' + MESES[+p[1]] + ' de ' + p[0] : MESES[+p[1]] + ' de ' + p[0];
  }
  function fechaCorta(iso) { var p = (iso || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MES_C[+p[1]] : ''; }
  function mesDe(iso) { return iso ? +iso.split('-')[1] : null; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function sumar(arr, f) { var t = 0; arr.forEach(function (x) { t += (typeof f === 'function' ? f(x) : x[f]) || 0; }); return t; }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (k) { if (k !== null && k !== undefined) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }
  function $(id) { return document.getElementById(id); }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
  function titulo(s) {
    var minus = ['de', 'del', 'y', 'e', 'en'], art = ['la', 'las', 'los', 'el'], romanos = /^(i|ii|iii|iv|v|vi)$/i;
    var partes = s.toLowerCase().split(/(\s+|\/|-|,)/), previa = '';
    return partes.map(function (w, i) {
      if (!w.trim() || /^(\/|-|,)$/.test(w)) return w;
      var r;
      if (romanos.test(w)) r = w.toUpperCase();
      else if (i > 0 && minus.indexOf(w) >= 0) r = w;
      else if (i > 0 && art.indexOf(w) >= 0 && (previa === 'de' || previa === 'del')) r = w;
      else r = w.charAt(0).toUpperCase() + w.slice(1);
      previa = w;
      return r;
    }).join('');
  }
  function proporcion(p) {
    if (p >= 75) return 'Tres de cada cuatro';
    if (p >= 60) return 'Seis de cada diez';
    if (p > 52) return 'Más de la mitad de las';
    if (p >= 48) return 'La mitad de las';
    if (p >= 38) return 'Casi la mitad de las';
    if (p >= 30) return 'Un tercio de las';
    if (p >= 22) return 'Una de cada cuatro';
    if (p >= 15) return 'Una de cada cinco';
    return 'Pocas';
  }
  var DIST = {}; D.distritos.forEach(function (d) { DIST[d.id] = d; });
  var ORDEN_D = {}; D.distritos.forEach(function (d, i) { ORDEN_D[d.id] = i; });
  var TIPOS = [
    { id: 'Recojo de criaderos', c: '#2a78d6' },
    { id: 'Escuelas', c: '#eb6834' },
    { id: 'Autoridades y comités', c: '#1baf7a' },
    { id: 'Familias y comunidad', c: '#eda100' },
    { id: 'Vacunación', c: '#e87ba4' },
    { id: 'Capacitación del personal', c: '#008300' }
  ];
  var COLOR_TIPO = {}; TIPOS.forEach(function (t) { COLOR_TIPO[t.id] = t.c; });

  // ------------------------------------------------------------ estado
  var params = new URLSearchParams(location.search);
  var sel = DIST[params.get('distrito')] ? params.get('distrito') : 'todos';
  var filtroTipo = 'todos', filtroEvid = 'todos', verTodas = false;

  function filtrar(arr, incluirGeneral) {
    return arr.filter(function (x) { return sel === 'todos' || x.d === sel || (incluirGeneral && x.d === 'todos'); });
  }
  function nombreSel() { return sel === 'todos' ? 'toda la jurisdicción' : DIST[sel].nombre; }
  function lugarFrase() {
    if (sel === 'todos') return 'toda la jurisdicción';
    if (sel === 'moyobamba') return 'los centros poblados Valle de la Conquista y Atumplaya (Moyobamba)';
    return 'el distrito de ' + DIST[sel].nombre;
  }
  function nombreDistrito(id) { return id === 'todos' ? 'Toda la jurisdicción' : (DIST[id] ? DIST[id].nombre : ''); }

  // ------------------------------------------------------------ tooltip
  var tip = $('tooltip');
  function mostrarTip(target, valor, lineas) {
    vaciar(tip);
    tip.appendChild(el('strong', { text: valor }));
    lineas.forEach(function (l) { if (l) tip.appendChild(el('span', { text: l })); });
    tip.hidden = false;
    var r = target.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = Math.min(Math.max(8, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - 8);
    var y = r.top - th - 8; if (y < 8) y = r.bottom + 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function ocultarTip() { tip.hidden = true; }
  function conTip(nodo, valor, lineas) {
    nodo.addEventListener('pointerenter', function () { mostrarTip(nodo, valor, lineas); });
    nodo.addEventListener('pointerleave', ocultarTip);
    nodo.addEventListener('focus', function () { mostrarTip(nodo, valor, lineas); });
    nodo.addEventListener('blur', ocultarTip);
  }
  window.addEventListener('scroll', ocultarTip, { passive: true });

  // ------------------------------------------------------------ visor de fotos
  var visor = $('visor');
  function abrirFoto(foto, pie) {
    $('visor-img').src = foto.src;
    $('visor-img').alt = pie;
    $('visor-pie').textContent = pie;
    if (visor.showModal) visor.showModal(); else window.open(foto.src, '_blank');
  }
  visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
  function botonFoto(foto, pie) {
    var img = el('img', { src: foto.th, alt: pie, loading: 'lazy', decoding: 'async', width: 560, height: Math.round(560 * foto.h / foto.w) });
    return el('button', { type: 'button', class: 'foto-boton', 'aria-label': 'Ampliar foto: ' + pie, onclick: function () { abrirFoto(foto, pie); } }, [img]);
  }

  // ------------------------------------------------------------ gráficos (svg)
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function barraRedondeada(x, y, w, h, r) {
    // extremo de dato redondeado (4px), base recta
    r = Math.min(r, w, h / 2);
    if (w <= 0) return '';
    return 'M' + x + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) +
      'V' + (y + h - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + 'H' + x + 'Z';
  }

  function barrasH(cont, items, opts) {
    vaciar(cont);
    opts = opts || {};
    if (!items.length) { cont.appendChild(el('p', { class: 'nota-vacia', text: opts.vacio || 'Sin datos registrados.' })); return; }
    var W = Math.max(300, cont.clientWidth || 600);
    var etqW = Math.min(opts.etqW || 200, Math.round(W * 0.42));
    var fila = 32, barH = 16, top = 4;
    var H = top + items.length * fila;
    var max = opts.max || Math.max.apply(null, items.map(function (i) { return i.valor; })) || 1;
    var valW = 64, area = W - etqW - valW - 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': opts.titulo || '' });
    svg.appendChild(svgEl('line', { x1: etqW, x2: etqW, y1: 0, y2: H, stroke: '#b7c3ca', 'stroke-width': 1 }));
    items.forEach(function (it, i) {
      var y = top + i * fila, w = Math.max(2, area * it.valor / max);
      var g = svgEl('g', { class: 'marca', tabindex: 0 });
      var etq = svgEl('text', { x: etqW - 10, y: y + barH / 2 + 5, 'text-anchor': 'end', class: 'eje' });
      etq.textContent = it.etq;
      g.appendChild(etq);
      g.appendChild(svgEl('rect', { class: 'foco', x: 0, y: y - 6, width: W, height: fila, fill: 'transparent', rx: 4 }));
      g.appendChild(svgEl('path', { class: 'dato', d: barraRedondeada(etqW + 1, y, w, barH, 4), fill: opts.color || '#2a78d6' }));
      var v = svgEl('text', { x: etqW + 1 + w + 8, y: y + barH / 2 + 5, class: 'valor' });
      v.textContent = it.texto;
      g.appendChild(v);
      conTip(g, it.texto, [it.etq].concat(it.extra || []));
      svg.appendChild(g);
    });
    var caja = el('div', { class: 'grafico' });
    caja.appendChild(svg);
    cont.appendChild(caja);
  }

  function barrasApiladas(cont, filas, series) {
    vaciar(cont);
    if (!filas.length) return;
    var W = Math.max(300, cont.clientWidth || 600);
    var etqW = Math.min(230, Math.round(W * 0.42)), fila = 40, barH = 16, top = 4, valW = 58;
    var H = top + filas.length * fila;
    var area = W - etqW - valW;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Resultado de las visitas por cerco' });
    filas.forEach(function (f, i) {
      var y = top + i * fila;
      var t1 = svgEl('text', { x: etqW - 10, y: y + 9, 'text-anchor': 'end', class: 'eje' }); t1.textContent = f.etq;
      var t2 = svgEl('text', { x: etqW - 10, y: y + 25, 'text-anchor': 'end', class: 'eje', style: 'font-size:12px;fill:#66737b' }); t2.textContent = f.sub;
      svg.appendChild(t1); svg.appendChild(t2);
      var x = etqW, total = f.valores.reduce(function (a, b) { return a + b; }, 0) || 1;
      f.valores.forEach(function (v, k) {
        var w = area * v / total;
        if (w <= 0) return;
        var g = svgEl('g', { class: 'marca', tabindex: 0 });
        var gap = k < f.valores.length - 1 ? 2 : 0;
        var esUltimo = f.valores.slice(k + 1).every(function (z) { return !z; });
        g.appendChild(svgEl(esUltimo ? 'path' : 'rect', esUltimo
          ? { class: 'dato', d: barraRedondeada(x, y + 4, Math.max(1, w), barH, 4), fill: series[k].c }
          : { class: 'dato', x: x, y: y + 4, width: Math.max(1, w - gap), height: barH, fill: series[k].c }));
        conTip(g, nf(100 * v / total, 1) + ' %', [series[k].n, nf(v) + ' visitas', f.etq + ', ' + f.sub]);
        svg.appendChild(g);
        x += w;
      });
      var val = svgEl('text', { x: etqW + area + 8, y: y + 17, class: 'valor' });
      val.textContent = nf(100 * (total - f.valores[0]) / total, 0) + ' %';
      svg.appendChild(val);
    });
    var caja = el('div', { class: 'grafico' }); caja.appendChild(svg); cont.appendChild(caja);
  }

  // ------------------------------------------------------------ tablas
  function tabla(cols, filas, pie, leyenda) {
    var t = el('table');
    if (leyenda) t.appendChild(el('caption', { text: leyenda }));
    var tr = el('tr');
    cols.forEach(function (c) { tr.appendChild(el('th', { scope: 'col', class: c.num ? 'num' : null, text: c.t })); });
    t.appendChild(el('thead', null, [tr]));
    var tb = el('tbody');
    filas.forEach(function (f) {
      var r = el('tr');
      f.forEach(function (v, i) {
        var td = el('td', { class: cols[i].num ? 'num' : null });
        if (v instanceof Node) td.appendChild(v); else td.textContent = v === null || v === undefined ? '' : v;
        r.appendChild(td);
      });
      tb.appendChild(r);
    });
    t.appendChild(tb);
    if (pie) {
      var rp = el('tr');
      pie.forEach(function (v, i) { rp.appendChild(el('td', { class: cols[i].num ? 'num' : null, text: v })); });
      t.appendChild(el('tfoot', null, [rp]));
    }
    return t;
  }
  function celdaDoble(a, b) { return el('span', null, [a, b ? el('span', { class: 'sub', text: b }) : null]); }

  // ------------------------------------------------------------ portada
  function animarCifra(nodo, final, formato) {
    var ini = parseFloat(nodo.getAttribute('data-v') || '0');
    nodo.setAttribute('data-v', final);
    if (reducido || ini === final) { nodo.firstChild.nodeValue = formato(final); return; }
    var t0 = null, dur = 450;
    function paso(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      nodo.firstChild.nodeValue = formato(ini + (final - ini) * e);
      if (k < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  function renderPortada() {
    $('libro-titulo').textContent = sel === 'todos' ? 'En toda la jurisdicción, de enero a octubre' : 'En ' + DIST[sel].nombre + (DIST[sel].nota ? ' (' + DIST[sel].nota + ')' : '') + ', de enero a octubre';
    var cl = filtrar(D.control), vg = filtrar(D.vigilancia), nb = filtrar(D.nebulizacion), rc = filtrar(D.recojos);
    var ie = filtrar(D.concurso).filter(function (c) { return c.participo; });
    var com = filtrar(D.comites);
    var caps = filtrar(D.capacitaciones.docentes).concat(filtrar(D.capacitaciones.lideres), filtrar(D.capacitaciones.agentes));
    var locs = {}; cl.forEach(function (c) { locs[c.loc] = 1; });
    var filas = [];
    if (cl.length) filas.push({ v: sumar(cl, 'vi'), f: function (x) { return nf(Math.round(x)); }, t: 'viviendas inspeccionadas casa por casa en control larvario',
      s: cl.length + (cl.length === 1 ? ' intervención' : ' intervenciones') + ' en ' + Object.keys(locs).length + (Object.keys(locs).length === 1 ? ' localidad' : ' localidades') });
    if (vg.length) filas.push({ v: vg.length, f: function (x) { return nf(Math.round(x)); }, t: vg.length === 1 ? 'muestreo de vigilancia entomológica' : 'muestreos de vigilancia entomológica',
      s: nf(sumar(vg, 'vi')) + ' viviendas revisadas en busca de larvas' });
    if (nb.length) filas.push({ v: nb.length, f: function (x) { return nf(Math.round(x)); }, t: nb.length === 1 ? 'cerco con nebulización espacial' : 'cercos con nebulización espacial',
      s: 'alrededor de viviendas con casos, en tres vueltas' });
    if (rc.length) filas.push({ v: sumar(rc, 't'), f: function (x) { return tn(Math.round(x * 10) / 10); }, u: 't', t: 'de criaderos retirados en campañas de recojo',
      s: rc.length + (rc.length === 1 ? ' campaña' : ' campañas') + ' con municipios, brigadas y vecinos' });
    if (com.length) filas.push({ v: com.length, f: function (x) { return nf(Math.round(x)); }, t: com.length === 1 ? 'comité de vigilancia comunitaria' : 'comités de vigilancia comunitaria',
      s: sumar(com, 'integrantes') + ' vecinos vigilan que se eliminen los criaderos' });
    if (ie.length) filas.push({ v: sumar(ie, 'kg'), f: function (x) { return nf(Math.round(x)); }, u: 'kg', t: 'de criaderos reunidos por escuelas',
      s: ie.length + (ie.length === 1 ? ' institución educativa' : ' instituciones educativas') + ' en el concurso Al cole seguro' });
    if (caps.length) filas.push({ v: sumar(caps, 'n'), f: function (x) { return nf(Math.round(x)); }, t: 'asistencias a capacitaciones y sensibilizaciones',
      s: 'docentes, estudiantes, líderes, agentes comunitarios y padres' });

    var cont = $('libro');
    var previas = {};
    Array.prototype.forEach.call(cont.querySelectorAll('.libro__cifra'), function (n) { previas[n.getAttribute('data-k')] = n.getAttribute('data-v'); });
    vaciar(cont);
    if (!filas.length) { cont.appendChild(el('p', { class: 'libro__vacio', text: 'Aún no hay actividades registradas para este distrito.' })); return; }
    if (!cl.length && !vg.length) cont.appendChild(el('p', { class: 'libro__vacio', text: 'Los formatos de control vectorial de 2026 no registran intervenciones en ' + DIST[sel].nombre + '; se muestran las acciones de promoción de la salud.' }));
    filas.forEach(function (f) {
      var cifra = el('span', { class: 'libro__cifra', 'data-k': f.t, 'data-v': previas[f.t] || 0 }, [f.f(previas[f.t] || 0)]);
      if (f.u) cifra.appendChild(el('small', { text: f.u }));
      cont.appendChild(el('div', { class: 'libro__fila' }, [cifra, el('span', { class: 'libro__txt' }, [f.t, el('span', { text: f.s })])]));
      animarCifra(cifra, f.v, f.f);
    });
  }

  function renderSelector() {
    var cont = vaciar($('distritos')), s = vaciar($('distrito-select'));
    [{ id: 'todos', nombre: 'Toda la jurisdicción' }].concat(D.distritos).forEach(function (d) {
      cont.appendChild(el('button', { type: 'button', 'aria-pressed': String(sel === d.id), onclick: function () { cambiar(d.id); } }, [d.id === 'moyobamba' ? 'Moyobamba (CC.PP.)' : d.nombre]));
      s.appendChild(el('option', { value: d.id, selected: sel === d.id ? 'selected' : null, text: d.id === 'moyobamba' ? 'Moyobamba (CC.PP.)' : d.nombre }));
    });
  }

  // ------------------------------------------------------------ hallazgos
  function claseIA(ia) {
    if (ia < 1) return ['bajo', 'riesgo bajo'];
    if (ia <= 2) return ['medio', 'riesgo mediano'];
    if (ia <= 4) return ['alto1', 'riesgo alto'];
    if (ia <= 7) return ['alto2', 'riesgo alto'];
    return ['alto3', 'riesgo alto'];
  }
  function renderIA() {
    var vg = filtrar(D.vigilancia);
    var grilla = vaciar($('ia-grilla')), tablaIA = vaciar($('ia-tabla'));
    var leyenda = vaciar($('ia-leyenda'));
    [['bajo', 'Bajo, menos de 1 %'], ['medio', 'Mediano, de 1 a 2 %'], ['alto1', 'Alto, más de 2 a 4 %'], ['alto2', 'de 4 a 7 %'], ['alto3', 'más de 7 %']].forEach(function (l) {
      var i = el('i'); i.className = 'celda--' + l[0]; leyenda.appendChild(el('span', null, [i, l[1]]));
    });
    $('bloque-ia').hidden = !vg.length;
    if (!vg.length) {
      $('ia-titulo').textContent = 'Sin muestreos de vigilancia entomológica';
      $('ia-texto').textContent = 'Los formatos de vigilancia de 2026 no registran muestreos en ' + lugarFrase() + '.';
      return;
    }
    var altos = vg.filter(function (v) { return v.ia > 2; }).length;
    var mx = vg.reduce(function (a, b) { return b.ia > a.ia ? b : a; });
    $('ia-titulo').textContent = altos === vg.length
      ? (vg.length === 1 ? 'El muestreo dio riesgo entomológico alto' : 'Todos los muestreos dieron riesgo entomológico alto')
      : altos + ' de ' + vg.length + ' muestreos dieron riesgo entomológico alto';
    $('ia-texto').textContent = 'En ' + altos + ' de ' + vg.length + ' muestreos de vigilancia el índice aédico superó el 2 %, el umbral de alto riesgo. El valor más alto fue ' +
      mx.loc + ' en ' + MESES[mx.mes] + ', con ' + nf(mx.ia, 1) + ' %: ' + mx.vp + ' de ' + mx.vi + ' viviendas tenían larvas.';

    var meses = []; var maxMes = Math.max.apply(null, D.vigilancia.map(function (v) { return v.mes; }));
    for (var m = 1; m <= maxMes; m++) meses.push(m);
    var filas = {};
    vg.forEach(function (v) {
      var k = v.d + '|' + v.loc;
      filas[k] = filas[k] || { d: v.d, loc: v.loc, m: {} };
      var c = filas[k].m[v.mes] = filas[k].m[v.mes] || { vi: 0, vp: 0, fechas: [] };
      c.vi += v.vi; c.vp += v.vp; c.fechas.push(v.fecha);
    });
    var lista = Object.keys(filas).map(function (k) { return filas[k]; }).sort(function (a, b) { return (ORDEN_D[a.d] - ORDEN_D[b.d]) || a.loc.localeCompare(b.loc, 'es'); });
    var t = el('table');
    t.appendChild(el('caption', { class: 'visualmente-oculto', text: 'Índice aédico por localidad y mes' }));
    var hr = el('tr', null, [el('th', { scope: 'col', text: 'Localidad' })]);
    meses.forEach(function (m) { hr.appendChild(el('th', { scope: 'col', text: cap(MES_C[m]) })); });
    t.appendChild(el('thead', null, [hr]));
    var tb = el('tbody');
    var filasTabla = [];
    lista.forEach(function (f) {
      var r = el('tr', null, [el('th', { scope: 'row' }, [f.loc, sel === 'todos' && DIST[f.d] && DIST[f.d].nombre !== f.loc ? el('span', { text: DIST[f.d].nombre }) : null])]);
      meses.forEach(function (m) {
        var c = f.m[m], td = el('td');
        if (c) {
          var ia = 100 * c.vp / c.vi, k = claseIA(ia);
          var celda = el('div', { class: 'celda celda--' + k[0], tabindex: 0, role: 'img',
            'aria-label': f.loc + ', ' + MESES[m] + ': índice aédico ' + nf(ia, 1) + ' %, ' + k[1] }, [nf(ia, 1)]);
          conTip(celda, nf(ia, 1) + ' %', [f.loc + ', ' + MESES[m], c.vp + ' de ' + nf(c.vi) + ' viviendas con larvas', cap(k[1])]);
          td.appendChild(celda);
          filasTabla.push([f.loc, nombreDistrito(f.d), cap(MESES[m]), nf(c.vi), nf(c.vp), nf(ia, 1) + ' %', cap(k[1])]);
        } else {
          td.appendChild(el('div', { class: 'celda celda--vacia', 'aria-label': 'Sin muestreo' }));
        }
        r.appendChild(td);
      });
      tb.appendChild(r);
    });
    t.appendChild(tb);
    grilla.appendChild(t);
    tablaIA.appendChild(el('div', { class: 'tabla-desliza' }, [tabla(
      [{ t: 'Localidad' }, { t: 'Distrito' }, { t: 'Mes' }, { t: 'Viviendas inspeccionadas', num: 1 }, { t: 'Con larvas', num: 1 }, { t: 'Índice aédico', num: 1 }, { t: 'Riesgo' }],
      filasTabla)]));
  }

  function renderRecipientes() {
    var dep = D.depositos.map(function () { return 0; });
    filtrar(D.control).concat(filtrar(D.vigilancia)).forEach(function (r) { r.dep.forEach(function (v, i) { dep[i] += v; }); });
    var total = dep.reduce(function (a, b) { return a + b; }, 0);
    $('bloque-recipientes').hidden = !total;
    if (!total) {
      $('rec-titulo').textContent = 'Sin recipientes con larvas registrados';
      $('rec-texto').textContent = 'No hay datos de control larvario ni de vigilancia para ' + lugarFrase() + '.';
      vaciar($('rec-grafico'));
      return;
    }
    var items = D.depositos.map(function (n, i) { return { etq: n, valor: 100 * dep[i] / total, texto: nf(100 * dep[i] / total, 1) + ' %', extra: [nf(dep[i]) + ' recipientes con larvas'] }; })
      .filter(function (i) { return i.valor > 0; }).sort(function (a, b) { return b.valor - a.valor; });
    var llantas = dep[5], baldes = dep[4], par = 100 * (llantas + baldes) / total;
    var deCada10 = Math.round(par / 10);
    $('rec-titulo').textContent = deCada10 >= 5
      ? 'Llantas, baldes, bateas y tinajas: ' + deCada10 + ' de cada 10 recipientes con larvas'
      : 'Dónde se cría el zancudo';
    $('rec-texto').textContent = 'De ' + nf(total) + ' recipientes con larvas, las llantas sumaron ' + nf(100 * llantas / total, 0) + ' % y los baldes, bateas y tinajas ' +
      nf(100 * baldes / total, 0) + ' %. Son recipientes que se pueden eliminar, voltear o tapar en casa, y por eso orientan los recojos y las visitas a familias.';
    barrasH($('rec-grafico'), items, { titulo: 'Recipientes con larvas por tipo', etqW: 190 });
  }

  function limpiarZona(z) {
    return titulo(z.replace(/^cerco\s*/i, '').replace(/^\(+|\)+$/g, '').replace(/\s*\/\s*/g, ' / ').replace(/\s+-\s+/g, ', ').replace(/\s{2,}/g, ' ')).replace(/\bZona\b/g, 'zona');
  }
  function resumenCerco(c) {
    var p = 0, n = 0, ce = 0, r = 0, de = 0;
    c.vueltas.forEach(function (v) { p += v.prog; n += v.neb; ce += v.cer; r += v.ren; de += v.des; });
    return { prog: p, neb: n, cer: ce, ren: r, des: de };
  }
  function renderAcceso() {
    var nb = filtrar(D.nebulizacion);
    var leg = vaciar($('acc-leyenda')), graf = vaciar($('acc-grafico'));
    $('bloque-acceso').hidden = !nb.length;
    if (!nb.length) {
      $('acc-titulo').textContent = 'Sin cercos de nebulización';
      $('acc-texto').textContent = 'No se registraron cercos con nebulización espacial en ' + lugarFrase() + '.';
      return;
    }
    var tot = { prog: 0, neb: 0, cer: 0, ren: 0, des: 0 };
    var filas = nb.map(function (c) {
      var s = resumenCerco(c);
      Object.keys(tot).forEach(function (k) { tot[k] += s[k]; });
      return { etq: limpiarZona(c.zona).slice(0, 34) + (limpiarZona(c.zona).length > 34 ? '…' : ''), sub: c.loc + ', ' + MESES[mesDe(c.vueltas[0].fecha)], valores: [s.neb, s.cer + s.des, s.ren] };
    });
    var sinAcceso = tot.cer + tot.des + tot.ren;
    var frase = proporcion(100 * sinAcceso / tot.prog);
    $('acc-titulo').textContent = frase + ' viviendas programadas no se ' + (/^Una de cada/.test(frase) ? 'pudo' : 'pudieron') + ' nebulizar';
    $('acc-texto').textContent = 'En ' + nb.length + (nb.length === 1 ? ' cerco' : ' cercos') + ', el ' + pct(sinAcceso, tot.prog, 0) + ' de las visitas programadas no pudo nebulizarse: ' +
      pct(tot.cer + tot.des, tot.prog, 0) + ' por viviendas cerradas o deshabitadas y ' + pct(tot.ren, tot.prog, 0) + ' porque los ocupantes no permitieron el ingreso. La sensibilización casa por casa y los comités vecinales ayudan a abrir esas puertas.';
    var series = [{ n: 'Nebulizadas', c: '#2a78d6' }, { n: 'Cerradas o deshabitadas', c: '#1baf7a' }, { n: 'No permitieron el ingreso', c: '#eb6834' }];
    series.forEach(function (s) { var i = el('i'); i.style.background = s.c; leg.appendChild(el('span', null, [i, s.n])); });
    leg.appendChild(el('span', { text: 'A la derecha: porcentaje sin nebulizar' }));
    barrasApiladas(graf, filas, series);
  }

  // ------------------------------------------------------------ control vectorial
  function renderControl() {
    var cl = filtrar(D.control);
    var cont = vaciar($('cl-tabla'));
    if (!cl.length) {
      $('cl-texto').textContent = 'No se registró control larvario en ' + lugarFrase() + ' en 2026.';
    } else {
      var por = {};
      cl.forEach(function (c) {
        var k = c.d + '|' + c.loc;
        var a = por[k] = por[k] || { d: c.d, loc: c.loc, n: 0, meses: [], vprog: 0, vi: 0, vp: 0, ri: 0, rp: 0, rt: 0, larv: 0 };
        a.n++; if (a.meses.indexOf(c.mes) < 0) a.meses.push(c.mes);
        a.vprog += c.vprog; a.vi += c.vi; a.vp += c.vp; a.ri += c.ri; a.rp += c.rp; a.rt += c.rtf + c.rtq; a.larv += c.larv;
      });
      var lista = Object.keys(por).map(function (k) { return por[k]; }).sort(function (a, b) { return b.vi - a.vi; });
      var T = { vprog: sumar(lista, 'vprog'), vi: sumar(lista, 'vi'), vp: sumar(lista, 'vp'), rt: sumar(lista, 'rt'), larv: sumar(lista, 'larv'), n: sumar(lista, 'n') };
      $('cl-texto').textContent = 'Las brigadas inspeccionaron ' + nf(T.vi) + ' viviendas en ' + T.n + (T.n === 1 ? ' intervención' : ' intervenciones') + ', con una cobertura de ' +
        pct(T.vi, T.vprog, 0) + ' de lo programado. Encontraron larvas en ' + nf(T.vp) + ' viviendas (' + pct(T.vp, T.vi) + ') y trataron ' + nf(T.rt) + ' recipientes.';
      var filas = lista.map(function (a) {
        return [celdaDoble(a.loc, sel === 'todos' && nombreDistrito(a.d) !== a.loc ? nombreDistrito(a.d) : ''),
          celdaDoble(String(a.n), a.meses.sort(function (x, y) { return x - y; }).map(function (m) { return MES_C[m]; }).join(', ')),
          nf(a.vi), pct(a.vi, a.vprog, 0), nf(a.vp), pct(a.vp, a.vi), nf(a.rt), kg(a.larv)];
      });
      cont.appendChild(tabla([{ t: 'Localidad' }, { t: 'Intervenciones' }, { t: 'Viviendas inspeccionadas', num: 1 }, { t: 'Cobertura', num: 1 }, { t: 'Viviendas con larvas', num: 1 },
        { t: '%', num: 1 }, { t: 'Recipientes tratados', num: 1 }, { t: 'Larvicida (kg)', num: 1 }], filas,
        lista.length > 1 ? ['Total', String(T.n), nf(T.vi), pct(T.vi, T.vprog, 0), nf(T.vp), pct(T.vp, T.vi), nf(T.rt), kg(T.larv)] : null));
    }

    var nb = filtrar(D.nebulizacion), contN = vaciar($('neb-tabla'));
    if (!nb.length) { $('neb-texto').textContent = 'No se registraron cercos con nebulización espacial en ' + lugarFrase() + '.'; return; }
    var insect = sumar(nb, 'insect');
    $('neb-texto').textContent = nb.length + (nb.length === 1 ? ' cerco' : ' cercos') + ' alrededor de viviendas con casos, cada uno con hasta tres vueltas de nebulización, usando ' + nf(insect, 1) + ' litros de insecticida.';
    var filasN = nb.map(function (c) {
      var s = resumenCerco(c);
      return [cap(fechaCorta(c.vueltas[0].fecha)), celdaDoble(c.loc, sel === 'todos' && nombreDistrito(c.d) !== c.loc ? nombreDistrito(c.d) : ''), limpiarZona(c.zona), String(c.vueltas.length), nf(c.vueltas[0].prog),
        pct(s.neb, s.prog, 0), pct(s.cer + s.des + s.ren, s.prog, 0)];
    });
    contN.appendChild(tabla([{ t: 'Inicio' }, { t: 'Localidad' }, { t: 'Sector' }, { t: 'Vueltas', num: 1 }, { t: 'Viviendas por vuelta', num: 1 }, { t: 'Nebulizadas', num: 1 }, { t: 'Sin nebulizar', num: 1 }], filasN));
  }

  // ------------------------------------------------------------ promoción
  function renderCifras() {
    var rc = filtrar(D.recojos), ie = filtrar(D.concurso).filter(function (c) { return c.participo; });
    var com = filtrar(D.comites), ord = filtrar(D.ordenanzas);
    var caps = filtrar(D.capacitaciones.docentes).concat(filtrar(D.capacitaciones.lideres), filtrar(D.capacitaciones.agentes));
    var act = filtrar(D.actividades, true).filter(function (a) { return a.comp === 'Promoción de la salud'; });
    var cont = vaciar($('ps-cifras'));
    [[tn(Math.round(sumar(rc, 't') * 10) / 10), 't', 'de criaderos retirados en ' + rc.length + ' campañas de recojo'],
      [nf(ie.length), '', 'escuelas en el concurso Al cole seguro'],
      [nf(com.length), '', 'comités de vigilancia comunitaria'],
      [nf(ord.length), '', ord.length === 1 ? 'ordenanza municipal de recojo' : 'ordenanzas municipales de recojo'],
      [nf(sumar(caps, 'n')), '', 'asistencias a capacitaciones'],
      [nf(act.length), '', 'actividades registradas']
    ].forEach(function (c) {
      var dd = el('dd', null, [c[0]]); if (c[1]) dd.appendChild(el('small', { text: c[1] }));
      cont.appendChild(el('div', null, [el('dt', { text: c[2] }), dd]));
    });
  }

  function renderRecojos() {
    var rc = filtrar(D.recojos), vis = vaciar($('rc-visual'));
    var t = sumar(rc, 't');
    var ie = filtrar(D.concurso), kg = sumar(ie, 'kg');
    var dists = {}; rc.forEach(function (r) { dists[r.d] = 1; });
    if (!rc.length) {
      $('rc-texto').textContent = 'No hay campañas de recojo registradas en ' + lugarFrase() + ' en 2026.';
    } else {
      $('rc-texto').textContent = rc.length + (rc.length === 1 ? ' campaña' : ' campañas') + ' de recojo retiraron ' + tn(Math.round(t * 10) / 10) + ' toneladas de posibles criaderos (llantas, baldes, botellas y otros inservibles)' +
        (sel === 'todos' ? ' en ' + Object.keys(dists).length + ' distritos y centros poblados' : '') + '. ' +
        (kg ? 'Las escuelas reunieron además ' + nf(kg) + ' kg en el concurso Al cole seguro.' : '');
      if (sel === 'todos') {
        var por = {};
        rc.forEach(function (r) { por[r.d] = por[r.d] || { t: 0, n: 0 }; por[r.d].t += r.t; por[r.d].n++; });
        var items = Object.keys(por).map(function (d) {
          return { etq: d === 'moyobamba' ? 'Valle de la Conquista y Atumplaya' : DIST[d].nombre, valor: por[d].t, texto: tn(Math.round(por[d].t * 10) / 10) + ' t',
            extra: [por[d].n + (por[d].n === 1 ? ' campaña' : ' campañas')] };
        }).sort(function (a, b) { return b.valor - a.valor; });
        barrasH(vis, items, { titulo: 'Toneladas de criaderos retiradas por distrito', etqW: 230 });
      } else {
        var filas = rc.slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); }).map(function (r) { return [cap(fechaCorta(r.fecha)), r.lugar, tn(r.t) + ' t']; });
        vis.appendChild(el('div', { class: 'tabla-desliza' }, [tabla([{ t: 'Fecha' }, { t: 'Lugar' }, { t: 'Recogido', num: 1 }], filas, rc.length > 1 ? ['Total', '', tn(Math.round(t * 100) / 100) + ' t'] : null)]));
      }
    }
    var p = D.meta.proxima, nodoP = $('rc-proxima');
    if (p && p.fecha >= D.meta.corte && (sel === 'todos' || sel === p.d)) {
      nodoP.textContent = 'Próxima actividad: ' + fechaLarga(p.fecha).replace(/ de \d{4}$/, '') + ', ' + p.texto.charAt(0).toLowerCase() + p.texto.slice(1) + '.';
      nodoP.hidden = false;
    } else nodoP.hidden = true;
  }

  function renderMunicipios() {
    var ord = filtrar(D.ordenanzas), com = filtrar(D.comites);
    var partes = [];
    if (com.length) partes.push(com.length + (com.length === 1 ? ' comité' : ' comités') + ' de vigilancia comunitaria, con ' + sumar(com, 'integrantes') + ' vecinos, ayudan a ubicar y eliminar puntos críticos donde las brigadas encuentran larvas una y otra vez.');
    if (ord.length) partes.push(sel === 'todos'
      ? ord.length + ' municipalidades tienen una ordenanza que fija campañas de recojo de criaderos durante el año.'
      : 'La municipalidad cuenta con la ' + ord[0].ordenanza + ', que fija las campañas de recojo de criaderos (' + ord[0].periodo.toLowerCase() + ').');
    $('mun-texto').textContent = partes.join(' ') || 'No hay ordenanzas ni comités registrados para ' + lugarFrase() + '.';
    var dest = $('mun-destacado');
    if (sel === 'todos' || sel === 'elias-soplin-vargas') {
      dest.textContent = 'En Elías Soplín Vargas, el Comité de Vigilancia y Control del Dengue es el primero reconocido por resolución de alcaldía (R. A. N.° 082-2026-A/MDESV, 16 de marzo de 2026).';
      dest.hidden = false;
    } else dest.hidden = true;
    var ot = vaciar($('ord-tabla'));
    if (ord.length) ot.appendChild(tabla([{ t: 'Distrito' }, { t: 'Ordenanza' }, { t: 'Campañas' }], ord.sort(function (a, b) { return ORDEN_D[a.d] - ORDEN_D[b.d]; })
      .map(function (o) { return [nombreDistrito(o.d), o.ordenanza, cap(o.periodo.toLowerCase())]; })));
    else ot.appendChild(el('p', { class: 'nota-vacia', text: 'Sin ordenanza registrada.' }));
    var ct = vaciar($('com-tabla'));
    if (com.length) ct.appendChild(tabla([{ t: 'Lugar' }, { t: 'Distrito' }, { t: 'Conformado' }, { t: 'Integrantes', num: 1 }],
      com.map(function (c) { return [titulo(c.lugar.replace(/\s*-\s*/g, ' - ')), nombreDistrito(c.d), c.periodo, String(c.integrantes)]; })));
    else ct.appendChild(el('p', { class: 'nota-vacia', text: 'Sin comités registrados.' }));
  }

  function renderEscuelas() {
    var ie = filtrar(D.concurso), doc = filtrar(D.capacitaciones.docentes);
    var part = ie.filter(function (c) { return c.participo; });
    var dists = {}; part.forEach(function (c) { dists[c.d] = 1; });
    var ies = {}; doc.forEach(function (d) { ies[d.ie] = 1; });
    var t = [];
    if (part.length) t.push(part.length + (part.length === 1 ? ' institución educativa' : ' instituciones educativas') + (sel === 'todos' ? ' de ' + Object.keys(dists).length + ' distritos' : '') +
      ' participaron en el concurso de identificación de criaderos y reunieron ' + nf(sumar(part, 'kg')) + ' kg de posibles criaderos traídos de las casas y recogidos en los locales.');
    if (doc.length) t.push('Antes del concurso se capacitó a ' + nf(sumar(doc, 'n')) + ' docentes de ' + Object.keys(ies).length + ' instituciones en ' + doc.length + (doc.length === 1 ? ' sesión' : ' sesiones') + ', para que repliquen con sus estudiantes.');
    $('esc-texto').textContent = t.join(' ') || 'No hay actividades en escuelas registradas para ' + lugarFrase() + '.';
    var cont = vaciar($('esc-tabla'));
    if (!ie.length) return;
    var maxKg = Math.max.apply(null, ie.map(function (c) { return c.kg; })) || 1;
    var filas = ie.slice().sort(function (a, b) { return b.kg - a.kg; }).map(function (c) {
      var barra = el('span', { class: 'barrita' }); barra.style.width = Math.max(2, 90 * c.kg / maxKg) + 'px';
      var res = c.ganadora ? el('span', { class: 'etiqueta etiqueta--gana', text: 'Ganadora' }) : (c.participo ? el('span', { class: 'etiqueta', text: 'Participó' }) : el('span', { class: 'etiqueta etiqueta--no', text: 'No participó' }));
      return [celdaDoble(c.ie, sel === 'todos' ? nombreDistrito(c.d) : ''), el('span', null, [barra, nf(c.kg) + ' kg']), res];
    });
    cont.appendChild(tabla([{ t: 'Institución educativa' }, { t: 'Criaderos reunidos' }, { t: 'Resultado' }], filas));
  }

  function renderCapacitacion() {
    var todas = filtrar(D.capacitaciones.docentes).concat(filtrar(D.capacitaciones.lideres), filtrar(D.capacitaciones.agentes));
    var por = {};
    todas.forEach(function (c) { por[c.grupo] = por[c.grupo] || { n: 0, s: 0 }; por[c.grupo].n += c.n; por[c.grupo].s++; });
    var total = sumar(todas, 'n');
    $('cap-texto').textContent = total
      ? nf(total) + ' asistencias en ' + todas.length + ' sesiones de capacitación y sensibilización sobre medidas preventivas, criaderos, signos de alarma y riesgos de la automedicación.'
      : 'No hay capacitaciones registradas para ' + lugarFrase() + '.';
    var items = Object.keys(por).map(function (g) { return { etq: g, valor: por[g].n, texto: nf(por[g].n), extra: [por[g].s + (por[g].s === 1 ? ' sesión' : ' sesiones')] }; })
      .sort(function (a, b) { return b.valor - a.valor; });
    barrasH($('cap-grafico'), items, { titulo: 'Asistencias por público', etqW: 210, vacio: '' });
  }

  function renderLinea() {
    var act = filtrar(D.actividades, true).filter(function (a) { return a.fecha && a.comp !== 'Epidemiología'; });
    $('linea-texto').textContent = act.length
      ? act.length + (act.length === 1 ? ' actividad registrada' : ' actividades registradas') + ' en ' + nombreSel() + ', de la más reciente a la más antigua. Cada una tiene su foto de respaldo cuando está disponible.'
      : 'No hay actividades registradas para ' + lugarFrase() + '.';
    var cuenta = {}; act.forEach(function (a) { cuenta[a.tipo] = (cuenta[a.tipo] || 0) + 1; });
    var fil = vaciar($('filtros-tipo'));
    if (filtroTipo !== 'todos' && !cuenta[filtroTipo]) filtroTipo = 'todos';
    [{ id: 'todos', n: act.length }].concat(TIPOS.filter(function (t) { return cuenta[t.id]; }).map(function (t) { return { id: t.id, n: cuenta[t.id] }; })).forEach(function (t) {
      fil.appendChild(el('button', { type: 'button', 'aria-pressed': String(filtroTipo === t.id), onclick: function () { filtroTipo = t.id; verTodas = false; renderLinea(); } },
        [t.id === 'todos' ? 'Todas' : t.id, el('span', { class: 'n', text: String(t.n) })]));
    });
    var lista = act.filter(function (a) { return filtroTipo === 'todos' || a.tipo === filtroTipo; })
      .sort(function (a, b) { return b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, 'es'); });
    var LIMITE = 18, visibles = verTodas ? lista : lista.slice(0, LIMITE);
    var cont = vaciar($('linea'));
    var grupos = [];
    visibles.forEach(function (a) {
      var k = a.fecha.slice(0, 7);
      if (!grupos.length || grupos[grupos.length - 1].k !== k) grupos.push({ k: k, items: [] });
      grupos[grupos.length - 1].items.push(a);
    });
    grupos.forEach(function (g) {
      var totalMes = lista.filter(function (a) { return a.fecha.slice(0, 7) === g.k; }).length;
      var mes = el('section', { class: 'mes' }, [el('h4', { class: 'mes__titulo' }, [cap(MESES[+g.k.slice(5)]) + ' de ' + g.k.slice(0, 4), el('span', { text: totalMes + (totalMes === 1 ? ' actividad' : ' actividades') })])]);
      var ol = el('ol', { class: 'actividades' });
      g.items.forEach(function (a) {
        var marcas = el('div', { class: 'actividad__marcas' });
        var tipo = el('span', { class: 'tipo', text: a.tipo }); tipo.style.setProperty('--c', COLOR_TIPO[a.tipo] || '#66737b');
        marcas.appendChild(tipo);
        if (sel === 'todos' || a.d !== sel) marcas.appendChild(el('span', { class: 'etiqueta', text: nombreDistrito(a.d) }));
        var datos = el('dl', { class: 'actividad__datos' });
        if (a.lugar) datos.appendChild(el('div', null, [el('dt', { text: 'Lugar' }), el('dd', { text: a.lugar })]));
        if (a.part) datos.appendChild(el('div', null, [el('dt', { text: 'Participantes' }), el('dd', { text: a.part })]));
        if (a.res) datos.appendChild(el('div', null, [el('dt', { text: 'Resultado' }), el('dd', { text: a.res })]));
        var cuerpo = el('div', null, [marcas, el('h4', { text: a.titulo }), a.desc ? el('p', { text: a.desc }) : null, datos,
          a.aliados.length ? el('p', { class: 'actividad__aliados', text: 'Con: ' + a.aliados.join(', ') + '.' }) : null]);
        var fecha = el('div', { class: 'actividad__fecha' }, [el('b', { text: a.fecha.length === 10 ? String(+a.fecha.slice(8)) : '' }), el('span', { text: MES_C[+a.fecha.slice(5, 7)] })]);
        var foto = a.fotos.length ? botonFoto(a.fotos[0], a.titulo + ' (' + fechaLarga(a.fecha) + ')') : el('div');
        ol.appendChild(el('li', { class: 'actividad' }, [fecha, cuerpo, foto]));
      });
      mes.appendChild(ol);
      cont.appendChild(mes);
    });
    if (lista.length > LIMITE) {
      cont.appendChild(el('div', { class: 'mas' }, [el('button', { type: 'button', class: 'boton-sec', onclick: function () { verTodas = !verTodas; renderLinea(); if (!verTodas) $('h-linea').scrollIntoView(); } },
        [verTodas ? 'Mostrar menos' : 'Ver las ' + lista.length + ' actividades'])]));
    }
  }

  function renderDifusion() {
    var af = D.difusion.afiches || [], pub = D.difusion.publicaciones || [];
    $('dif-texto').textContent = 'Afiches de convocatoria para cada campaña de recojo y ' + pub.length + ' publicaciones en redes sociales.';
    var ca = vaciar($('afiches'));
    af.forEach(function (f, i) { ca.appendChild(botonFoto(f, 'Afiche de convocatoria ' + (i + 1))); });
    var cp = vaciar($('publicaciones'));
    pub.forEach(function (u, i) { cp.appendChild(el('li', null, [el('a', { href: u, target: '_blank', rel: 'noopener', text: 'Publicación ' + (i + 1) + ' en Facebook' })])); });
  }

  // ------------------------------------------------------------ epidemiología
  function renderEpi() {
    var act = filtrar(D.actividades).filter(function (a) { return a.comp === 'Epidemiología'; });
    var cont = vaciar($('epi'));
    if (!act.length) { cont.appendChild(el('li', null, [el('p', { class: 'nota-vacia', text: 'No hay acciones de epidemiología registradas para ' + lugarFrase() + '.' })])); return; }
    act.forEach(function (a) {
      cont.appendChild(el('li', null, [el('div', null, [el('p', { class: 'lugar', text: a.lugar + (sel === 'todos' ? ', ' + nombreDistrito(a.d) : '') }), el('h3', { text: a.titulo }), el('p', { text: a.desc })]),
        a.fotos.length ? botonFoto(a.fotos[0], a.titulo + ', ' + a.lugar) : el('div')]));
    });
  }

  // ------------------------------------------------------------ evidencias
  function renderEvidencias() {
    var todas = D.evidencias, propias = filtrar(todas);
    var usar = propias.length ? propias : todas;
    $('evid-texto').textContent = propias.length || sel === 'todos'
      ? 'Fotos de las brigadas de vigilancia y control vectorial en ' + nombreSel() + ', mes a mes.'
      : 'No hay fotos de control vectorial marcadas para ' + DIST[sel].nombre + '; se muestran las de toda la jurisdicción.';
    var comps = {}; usar.forEach(function (e) { comps[e.comp] = (comps[e.comp] || 0) + 1; });
    if (filtroEvid !== 'todos' && !comps[filtroEvid]) filtroEvid = 'todos';
    var fil = vaciar($('filtros-evid'));
    [{ id: 'todos', n: usar.length }].concat(Object.keys(comps).sort().map(function (c) { return { id: c, n: comps[c] }; })).forEach(function (c) {
      fil.appendChild(el('button', { type: 'button', 'aria-pressed': String(filtroEvid === c.id), onclick: function () { filtroEvid = c.id; renderEvidencias(); } },
        [c.id === 'todos' ? 'Todas' : c.id, el('span', { class: 'n', text: String(c.n) })]));
    });
    var gal = vaciar($('galeria'));
    usar.filter(function (e) { return filtroEvid === 'todos' || e.comp === filtroEvid; }).sort(function (a, b) { return b.mes.localeCompare(a.mes); }).forEach(function (e) {
      var pie = cap(MESES[+e.mes.slice(5, 7)]) + '. ' + e.comp + '. ' + e.desc;
      gal.appendChild(el('figure', null, [botonFoto(e.fotos[0], pie), el('figcaption', null, [el('b', { text: cap(MESES[+e.mes.slice(5, 7)]) + ', ' + e.comp.toLowerCase() + '. ' }), e.desc])]));
    });
  }

  // ------------------------------------------------------------ contexto y orquestación
  function renderContexto() {
    var lugar = lugarFrase();
    var textos = {
      hallazgos: 'Qué muestran la vigilancia entomológica, el control larvario y la nebulización en ' + lugar + '.',
      control: 'Inspección de viviendas, tratamiento de recipientes con agua y cercos de nebulización alrededor de casos en ' + lugar + '.',
      promocion: 'Trabajo con municipalidades, escuelas y vecinos de ' + lugar + ' para eliminar criaderos y sostener la prevención en casa.',
      epidemiologia: 'Acciones de vigilancia epidemiológica en ' + lugar + ': seguimiento de febriles, revisión de historias clínicas y salas situacionales.'
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-contexto]'), function (n) { n.textContent = textos[n.getAttribute('data-contexto')]; });
    document.title = (sel === 'todos' ? '' : DIST[sel].nombre + ' | ') + 'Prevención del dengue 2026 | UNGET Rioja';
  }

  function renderGraficos() { renderRecipientes(); renderAcceso(); renderRecojos(); renderCapacitacion(); renderNotaHallazgos(); }

  function renderNotaHallazgos() {
    var faltan = [];
    if ($('bloque-ia').hidden) faltan.push('vigilancia entomológica');
    if ($('bloque-recipientes').hidden) faltan.push('control larvario');
    if ($('bloque-acceso').hidden) faltan.push('nebulización espacial');
    var nota = $('hallazgos-nota');
    if (!faltan.length) { nota.hidden = true; return; }
    var lista = faltan.length > 1 ? faltan.slice(0, -1).join(', ') + ' ni ' + faltan[faltan.length - 1] : faltan[0];
    nota.textContent = 'Los formatos de 2026 no registran ' + lista + ' en ' + lugarFrase() + '.' +
      (faltan.length === 3 ? ' Las acciones de este distrito están en Promoción de la salud.' : '');
    nota.hidden = false;
  }

  function renderTodo() {
    renderSelector(); renderContexto(); renderPortada(); renderIA(); renderControl(); renderCifras();
    renderMunicipios(); renderEscuelas(); renderLinea(); renderDifusion(); renderEpi(); renderEvidencias(); renderGraficos();
  }

  function cambiar(id) {
    if (!DIST[id] && id !== 'todos') id = 'todos';
    sel = id; verTodas = false;
    var u = new URL(location.href);
    if (id === 'todos') u.searchParams.delete('distrito'); else u.searchParams.set('distrito', id);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
    renderTodo();
  }

  $('distrito-select').addEventListener('change', function (e) { cambiar(e.target.value); });
  $('imprimir').addEventListener('click', function () { window.print(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-corte]'), function (n) { n.textContent = fechaLarga(D.meta.corte); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-periodo]'), function (n) { n.textContent = (D.meta.periodo || '').toLowerCase(); });
  $('generado').textContent = 'Información al ' + fechaLarga(D.meta.corte) + '. Página generada el ' + D.meta.generado + '.';

  var anchoPrevio = window.innerWidth, tempo = null;
  window.addEventListener('resize', function () {
    clearTimeout(tempo);
    tempo = setTimeout(function () { if (Math.abs(window.innerWidth - anchoPrevio) > 40) { anchoPrevio = window.innerWidth; renderGraficos(); } }, 180);
  });
  window.addEventListener('beforeprint', renderGraficos);

  renderTodo();
})();
