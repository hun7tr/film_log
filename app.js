'use strict';
(function () {

  // ------------------------------------------------------------ Konstanten
  const THEMES = {
    hell: { bar: '#F0EEE9', colors: ['#F0EEE9', '#E7E9E7', '#B7B8B4', '#898784', '#5AA0DE'], pdf: [90, 160, 222] },
    dunkel: { bar: '#161617', colors: ['#161617', '#2A2A2D', '#3D3D42', '#9C9BA1', '#FF7A3D'], pdf: [224, 98, 40] }
  };
  const VERSION = '0.13';
  const SHUTTERS = ['B', '30s', '15s', '8s', '4s', '2s', '1s', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000', '1/4000', '1/8000'];
  const APERTURES = ['1', '1.2', '1.4', '1.8', '2', '2.8', '3.5', '4', '5.6', '8', '11', '16', '22', '32'];
  const FOCALS = [14, 17, 20, 24, 28, 35, 40, 50, 58, 70, 85, 100, 105, 135, 150, 200, 300, 400];
  const DEFAULTS = { shutter: '1/125', aperture: '8', focal: 50, flash: false, ev: 0 };
  // Belichtungskorrektur in Drittelstufen: -9 = −3 EV … +9 = +3 EV
  const EVS = Array.from({ length: 19 }, (_, i) => i - 9);
  const ROLL_KEYS = ['title', 'film', 'iso', 'ei', 'push', 'camera', 'frames', 'note', 'pns', 'simple'];

  const S = { rolls: [], shots: [], folders: [], tags: [], feedback: [], trash: { rolls: [], shots: [], folders: [], tags: [] }, settings: { theme: 'hell', lang: 'de' } };

  // ------------------------------------------------------------ Helfer
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  const ICONS = {
    down: '<path d="M5 9l7 7 7-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    play: '<path d="M7 5l12 7-12 7z" fill="currentColor"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
    bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    double: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
    importIc: '<path d="M12 3v12M8 11l4 4 4-4M5 13v7h14v-7"/>',
    undo: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    tabActive: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>',
    tabArchive: '<path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4"/>',
    tabExport: '<path d="M12 3v12M8 7l4-4 4 4M5 13v7h14v-7"/>',
    tabSettings: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>'
  };
  function icon(name) {
    const s = h('span', { class: 'ico', 'aria-hidden': 'true' });
    s.style.display = 'contents';
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
    return s;
  }

  function t(key, vars) {
    const dict = window.I18N[S.settings.lang] || window.I18N.de;
    let s = dict[key];
    if (s == null) s = window.I18N.de[key];
    if (s == null) return key;
    if (typeof s === 'function') return s;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const pad2 = n => String(n).padStart(2, '0');
  const LOCALES = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES', pt: 'pt-BR' };
  const locale = () => LOCALES[S.settings.lang] || 'en-GB';
  const fmtDate = ms => ms == null ? '' : new Intl.DateTimeFormat(locale(), { dateStyle: 'medium' }).format(new Date(ms));
  const fmtDateTime = ms => ms == null ? '' : new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
  const fmtShutter = v => v == null ? '' : v === 'B' ? 'B' : /s$/.test(v) ? v.slice(0, -1) + ' s' : v;
  const fmtShutterUnit = v => v == null ? '' : v === 'B' ? 'B' : /s$/.test(v) ? v.slice(0, -1) + ' s' : v + ' s';
  const fmtAperture = v => v == null ? '' : 'f/' + v;
  const fmtFocal = v => v == null ? '' : v + ' mm';
  const fmtCoord = (lat, lon) => lat.toFixed(5) + ', ' + lon.toFixed(5);
  const fmtPush = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n || 0);
  // Drittelstufen lesbar: 4 -> +1⅓, für CSV und PDF ohne Sonderzeichen: +1 1/3
  const fmtEv = (n, ascii) => {
    if (n == null) return '';
    if (n === 0) return '±0';
    const a = Math.abs(n), w = Math.floor(a / 3), r = a % 3;
    const frac = !r ? '' : ascii ? (w ? ' ' : '') + r + '/3' : r === 1 ? '⅓' : '⅔';
    return (n > 0 ? '+' : ascii ? '-' : '−') + (w || !r ? w : '') + frac;
  };
  const noLabel = (no, sub) => pad2(no) + (sub > 1 ? '.' + sub : '');
  const toLocalInput = ms => {
    if (ms == null) return '';
    const d = new Date(ms);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  };

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ------------------------------------------------------------ Speicher (IndexedDB)
  const DB = {
    db: null,
    open() {
      return new Promise((res, rej) => {
        const r = indexedDB.open('film-log', 3);
        r.onupgradeneeded = () => {
          const d = r.result;
          ['rolls', 'shots', 'media', 'folders', 'tags', 'feedback'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); });
        };
        r.onsuccess = () => { DB.db = r.result; res(); };
        r.onerror = () => rej(r.error);
      });
    },
    run(stores, mode, fn) {
      return new Promise((res, rej) => {
        if (!DB.db) return rej(new Error('no db'));
        const tx = DB.db.transaction(stores, mode);
        const r = fn(tx);
        tx.oncomplete = () => res(r && 'result' in r ? r.result : undefined);
        tx.onerror = tx.onabort = () => rej(tx.error);
      });
    },
    all: store => DB.run(store, 'readonly', tx => tx.objectStore(store).getAll()),
    get: (store, id) => DB.run(store, 'readonly', tx => tx.objectStore(store).get(id)),
    put: (store, val) => DB.run(store, 'readwrite', tx => { tx.objectStore(store).put(val); }),
    del: (store, id) => DB.run(store, 'readwrite', tx => { tx.objectStore(store).delete(id); })
  };

  const urls = new Map();
  async function mediaUrl(id) {
    if (!id) return null;
    if (urls.has(id)) return urls.get(id);
    const m = await DB.get('media', id);
    if (!m) return null;
    const u = URL.createObjectURL(new Blob([m.buf], { type: m.type }));
    urls.set(id, u);
    return u;
  }
  async function dropMedia(id) {
    if (!id) return;
    if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
    await DB.del('media', id);
  }

  // ------------------------------------------------------------ Daten
  const rollById = id => S.rolls.find(r => r.id === id);
  const rollShots = id => S.shots.filter(s => s.rollId === id).sort((a, b) => b.no - a.no || a.sub - b.sub);
  const frameCount = id => new Set(S.shots.filter(s => s.rollId === id).map(s => s.no)).size;
  const nextNo = id => S.shots.filter(s => s.rollId === id).reduce((m, s) => Math.max(m, s.no), 0) + 1;
  const activeSince = id => S.shots.filter(s => s.rollId === id && s.date != null).reduce((m, s) => (m == null || s.date < m ? s.date : m), null);
  function lastValues(id) {
    const out = Object.assign({}, DEFAULTS);
    const list = S.shots.filter(s => s.rollId === id).sort((a, b) => b.createdAt - a.createdAt);
    for (const k of Object.keys(DEFAULTS)) {
      const hit = list.find(s => s[k] != null);
      if (hit) out[k] = hit[k];
    }
    return out;
  }
  function nextTitle() {
    let n = S.rolls.length + 1;
    const taken = new Set(S.rolls.map(r => r.title));
    while (taken.has(t('defaultTitle', { n }))) n++;
    return t('defaultTitle', { n });
  }
  const pickRoll = r => { const o = {}; ROLL_KEYS.forEach(k => { o[k] = r[k] == null ? null : r[k]; }); return o; };

  // ------------------------------------------------------------ Fenster
  const layers = document.getElementById('layers');
  const stack = [];

  function openSheet(opts) {
    const sheet = { closed: false, render: null };
    const title = h('div', { class: 'sheet-title' });
    const right = h('div', { class: 'sheet-right' });
    const head = h('header', { class: 'sheet-head' },
      h('div', { class: 'grab' }),
      h('button', { class: 'icon-btn', 'aria-label': t('close'), onclick: () => sheet.requestClose() }, icon('close')),
      title, right);
    const body = h('div', { class: 'sheet-body' });
    const foot = h('footer', { class: 'sheet-foot' });
    const el = h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, head, body, foot);
    const layer = h('div', { class: 'layer' }, h('div', { class: 'backdrop', onclick: () => sheet.requestClose() }), el);

    Object.assign(sheet, { el, head, body, foot, layer });
    sheet.setTitle = v => title.replaceChildren(...(Array.isArray(v) ? v : [v == null ? '' : v]));
    sheet.setRight = v => right.replaceChildren(...(v ? [v] : []));
    sheet.close = () => {
      if (sheet.closed) return;
      sheet.closed = true;
      const i = stack.indexOf(sheet);
      if (i >= 0) stack.splice(i, 1);
      el.style.transform = '';
      layer.classList.remove('open');
      setTimeout(() => layer.remove(), 340);
      if (opts.onClosed) opts.onClosed();
    };
    let asking = false;
    sheet.requestClose = async () => {
      if (sheet.closed || asking) return false;
      if (opts.beforeClose) {
        asking = true;
        let ok = false;
        try { ok = await opts.beforeClose(); } finally { asking = false; }
        if (!ok) { el.style.transform = ''; return false; }
      }
      sheet.close();
      return true;
    };

    // nach unten ziehen zum Schließen; greift nur an der Kopfzeile, damit Listen frei scrollen
    let startY = null, dy = 0, dragging = false;
    head.addEventListener('pointerdown', e => {
      if (e.target.closest('button,input,select,a')) return;
      startY = e.clientY; dy = 0; dragging = false;
      try { head.setPointerCapture(e.pointerId); } catch (err) {}
    });
    head.addEventListener('pointermove', e => {
      if (startY == null) return;
      dy = Math.max(0, e.clientY - startY);
      if (dy > 6) dragging = true;
      if (dragging) { el.style.transition = 'none'; el.style.transform = 'translateY(' + dy + 'px)'; }
    });
    const end = () => {
      if (startY == null) return;
      startY = null;
      el.style.transition = '';
      if (dragging && dy > 110) sheet.requestClose();
      else el.style.transform = '';
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);

    if (opts.title != null) sheet.setTitle(opts.title);
    layers.append(layer);
    stack.push(sheet);
    void layer.offsetHeight;
    layer.classList.add('open');
    return sheet;
  }

  // Rückfragen im Stil der iOS-Systemabfragen. buttons: [{label, value, kind: 'bold' | 'danger', act, onTap}]
  // Zwei kurze Knöpfe stehen nebeneinander, sonst untereinander mit Abbrechen unten. Antippen daneben schließt nicht, wie bei iOS.
  function alertBox(o) {
    const stack = o.buttons.length > 2 || o.buttons.some(b => b.label.length > 13);
    if (stack && o.buttons.length === 2) o = Object.assign({}, o, { buttons: o.buttons.slice().reverse() });
    return new Promise(resolve => {
      let done = false;
      const finish = v => {
        if (done) return;
        done = true;
        layer.classList.remove('open');
        setTimeout(() => layer.remove(), 200);
        resolve(v);
      };
      const btns = o.buttons.map((b, i) => h('button', { class: b.kind || null, 'data-act': b.act || 'alert-' + i, onclick: () => { if (b.onTap) b.onTap(); finish(b.value); } }, b.label));
      if (o.input) o.input.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = o.buttons.find(x => x.kind === 'bold'); if (b) finish(b.value); } });
      const layer = h('div', { class: 'alert-layer' },
        h('div', { class: 'alert', role: 'alertdialog', 'aria-modal': 'true' },
          h('div', { class: 'alert-text' },
            h('p', { class: 'alert-title' }, o.title),
            o.message ? h('p', { class: 'alert-msg' }, o.message) : null,
            o.input || null),
          h('div', { class: 'alert-btns' + (stack ? ' stack' : '') }, btns)));
      layers.append(layer);
      void layer.offsetHeight;
      layer.classList.add('open');
      if (o.input) setTimeout(() => o.input.focus(), 220);
    });
  }
  const confirmDelete = (message, okLabel) => alertBox({ title: message, buttons: [
    { label: t('cancel'), value: false, act: 'alert-cancel' },
    { label: okLabel || t('delete'), value: true, kind: 'danger', act: 'alert-ok' }] });
  const askSave = msg => alertBox({ title: msg, buttons: [
    { label: t('save'), value: 'save', kind: 'bold', act: 'alert-save' },
    { label: t('discard'), value: 'discard', kind: 'danger', act: 'alert-discard' },
    { label: t('cancel'), value: null, act: 'alert-cancel' }] });
  async function askText(title, initial, placeholder) {
    const input = h('input', { type: 'text', class: 'alert-input', placeholder, value: initial || '', autocomplete: 'off', enterkeyhint: 'done', 'data-field': 'ask-text' });
    const ok = await alertBox({ title, input, buttons: [
      { label: t('cancel'), value: false, act: 'alert-cancel' },
      { label: t('save'), value: true, kind: 'bold', act: 'alert-ok' }] });
    return ok ? input.value.trim() || null : null;
  }

  function refreshAll() {
    renderHome();
    stack.slice().forEach(s => { if (s.render && !s.closed) s.render(); });
  }

  // ------------------------------------------------------------ Seiten mit Tab-Leiste (statt Hauptmenü)
  const home = document.getElementById('home');
  const TABS = [['active', 'tabActive'], ['archive', 'tabArchive'], ['export', 'tabExport'], ['settings', 'tabSettings']];
  let page = null, tabName = 'active';
  const tabbar = h('nav', { class: 'tabbar' });
  // Glas-Marker, der zwischen den Tabs gleitet und beim Drücken dem Finger folgt
  const tabLens = h('div', { class: 'tab-lens' });
  const tabBtns = TABS.map(([key, ic]) => h('button', { class: 'tab', 'data-nav': key, onclick: e => { if (e.detail === 0 && key !== tabName) showTab(key); } }, icon(ic), h('span', { class: 'tab-label' })));
  tabbar.append(tabLens, ...tabBtns);
  const moveLens = (x, w, lift) => { tabLens.style.width = w + 'px'; tabLens.style.transform = 'translateX(' + x + 'px)' + (lift ? ' scale(1.12)' : ''); };
  function placeLens() {
    const b = tabBtns[TABS.findIndex(x => x[0] === tabName)];
    if (b && b.offsetWidth) moveLens(b.offsetLeft, b.offsetWidth, false);
  }
  function followLens(clientX) {
    const r = tabbar.getBoundingClientRect(), w = tabBtns[0].offsetWidth;
    const min = tabBtns[0].offsetLeft, max = tabBtns[tabBtns.length - 1].offsetLeft;
    const x = Math.max(min, Math.min(max, clientX - r.left - w / 2));
    moveLens(x, w, true);
    const idx = Math.round((x - min) / ((max - min) / (tabBtns.length - 1)));
    tabBtns.forEach((b, i) => b.classList.toggle('near', i === idx));
    return idx;
  }
  let lensDrag = null;
  tabbar.addEventListener('pointerdown', e => {
    lensDrag = { id: e.pointerId, idx: 0 };
    try { tabbar.setPointerCapture(e.pointerId); } catch (err) {}
    tabbar.classList.add('pressing');
    lensDrag.idx = followLens(e.clientX);
  });
  tabbar.addEventListener('pointermove', e => {
    if (!lensDrag || e.pointerId !== lensDrag.id) return;
    const idx = followLens(e.clientX);
    if (idx !== lensDrag.idx) { lensDrag.idx = idx; haptic(); }
  });
  const lensEnd = (e, commit) => {
    if (!lensDrag || e.pointerId !== lensDrag.id) return;
    const idx = lensDrag.idx;
    lensDrag = null;
    tabbar.classList.remove('pressing');
    tabBtns.forEach(b => b.classList.remove('near'));
    if (commit && TABS[idx][0] !== tabName) { haptic(); showTab(TABS[idx][0]); }
    else placeLens();
  };
  tabbar.addEventListener('pointerup', e => lensEnd(e, true));
  tabbar.addEventListener('pointercancel', e => lensEnd(e, false));
  tabbar.addEventListener('touchmove', e => { if (lensDrag) e.preventDefault(); }, { passive: false });
  window.addEventListener('resize', placeLens);

  function renderTabbar() {
    tabBtns.forEach((b, i) => {
      const on = TABS[i][0] === tabName;
      b.classList.toggle('on', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
      b.lastChild.textContent = t(TABS[i][0]);
    });
    placeLens();
    requestAnimationFrame(() => tabbar.classList.add('ready'));
  }

  // Eine Seite bietet dieselben Anschlüsse wie ein Fenster, damit Listen, Export und Einstellungen beides bedienen können
  function showTab(name) {
    tabName = name;
    const title = h('h1', { class: 'page-title' });
    const left = h('div', { class: 'page-side' }), right = h('div', { class: 'page-side' });
    const body = h('div', { class: 'page-body' });
    const foot = h('footer', { class: 'page-foot' });
    page = {
      closed: false, isPage: true, body, foot, render: null,
      setTitle: v => { title.textContent = v == null ? '' : v; },
      setLeft: v => left.replaceChildren(...(v ? [v] : [])),
      setRight: v => right.replaceChildren(...(v ? [v] : [])),
      close: () => {}
    };
    home.replaceChildren(h('header', { class: 'page-head' }, left, h('div', { class: 'page-brand' }, h('b', null, 'Film_Log'), h('span', { 'data-version': '' }, 'Alpha ' + VERSION)), right), title, body, foot, tabbar);
    renderTabbar();
    if (name === 'active' || name === 'archive') openList(name, page);
    else if (name === 'export') openExport(null, page);
    else openSettings(page);
  }

  function renderHome() {
    if (!page) { showTab(tabName); return; }
    renderTabbar();
    if (page.render) page.render();
  }

  // ------------------------------------------------------------ Einstellungszeilen wie in der Uhr-App
  const group = (...kids) => h('div', { class: 'group' }, kids);
  const line = (label, control, attrs) => h('label', Object.assign({ class: 'line' }, attrs || {}), h('span', { class: 'line-label' }, label), control);
  const lineBtn = (label, value, onTap, attrs) => h('button', Object.assign({ class: 'line', onclick: onTap }, attrs || {}),
    h('span', { class: 'line-label' }, label), value == null ? null : (value.nodeType ? value : h('span', { class: 'line-value' }, value)), icon('chev'));
  const lineSwitch = (label, on, onChange, field) => line(label, h('input', { type: 'checkbox', class: 'switch', role: 'switch', 'data-field': field, checked: on ? true : null, onchange: e => onChange(e.target.checked) }));

  // ------------------------------------------------------------ Rolle anlegen und bearbeiten
  function rollForm(d) {
    const input = (key, label, o) => line(label, h('input', {
      type: 'text', inputmode: o.num ? 'numeric' : null, placeholder: o.ph || '', autocomplete: 'off',
      autocapitalize: o.num ? 'off' : 'sentences', 'data-field': key, enterkeyhint: 'done',
      value: d[key] == null ? '' : d[key],
      oninput: e => {
        const v = e.target.value;
        if (o.num) { const n = parseInt(v.replace(/\D/g, ''), 10); d[key] = isNaN(n) ? null : n; }
        else d[key] = v;
      },
      onkeydown: e => { if (e.key === 'Enter') e.target.blur(); }
    }));

    const push = h('select', { 'data-field': 'push', onchange: e => { d.push = Number(e.target.value); } },
      [-2, -1, 0, 1, 2, 3].map(n => h('option', { value: n }, fmtPush(n))));
    push.value = String(d.push || 0);

    const PRESETS = [12, 24, 36];
    const other = line(t('fFramesOther'), h('input', {
      type: 'text', inputmode: 'numeric', 'data-field': 'frames', enterkeyhint: 'done', value: PRESETS.includes(d.frames) ? '' : d.frames,
      oninput: e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); if (n > 0) d.frames = n; },
      onkeydown: e => { if (e.key === 'Enter') e.target.blur(); }
    }));
    other.hidden = PRESETS.includes(d.frames);
    const frames = h('select', { 'data-field': 'frames-preset', onchange: e => {
      if (e.target.value === 'other') { other.hidden = false; other.querySelector('input').focus(); }
      else { other.hidden = true; d.frames = Number(e.target.value); }
    } }, PRESETS.map(n => h('option', { value: n }, n)), h('option', { value: 'other' }, t('fFramesOther')));
    frames.value = PRESETS.includes(d.frames) ? String(d.frames) : 'other';

    return h('div', null,
      group(input('title', t('fTitle'), {}), input('film', t('fFilm'), { ph: t('fFilmPh') }), input('camera', t('fCamera'), { ph: t('fCameraPh') })),
      group(input('iso', t('fIso'), { num: true }), input('ei', t('fEi'), { num: true }), line(t('fPush'), push), line(t('fFrames'), frames), other),
      group(lineSwitch(t('pns'), d.pns, v => { d.pns = v; }, 'pns'), lineSwitch(t('simple'), d.simple, v => { d.simple = v; }, 'simple')),
      group(input('note', t('fNote'), {})));
  }
  function cleanRoll(d, fallbackTitle) {
    const o = pickRoll(d);
    o.title = (o.title || '').trim() || fallbackTitle;
    o.film = (o.film || '').trim(); o.camera = (o.camera || '').trim(); o.note = (o.note || '').trim();
    o.push = o.push || 0;
    o.pns = !!o.pns;
    o.simple = !!o.simple;
    o.frames = o.frames > 0 ? o.frames : 36;
    return o;
  }

  // Ein Fenster für neue und bestehende Rollen: oben links schließen, oben rechts sichern
  function openRollEdit(id) {
    const roll = id ? rollById(id) : null;
    const fallback = roll ? roll.title : nextTitle();
    const d = roll ? pickRoll(roll) : { title: fallback, film: '', iso: null, ei: null, push: 0, camera: '', frames: 36, note: '', pns: false, simple: false };
    d.pns = !!d.pns; d.simple = !!d.simple;
    const orig = JSON.stringify(d);
    let saving = false;
    const save = async () => {
      if (roll) { Object.assign(roll, cleanRoll(d, fallback)); await DB.put('rolls', roll); return roll; }
      const r = Object.assign({ id: uid(), createdAt: Date.now(), archived: false, askedFull: false }, cleanRoll(d, fallback));
      toTop(r, false);
      await DB.put('rolls', r);
      S.rolls.push(r);
      return r;
    };
    const sheet = openSheet({
      title: t(roll ? 'moreEdit' : 'newRoll'),
      beforeClose: async () => {
        if (saving || JSON.stringify(d) === orig) return true;
        const a = await askSave(t('askSave'));
        if (a === 'save') { try { await save(); refreshAll(); toast(t('saved')); } catch (e) { toast(t('saveFail')); return false; } return true; }
        return a === 'discard';
      }
    });
    sheet.setRight(h('button', {
      class: 'icon-btn ok', 'data-act': 'finish', 'aria-label': t('save'), onclick: async () => {
        haptic();
        if (saving) return;
        saving = true;
        try {
          const r = await save();
          sheet.close();
          refreshAll();
          if (!roll) openRoll(r.id);
        } catch (e) { saving = false; toast(t('saveFail')); }
      }
    }, icon('check')));
    sheet.body.append(rollForm(d));
    if (roll) sheet.body.append(group(h('button', {
      class: 'line danger', 'data-act': 'roll-delete', onclick: async () => {
        if (!(await confirmDelete(t('askTrashRoll', { t: roll.title })))) return;
        saving = true;
        await trashRoll(roll.id);
        sheet.close();
        refreshAll();
        toast(t('movedToTrash'));
      }
    }, t('moreDelete'))));
  }

  // ------------------------------------------------------------ Aktiv und Archiv
  // Filmname und ISO sind getrennte Felder; angezeigt werden sie zusammen
  function filmLabel(r) {
    const f = (r.film || '').trim();
    const iso = r.iso == null ? '' : String(r.iso);
    if (!iso) return f;
    if (new RegExp('(^|\\D)' + iso + '(\\D|$)').test(f)) return f;
    return f ? f + ' ' + iso : 'ISO ' + iso;
  }
  function rollRow(r, onTap, side, cls) {
    const sub = [filmLabel(r), r.camera, frameCount(r.id) + '/' + r.frames + ' Exp.', r.pns ? 'P&S' : '', r.simple ? 'Simple' : ''].filter(Boolean).join(', ');
    return h('button', { class: 'line' + (cls || ''), 'data-roll': r.id, onclick: onTap },
      h('span', { class: 'line-label two' }, h('b', null, r.title), h('small', null, sub), tagChips(r.tags)),
      side === undefined ? icon('chev') : side);
  }

  const folderById = id => S.folders.find(f => f.id === id);
  const archivedRolls = () => S.rolls.filter(r => r.archived).sort((a, b) => b.createdAt - a.createdAt);
  const shotsOf = rolls => rolls.flatMap(r => rollShots(r.id).reverse());
  function folderRow(f, onTap) {
    const n = S.rolls.filter(r => r.archived && r.folderId === f.id).length;
    return h('button', { class: 'line', 'data-folder': f.name, onclick: onTap },
      h('span', { class: 'line-folder' }, icon('folder')),
      h('span', { class: 'line-label two' }, h('b', null, f.name), h('small', null, t('nRolls')(n)), tagChips(f.tags)),
      icon('chev'));
  }
  function shotRow(s, withRoll) {
    const val = (v, f) => h('span', { class: v == null ? 'nil' : null }, v == null ? '–' : f(v));
    const roll = rollById(s.rollId);
    const pns = !!(roll && roll.pns);
    const meta = [
      withRoll && roll ? h('span', null, roll.title) : null,
      s.date != null && !pns ? h('span', null, fmtDateTime(s.date)) : null,
      s.flash ? icon('bolt') : null,
      !pns && s.ev ? h('span', null, fmtEv(s.ev) + ' EV') : null,
      !pns && s.double ? icon('double') : null,
      s.lat != null ? icon('pin') : null,
      s.audioId ? icon('mic') : null,
      s.note ? h('span', null, s.note) : null
    ];
    return h('button', { class: 'shot' + (s.sub > 1 ? ' sub' : ''), 'data-shot': noLabel(s.no, s.sub), onclick: () => openShot(s.rollId, s.id) },
      h('span', { class: 'shot-no' }, noLabel(s.no, s.sub)),
      h('span', null,
        pns ? h('span', { class: 'shot-vals one' }, val(s.date, fmtDateTime))
          : h('span', { class: 'shot-vals' }, val(s.shutter, fmtShutter), val(s.aperture, fmtAperture), val(s.focal, fmtFocal)),
        h('span', { class: 'shot-meta' }, meta)),
      s.thumb ? h('img', { class: 'shot-thumb', src: s.thumb, alt: '' }) : h('span'));
  }

  const rollLine = r => keyed(rollRow(r, () => openRoll(r.id)), 'r:' + r.id);
  async function removeShotAsk(s) {
    if (!(await confirmDelete(t('askTrashShot', { n: noLabel(s.no, s.sub) })))) return;
    await toTrash('shots', s);
    refreshAll();
    toast(t('movedToTrash'));
  }
  const keyed = (row, key) => { row.dataset.drag = key; return row; };
  const shotLine = s => keyed(shotRow(s), 's:' + s.id);

  function openList(kind, host) {
    const sheet = host || openSheet({ title: t(kind) });
    const round = (act, ic, label, fn) => h('button', { class: 'icon-btn', 'aria-label': label, 'data-act': act, onclick: fn }, icon(ic));
    const addMenu = async e => {
      const a = await popMenu(e.currentTarget, [{ label: t('newFolder'), value: 'folder', icon: 'folder' }, { label: t('importCsv'), value: 'import', icon: 'importIc' }]);
      if (a === 'folder') { if (await createFolder()) refreshAll(); } else if (a === 'import') openImport();
    };
    sortable(sheet.body, {
      onMove: async (key, index) => { await reorderTo(kind === 'archive' ? archiveItems() : activeItems(), key, index); refreshAll(); },
      onInto: kind === 'archive' ? async (key, folderKey) => {
        const r = rollById(key.slice(2));
        if (!r) return;
        r.folderId = folderKey.slice(2); r.order = null;
        await DB.put('rolls', r);
        refreshAll();
        toast(t('saved'));
      } : null,
      onHold: keyMenu
    });
    sheet.render = () => {
      sheet.setTitle(t(kind));
      if (kind === 'active') {
        sheet.setRight(round('add', 'plus', t('newRoll'), () => openRollEdit()));
        const act = activeItems();
        if (!act.length) sheet.body.replaceChildren(h('p', { class: 'empty' }, t('emptyActive')));
        else sheet.body.replaceChildren(group(act.map(it => rollLine(it.obj))), h('p', { class: 'hint drag-hint' }, t('dragHint')));
        return;
      }
      const rolls = archivedRolls();
      if (sheet.setLeft) sheet.setLeft(rolls.length ? h('button', { class: 'pill-btn', 'data-act': 'filter', onclick: openFilter }, t('filter')) : null);
      sheet.setRight(h('div', { class: 'btn-row' },
        rolls.length ? round('map', 'map', t('map'), () => openMap(t('archive'), shotsOf(rolls))) : null,
        round('add-folder', 'plus', t('newFolder'), addMenu)));
      const items = archiveItems();
      const kids = items.map(it => it.folder
        ? keyed(folderRow(it.obj, () => openFolder(it.obj.id)), it.key)
        : rollLine(it.obj));
      if (kids.length) sheet.body.replaceChildren(group(kids), h('p', { class: 'hint drag-hint' }, t('dragHint')));
      else sheet.body.replaceChildren(h('p', { class: 'empty' }, t('emptyArchive')));
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Aufklappmenü und Rückfrage im iOS-Stil
  let pointerDown = false;
  window.addEventListener('pointerdown', () => { pointerDown = true; }, true);
  window.addEventListener('pointerup', () => { pointerDown = false; }, true);
  window.addEventListener('pointercancel', () => { pointerDown = false; }, true);

  // Menü, das neben dem angetippten Element aufklappt. items: [{label, value, icon, danger, checked}]
  function popMenu(anchor, items, title) {
    return new Promise(resolve => {
      // öffnet sich das Menü unter einem noch liegenden Finger, zählt erst der nächste Tipp
      let done = false, armed = !pointerDown;
      const finish = v => {
        if (done) return;
        done = true;
        layer.classList.remove('open');
        setTimeout(() => layer.remove(), 220);
        resolve(v);
      };
      const hasCheck = items.some(i => i.checked != null);
      const menu = h('div', { class: 'pop', role: 'menu' },
        title ? h('div', { class: 'pop-title' }, title) : null,
        items.map(i => h('button', { class: 'pop-item' + (i.danger ? ' danger' : ''), role: 'menuitem', 'data-value': String(i.value), onclick: () => { if (!armed) return; if (i.onTap) i.onTap(); finish(i.value); } },
          hasCheck ? h('span', { class: 'pop-check' }, i.checked ? icon('check') : null) : null,
          h('span', { class: 'pop-label' }, i.label), i.icon ? icon(i.icon) : null)));
      const layer = h('div', { class: 'pop-layer', onclick: e => { if (e.target === layer && armed) finish(null); } }, menu);
      layers.append(layer);
      const ar = anchor && anchor.isConnected && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
      const r = ar && ar.width ? ar : { left: innerWidth / 2 - 125, right: innerWidth / 2 + 125, top: innerHeight / 3, bottom: innerHeight / 3 };
      const w = menu.offsetWidth, hh = menu.offsetHeight;
      let top = r.bottom + 8, above = false;
      if (top + hh > innerHeight - 20) { top = Math.max(50, r.top - hh - 8); above = true; }
      menu.style.top = top + 'px';
      menu.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.right - w)) + 'px';
      menu.style.transformOrigin = (above ? 'bottom' : 'top') + ' right';
      const on = hasCheck && menu.querySelector('.pop-check svg');
      if (on) { const it = on.closest('.pop-item'); menu.scrollTop = Math.max(0, it.offsetTop - (menu.clientHeight - it.offsetHeight) / 2); }
      void layer.offsetHeight;
      layer.classList.add('open');
      if (!armed) window.addEventListener('pointerup', () => setTimeout(() => { armed = true; }, 80), { once: true });
    });
  }

  // Zeilen mit data-drag: eine Sekunde halten öffnet das Menü (für Listen ohne Sortieren)
  function holdable(box, onHold) {
    let st = null;
    const stop = () => { if (!st) return; clearTimeout(st.t1); clearTimeout(st.t2); st.el.classList.remove('holding'); st = null; };
    box.addEventListener('pointerdown', e => {
      const el = e.target.closest('[data-drag]');
      if (!el || !box.contains(el) || st) return;
      const s = { el, x: e.clientX, y: e.clientY, id: e.pointerId };
      s.t1 = setTimeout(() => el.classList.add('holding'), 350);
      s.t2 = setTimeout(() => {
        if (st !== s) return;
        stop();
        el._noClickUntil = Infinity;
        window.addEventListener('pointerup', () => { el._noClickUntil = Date.now() + 400; }, { once: true });
        haptic();
        onHold(el.dataset.drag, el);
      }, HOLD_MS);
      st = s;
    });
    box.addEventListener('pointermove', e => { if (st && e.pointerId === st.id && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 8) stop(); });
    box.addEventListener('pointerup', stop);
    box.addEventListener('pointercancel', stop);
    box.addEventListener('contextmenu', e => { if (st) e.preventDefault(); });
    box.addEventListener('click', e => {
      const el = e.target.closest('[data-drag]');
      if (el && el._noClickUntil > Date.now()) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }
  const HOLD_MS = 1000;

  // Menü einer Rolle: über die drei Punkte und über langes Halten in den Listen
  async function rollMenu(id, ctx) {
    ctx = ctx || {};
    const roll = rollById(id);
    if (!roll) return;
    const mine = S.shots.filter(s => s.rollId === id);
    const a = await popMenu(ctx.anchor, [
      { label: t('moreEdit'), value: 'edit', icon: 'pencil' },
      { label: t('tags'), value: 'tags' },
      mine.length ? { label: t('scans'), value: 'scans', icon: 'image' } : null,
      mine.some(s => s.lat != null) ? { label: t('map'), value: 'map', icon: 'map' } : null,
      { label: t('moreExport'), value: 'export', icon: 'tabExport' },
      roll.archived ? { label: t('moreFolder'), value: 'folder', icon: 'folder' } : null,
      roll.archived ? { label: t('moreReactivate'), value: 'reactivate', icon: 'tabActive' } : { label: t('moreArchive'), value: 'archive', icon: 'tabArchive' },
      { label: t('moreDelete'), value: 'delete', icon: 'trash', danger: true }
    ].filter(Boolean), roll.title);
    if (a === 'edit') openRollEdit(id);
    else if (a === 'tags') openTags(roll, 'rolls');
    else if (a === 'scans') openScans(id);
    else if (a === 'map') openMap(roll.title, rollShots(id).reverse(), true);
    else if (a === 'folder') { if (await moveToFolder(roll, ctx.anchor)) { refreshAll(); toast(t('saved')); } }
    else if (a === 'export') openExport(id);
    else if (a === 'archive' || a === 'reactivate') {
      roll.archived = a === 'archive';
      toTop(roll, roll.archived);
      await DB.put('rolls', roll);
      if (ctx.close) ctx.close();
      refreshAll();
      toast(t(a === 'archive' ? 'archived' : 'reactivated'));
    } else if (a === 'delete') {
      if (!(await confirmDelete(t('askTrashRoll', { t: roll.title })))) return;
      await trashRoll(id);
      if (ctx.close) ctx.close();
      refreshAll();
      toast(t('movedToTrash'));
    }
  }

  async function folderMenu(id, close, anchor) {
    const f = folderById(id);
    if (!f) return;
    const a = await popMenu(anchor, [
      { label: t('rename'), value: 'rename', icon: 'pencil' },
      { label: t('tags'), value: 'tags' },
      { label: t('deleteFolder'), value: 'delete', icon: 'trash', danger: true }
    ], f.name);
    if (a === 'rename') {
      const n = await askText(t('rename'), f.name, t('folderName'));
      if (n) { f.name = n; await DB.put('folders', f); refreshAll(); }
    } else if (a === 'tags') openTags(f, 'folders');
    else if (a === 'delete') {
      if (!(await confirmDelete(t('askTrashFolder', { t: f.name })))) return;
      await toTrash('folders', f);
      if (close) close();
      refreshAll();
      toast(t('movedToTrash'));
    }
  }

  async function shotMenu(id, anchor) {
    const s = S.shots.find(x => x.id === id);
    if (!s) return;
    const roll = rollById(s.rollId) || { title: '' };
    const a = await popMenu(anchor, [
      { label: t('actEdit'), value: 'edit', icon: 'pencil' },
      s.lat != null ? { label: t('showOnMap'), value: 'map', icon: 'map' } : null,
      { label: t('delete'), value: 'delete', icon: 'trash', danger: true }
    ].filter(Boolean), t('shot') + ' ' + noLabel(s.no, s.sub));
    if (a === 'edit') openShot(s.rollId, s.id);
    else if (a === 'map') openMap(roll.title, [s]);
    else if (a === 'delete') removeShotAsk(s);
  }
  const keyMenu = (key, el) => (key[0] === 'f' ? folderMenu(key.slice(2), null, el) : key[0] === 's' ? shotMenu(key.slice(2), el) : rollMenu(key.slice(2), { anchor: el }));

  // leichtes haptisches Feedback: Vibration auf Android, auf dem iPhone über einen unsichtbaren Schalter
  function haptic() {
    try {
      if (navigator.vibrate) { navigator.vibrate(10); return; }
      const label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.display = 'none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      label.append(input);
      document.head.append(label);
      label.click();
      label.remove();
    } catch (e) {}
  }

  // ------------------------------------------------------------ Rollenansicht
  function openRoll(id) {
    const roll = rollById(id);
    if (!roll) return;
    const sheet = openSheet({});
    sheet.rollId = id;
    sheet.setRight(h('button', { class: 'icon-btn', 'aria-label': t('more'), 'data-act': 'more', onclick: e => rollMenu(id, { close: () => sheet.close(), anchor: e.currentTarget }) }, icon('more')));
    const heading = h('h2', { class: 'roll-title' });
    const subline = h('button', { class: 'roll-sub', 'data-act': 'roll-edit', onclick: () => openRollEdit(id) });
    const tagLine = h('div', { class: 'tags-block' });
    const info = h('p', { class: 'roll-info' });
    const list = h('div', { class: 'shots' });
    sheet.body.append(heading, subline, tagLine, info, list);
    holdable(list, keyMenu);

    sheet.render = () => {
      if (!rollById(id)) { sheet.close(); return; }
      const shots = rollShots(id);
      sheet.setTitle(h('span', { class: 'num', 'data-count': '' }, pad2(frameCount(id)) + ' / ' + roll.frames));
      heading.textContent = roll.title;
      tagLine.replaceChildren(...[tagChips(roll.tags)].filter(Boolean));
      subline.textContent = [roll.camera, (filmLabel(roll) + (roll.push ? ' (' + fmtPush(roll.push) + ')' : '')).trim(), roll.frames + ' Exp.', roll.pns ? 'P&S' : '', roll.simple ? 'Simple' : ''].filter(Boolean).join(' / ');
      const since = activeSince(id);
      info.textContent = since != null ? t('activeSince', { d: fmtDate(since) }) : t('noShotsYet');
      list.replaceChildren(...(shots.length ? [group(shots.map(shotLine))] : []));
      sheet.foot.className = 'sheet-foot center';
      if (roll.archived) sheet.foot.replaceChildren();
      else if (!sheet.foot.firstChild) sheet.foot.append(h('button', { class: 'shutter', 'aria-label': t('newShot'), 'data-act': 'shutter', onclick: () => { haptic(); if (roll.simple) quickShot(roll); else openShot(id, null); } }));
    };
    sheet.render();
  }

  // Simple Mode: Auslöser speichert sofort Nummer, Zeit und Standort; alles andere lässt sich später nachtragen
  async function quickShot(roll) {
    const rec = { id: uid(), rollId: roll.id, createdAt: Date.now(), no: nextNo(roll.id), sub: 1, shutter: null, aperture: null, focal: null, flash: null, ev: null, double: null, lat: null, lon: null, acc: null, date: Date.now(), note: '', audioId: null, photoId: null, thumb: null };
    try { await DB.put('shots', rec); } catch (e) { toast(t('saveFail')); return; }
    S.shots.push(rec);
    refreshAll();
    toast(t('shotSaved', { n: noLabel(rec.no, 1) }));
    checkFull(roll);
    if (!navigator.geolocation) return;
    let precise = false, mine = null;
    const ok = (p, isPrecise) => {
      if (precise && !isPrecise) return;
      if (!S.shots.includes(rec) || rec.lat !== mine) return; // gelöscht oder inzwischen von Hand geändert
      if (isPrecise) precise = true;
      rec.lat = mine = p.coords.latitude; rec.lon = p.coords.longitude; rec.acc = p.coords.accuracy;
      DB.put('shots', rec).catch(() => {});
      refreshAll();
    };
    navigator.geolocation.getCurrentPosition(p => ok(p, false), () => {}, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
    navigator.geolocation.getCurrentPosition(p => ok(p, true), () => {}, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
  }

  // Mehrere Shots auf einer Nummer heißen 05, 05.2, 05.3 … ohne Lücken; zusammen gelten sie als Doppelbelichtung
  async function renumber(rollId, no) {
    const list = S.shots.filter(s => s.rollId === rollId && s.no === no).sort((a, b) => a.sub - b.sub || a.createdAt - b.createdAt);
    for (let i = 0; i < list.length; i++) {
      const s = list[i], dbl = list.length > 1 ? true : s.double;
      if (s.sub !== i + 1 || s.double !== dbl) { s.sub = i + 1; s.double = dbl; await DB.put('shots', s); }
    }
  }

  // Neu angelegte, archivierte und wiederhergestellte Einträge stehen oben in ihrer Liste
  const peersOf = archived => (archived ? S.rolls.filter(r => r.archived).concat(S.folders) : S.rolls.filter(r => !r.archived));
  const topOrder = (archived, except) => peersOf(archived).reduce((m, x) => (x === except ? m : Math.min(m, x.order == null ? -1 : x.order)), 0) - 1;
  const toTop = (obj, archived) => { obj.order = topOrder(archived, obj); };

  // Papierkorb: gelöschte Rollen, Shots, Ordner und Tags bleiben 30 Tage erhalten
  const DAY = 86400000, TRASH_DAYS = 30;
  const TRASH_KINDS = ['rolls', 'shots', 'folders', 'tags'];
  const allOf = kind => S[kind].concat(S.trash[kind]);
  const trashCount = () => TRASH_KINDS.reduce((n, k) => n + S.trash[k].length, 0);
  const daysLeft = o => Math.max(1, Math.ceil((o.deletedAt + TRASH_DAYS * DAY - Date.now()) / DAY));

  async function purgeShot(s) {
    await dropMedia(s.photoId);
    await dropMedia(s.audioId);
    await DB.del('shots', s.id);
    S.shots = S.shots.filter(x => x !== s);
    S.trash.shots = S.trash.shots.filter(x => x !== s);
  }
  async function deleteRoll(id) {
    for (const s of allOf('shots').filter(x => x.rollId === id)) await purgeShot(s);
    await DB.del('rolls', id);
    S.rolls = S.rolls.filter(r => r.id !== id);
    S.trash.rolls = S.trash.rolls.filter(r => r.id !== id);
  }
  // endgültig löschen; Ordner und Tags lösen sich dabei von ihren Rollen
  async function purge(kind, o) {
    if (kind === 'rolls') return deleteRoll(o.id);
    if (kind === 'shots') return purgeShot(o);
    if (kind === 'folders') for (const r of allOf('rolls')) if (r.folderId === o.id) { r.folderId = null; await DB.put('rolls', r); }
    if (kind === 'tags') for (const st of ['rolls', 'folders']) for (const x of allOf(st)) if ((x.tags || []).includes(o.id)) { x.tags = x.tags.filter(i => i !== o.id); await DB.put(st, x); }
    await DB.del(kind, o.id);
    S.trash[kind] = S.trash[kind].filter(x => x !== o);
  }
  // Ordner und Tags bleiben an ihren Rollen vermerkt, damit sie beim Wiederherstellen zurückkehren
  async function toTrash(kind, o) {
    o.deletedAt = Date.now();
    await DB.put(kind, o);
    S[kind] = S[kind].filter(x => x !== o);
    S.trash[kind].push(o);
    if (kind === 'rolls') stack.slice().forEach(sh => { if (sh.rollId === o.id) sh.close(); });
    if (kind === 'shots') await renumber(o.rollId, o.no);
  }
  async function fromTrash(kind, o) {
    if (kind === 'shots') {
      const roll = S.trash.rolls.find(r => r.id === o.rollId);
      if (roll) await fromTrash('rolls', roll);
      o.sub = S.shots.filter(x => x.rollId === o.rollId && x.no === o.no).reduce((m, x) => Math.max(m, x.sub), 0) + 1;
    }
    delete o.deletedAt;
    if (kind === 'rolls') toTop(o, o.archived);
    if (kind === 'folders') toTop(o, true);
    await DB.put(kind, o);
    S.trash[kind] = S.trash[kind].filter(x => x !== o);
    S[kind].push(o);
    if (kind === 'shots') await renumber(o.rollId, o.no);
  }
  const trashRoll = id => { const r = rollById(id); return r ? toTrash('rolls', r) : null; };

  function trashLabel(kind, o) {
    const left = t('trashDays')(daysLeft(o));
    if (kind === 'rolls') return { name: o.title, sub: left };
    if (kind === 'folders') return { name: o.name, sub: left };
    if (kind === 'tags') return { name: o.name, sub: left, chip: h('span', { class: 'tags' }, h('i', { class: 'tag', style: 'background:' + o.color }, o.name)) };
    const r = rollById(o.rollId) || S.trash.rolls.find(x => x.id === o.rollId);
    return { name: t('shot') + ' ' + noLabel(o.no, o.sub), sub: [r ? r.title : '', left].filter(Boolean).join(', ') };
  }
  async function trashMenu(key, el) {
    const [, kind, id] = key.split(':');
    const o = (S.trash[kind] || []).find(x => x.id === id);
    if (!o) return;
    const name = trashLabel(kind, o).name;
    const a = await popMenu(el, [
      { label: t('putBack'), value: 'back', icon: 'undo' },
      { label: t('purge'), value: 'purge', icon: 'trash', danger: true }
    ], name);
    if (a === 'back') { await fromTrash(kind, o); refreshAll(); toast(t('putBackDone')); }
    else if (a === 'purge') {
      if (!(await confirmDelete(t('askPurge', { t: name })))) return;
      await purge(kind, o);
      refreshAll();
      toast(t('deleted'));
    }
  }
  function openTrash() {
    const sheet = openSheet({ title: t('trash') });
    holdable(sheet.body, trashMenu);
    sheet.render = () => {
      sheet.setTitle(t('trash'));
      const kids = [h('p', { class: 'group-note lead' }, t('trashHint'))];
      // je Art ein Abschnitt, zuerst was am wenigsten Zeit übrig hat
      TRASH_KINDS.forEach(kind => {
        const list = S.trash[kind].slice().sort((a, b) => a.deletedAt - b.deletedAt);
        if (!list.length) return;
        kids.push(h('p', { class: 'section-label' }, t(kind === 'shots' ? 'shotsHead' : kind)), group(list.map(o => {
          const l = trashLabel(kind, o), key = 't:' + kind + ':' + o.id;
          return keyed(h('button', { class: 'line', 'data-trash': l.name, onclick: e => trashMenu(key, e.currentTarget) },
            h('span', { class: 'line-label two' }, l.chip || h('b', null, l.name), h('small', null, l.sub)), icon('chev')), key);
        })));
      });
      if (!trashCount()) kids.push(h('p', { class: 'empty' }, t('trashEmpty')));
      else kids.push(group(h('button', {
        class: 'line danger', 'data-act': 'trash-empty', onclick: async () => {
          if (!(await confirmDelete(t('askEmptyTrash'), t('emptyTrash')))) return;
          for (const kind of TRASH_KINDS) for (const o of S.trash[kind].slice()) if (S.trash[kind].includes(o)) await purge(kind, o);
          refreshAll();
          toast(t('deleted'));
        }
      }, t('emptyTrash'))));
      sheet.body.replaceChildren(...kids);
    };
    sheet.render();
  }

  async function checkFull(roll) {
    if (roll.archived || roll.askedFull || frameCount(roll.id) < roll.frames) return;
    roll.askedFull = true;
    await DB.put('rolls', roll);
    const a = await alertBox({ title: t('askArchive', { t: roll.title }), buttons: [
      { label: t('later'), value: false, act: 'alert-cancel' },
      { label: t('moreArchive'), value: true, kind: 'bold', act: 'alert-ok' }] });
    if (!a) return;
    roll.archived = true;
    toTop(roll, true);
    await DB.put('rolls', roll);
    stack.slice().forEach(s => { if (s.rollId === roll.id) s.close(); });
    refreshAll();
    toast(t('archived'));
  }

  // ------------------------------------------------------------ Wahlrad
  function makeWheel(values, fmt, value, onChange, small) {
    const IH = small ? 40 : 52;
    let idx = values.indexOf(value);
    if (idx < 0) idx = 0;
    const list = h('div', { class: 'wheel-list' });
    const items = values.map((v, i) => h('div', { class: 'wheel-item', onclick: () => list.scrollTo({ top: i * IH, behavior: 'smooth' }) }, fmt(v)));
    list.append(h('div', { class: 'wheel-pad' }), ...items, h('div', { class: 'wheel-pad' }));
    const mark = () => items.forEach((it, i) => it.classList.toggle('sel', i === idx));
    list.addEventListener('scroll', () => {
      const i = Math.min(values.length - 1, Math.max(0, Math.round(list.scrollTop / IH)));
      if (i !== idx) { idx = i; mark(); haptic(); onChange(values[idx]); }
    }, { passive: true });
    mark();
    const el = h('div', { class: 'wheel' + (small ? ' small' : '') }, h('div', { class: 'wheel-band' }), list);
    el.sync = () => { list.scrollTop = idx * IH; };
    return el;
  }

  // ------------------------------------------------------------ Referenzfoto
  async function loadImage(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      if (img.decode) await img.decode();
      else await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      return img;
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  function drawScaled(img, max) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  const canvasJpeg = (c, q) => new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('jpeg'))), 'image/jpeg', q));
  async function processPhoto(file) {
    const img = await loadImage(file);
    const c = drawScaled(img, 1600);
    const blob = await canvasJpeg(c, 0.85);
    return { buf: await blob.arrayBuffer(), type: 'image/jpeg', w: c.width, h: c.height, thumb: drawScaled(img, 160).toDataURL('image/jpeg', 0.7) };
  }

  // ------------------------------------------------------------ Shot-Dialog
  // Shot anlegen und bearbeiten: Wahlräder oben, darunter Einstellungszeilen, oben rechts sichern
  function openShot(rollId, shotId) {
    const roll = rollById(rollId);
    if (!roll) return;
    const shot = shotId ? S.shots.find(s => s.id === shotId) : null;
    const isNew = !shot;
    const pns = !!roll.pns;
    const last = lastValues(rollId);
    const nn = v => (v == null ? null : v);
    // Point-and-Shoot: Zeit, Blende und Brennweite werden nicht abgefragt, vorhandene Werte bleiben aber gespeichert
    const d = isNew
      ? { no: nextNo(rollId), shutter: null, aperture: null, focal: null, flash: null, ev: null, double: null, lat: null, lon: null, acc: null, date: Date.now(), note: '', audioId: null, photoId: null, thumb: null }
      : { no: shot.no, shutter: nn(shot.shutter), aperture: nn(shot.aperture), focal: nn(shot.focal), flash: shot.flash == null ? null : !!shot.flash, ev: nn(shot.ev), double: shot.double == null ? null : !!shot.double, lat: nn(shot.lat), lon: nn(shot.lon), acc: nn(shot.acc), date: nn(shot.date), note: shot.note || '', audioId: shot.audioId || null, photoId: shot.photoId || null, thumb: shot.thumb || null };
    // bei einem neuen Shot zählt der automatisch ermittelte Standort nicht als Änderung
    const snap = () => JSON.stringify(isNew ? Object.assign({}, d, { lat: 0, lon: 0, acc: 0 }) : d);
    const orig = snap();

    let saving = false;
    let newPhoto = null, newPhotoUrl = null, newAudio = null, newAudioUrl = null;
    let rec = null, player = null;
    const geo = { state: 'idle', token: 0 };

    const sheet = openSheet({
      beforeClose: async () => {
        if (saving) return true;
        if (snap() === orig && !newPhoto && !newAudio && !rec && !(isNew && wstep > 0)) return true;
        const a = await askSave(t('askSaveShot'));
        if (a === 'save') { await finish(); return false; }
        return a === 'discard';
      },
      onClosed: () => {
        geo.token++;
        stopRec(true);
        if (player) player.pause();
        if (newPhotoUrl) URL.revokeObjectURL(newPhotoUrl);
        if (newAudioUrl) URL.revokeObjectURL(newAudioUrl);
      }
    });

    const predictedSub = () => {
      if (!isNew && shot.no === d.no) return shot.sub;
      const same = S.shots.filter(s => s.rollId === rollId && s.no === d.no && (isNew || s.id !== shot.id));
      return same.length ? Math.max(...same.map(s => s.sub)) + 1 : 1;
    };

    // --- Nummer
    const noValue = h('span', { class: 'step-num', 'data-no': '' });
    const noNote = h('p', { class: 'group-note', hidden: true });
    function updateNo() {
      const sub = predictedSub();
      sheet.setTitle(t('shot') + ' ' + noLabel(d.no, sub));
      noValue.textContent = pad2(d.no);
      noNote.hidden = sub <= 1;
      noNote.textContent = sub > 1 ? t('noExists', { n: d.no, m: noLabel(d.no, sub) }) : '';
    }

    // --- Standort
    const locValue = h('span', { class: 'line-value', 'data-loc': '' });
    const locNote = h('p', { class: 'group-note', hidden: true }, t('locDenied'));
    function updateLoc() {
      if (sheet.closed) return;
      locValue.textContent = d.lat != null ? fmtCoord(d.lat, d.lon) : geo.state === 'busy' ? t('locBusy') : geo.state === 'fail' ? t('locFail') : '–';
      locNote.hidden = !(geo.state === 'fail' && geo.why === 'denied' && d.lat == null);
    }
    function locate() {
      if (!navigator.geolocation) { geo.state = 'fail'; updateLoc(); return; }
      const token = ++geo.token;
      geo.state = 'busy'; geo.why = null;
      d.lat = d.lon = d.acc = null;
      updateLoc();
      let got = false, pending = 2;
      const ok = (p, precise) => {
        if (token !== geo.token || sheet.closed) return;
        if (got === 'precise' && !precise) return;
        got = precise ? 'precise' : 'coarse';
        d.lat = p.coords.latitude; d.lon = p.coords.longitude; d.acc = p.coords.accuracy;
        geo.state = 'ok';
        updateLoc();
      };
      const fail = e => {
        if (token !== geo.token || sheet.closed) return;
        if (e && e.code === 1) geo.why = 'denied';
        if (--pending > 0 || got) return;
        geo.state = 'fail';
        updateLoc();
      };
      // erst eine schnelle, grobe Ortung, parallel die genaue per GPS; immer frisch, nie der Standort des vorigen Shots
      navigator.geolocation.getCurrentPosition(p => ok(p, false), fail, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
      navigator.geolocation.getCurrentPosition(p => ok(p, true), fail, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
    }
    async function locMenu(e) {
      const a = await popMenu(e.currentTarget, [
        { label: t('locRetry'), value: 'gps', icon: 'pin' },
        { label: t('pickOnMap'), value: 'map', icon: 'map' },
        d.lat != null ? { label: t('locRemove'), value: 'none', icon: 'trash', danger: true } : null
      ].filter(Boolean), t('st_loc'));
      if (a === 'gps') locate();
      else if (a === 'map') openPicker(d.lat != null ? { lat: d.lat, lon: d.lon, z: 16 } : lastPlace(rollId), c => {
        geo.token++; geo.state = 'ok';
        d.lat = c.lat; d.lon = c.lon; d.acc = null;
        updateLoc();
      });
      else if (a === 'none') { geo.token++; geo.state = 'idle'; d.lat = d.lon = d.acc = null; updateLoc(); }
    }

    // --- Sprachnotiz
    const audioBox = h('div', { class: 'line-slot' });
    const hasAudio = () => !!(newAudio || d.audioId);
    async function startRec() {
      if (!navigator.mediaDevices || !window.MediaRecorder) { toast(t('micFail')); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        const chunks = [];
        const r = { mr, start: Date.now(), discard: false };
        r.done = new Promise(res => { r.resolve = res; });
        mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach(x => x.stop());
          clearInterval(r.timer);
          if (rec === r) rec = null;
          if (!r.discard && chunks.length) {
            const blob = new Blob(chunks, { type: mr.mimeType || chunks[0].type || 'audio/mp4' });
            newAudio = { buf: await blob.arrayBuffer(), type: blob.type };
            if (newAudioUrl) { URL.revokeObjectURL(newAudioUrl); newAudioUrl = null; }
            d.audioId = null;
          }
          r.resolve();
          renderAudio();
        };
        r.timer = setInterval(renderAudio, 500);
        rec = r;
        mr.start();
        renderAudio();
      } catch (e) { toast(t('micFail')); }
    }
    function stopRec(discard) {
      if (!rec) return;
      rec.discard = !!discard;
      if (rec.mr.state !== 'inactive') rec.mr.stop();
    }
    async function togglePlay() {
      if (player) { player.pause(); player = null; renderAudio(); return; }
      let url;
      if (newAudio) url = newAudioUrl || (newAudioUrl = URL.createObjectURL(new Blob([newAudio.buf], { type: newAudio.type })));
      else url = await mediaUrl(d.audioId);
      if (!url) return;
      const a = new Audio(url);
      player = a;
      a.onended = () => { if (player === a) { player = null; renderAudio(); } };
      a.play().catch(() => { if (player === a) { player = null; renderAudio(); } });
      renderAudio();
    }
    function renderAudio() {
      if (sheet.closed) return;
      const label = h('span', { class: 'line-label' }, t('voiceNote'));
      if (rec) {
        const sec = Math.floor((Date.now() - rec.start) / 1000);
        audioBox.replaceChildren(h('button', { class: 'line', 'data-act': 'rec-stop', onclick: () => stopRec(false) },
          label, h('span', { class: 'line-value live' }, h('span', { class: 'rec-dot' }), Math.floor(sec / 60) + ':' + pad2(sec % 60) + '  ' + t('stop'))));
      } else if (hasAudio()) {
        audioBox.replaceChildren(h('div', { class: 'line' },
          h('button', { class: 'line-main', 'data-act': 'play', onclick: togglePlay }, label, h('span', { class: 'line-value accent' }, t(player ? 'stop' : 'play'))),
          h('button', { class: 'line-icon', 'aria-label': t('removeAudio'), 'data-act': 'audio-remove', onclick: () => { if (player) { player.pause(); player = null; } newAudio = null; d.audioId = null; renderAudio(); } }, icon('trash'))));
      } else {
        audioBox.replaceChildren(h('button', { class: 'line', 'data-act': 'rec-start', onclick: startRec }, label, h('span', { class: 'line-value accent' }, t('record'))));
      }
    }

    // --- Referenzfoto
    const refValue = h('span', { class: 'line-value' });
    const hasPhoto = () => !!(newPhoto || d.photoId);
    function updateRef() { refValue.replaceChildren(d.thumb ? h('img', { class: 'line-thumb', src: d.thumb, alt: t('photo') }) : hasPhoto() ? t('photo') : t('add')); }
    async function onPick(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        newPhoto = await processPhoto(file);
        if (newPhotoUrl) URL.revokeObjectURL(newPhotoUrl);
        newPhotoUrl = URL.createObjectURL(new Blob([newPhoto.buf], { type: newPhoto.type }));
        d.photoId = null;
        d.thumb = newPhoto.thumb;
      } catch (err) { toast(t('photoFail')); }
      if (!sheet.closed) { updateRef(); if (onRef) onRef(); }
    }
    const camIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, 'data-in': 'camera', onchange: onPick });
    const libIn = h('input', { type: 'file', accept: 'image/*', hidden: true, 'data-in': 'library', onchange: onPick });
    // Kamera und Mediathek öffnen sich direkt im Antippen, sonst blockiert Safari sie
    async function refMenu(e) {
      const a = await popMenu(e.currentTarget, [
        { label: t('takePhoto'), value: 'cam', icon: 'camera', onTap: () => camIn.click() },
        { label: t('pickPhoto'), value: 'lib', icon: 'image', onTap: () => libIn.click() },
        hasPhoto() ? { label: t('removePhoto'), value: 'none', icon: 'trash', danger: true } : null
      ].filter(Boolean), t('st_ref'));
      if (a === 'none') { newPhoto = null; d.photoId = null; d.thumb = null; updateRef(); }
    }

    async function finish() {
      if (saving) return;
      saving = true;
      try {
        if (rec) { const p = rec.done; stopRec(false); await p; }
        const sub = predictedSub();
        const old = isNew ? {} : { photoId: shot.photoId, audioId: shot.audioId, no: shot.no };
        if (newPhoto) {
          const mid = uid();
          await DB.put('media', { id: mid, buf: newPhoto.buf, type: newPhoto.type, w: newPhoto.w, h: newPhoto.h });
          d.photoId = mid; d.thumb = newPhoto.thumb;
        }
        if (newAudio) {
          const mid = uid();
          await DB.put('media', { id: mid, buf: newAudio.buf, type: newAudio.type });
          d.audioId = mid;
        }
        const record = isNew ? { id: uid(), rollId, createdAt: Date.now() } : shot;
        Object.assign(record, d, { sub, note: d.note.trim() });
        await DB.put('shots', record);
        if (isNew) S.shots.push(record);
        await renumber(rollId, record.no);
        if (old.no != null && old.no !== record.no) await renumber(rollId, old.no);
        if (old.photoId && old.photoId !== d.photoId) await dropMedia(old.photoId);
        if (old.audioId && old.audioId !== d.audioId) await dropMedia(old.audioId);
        sheet.close();
        refreshAll();
        if (isNew) checkFull(roll);
      } catch (e) {
        saving = false;
        toast(t('saveFail'));
      }
    }

    async function removeShot() {
      if (!(await confirmDelete(t('askTrashShot', { n: noLabel(shot.no, shot.sub) })))) return;
      saving = true;
      await toTrash('shots', shot);
      sheet.close();
      refreshAll();
      toast(t('movedToTrash'));
    }

    // --- Neuer Shot: Schritt für Schritt
    let wstep = 0, onRef = null;
    function buildWizard() {
      const STEPS = pns ? ['no', 'flash', 'loc', 'date', 'notes', 'ref'] : ['no', 'shutter', 'aperture', 'focal', 'flash', 'corr', 'loc', 'date', 'notes', 'ref'];
      const wv = { shutter: last.shutter, aperture: last.aperture, focal: last.focal, flash: !!last.flash, ev: last.ev == null ? 0 : last.ev, double: null };
      const lists = { shutter: [SHUTTERS, v => v], aperture: [APERTURES, fmtAperture], focal: [FOCALS, fmtFocal] };
      sheet.body.classList.add('steps');
      sheet.el.append(camIn, libIn);
      const note = h('textarea', { class: 'input', placeholder: t('notePh'), 'aria-label': t('st_notes'), oninput: e => { d.note = e.target.value; } });
      const content = key => {
        if (key === 'no') {
          return h('div', { class: 'step-box' },
            h('div', { class: 'stepper' },
              h('button', { 'aria-label': '−', 'data-act': 'no-minus', onclick: () => { haptic(); d.no = Math.max(0, d.no - 1); updateNo(); render(); } }, '−'),
              h('div', { class: 'bignum', 'data-no': '' }, pad2(d.no)),
              h('button', { 'aria-label': '+', 'data-act': 'no-plus', onclick: () => { haptic(); d.no++; updateNo(); render(); } }, '+')),
            noNote);
        }
        if (lists[key]) {
          const w = makeWheel(lists[key][0], lists[key][1], wv[key], v => { wv[key] = v; });
          w.dataset.wheel = key;
          return w;
        }
        if (key === 'flash') {
          return h('div', { class: 'seg flash-seg' }, [[false, 'flashOff'], [true, 'flashOn']].map(([v, k]) =>
            h('button', { class: wv.flash === v ? 'on' : '', 'data-flash': String(v), onclick: () => { haptic(); wv.flash = v; render(); } }, v ? icon('bolt') : null, t(k))));
        }
        if (key === 'corr') {
          // eine zweite Aufnahme auf derselben Nummer ist eine Doppelbelichtung
          if (wv.double == null) wv.double = predictedSub() > 1;
          const values = EVS.includes(wv.ev) ? EVS : EVS.concat(wv.ev).sort((a, b) => a - b);
          const w = makeWheel(values, v => fmtEv(v) + ' EV', wv.ev, v => { wv.ev = v; });
          w.dataset.wheel = 'ev';
          const box = h('div', { class: 'step-box' }, w, group(lineSwitch(t('fDouble'), wv.double, v => { haptic(); wv.double = v; }, 'double')));
          box.sync = () => w.sync();
          return box;
        }
        if (key === 'loc') {
          return h('div', { class: 'step-box' },
            h('div', { class: 'big-value' }, locValue), locNote,
            h('button', { class: 'btn', onclick: () => { haptic(); locate(); } }, icon('pin'), t('locRetry')),
            h('button', { class: 'btn', 'data-act': 'pick-map', onclick: () => openPicker(d.lat != null ? { lat: d.lat, lon: d.lon, z: 16 } : lastPlace(rollId), c => {
              geo.token++; geo.state = 'ok';
              d.lat = c.lat; d.lon = c.lon; d.acc = null;
              updateLoc();
            }) }, icon('map'), t('pickOnMap')));
        }
        if (key === 'date') {
          return h('input', { class: 'date-input', type: 'datetime-local', value: toLocalInput(d.date), 'data-field': 'date', 'aria-label': t('st_date'), oninput: e => { const v = e.target.value; d.date = v ? new Date(v).getTime() : null; } });
        }
        if (key === 'notes') {
          note.value = d.note;
          return h('div', { class: 'step-box' }, note, group(audioBox));
        }
        if (hasPhoto()) {
          const img = h('img', { class: 'photo-preview', alt: '' });
          if (newPhotoUrl) img.src = newPhotoUrl;
          else mediaUrl(d.photoId).then(u => { if (u) img.src = u; });
          return h('div', { class: 'step-box' }, img,
            h('button', { class: 'btn', 'data-act': 'photo-remove', onclick: () => { newPhoto = null; d.photoId = null; d.thumb = null; render(); } }, icon('trash'), t('removePhoto')));
        }
        return h('div', { class: 'step-box' },
          h('button', { class: 'btn', onclick: () => camIn.click() }, icon('camera'), t('takePhoto')),
          h('button', { class: 'btn', onclick: () => libIn.click() }, icon('image'), t('pickPhoto')));
      };
      const commit = key => {
        if (lists[key]) d[key] = wv[key];
        else if (key === 'flash') d.flash = wv.flash;
        else if (key === 'corr') { d.ev = wv.ev; d.double = wv.double; }
      };
      const skip = key => {
        if (lists[key] || key === 'flash') d[key] = null;
        else if (key === 'loc') { geo.token++; geo.state = 'idle'; d.lat = d.lon = d.acc = null; updateLoc(); }
        else if (key === 'date') d.date = null;
        else if (key === 'corr') { d.ev = null; d.double = null; }
        else if (key === 'notes') { stopRec(true); if (player) { player.pause(); player = null; } d.note = ''; newAudio = null; d.audioId = null; renderAudio(); }
        else { newPhoto = null; d.photoId = null; d.thumb = null; }
      };
      const go = n => {
        if (STEPS[wstep] === 'notes') { stopRec(false); if (player) { player.pause(); player = null; } }
        if (n >= STEPS.length) { finish(); return; }
        wstep = n;
        render();
      };
      function render() {
        const key = STEPS[wstep], c = content(key), lastStep = wstep === STEPS.length - 1;
        sheet.body.replaceChildren(
          h('div', { class: 'progress', 'aria-hidden': 'true' }, STEPS.map((_, i) => h('i', { class: i === wstep ? 'on' : i < wstep ? 'done' : '' }))),
          h('h2', { class: 'step-title' }, t('st_' + key)), c);
        if (key !== 'notes') c.classList.add('low');
        if (c.sync) c.sync();
        sheet.foot.className = 'sheet-foot three';
        sheet.foot.replaceChildren(
          h('button', { class: 'btn ghost' + (wstep === 0 ? ' invisible' : ''), 'data-act': 'back', onclick: () => go(wstep - 1) }, t('back')),
          h('button', { class: 'btn ghost' + (key === 'no' ? ' invisible' : ''), 'data-act': 'skip', onclick: () => { skip(key); go(wstep + 1); } }, t('skip')),
          h('button', { class: 'btn primary', 'data-act': lastStep ? 'finish' : 'next', onclick: () => { haptic(); commit(key); go(wstep + 1); } }, t(lastStep ? 'finish' : 'next')));
      }
      onRef = () => { if (STEPS[wstep] === 'ref') render(); };
      render();
    }

    // --- Shot bearbeiten: alles auf einer Seite
    function buildFull() {
    const wheels = pns ? [] : [['shutter', SHUTTERS, v => v], ['aperture', APERTURES, fmtAperture], ['focal', FOCALS, fmtFocal]].map(([k, vals, f]) => {
      const list = [null].concat(vals);
      if (d[k] != null && !list.includes(d[k])) list.splice(1, 0, d[k]);
      const w = makeWheel(list, v => (v == null ? '–' : f(v)), d[k], v => { d[k] = v; }, true);
      w.dataset.wheel = k;
      return w;
    });
    const evValue = h('span', { class: 'line-value' });
    const showEv = () => { evValue.textContent = d.ev == null ? '–' : fmtEv(d.ev) + ' EV'; };
    showEv();
    const evMenu = async e => {
      const vals = [null].concat(EVS.includes(d.ev) || d.ev == null ? EVS : EVS.concat(d.ev).sort((a, b) => a - b));
      const a = await popMenu(e.currentTarget, vals.map(v => ({ label: v == null ? '–' : fmtEv(v) + ' EV', value: v == null ? 'none' : String(v), checked: d.ev === v })), t('fEv'));
      if (a == null) return;
      d.ev = a === 'none' ? null : Number(a);
      showEv();
    };
    const dateIn = h('input', { type: 'datetime-local', value: toLocalInput(d.date), 'data-field': 'date', 'aria-label': t('st_date'), oninput: e => { const v = e.target.value; d.date = v ? new Date(v).getTime() : null; } });
    const note = h('textarea', { class: 'line-area', placeholder: t('notePh'), 'aria-label': t('st_notes'), rows: 2, oninput: e => { d.note = e.target.value; } });
    note.value = d.note;
    sheet.body.append(...[
      wheels.length ? h('div', { class: 'wheels3' },
        h('div', { class: 'wheels3-head' }, h('span', null, t('st_shutter')), h('span', null, t('st_aperture')), h('span', null, t('st_focal'))),
        h('div', { class: 'wheels3-row' }, wheels)) : null,
      group(
        h('div', { class: 'line' }, h('span', { class: 'line-label' }, t('st_no')),
          h('span', { class: 'stepper-s' },
            h('button', { 'aria-label': '−', 'data-act': 'no-minus', onclick: () => { haptic(); d.no = Math.max(0, d.no - 1); updateNo(); } }, '−'),
            noValue,
            h('button', { 'aria-label': '+', 'data-act': 'no-plus', onclick: () => { haptic(); d.no++; updateNo(); } }, '+'))),
        lineSwitch(t('st_flash'), d.flash === true, v => { haptic(); d.flash = v; }, 'flash')),
      noNote,
      pns ? null : group(
        lineBtn(t('fEv'), evValue, evMenu, { 'data-act': 'ev' }),
        lineSwitch(t('fDouble'), d.double === true, v => { haptic(); d.double = v; }, 'double')),
      group(lineBtn(t('st_loc'), locValue, e => { haptic(); locMenu(e); }, { 'data-act': 'loc' }), line(t('st_date'), dateIn)),
      locNote,
      group(note, audioBox, lineBtn(t('st_ref'), refValue, refMenu, { 'data-act': 'ref' })),
      isNew ? null : group(h('button', { class: 'line danger', 'data-act': 'shot-delete', onclick: removeShot }, t('deleteShot'))),
      camIn, libIn
    ].filter(Boolean));
    wheels.forEach(w => w.sync());
    }
    if (isNew) buildWizard();
    else {
      sheet.setRight(h('button', { class: 'icon-btn ok', 'data-act': 'finish', 'aria-label': t('save'), onclick: () => { haptic(); finish(); } }, icon('check')));
      buildFull();
    }
    if (d.audioId) mediaUrl(d.audioId);
    updateNo(); updateLoc(); updateRef(); renderAudio();
    if (isNew) locate();
  }

  // ------------------------------------------------------------ Tags
  const TAG_COLORS = ['#B5533C', '#C98A2B', '#6E8B4E', '#3F8C8C', '#4E6FAE', '#8A5C9E', '#7A6A5A'];
  function tagChips(ids) {
    const list = (ids || []).map(id => S.tags.find(x => x.id === id)).filter(Boolean);
    if (!list.length) return null;
    return h('span', { class: 'tags' }, list.map(x => h('i', { class: 'tag', style: 'background:' + x.color }, x.name)));
  }

  function openTags(target, store) {
    const sheet = openSheet({ title: t('tags') });
    let color = TAG_COLORS[0];
    const name = h('input', { type: 'text', placeholder: t('tagName'), 'data-field': 'tag-name', autocomplete: 'off', enterkeyhint: 'done' });
    const save = async () => { await DB.put(store, target); refreshAll(); };
    const has = id => (target.tags || []).includes(id);
    async function removeTag(x) {
      if (!(await confirmDelete(t('askTrashTag', { t: x.name })))) return;
      await toTrash('tags', x);
      refreshAll();
      toast(t('movedToTrash'));
    }
    sheet.render = () => {
      sheet.setTitle(t('tags'));
      sheet.body.replaceChildren(
        S.tags.length
          ? h('div', null, S.tags.map(x => h('div', { class: 'tag-row' },
            h('button', { class: 'tag-toggle' + (has(x.id) ? ' on' : ''), 'data-tag': x.name, onclick: async () => { target.tags = has(x.id) ? target.tags.filter(i => i !== x.id) : (target.tags || []).concat(x.id); await save(); } },
              h('i', { class: 'tag', style: 'background:' + x.color }, x.name), h('span', { class: 'check' })),
            h('button', { class: 'icon-btn', 'aria-label': t('delete'), onclick: () => removeTag(x) }, icon('trash')))))
          : h('p', { class: 'note' }, t('noTags')),
        h('p', { class: 'section-label' }, t('newTag')),
        h('label', { class: 'field' }, name),
        h('div', { class: 'dots' }, TAG_COLORS.map(c => h('button', { class: 'dot' + (c === color ? ' on' : ''), style: 'background:' + c, 'aria-label': c, onclick: () => { color = c; sheet.render(); } }))),
        h('button', {
          class: 'btn below', 'data-act': 'tag-add', onclick: async () => {
            const n = name.value.trim();
            if (!n) return;
            const tag = { id: uid(), name: n, color };
            await DB.put('tags', tag);
            S.tags.push(tag);
            target.tags = (target.tags || []).concat(tag.id);
            name.value = '';
            await save();
          }
        }, t('addTag')));
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Ordner im Archiv
  async function createFolder() {
    const name = await askText(t('newFolder'), '', t('folderName'));
    if (!name) return null;
    const f = { id: uid(), name, tags: [], createdAt: Date.now() };
    toTop(f, true);
    await DB.put('folders', f);
    S.folders.push(f);
    return f;
  }

  function openFolder(id) {
    const sheet = openSheet({});
    sheet.setRight(h('button', {
      class: 'icon-btn', 'aria-label': t('more'), 'data-act': 'more', onclick: e => folderMenu(id, () => sheet.close(), e.currentTarget)
    }, icon('more')));
    sortable(sheet.body, {
      onMove: async (key, index) => { await reorderTo(byOrder(archivedRolls().filter(r => r.folderId === id)).map(o => ({ obj: o, folder: false, key: 'r:' + o.id })), key, index); refreshAll(); },
      onHold: keyMenu
    });
    sheet.render = () => {
      const f = folderById(id);
      if (!f) { sheet.close(); return; }
      sheet.setTitle(f.name);
      const rolls = byOrder(archivedRolls().filter(r => r.folderId === id));
      const chips = tagChips(f.tags);
      sheet.body.replaceChildren(...[
        chips ? h('div', { class: 'tags-block' }, chips) : null,
        ...(rolls.length ? [group(rolls.map(rollLine))] : [h('p', { class: 'empty' }, t('emptyFolder'))])
      ].filter(Boolean));
    };
    sheet.render();
  }

  async function moveToFolder(roll, anchor) {
    const folders = S.folders.slice().sort((a, b) => a.name.localeCompare(b.name));
    const a = await popMenu(anchor, [
      ...folders.map(f => ({ label: f.name, value: f.id, icon: 'folder', checked: roll.folderId === f.id })),
      { label: t('newFolder'), value: '__new', icon: 'plus', checked: false },
      roll.folderId && folderById(roll.folderId) ? { label: t('noFolder'), value: '__none', checked: false } : null
    ].filter(Boolean), t('moreFolder'));
    if (!a) return false;
    if (a === '__new') { const f = await createFolder(); if (!f) return false; roll.folderId = f.id; }
    else roll.folderId = a === '__none' ? null : a;
    await DB.put('rolls', roll);
    return true;
  }

  // ------------------------------------------------------------ Filter im Archiv
  function runFilter(c) {
    const dateOn = c.years.size || c.from || c.to;
    const inDate = s => {
      if (!dateOn) return true;
      if (s.date == null) return false;
      if (c.years.size && !c.years.has(new Date(s.date).getFullYear())) return false;
      const day = toLocalInput(s.date).slice(0, 10);
      return !(c.from && day < c.from) && !(c.to && day > c.to);
    };
    const rollOk = r => {
      const f = folderById(r.folderId);
      const tg = (r.tags || []).concat(f ? f.tags || [] : []);
      return (!c.tags.size || tg.some(x => c.tags.has(x))) && (!c.cams.size || c.cams.has(r.camera)) &&
        (!c.films.size || c.films.has(filmLabel(r))) && (!c.isos.size || c.isos.has(r.iso));
    };
    const rolls = [], shots = [];
    archivedRolls().filter(rollOk).forEach(r => {
      const ss = rollShots(r.id).reverse().filter(inDate).filter(s => !c.flash.size || (s.flash != null && c.flash.has(!!s.flash)));
      if ((!dateOn && !c.flash.size) || ss.length) rolls.push(r);
      shots.push(...ss);
    });
    const onlyTags = c.tags.size && !c.cams.size && !c.films.size && !c.isos.size && !dateOn && !c.flash.size;
    const folders = c.tags.size ? S.folders.filter(f => (f.tags || []).some(x => c.tags.has(x)) && (onlyTags || rolls.some(r => r.folderId === f.id))) : [];
    return { folders, rolls, shots };
  }

  function openFilter() {
    const c = { tags: new Set(), cams: new Set(), films: new Set(), isos: new Set(), years: new Set(), flash: new Set(), from: '', to: '' };
    const sheet = openSheet({ title: t('filter') });
    const go = h('button', { class: 'btn primary', 'data-act': 'filter-go', onclick: () => openResults(c) });
    sheet.foot.append(go);
    const upd = () => { const r = runFilter(c); go.textContent = t('showHits')(r.rolls.length, r.shots.length); };
    const fromIn = h('input', { type: 'date', 'aria-label': t('from'), 'data-field': 'from', oninput: e => { c.from = e.target.value; upd(); } });
    const toIn = h('input', { type: 'date', 'aria-label': t('to'), 'data-field': 'to', oninput: e => { c.to = e.target.value; upd(); } });
    sheet.render = () => {
      sheet.setTitle(t('filter'));
      const rolls = archivedRolls();
      const uniq = arr => [...new Set(arr.filter(v => v != null && v !== ''))];
      const group = (label, set, values, fmt, colorOf) => values.length ? [
        h('p', { class: 'section-label' }, label),
        h('div', { class: 'pills' }, values.map(v => h('button', { class: 'pill' + (set.has(v) ? ' on' : ''), 'data-pill': fmt ? fmt(v) : v, onclick: () => { if (set.has(v)) set.delete(v); else set.add(v); sheet.render(); } },
          colorOf ? h('i', { class: 'pill-dot', style: 'background:' + colorOf(v) }) : null, fmt ? fmt(v) : v)))
      ] : [];
      const tagOf = id => S.tags.find(x => x.id === id) || {};
      const top = sheet.body.scrollTop;
      sheet.body.replaceChildren(
        ...group(t('tags'), c.tags, S.tags.map(x => x.id), id => tagOf(id).name, id => tagOf(id).color),
        ...group(t('fCamera'), c.cams, uniq(rolls.map(r => r.camera)).sort()),
        ...group(t('fFilm'), c.films, uniq(rolls.map(filmLabel)).sort()),
        ...group(t('fIso'), c.isos, uniq(rolls.map(r => r.iso)).sort((a, b) => a - b)),
        ...group(t('st_flash'), c.flash, [true, false], v => cap(t(v ? 'yes' : 'no'))),
        ...group(t('year'), c.years, uniq(shotsOf(rolls).filter(s => s.date != null).map(s => new Date(s.date).getFullYear())).sort()),
        h('p', { class: 'section-label' }, t('period')),
        h('div', { class: 'form' },
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, t('from')), fromIn),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, t('to')), toIn)));
      sheet.body.scrollTop = top;
      upd();
    };
    sheet.render();
  }

  function openResults(c) {
    const sheet = openSheet({ title: t('results') });
    holdable(sheet.body, keyMenu);
    sheet.render = () => {
      sheet.setTitle(t('results'));
      const r = runFilter(c);
      const kids = [];
      if (!r.folders.length && !r.rolls.length && !r.shots.length) kids.push(h('p', { class: 'empty' }, t('noHits')));
      if (r.shots.some(s => s.lat != null)) kids.push(h('button', { class: 'btn', 'data-act': 'results-map', onclick: () => openMap(t('results'), r.shots) }, icon('map'), t('showOnMap')));
      const section = (key, n) => h('p', { class: 'section-label' }, t(key) + ' (' + n + ')');
      if (r.folders.length) { kids.push(section('folders', r.folders.length)); kids.push(group(r.folders.map(f => keyed(folderRow(f, () => openFolder(f.id)), 'f:' + f.id)))); }
      if (r.rolls.length) { kids.push(section('rolls', r.rolls.length)); kids.push(group(r.rolls.map(rollLine))); }
      if (r.shots.length) { kids.push(section('photos', r.shots.length)); kids.push(group(r.shots.slice(0, 300).map(s => keyed(shotRow(s, true), 's:' + s.id)))); }
      sheet.body.replaceChildren(...kids);
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Karte
  function openMap(title, shots, line) {
    const pts = shots.filter(s => s.lat != null && s.lon != null);
    const sheet = openSheet({ title });
    if (!pts.length) { sheet.body.append(h('p', { class: 'empty' }, t('noLocations'))); return; }
    sheet.body.classList.add('map-body');
    const box = h('div', { class: 'map' });
    sheet.body.append(box);
    const show = s => {
      const roll = rollById(s.rollId) || { title: '' };
      const label = roll.title + ', ' + t('shot') + ' ' + noLabel(s.no, s.sub);
      const v = visible(roll)(s);
      const vals = [v.shutter == null ? null : fmtShutterUnit(v.shutter), v.aperture == null ? null : fmtAperture(v.aperture), v.focal == null ? null : fmtFocal(v.focal), v.ev ? fmtEv(v.ev) + ' EV' : null].filter(Boolean).join('   ');
      sheet.foot.className = 'sheet-foot';
      sheet.foot.replaceChildren(
        h('div', { class: 'map-card', 'data-map-card': '' },
          s.thumb ? h('img', { class: 'shot-thumb', src: s.thumb, alt: '' }) : null,
          h('div', null, h('b', null, label), h('span', null, [vals, s.date != null ? fmtDateTime(s.date) : null].filter(Boolean).join(', ')), s.note ? h('span', null, s.note) : null)),
        h('div', { class: 'seg' },
          h('button', { onclick: () => openShot(s.rollId, s.id) }, t('openShot')),
          h('a', { href: 'https://maps.apple.com/?ll=' + s.lat + ',' + s.lon + '&q=' + encodeURIComponent(label), target: '_blank', rel: 'noopener' }, t('appleMaps'))));
    };
    window.FilmMap.create(box, pts.map(s => ({ lat: s.lat, lon: s.lon, label: noLabel(s.no, s.sub), data: s })), { line, onSelect: p => show(p.data) });
    if (navigator.onLine === false) toast(t('mapOffline'));
  }

  // ------------------------------------------------------------ Scans zuordnen
  const IMG_RE = /\.(jpe?g|png|tiff?|webp|heic)$/i;
  function exifMeta(roll, s) {
    s = visible(roll)(s);
    const sh = s.shutter;
    const exposure = sh == null || sh === 'B' ? null : /s$/.test(sh) ? [parseInt(sh, 10), 1] : sh.split('/').map(Number);
    return {
      description: s.note || '', model: roll.camera || '', date: s.date, exposure,
      fnumber: s.aperture == null ? null : Number(s.aperture), iso: roll.ei || roll.iso || null, focal: s.focal, flash: s.flash == null ? null : !!s.flash, ev: s.ev, lat: s.lat, lon: s.lon,
      comment: [filmLabel(roll) ? 'Film: ' + filmLabel(roll) : '', roll.push ? 'Push/Pull ' + (roll.push > 0 ? '+' : '') + roll.push : '', 'Shot ' + noLabel(s.no, s.sub), s.double ? 'Double exposure' : ''].filter(Boolean).join(', ')
    };
  }

  function openScans(rollId) {
    const roll = rollById(rollId);
    if (!roll) return;
    const frames = [...new Set(S.shots.filter(s => s.rollId === rollId).map(s => s.no))].sort((a, b) => a - b);
    const shotFor = no => S.shots.filter(s => s.rollId === rollId && s.no === no).sort((a, b) => a.sub - b.sub)[0];
    let items = null, busy = false, progress = '';
    const sheet = openSheet({ title: t('scans') });
    const go = h('button', { class: 'btn primary', 'data-act': 'scan-run', onclick: run });
    const zipIn = h('input', { type: 'file', accept: '.zip,application/zip,application/x-zip-compressed', hidden: true, 'data-in': 'scan-zip', onchange: e => load(e, true) });
    const imgIn = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, 'data-in': 'scan-files', onchange: e => load(e, false) });
    const assign = () => items.forEach((it, i) => { it.no = i < frames.length ? frames[i] : null; });

    async function load(e, isZip) {
      const files = [...(e.target.files || [])];
      e.target.value = '';
      if (!files.length) return;
      try {
        let list;
        if (isZip) {
          const zip = await window.JSZip.loadAsync(files[0]);
          list = Object.values(zip.files).filter(f => !f.dir && IMG_RE.test(f.name) && !/(^|\/)(\._|__MACOSX\/)/.test(f.name))
            .map(f => ({ name: f.name.split('/').pop(), path: f.name, read: () => f.async('uint8array') }));
        } else {
          list = files.filter(f => IMG_RE.test(f.name)).map(f => ({ name: f.name, path: f.name, read: async () => new Uint8Array(await f.arrayBuffer()) }));
        }
        if (!list.length) { toast(t('scanNone')); return; }
        list.sort((a, b) => window.FilmScan.natural(a.path, b.path));
        items = list;
        assign();
        sheet.render();
        thumbs();
      } catch (err) { toast(t('scanFail')); }
    }

    // Vorschaubilder nacheinander erzeugen, damit der Speicher nicht vollläuft
    async function thumbs() {
      const mine = items;
      for (;;) {
        if (sheet.closed || items !== mine || busy) return;
        const it = mine.find(x => !x.tried);
        if (!it) return;
        it.tried = true;
        if (!/\.(jpe?g|png|webp)$/i.test(it.name)) continue;
        try {
          const img = await loadImage(new Blob([await it.read()]));
          it.thumb = drawScaled(img, 120).toDataURL('image/jpeg', 0.6);
          if (it.imgEl) it.imgEl.src = it.thumb;
        } catch (e) {}
      }
    }

    async function run() {
      if (busy || !items) return;
      busy = true;
      try {
        const out = new window.JSZip(), used = new Set(), base = slug(roll.title);
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          progress = (i + 1) + '/' + items.length;
          go.textContent = t('scanBusy') + ' ' + progress;
          go.disabled = true;
          let bytes = await it.read(), name = it.name;
          if (it.no != null) {
            const ext = (it.name.match(/\.[^.]+$/) || ['.jpg'])[0].toLowerCase();
            name = base + '_' + pad2(it.no) + ext;
            if (window.FilmScan.isJpeg(bytes)) { try { bytes = window.FilmScan.writeExif(bytes, exifMeta(roll, shotFor(it.no))); } catch (e) {} }
          }
          let n = name, k = 2;
          while (used.has(n.toLowerCase())) n = name.replace(/(\.[^.]+)$/, '_' + (k++) + '$1');
          used.add(n.toLowerCase());
          out.file(n, bytes, { binary: true });
        }
        const blob = await out.generateAsync({ type: 'blob', compression: 'STORE' });
        const file = new File([blob], base + '-scans.zip', { type: 'application/zip' });
        busy = false;
        sheet.render();
        await offerFile(t('scanReady'), file);
      } catch (e) {
        busy = false;
        sheet.render();
        toast(t('scanFail'));
      }
    }

    sheet.render = () => {
      sheet.setTitle(t('scans'));
      if (!items) {
        sheet.foot.replaceChildren();
        sheet.body.replaceChildren(
          h('p', { class: 'note' }, t('scanIntro')),
          h('div', { class: 'btn-stack' },
            h('button', { class: 'btn', onclick: () => zipIn.click() }, t('scanZip')),
            h('button', { class: 'btn', onclick: () => imgIn.click() }, icon('image'), t('scanFiles'))),
          zipIn, imgIn);
        return;
      }
      const mapped = items.filter(it => it.no != null).length;
      sheet.body.replaceChildren(
        h('p', { class: 'note', 'data-scan-info': '' }, t('scanInfo')(items.length, frames.length, mapped)),
        h('button', { class: 'btn', 'data-act': 'scan-reverse', onclick: () => { items.reverse(); assign(); sheet.render(); } }, t('scanReverse')),
        h('div', { class: 'scan-list' }, items.map(it => {
          const sel = h('select', { 'aria-label': t('shot'), onchange: e => { it.no = e.target.value === '' ? null : Number(e.target.value); sheet.render(); } },
            h('option', { value: '' }, '–'), frames.map(n => h('option', { value: n }, pad2(n))));
          sel.value = it.no == null ? '' : String(it.no);
          it.imgEl = h('img', { class: 'shot-thumb', alt: '', src: it.thumb || null });
          return h('div', { class: 'scan-row', 'data-scan': it.name }, it.imgEl, h('span', { class: 'scan-name' }, it.name), h('label', { class: 'field' }, sel));
        })),
        zipIn, imgIn);
      sheet.foot.className = 'sheet-foot';
      if (!sheet.foot.firstChild) sheet.foot.append(go);
      go.textContent = busy ? t('scanBusy') + ' ' + progress : t('scanRun');
      go.disabled = busy || !mapped;
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Import aus CSV
  const IMPORT_FIELDS = [
    ['roll', 'imRoll'], ['no', 'st_no'], ['shutter', 'st_shutter'], ['aperture', 'st_aperture'], ['focal', 'st_focal'], ['flash', 'st_flash'], ['ev', 'fEv'], ['double', 'fDouble'],
    ['date', 'st_date'], ['time', 'cTime'], ['lat', 'cLat'], ['lon', 'cLon'], ['loc', 'imLoc'], ['notes', 'st_notes'],
    ['film', 'fFilm'], ['iso', 'fIso'], ['camera', 'fCamera']
  ];
  // Spaltennamen aus dem eigenen Export aller Sprachen ebenfalls erkennen
  function importNames() {
    const cols = { cShot: 'no', cShutter: 'shutter', cAperture: 'aperture', cFocal: 'focal', cFlash: 'flash', cEv: 'ev', cDouble: 'double', cLat: 'lat', cLon: 'lon', cDate: 'date', cTime: 'time', cNotes: 'notes' };
    const metas = { fTitle: 'title', fFilm: 'film', fCamera: 'camera', fIso: 'iso', fEi: 'ei', fPush: 'push', fNote: 'note', mShots: 'frames' };
    const extra = {}, metaMap = {};
    Object.values(window.I18N).forEach(d => {
      for (const k in cols) if (typeof d[k] === 'string') (extra[cols[k]] = extra[cols[k]] || []).push(d[k]);
      for (const k in metas) if (typeof d[k] === 'string') metaMap[window.FilmImport.norm(d[k])] = metas[k];
    });
    return { extra, metaMap };
  }
  const loadLearned = () => { try { return JSON.parse(localStorage.getItem('filmlog.csvmap') || '{}'); } catch (e) { return {}; } };

  function openImport() {
    const sheet = openSheet({ title: t('importCsv') });
    const names = importNames();
    let parsed = null, map = {}, fileTitle = '', busy = false;
    const go = h('button', { class: 'btn primary', 'data-act': 'import-go', onclick: run });
    const fileIn = h('input', {
      type: 'file', accept: '.csv,.tsv,.txt,text/csv,text/plain', hidden: true, 'data-in': 'import', onchange: async e => {
        const f = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!f) return;
        try {
          const buf = await f.arrayBuffer();
          let text = new TextDecoder('utf-8').decode(buf);
          if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buf);
          const p = window.FilmImport.parseCsv(text);
          if (!p.rows.length) { toast(t('importNone')); return; }
          parsed = p;
          fileTitle = f.name.replace(/\.[^.]+$/, '');
          map = window.FilmImport.guess(p.header, loadLearned(), names.extra);
          sheet.render();
        } catch (err) { toast(t('importFail')); }
      }
    });
    const result = () => window.FilmImport.build(parsed, map, { title: fileTitle, metaMap: names.metaMap });

    async function run() {
      if (busy || !parsed) return;
      busy = true;
      try {
        const learned = loadLearned();
        for (const f in map) if (map[f] != null) learned[window.FilmImport.norm(parsed.header[map[f]])] = f;
        try { localStorage.setItem('filmlog.csvmap', JSON.stringify(learned)); } catch (e) {}
        const list = result(), now = Date.now(), rolls = [], shots = [], top = topOrder(true);
        list.forEach((g, gi) => {
          const dates = g.shots.map(s => s.date).filter(x => x != null);
          const roll = Object.assign({ id: uid(), createdAt: dates.length ? Math.min(...dates) : now + gi, archived: true, askedFull: true, tags: [], folderId: null, pns: false, order: top - list.length + 1 + gi }, g.roll);
          rolls.push(roll);
          const count = {};
          g.shots.forEach(s => { count[s.no] = (count[s.no] || 0) + 1; });
          g.shots.forEach((s, i) => shots.push(Object.assign({ id: uid(), rollId: roll.id, createdAt: now + i, audioId: null, photoId: null, thumb: null }, s, count[s.no] > 1 ? { double: true } : null)));
        });
        await DB.run(['rolls', 'shots'], 'readwrite', tx => {
          rolls.forEach(r => tx.objectStore('rolls').put(r));
          shots.forEach(s => tx.objectStore('shots').put(s));
        });
        S.rolls.push(...rolls);
        S.shots.push(...shots);
        sheet.close();
        refreshAll();
        toast(t('imported')(rolls.length, shots.length));
      } catch (e) {
        busy = false;
        toast(t('importFail'));
      }
    }

    sheet.render = () => {
      sheet.setTitle(t('importCsv'));
      if (!parsed) {
        sheet.foot.replaceChildren();
        sheet.body.replaceChildren(h('p', { class: 'note' }, t('importIntro')), h('button', { class: 'btn', onclick: () => fileIn.click() }, t('importPick')), fileIn);
        return;
      }
      const sample = parsed.rows[0] || [];
      const list = result();
      const top = sheet.body.scrollTop;
      sheet.body.replaceChildren(
        h('p', { class: 'note', 'data-import-info': '' }, t('importInfo')(parsed.rows.length, parsed.header.filter(Boolean).length)),
        h('div', { class: 'map-list' }, IMPORT_FIELDS.map(([f, label]) => {
          const sel = h('select', { 'data-map': f, 'aria-label': t(label), onchange: e => { if (e.target.value === '') delete map[f]; else map[f] = Number(e.target.value); sheet.render(); } },
            h('option', { value: '' }, '–'), parsed.header.map((hd, i) => (hd ? h('option', { value: i }, hd) : null)));
          sel.value = map[f] == null ? '' : String(map[f]);
          return h('div', { class: 'map-row' },
            h('span', { class: 'map-label' }, t(label), map[f] != null && sample[map[f]] ? h('small', null, sample[map[f]]) : null),
            h('label', { class: 'field' }, sel));
        })),
        fileIn);
      sheet.body.scrollTop = top;
      sheet.foot.className = 'sheet-foot';
      if (!sheet.foot.firstChild) sheet.foot.append(go);
      go.textContent = t('importGo')(list.length, list.reduce((n, g) => n + g.shots.length, 0));
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Eigene Farben
  const hexRgb = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
  const rgbHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mixHex = (a, b, k) => { const p = hexRgb(a), q = hexRgb(b); return rgbHex(p.map((v, i) => v + (q[i] - v) * k)); };
  const lumHex = x => { const c = hexRgb(x).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const onHex = x => (lumHex(x) > 0.36 ? '#141414' : '#FFFFFF');
  function hslHex(hh, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + hh / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgbHex([f(0) * 255, f(8) * 255, f(4) * 255]);
  }
  const CUSTOM_KEYS = ['bg', 'card', 'text', 'accent', 'second'];
  const CUSTOM_DEFAULT = { bg: '#EEEDE9', card: '#DEDCCB', text: '#2B2622', accent: '#98503F', second: '#A2B08F' };
  // aus fünf gewählten Farben alle Töne der Oberfläche ableiten
  function customVars(c) {
    return {
      '--bg': c.bg, '--sheet': c.bg, '--card': c.card, '--line': mixHex(c.card, c.text, 0.22), '--text': c.text, '--muted': mixHex(c.text, c.bg, 0.36),
      '--accent': c.accent, '--on-accent': onHex(c.accent), '--second': c.second, '--on-second': onHex(c.second), '--third': mixHex(c.accent, c.bg, 0.5),
      '--shade': lumHex(c.bg) < 0.2 ? 'rgba(0, 0, 0, .66)' : 'rgba(30, 30, 30, .42)'
    };
  }
  function customColors() {
    const c = Object.assign({}, CUSTOM_DEFAULT, S.settings.custom || {});
    CUSTOM_KEYS.forEach(k => { if (!/^#[0-9a-f]{6}$/i.test(c[k])) c[k] = CUSTOM_DEFAULT[k]; });
    return c;
  }
  const PALETTE = (() => {
    const light = [96, 88, 76, 62, 48, 34, 20, 9], rows = [light.map(l => hslHex(40, 6, l))];
    [0, 18, 36, 52, 80, 130, 165, 190, 212, 235, 265, 295, 330].forEach(hue => rows.push(light.map(l => hslHex(hue, l > 85 ? 55 : l < 15 ? 60 : 68, l))));
    return rows;
  })();

  function openCustom() {
    let el = 'bg';
    const sheet = openSheet({ title: t('th_custom') });
    if (!S.settings.custom) {
      // mit den Farben des aktuellen Themes beginnen
      const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
      const start = { bg: v('--bg'), card: v('--card'), text: v('--text'), accent: v('--accent'), second: v('--second') };
      S.settings.custom = Object.assign({}, CUSTOM_DEFAULT);
      CUSTOM_KEYS.forEach(k => { if (/^#[0-9a-f]{6}$/i.test(start[k])) S.settings.custom[k] = start[k].toUpperCase(); });
    }
    sheet.render = () => {
      sheet.setTitle(t('th_custom'));
      const c = customColors();
      const top = sheet.body.scrollTop;
      sheet.body.replaceChildren(
        h('div', { class: 'pills' }, CUSTOM_KEYS.map(k => h('button', { class: 'pill' + (el === k ? ' on' : ''), 'data-el': k, onclick: () => { el = k; sheet.render(); } },
          h('i', { class: 'pill-dot big', style: 'background:' + c[k] }), t('el_' + k)))),
        h('div', { class: 'palette' }, PALETTE.flat().map(x => h('button', {
          class: 'swatch' + (c[el] === x ? ' on' : ''), style: 'background:' + x, 'aria-label': x, 'data-color': x,
          onclick: () => { S.settings.custom = Object.assign(customColors(), { [el]: x }); S.settings.theme = 'custom'; saveSettings(); }
        }))));
      sheet.body.scrollTop = top;
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Verschieben durch langes Halten
  const byOrder = list => list.map((o, i) => ({ o, i })).sort((a, b) => {
    const x = a.o.order == null ? -1 : a.o.order, y = b.o.order == null ? -1 : b.o.order;
    return x - y || a.i - b.i;
  }).map(x => x.o);
  function archiveItems() {
    const folders = S.folders.slice().sort((a, b) => a.name.localeCompare(b.name));
    const loose = archivedRolls().filter(r => !r.folderId || !folderById(r.folderId));
    return byOrder(folders.concat(loose)).map(o => { const folder = S.folders.includes(o); return { obj: o, folder, key: (folder ? 'f:' : 'r:') + o.id }; });
  }
  async function reorderTo(items, from, index) {
    const a = items.slice(), i = a.findIndex(x => x.key === from);
    if (i < 0) return;
    a.splice(Math.max(0, Math.min(a.length - 1, index)), 0, a.splice(i, 1)[0]);
    for (let k = 0; k < a.length; k++) if (a[k].obj.order !== k) { a[k].obj.order = k; await DB.put(a[k].folder ? 'folders' : 'rolls', a[k].obj); }
  }
  const activeItems = () => byOrder(S.rolls.filter(r => !r.archived).sort((a, b) => b.createdAt - a.createdAt)).map(o => ({ obj: o, folder: false, key: 'r:' + o.id }));

  /* Zeilen mit data-drag: kurz halten und ziehen sortiert, die anderen Zeilen rücken dabei zur Seite.
     Eine Sekunde halten ohne zu ziehen öffnet das Menü. cb: {onMove(key, index), onInto(key, folderKey), onHold(key, el)} */
  function sortable(box, cb) {
    let st = null;
    const reset = () => box.querySelectorAll('[data-drag]').forEach(e => { e.style.transform = ''; e.style.transition = ''; e.classList.remove('dragging', 'drop-into', 'over-folder'); });
    const end = commit => {
      if (!st) return;
      const s = st;
      st = null;
      clearTimeout(s.timer);
      clearTimeout(s.menuTimer);
      if (!s.active) return;
      s.el._noClickUntil = Date.now() + 450;
      if (!commit) { reset(); return; }
      if (!s.moved) { reset(); return; }
      if (s.into) { reset(); if (cb.onInto) cb.onInto(s.el.dataset.drag, s.into.dataset.drag); return; }
      if (s.index === s.i0) { reset(); return; }
      // in die Lücke einrasten, dann speichern
      s.el.style.transition = 'transform .15s';
      s.el.style.transform = 'translateY(' + s.slot + 'px)';
      setTimeout(() => { reset(); cb.onMove(s.el.dataset.drag, s.index); }, 160);
    };
    box.addEventListener('pointerdown', e => {
      const el = e.target.closest('[data-drag]');
      if (!el || !box.contains(el) || st) return;
      const s = { el, y: e.clientY, x: e.clientX, id: e.pointerId, active: false, moved: false, into: null };
      s.timer = setTimeout(() => {
        if (st !== s) return;
        s.list = [...box.querySelectorAll('[data-drag]')];
        s.rects = s.list.map(t => { const r = t.getBoundingClientRect(); return { top: r.top, h: r.height }; });
        s.i0 = s.index = s.list.indexOf(el);
        s.gap = s.rects.length > 1 ? Math.max(0, s.rects[1].top - s.rects[0].top - s.rects[0].h) : 10;
        s.scroll0 = box.scrollTop;
        s.slot = 0;
        s.active = true;
        el.classList.add('dragging');
        haptic();
        try { box.setPointerCapture(s.id); } catch (err) {}
      }, 420);
      // eine Sekunde halten, ohne zu ziehen: Menü öffnen, noch während der Finger liegt
      s.menuTimer = setTimeout(() => {
        if (st !== s || s.moved || !cb.onHold) return;
        st = null;
        clearTimeout(s.timer);
        reset();
        try { box.releasePointerCapture(s.id); } catch (err) {}
        el._noClickUntil = Infinity;
        window.addEventListener('pointerup', () => { el._noClickUntil = Date.now() + 400; }, { once: true });
        haptic();
        cb.onHold(el.dataset.drag, el);
      }, HOLD_MS);
      st = s;
    });
    box.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      const s = st;
      if (!s.active) { if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) end(false); return; }
      const dy = e.clientY - s.y + (box.scrollTop - s.scroll0);
      if (Math.abs(dy) > 6) s.moved = true;
      s.el.style.transform = 'translateY(' + dy + 'px)';
      const me = s.rects[s.i0], center = me.top + me.h / 2 + dy, step = me.h + s.gap;
      let into = null, index = 0;
      s.list.forEach((t, k) => {
        if (k === s.i0) return;
        const r = s.rects[k];
        if (cb.onInto && t.dataset.drag[0] === 'f' && s.el.dataset.drag[0] === 'r' && center > r.top + r.h * 0.25 && center < r.top + r.h * 0.75) into = t;
        if (r.top + r.h / 2 < center) index++;
      });
      if (s.into && s.into !== into) s.into.classList.remove('drop-into');
      if (into) into.classList.add('drop-into');
      s.el.classList.toggle('over-folder', !!into);
      s.into = into;
      if (into) index = s.index;
      s.index = index;
      let slot = 0;
      s.list.forEach((t, k) => {
        if (k === s.i0) return;
        const pos = k < s.i0 ? k : k - 1;
        let shift = 0;
        if (k < s.i0 && pos >= index) { shift = step; slot -= s.rects[k].h + s.gap; }
        else if (k > s.i0 && pos < index) { shift = -step; slot += s.rects[k].h + s.gap; }
        t.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
      });
      s.slot = slot;
      const b = box.getBoundingClientRect();
      if (e.clientY < b.top + 50) box.scrollTop -= 8; else if (e.clientY > b.bottom - 50) box.scrollTop += 8;
    });
    box.addEventListener('pointerup', e => { if (st && e.pointerId === st.id) end(true); });
    box.addEventListener('pointercancel', e => { if (st && e.pointerId === st.id) end(false); });
    box.addEventListener('touchmove', e => { if (st && st.active) e.preventDefault(); }, { passive: false });
    box.addEventListener('contextmenu', e => { if (st) e.preventDefault(); });
    box.addEventListener('click', e => {
      const el = e.target.closest('[data-drag]');
      if (el && el._noClickUntil > Date.now()) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  // ------------------------------------------------------------ Standort auf der Karte wählen
  function openPicker(start, onPick) {
    const sheet = openSheet({ title: t('pickOnMap') });
    sheet.body.classList.add('map-body');
    const box = h('div', { class: 'map' });
    sheet.body.append(box);
    const map = window.FilmMap.create(box, [], { picker: true, center: start });
    sheet.foot.append(h('button', { class: 'btn primary', 'data-act': 'pick-ok', onclick: () => { const c = map.center(); sheet.close(); onPick(c); } }, t('useLocation')));
    if (navigator.onLine === false) toast(t('mapOffline'));
  }
  function lastPlace(rollId) {
    const list = S.shots.filter(s => s.lat != null).sort((a, b) => (b.rollId === rollId) - (a.rollId === rollId) || b.createdAt - a.createdAt);
    return list.length ? { lat: list[0].lat, lon: list[0].lon, z: 15 } : { lat: 51.16, lon: 10.45, z: 5 };
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // ------------------------------------------------------------ Export
  function shareFile(file) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file] }).catch(e => { if (e && e.name !== 'AbortError') downloadFile(file); });
        return;
      }
    } catch (e) {}
    downloadFile(file);
  }
  function downloadFile(file) {
    const url = URL.createObjectURL(file);
    const a = h('a', { href: url, download: file.name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  // Teilen muss direkt im Antippen starten, sonst lehnt Safari es ab
  const offerFile = (msg, file) => alertBox({ title: msg, message: file.name, buttons: [
    { label: t('close'), value: null, act: 'alert-cancel' },
    { label: t('share'), value: true, kind: 'bold', act: 'alert-ok', onTap: () => shareFile(file) }] });
  const slug = s => (s || 'film').normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'film';

  function rollMeta(roll) {
    const since = activeSince(roll.id);
    return [
      { label: t('fFilm'), value: roll.film || '–' },
      { label: t('fCamera'), value: roll.camera || '–' },
      { label: t('mShots'), value: frameCount(roll.id) + '/' + roll.frames },
      { label: t('fIso'), value: roll.iso == null ? '–' : String(roll.iso) },
      { label: t('fEi'), value: roll.ei == null ? '–' : String(roll.ei) },
      { label: t('fPush'), value: t('stops')(roll.push || 0) },
      { label: t('mSince'), value: since == null ? '–' : fmtDate(since) }
    ];
  }

  // Im Point-and-Shoot-Modus bleiben Zeit, Blende und Brennweite gespeichert, werden aber nicht ausgegeben
  const visible = roll => s => (roll.pns ? Object.assign({}, s, { shutter: null, aperture: null, focal: null, ev: null, double: null }) : s);
  function buildCsv(roll) {
    const lang = S.settings.lang, de = lang !== 'en', sep = lang === 'de' ? '.' : '/';
    const num = v => (de ? String(v).replace('.', ',') : String(v));
    const date = ms => { const d = new Date(ms); return de ? pad2(d.getDate()) + sep + pad2(d.getMonth() + 1) + sep + d.getFullYear() : d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
    const time = ms => { const d = new Date(ms); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
    const meta = [[t('fTitle'), roll.title]].concat(rollMeta(roll).map(m => [m.label, m.value === '–' ? '' : m.value]), [[t('fNote'), roll.note || '']]);
    const header = [t('cShot'), t('cShutter'), t('cAperture'), t('cFocal'), t('cFlash'), t('cEv'), t('cDouble'), t('cLat'), t('cLon'), t('cDate'), t('cTime'), t('cNotes'), t('cRef')];
    const rows = rollShots(roll.id).reverse().map(visible(roll)).map(s => [
      noLabel(s.no, s.sub),
      s.shutter == null ? '' : fmtShutterUnit(s.shutter),
      s.aperture == null ? '' : 'f/' + num(s.aperture),
      s.focal == null ? '' : s.focal,
      s.flash == null ? '' : t(s.flash ? 'yes' : 'no'),
      // Korrektur als Dezimalzahl wie im Kameradisplay (+0,7), damit Tabellen sie nicht als Bruch oder Datum lesen
      s.ev == null ? '' : (s.ev > 0 ? '+' : '') + num(String(Math.round(s.ev / 3 * 10) / 10)),
      s.double == null ? '' : t(s.double ? 'yes' : 'no'),
      s.lat == null ? '' : num(s.lat.toFixed(6)),
      s.lon == null ? '' : num(s.lon.toFixed(6)),
      s.date == null ? '' : date(s.date),
      s.date == null ? '' : time(s.date),
      s.note || '',
      t(s.photoId ? 'yes' : 'no')
    ]);
    return '﻿' + window.FilmExport.csv(meta, header, rows);
  }

  async function buildPdf(roll) {
    const ctx = document.createElement('canvas').getContext('2d');
    const measure = (s, size, bold) => { ctx.font = (bold ? 'bold ' : '') + size + 'px Helvetica, Arial, sans-serif'; return ctx.measureText(s).width; };
    const shots = [];
    for (const s of rollShots(roll.id).map(visible(roll)).sort((a, b) => a.no - b.no || a.sub - b.sub)) {
      let image = null;
      if (s.photoId) {
        try {
          const m = await DB.get('media', s.photoId);
          if (m) {
            const c = drawScaled(await loadImage(new Blob([m.buf], { type: m.type })), 900);
            const blob = await canvasJpeg(c, 0.8);
            image = { bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height };
          }
        } catch (e) {}
      }
      const main = [s.shutter == null ? null : fmtShutterUnit(s.shutter), s.aperture == null ? null : fmtAperture(s.aperture), s.focal == null ? null : fmtFocal(s.focal)].filter(Boolean).join('     ') || '–';
      const lines = [];
      if (s.date != null) lines.push(fmtDateTime(s.date));
      if (s.lat != null) lines.push(fmtCoord(s.lat, s.lon));
      if (s.flash != null) lines.push(t('st_flash') + ': ' + t(s.flash ? 'yes' : 'no'));
      if (s.ev != null) lines.push(t('fEv') + ': ' + fmtEv(s.ev, true) + ' EV');
      if (s.double) lines.push(t('fDouble'));
      shots.push({ no: noLabel(s.no, s.sub), main, lines, note: s.note || '', image });
    }
    const meta = rollMeta(roll);
    if (roll.note) meta.push({ label: t('fNote'), value: roll.note, wide: true });
    return window.FilmExport.pdf({
      title: roll.title, subtitle: t('pdfExported', { d: fmtDate(Date.now()) }), pageLabel: t('pdfPage'), emptyText: t('pdfNoShots'),
      meta, shots, accent: S.settings.theme === 'custom' ? hexRgb(customColors().accent) : THEMES[S.settings.theme].pdf, measure
    });
  }

  function openExport(preId, host) {
    let sel = preId || null, format = 'pdf', busy = false;
    const sheet = host || openSheet({ title: t('export') });
    holdable(sheet.body, keyMenu);
    const go = h('button', { class: 'btn primary', 'data-act': 'export', onclick: run });
    sheet.foot.replaceChildren(go);

    async function run() {
      const roll = rollById(sel);
      if (!roll || busy) return;
      busy = true;
      sheet.render();
      try {
        let file;
        if (format === 'csv') file = new File([buildCsv(roll)], slug(roll.title) + '.csv', { type: 'text/csv' });
        else file = new File([await buildPdf(roll)], slug(roll.title) + '.pdf', { type: 'application/pdf' });
        busy = false;
        sheet.render();
        await offerFile(t('exportReady'), file);
      } catch (e) {
        busy = false;
        sheet.render();
        toast(t('exportFail'));
      }
    }

    sheet.render = () => {
      sheet.setTitle(t('export'));
      if (sel && !rollById(sel)) sel = null;
      const groups = [['active', S.rolls.filter(r => !r.archived)], ['archive', S.rolls.filter(r => r.archived)]];
      const kids = [];
      if (!S.rolls.length) kids.push(h('p', { class: 'empty' }, t('emptyExport')));
      else {
        if (!sel && S.rolls.length === 1) sel = S.rolls[0].id;
        kids.push(h('div', { class: 'segc' },
          ['pdf', 'csv'].map(f => h('button', { class: format === f ? 'on' : '', 'data-format': f, onclick: () => { format = f; sheet.render(); } }, t(f === 'pdf' ? 'fmtPdf' : 'fmtCsv')))),
          h('p', { class: 'group-note' }, t(format === 'pdf' ? 'fmtPdfSub' : 'fmtCsvSub')));
        groups.forEach(([key, rolls]) => {
          if (!rolls.length) return;
          kids.push(h('p', { class: 'section-label' }, t(key)));
          kids.push(group(rolls.sort((a, b) => b.createdAt - a.createdAt).map(r => keyed(
            rollRow(r, () => { sel = r.id; sheet.render(); }, sel === r.id ? icon('check') : h('span', { class: 'line-gap' }), ' pick' + (sel === r.id ? ' on' : '')),
            'r:' + r.id))));
        });
      }
      const top = sheet.body.scrollTop;
      sheet.body.replaceChildren(...kids);
      sheet.body.scrollTop = top;
      go.hidden = !S.rolls.length;
      go.textContent = busy ? t('exporting') : t('doExport');
      go.disabled = !sel || busy;
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Einstellungen und Backup
  function loadSettings() {
    try { Object.assign(S.settings, JSON.parse(localStorage.getItem('filmlog.settings') || '{}')); } catch (e) {}
    if (!THEMES[S.settings.theme] && S.settings.theme !== 'custom') S.settings.theme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dunkel' : 'hell';
    if (!window.I18N[S.settings.lang]) S.settings.lang = 'de';
  }
  function applySettings() {
    document.documentElement.dataset.theme = S.settings.theme;
    document.documentElement.lang = S.settings.lang;
    // Systemelemente wie Auswahlmenüs und Datumsfelder folgen dem Theme der App, nicht dem des iPhones
    document.documentElement.style.colorScheme = S.settings.theme === 'dunkel' || (S.settings.theme === 'custom' && lumHex(customColors().bg) < 0.2) ? 'dark' : 'light';
    const m = document.querySelector('meta[name="theme-color"]');
    const custom = S.settings.theme === 'custom' ? customVars(customColors()) : null;
    Object.keys(customVars(CUSTOM_DEFAULT)).forEach(k => { if (custom) document.documentElement.style.setProperty(k, custom[k]); else document.documentElement.style.removeProperty(k); });
    if (m) m.setAttribute('content', custom ? custom['--bg'] : THEMES[S.settings.theme].bar);
  }
  function saveSettings() {
    try { localStorage.setItem('filmlog.settings', JSON.stringify(S.settings)); } catch (e) {}
    applySettings();
    refreshAll();
  }

  const toB64 = buf => {
    const u = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const fromB64 = b => {
    const s = atob(b);
    const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u.buffer;
  };

  async function makeBackup() {
    const media = await DB.all('media');
    const data = {
      app: 'film-log', version: 1, exportedAt: new Date().toISOString(), settings: S.settings, rolls: allOf('rolls'), shots: allOf('shots'), folders: allOf('folders'), tags: allOf('tags'),
      media: media.map(m => ({ id: m.id, type: m.type, w: m.w, h: m.h, data: toB64(m.buf) }))
    };
    const d = new Date();
    return new File([JSON.stringify(data)], 'film-log-backup-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '.json', { type: 'application/json' });
  }

  // gelöschte Einträge (deletedAt) kommen in den Papierkorb, alle anderen in die Listen
  function splitLoaded(data) {
    TRASH_KINDS.forEach(k => {
      S[k] = data[k].filter(x => !x.deletedAt);
      S.trash[k] = data[k].filter(x => x.deletedAt);
    });
  }

  async function restoreBackup(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch (e) { data = null; }
    if (!data || data.app !== 'film-log' || !Array.isArray(data.rolls) || !Array.isArray(data.shots)) { toast(t('restoreFail')); return; }
    const ok = await alertBox({ title: t('askRestore'), message: file.name, buttons: [
      { label: t('cancel'), value: false, act: 'alert-cancel' },
      { label: t('restore'), value: true, kind: 'danger', act: 'alert-ok' }] });
    if (!ok) return;
    const media = (data.media || []).map(m => ({ id: m.id, type: m.type, w: m.w, h: m.h, buf: fromB64(m.data) }));
    await DB.run(['rolls', 'shots', 'media', 'folders', 'tags'], 'readwrite', tx => {
      const put = (name, list) => { const st = tx.objectStore(name); st.clear(); list.forEach(x => st.put(x)); };
      put('rolls', data.rolls); put('shots', data.shots); put('media', media);
      put('folders', data.folders || []); put('tags', data.tags || []);
    });
    urls.forEach(u => URL.revokeObjectURL(u));
    urls.clear();
    splitLoaded({ rolls: data.rolls, shots: data.shots, folders: data.folders || [], tags: data.tags || [] });
    if (data.settings) {
      if (data.settings.custom) S.settings.custom = data.settings.custom;
      if (THEMES[data.settings.theme] || data.settings.theme === 'custom') S.settings.theme = data.settings.theme;
      if (window.I18N[data.settings.lang]) S.settings.lang = data.settings.lang;
    }
    saveSettings();
    toast(t('restored'));
  }

  function openSettings(host) {
    const sheet = host || openSheet({ title: t('settings') });
    const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true, 'data-in': 'backup', onchange: async e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) { try { await restoreBackup(f); } catch (err) { toast(t('restoreFail')); } } } });
    let busy = false;
    sheet.render = () => {
      sheet.setTitle(t('settings'));
      const standalone = navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
      const LANGS = [['de', 'Deutsch'], ['en', 'English'], ['fr', 'Français'], ['es', 'Español'], ['pt', 'Português']];
      const themeKeys = Object.keys(THEMES).concat('custom');
      const pickTheme = async e => {
        const k = await popMenu(e.currentTarget, themeKeys.map(x => ({ label: t('th_' + x), value: x, checked: S.settings.theme === x })));
        if (!k) return;
        if (k === 'custom') openCustom();
        S.settings.theme = k;
        saveSettings();
      };
      const pickLang = async e => {
        const k = await popMenu(e.currentTarget, LANGS.map(([x, name]) => ({ label: name, value: x, checked: S.settings.lang === x })));
        if (k) { S.settings.lang = k; saveSettings(); }
      };
      const top = sheet.body.scrollTop;
      sheet.body.replaceChildren(...[
        group(
          lineBtn(t('setTheme'), t('th_' + S.settings.theme), pickTheme, { 'data-act': 'theme' }),
          lineBtn(t('setLang'), (LANGS.find(x => x[0] === S.settings.lang) || LANGS[0])[1], pickLang, { 'data-act': 'lang' })),
        h('p', { class: 'section-label' }, t('setBackup')),
        group(
          h('button', {
            class: 'line action', 'data-act': 'backup-save', onclick: async () => {
              if (busy) return;
              busy = true;
              try { const f = await makeBackup(); busy = false; await offerFile(t('backupReady'), f); } catch (e) { busy = false; toast(t('exportFail')); }
            }
          }, t('backupSave')),
          h('button', { class: 'line action', 'data-act': 'backup-restore', onclick: () => fileIn.click() }, t('backupRestore'))),
        h('p', { class: 'group-note' }, t('backupHint')),
        h('p', { class: 'section-label' }, t('about')),
        group(
          lineBtn(t('trash'), String(trashCount()), openTrash, { 'data-act': 'trash-open' }),
          lineBtn(t('feedback'), S.feedback.length ? String(S.feedback.length) : null, openFeedback, { 'data-act': 'feedback' }),
          lineBtn(t('changelog'), 'Alpha ' + VERSION, openChangelog, { 'data-act': 'changelog' })),
        standalone ? null : h('p', { class: 'group-note' }, t('installHint')),
        fileIn
      ].filter(Boolean));
      sheet.body.scrollTop = top;
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Feedback (bleibt auf dem Gerät, Teilen nur auf Wunsch)
  function openFeedback() {
    const sheet = openSheet({ title: t('feedback') });
    sheet.setRight(h('button', { class: 'icon-btn', 'aria-label': t('feedbackNew'), 'data-act': 'feedback-add', onclick: () => openFeedbackEdit(null) }, icon('plus')));
    holdable(sheet.body, async (key, el) => {
      const f = S.feedback.find(x => x.id === key.slice(3));
      if (!f) return;
      const a = await popMenu(el, [
        { label: t('actEdit'), value: 'edit', icon: 'pencil' },
        { label: t('delete'), value: 'delete', icon: 'trash', danger: true }
      ], f.title);
      if (a === 'edit') openFeedbackEdit(f.id);
      else if (a === 'delete') {
        if (!(await confirmDelete(t('askDeleteFeedback', { t: f.title })))) return;
        await DB.del('feedback', f.id);
        S.feedback = S.feedback.filter(x => x !== f);
        refreshAll();
        toast(t('deleted'));
      }
    });
    sheet.render = () => {
      sheet.setTitle(t('feedback'));
      const list = S.feedback.slice().sort((a, b) => b.createdAt - a.createdAt);
      sheet.body.replaceChildren(...[
        h('p', { class: 'group-note lead' }, t('feedbackHint')),
        list.length ? group(list.map(f => keyed(h('button', { class: 'line', 'data-feedback': f.title, onclick: () => openFeedbackEdit(f.id) },
          h('span', { class: 'line-label two' }, h('b', null, f.title), h('small', null, [fmtDate(f.createdAt), (f.text || '').split('\n')[0]].filter(Boolean).join(', '))),
          icon('chev')), 'fb:' + f.id))) : h('p', { class: 'empty' }, t('feedbackEmpty')),
        list.length ? group(h('button', { class: 'line action', 'data-act': 'feedback-share', onclick: shareFeedback }, t('feedbackShare'))) : null
      ].filter(Boolean));
    };
    sheet.render();
  }

  function openFeedbackEdit(id) {
    const f = id ? S.feedback.find(x => x.id === id) : null;
    const d = { title: f ? f.title : '', text: f ? f.text : '' };
    const orig = JSON.stringify(d);
    const empty = () => !d.title.trim() && !d.text.trim();
    let saving = false;
    const save = async () => {
      const rec = f || { id: uid(), createdAt: Date.now() };
      Object.assign(rec, { title: d.title.trim() || d.text.trim().split('\n')[0].slice(0, 60) || t('feedback'), text: d.text.trim(), updatedAt: Date.now(), version: VERSION });
      await DB.put('feedback', rec);
      if (!f) S.feedback.push(rec);
    };
    const sheet = openSheet({
      title: t(f ? 'feedback' : 'feedbackNew'),
      beforeClose: async () => {
        if (saving || JSON.stringify(d) === orig || (!f && empty())) return true;
        const a = await askSave(t('askSave'));
        if (a === 'save') { try { await save(); refreshAll(); toast(t('saved')); } catch (e) { toast(t('saveFail')); return false; } return true; }
        return a === 'discard';
      }
    });
    sheet.setRight(h('button', {
      class: 'icon-btn ok', 'data-act': 'finish', 'aria-label': t('save'), onclick: async () => {
        haptic();
        if (saving) return;
        if (!f && empty()) { sheet.close(); return; }
        saving = true;
        try { await save(); sheet.close(); refreshAll(); toast(t('saved')); } catch (e) { saving = false; toast(t('saveFail')); }
      }
    }, icon('check')));
    sheet.body.append(
      group(line(t('fTitle'), h('input', { type: 'text', 'data-field': 'fb-title', placeholder: t('feedbackTitlePh'), value: d.title, autocomplete: 'off', enterkeyhint: 'next', oninput: e => { d.title = e.target.value; } }))),
      group(h('textarea', { class: 'line-area tall', 'data-field': 'fb-text', placeholder: t('feedbackTextPh'), 'aria-label': t('feedbackTextPh'), value: d.text, oninput: e => { d.text = e.target.value; } })));
  }

  // alle Einträge als Textdatei über das Teilen-Menü; muss direkt im Antippen starten
  function shareFeedback() {
    const list = S.feedback.slice().sort((a, b) => a.createdAt - b.createdAt);
    const text = ['Film_Log Feedback', 'Alpha ' + VERSION + ', ' + fmtDateTime(Date.now()), '']
      .concat(list.flatMap(f => ['', f.title, fmtDateTime(f.createdAt) + (f.version ? ', Alpha ' + f.version : ''), '', f.text || ''])).join('\n') + '\n';
    const d = new Date();
    shareFile(new File([text], 'film-log-feedback-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '.txt', { type: 'text/plain' }));
  }

  // ------------------------------------------------------------ Changelog
  function openChangelog() {
    const sheet = openSheet({ title: t('changelog') });
    const open = new Set();
    sheet.render = () => {
      sheet.setTitle(t('changelog'));
      const lang = S.settings.lang === 'de' ? 'de' : 'en';
      sheet.body.replaceChildren(...(window.CHANGELOG || []).map(e => {
        const d = e[lang] || e.en || {};
        const group = (key, list) => (list && list.length ? [h('p', { class: 'cl-group' }, t(key)), h('ul', { class: 'cl-list' }, list.map(x => h('li', null, x)))] : []);
        return h('div', { class: 'cl-entry' + (open.has(e.v) ? ' open' : '') },
          h('button', { class: 'cl-head', 'data-version': e.v, 'aria-expanded': open.has(e.v) ? 'true' : 'false', onclick: () => { if (open.has(e.v)) open.delete(e.v); else open.add(e.v); sheet.render(); } },
            h('span', { class: 'cl-version' }, 'Alpha ' + e.v),
            h('span', { class: 'cl-title' }, e.title[lang] || e.title.en),
            h('span', { class: 'cl-date' }, fmtDate(new Date(e.date + 'T12:00:00').getTime()))),
          open.has(e.v) ? h('div', { class: 'cl-body' }, group('clNew', d.added), group('clChanged', d.changed), group('clRemoved', d.removed)) : null);
      }));
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Start
  async function init() {
    try { if (!localStorage.getItem('filmlog.settings')) { const l = (navigator.language || 'de').slice(0, 2).toLowerCase(); S.settings.lang = window.I18N[l] ? l : 'en'; } } catch (e) {}
    loadSettings();
    applySettings();
    renderHome();
    try {
      await DB.open();
      splitLoaded({ rolls: await DB.all('rolls'), shots: await DB.all('shots'), folders: await DB.all('folders'), tags: await DB.all('tags') });
      S.feedback = await DB.all('feedback');
    } catch (e) { toast(t('dbError')); }
    // Papierkorb: was länger als 30 Tage liegt, endgültig entfernen
    for (const kind of TRASH_KINDS) for (const o of S.trash[kind].filter(x => Date.now() - x.deletedAt > TRASH_DAYS * DAY)) { if (S.trash[kind].includes(o)) { try { await purge(kind, o); } catch (e) {} } }
    renderHome();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  init();
})();
