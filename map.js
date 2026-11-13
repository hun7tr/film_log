'use strict';
/* Small slippy map on OpenStreetMap tiles: drag to pan, pinch or buttons to zoom, numbered pins. */
(function (root) {
  const T = 256, ZMIN = 2, ZMAX = 19;
  const proj = (lat, lon, z) => {
    const n = T * Math.pow(2, z);
    const s = Math.sin(Math.max(-85.05, Math.min(85.05, lat)) * Math.PI / 180);
    return [(lon + 180) / 360 * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
  };
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  /* points: [{lat, lon, label, data}]; opts: {line, onSelect(point)} */
  function create(box, points, opts) {
    opts = opts || {};
    const tiles = el('div', 'map-tiles');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'map-line');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(path);
    const marks = el('div', 'map-marks');
    const zoomBox = el('div', 'map-zoom');
    const plus = el('button'), minus = el('button');
    plus.textContent = '+'; minus.textContent = '−';
    plus.setAttribute('aria-label', 'Zoom in'); minus.setAttribute('aria-label', 'Zoom out');
    zoomBox.append(plus, minus);
    const credit = el('a', 'map-credit');
    credit.href = 'https://www.openstreetmap.org/copyright';
    credit.target = '_blank'; credit.rel = 'noopener';
    credit.textContent = '© OpenStreetMap';
    box.replaceChildren(tiles, svg, marks, zoomBox, credit);

    let z = 14, cx = 0, cy = 0, selected = null;
    const cache = new Map();
    const pins = points.map(p => {
      const b = el('button', 'map-pin');
      b.textContent = p.label;
      b.addEventListener('click', () => select(p));
      marks.append(b);
      return b;
    });

    function select(p) {
      selected = p;
      pins.forEach((b, i) => b.classList.toggle('on', points[i] === p));
      if (opts.onSelect) opts.onSelect(p);
    }

    function fit() {
      const w = box.clientWidth || 320, h = box.clientHeight || 400;
      for (z = 17; z > ZMIN; z--) {
        const ps = points.map(p => proj(p.lat, p.lon, z));
        const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
        if (Math.max(...xs) - Math.min(...xs) <= w - 90 && Math.max(...ys) - Math.min(...ys) <= h - 120) break;
      }
      if (points.length === 1) z = 15;
      const ps = points.map(p => proj(p.lat, p.lon, z));
      const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
      cx = (Math.max(...xs) + Math.min(...xs)) / 2;
      cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    }

    function draw() {
      const w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      const x0 = cx - w / 2, y0 = cy - h / 2, n = Math.pow(2, z);
      const seen = new Set();
      for (let tx = Math.floor(x0 / T); tx <= Math.floor((x0 + w) / T); tx++) {
        for (let ty = Math.floor(y0 / T); ty <= Math.floor((y0 + h) / T); ty++) {
          if (ty < 0 || ty >= n) continue;
          const wx = ((tx % n) + n) % n, key = z + '/' + wx + '/' + ty + '@' + tx;
          seen.add(key);
          let img = cache.get(key);
          if (!img) {
            img = new Image();
            img.className = 'map-tile'; img.alt = ''; img.draggable = false;
            img.onerror = () => { img.style.visibility = 'hidden'; };
            img.src = 'https://tile.openstreetmap.org/' + z + '/' + wx + '/' + ty + '.png';
            tiles.append(img);
            cache.set(key, img);
          }
          img.style.transform = 'translate(' + Math.round(tx * T - x0) + 'px,' + Math.round(ty * T - y0) + 'px)';
        }
      }
      cache.forEach((img, key) => { if (!seen.has(key)) { img.remove(); cache.delete(key); } });
      const pts = points.map(p => { const q = proj(p.lat, p.lon, z); return [q[0] - x0, q[1] - y0]; });
      pins.forEach((b, i) => { b.style.transform = 'translate(' + Math.round(pts[i][0]) + 'px,' + Math.round(pts[i][1]) + 'px)'; });
      path.setAttribute('d', opts.line && pts.length > 1 ? 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') : '');
    }

    function zoom(d) {
      const nz = Math.max(ZMIN, Math.min(ZMAX, z + d));
      if (nz === z) return;
      const f = Math.pow(2, nz - z);
      cx *= f; cy *= f; z = nz;
      draw();
    }
    plus.addEventListener('click', () => zoom(1));
    minus.addEventListener('click', () => zoom(-1));

    const fingers = new Map();
    let pinch = 0;
    const dist = () => { const a = [...fingers.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
    box.addEventListener('pointerdown', e => {
      if (e.target.closest('button,a')) return;
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
      if (fingers.size === 2) pinch = dist();
    });
    box.addEventListener('pointermove', e => {
      const f = fingers.get(e.pointerId);
      if (!f) return;
      const dx = e.clientX - f.x, dy = e.clientY - f.y;
      f.x = e.clientX; f.y = e.clientY;
      if (fingers.size === 1) { cx -= dx; cy -= dy; draw(); }
      else if (fingers.size === 2 && pinch) {
        const r = dist() / pinch;
        if (r > 1.5) { zoom(1); pinch = dist(); }
        else if (r < 0.67) { zoom(-1); pinch = dist(); }
      }
    });
    const up = e => { fingers.delete(e.pointerId); pinch = 0; };
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });

    fit();
    draw();
    if (root.ResizeObserver) new ResizeObserver(draw).observe(box);
    return { select, zoom };
  }

  root.FilmMap = { create };
})(typeof window !== 'undefined' ? window : globalThis);
