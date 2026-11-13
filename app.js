'use strict';
(function () {

  // ------------------------------------------------------------ Konstanten
  const THEMES = {
    salbei: { bar: '#EEEDE9', colors: ['#EEEDE9', '#C8C6AD', '#98503F', '#A2B08F', '#D9B2A9'], pdf: [152, 80, 63] },
    wald: { bar: '#CBDBA7', colors: ['#CBDBA7', '#789342', '#294E21', '#76C1C3', '#548D95'], pdf: [84, 141, 149] },
    sepia: { bar: '#0D0D0D', colors: ['#0D0D0D', '#40352C', '#A69B92', '#D9D0C7', '#F2EEEB'], pdf: [64, 53, 44] }
  };
  const SHUTTERS = ['B', '30s', '15s', '8s', '4s', '2s', '1s', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000', '1/4000', '1/8000'];
  const APERTURES = ['1', '1.2', '1.4', '1.8', '2', '2.8', '3.5', '4', '5.6', '8', '11', '16', '22', '32'];
  const FOCALS = [14, 17, 20, 24, 28, 35, 40, 50, 58, 70, 85, 100, 105, 135, 150, 200, 300, 400];
  const DEFAULTS = { shutter: '1/125', aperture: '8', focal: 50 };
  const STEPS = ['no', 'shutter', 'aperture', 'focal', 'loc', 'date', 'notes', 'ref', 'done'];
  const LAST = STEPS.length - 1;
  const ROLL_KEYS = ['title', 'film', 'iso', 'ei', 'push', 'camera', 'frames', 'note'];

  const S = { rolls: [], shots: [], settings: { theme: 'salbei', lang: 'de' } };

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
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
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
  const locale = () => (S.settings.lang === 'de' ? 'de-DE' : 'en-GB');
  const fmtDate = ms => ms == null ? '' : new Intl.DateTimeFormat(locale(), { dateStyle: 'medium' }).format(new Date(ms));
  const fmtDateTime = ms => ms == null ? '' : new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
  const fmtShutter = v => v == null ? '' : v === 'B' ? 'B' : /s$/.test(v) ? v.slice(0, -1) + ' s' : v;
  const fmtShutterUnit = v => v == null ? '' : v === 'B' ? 'B' : /s$/.test(v) ? v.slice(0, -1) + ' s' : v + ' s';
  const fmtAperture = v => v == null ? '' : 'f/' + v;
  const fmtFocal = v => v == null ? '' : v + ' mm';
  const fmtCoord = (lat, lon) => lat.toFixed(5) + ', ' + lon.toFixed(5);
  const fmtPush = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n || 0);
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
        const r = indexedDB.open('film-log', 1);
        r.onupgradeneeded = () => {
          const d = r.result;
          d.createObjectStore('rolls', { keyPath: 'id' });
          d.createObjectStore('shots', { keyPath: 'id' });
          d.createObjectStore('media', { keyPath: 'id' });
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
      h('button', { class: 'icon-btn', 'aria-label': t('close'), onclick: () => sheet.requestClose() }, icon('down')),
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

  // Rückfrage als kleines Fenster. buttons: [{label, value, kind, onTap}]
  function ask(message, buttons, detail) {
    return new Promise(resolve => {
      let done = false;
      const finish = v => {
        if (done) return;
        done = true;
        layer.classList.remove('open');
        setTimeout(() => layer.remove(), 340);
        resolve(v);
      };
      const el = h('section', { class: 'sheet mini', role: 'alertdialog', 'aria-modal': 'true' },
        h('p', { class: 'mini-msg' }, message),
        detail ? h('p', { class: 'mini-detail' }, detail) : null,
        buttons.map(b => h('button', {
          class: 'btn ' + (b.kind || ''),
          onclick: () => { if (b.onTap) b.onTap(); finish(b.value); }
        }, b.label)));
      const layer = h('div', { class: 'layer', style: 'z-index:40' }, h('div', { class: 'backdrop', onclick: () => finish(null) }), el);
      layers.append(layer);
      void layer.offsetHeight;
      layer.classList.add('open');
    });
  }
  const askSave = msg => ask(msg, [
    { label: t('save'), value: 'save', kind: 'primary' },
    { label: t('discard'), value: 'discard' },
    { label: t('cancel'), value: null, kind: 'ghost' }
  ]);

  function refreshAll() {
    renderHome();
    stack.slice().forEach(s => { if (s.render && !s.closed) s.render(); });
  }

  // ------------------------------------------------------------ Hauptmenü
  const home = document.getElementById('home');
  function renderHome() {
    const active = S.rolls.filter(r => !r.archived).length;
    const standalone = navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    const item = (key, fn, side) => h('button', { class: 'menu-item', 'data-nav': key, onclick: fn }, h('span', null, t(key)), side);
    home.replaceChildren(
      h('div', null,
        h('h1', { class: 'brand' }, 'Film_Log'),
        h('p', { class: 'brand-sub' }, S.rolls.length ? t('homeStats')(S.rolls.length, S.shots.length) : t('homeEmpty'))),
      h('div', null,
        h('nav', { class: 'menu' },
          item('create', () => openCreate()),
          item('active', openActive, h('span', { class: 'counter', 'aria-label': String(active) }, active)),
          item('archive', () => openList('archive'), h('span', { class: 'counter', 'aria-label': String(S.rolls.length - active) }, S.rolls.length - active)),
          item('export', () => openExport()),
          item('settings', openSettings)),
        standalone ? null : h('p', { class: 'install-hint' }, t('installHint'))));
  }

  // ------------------------------------------------------------ Formular einer Rolle
  function rollForm(d) {
    const input = (key, label, o) => h('label', { class: 'field' + (o.cls ? ' ' + o.cls : '') },
      h('span', { class: 'field-label' }, label),
      h('input', {
        type: 'text', class: o.num ? 'numeric' : null, inputmode: o.num ? 'numeric' : null, placeholder: o.ph, autocomplete: 'off',
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
    const chips = PRESETS.map(n => h('button', { type: 'button', class: 'chip', 'data-frames': n, onclick: () => { d.frames = n; other.value = ''; mark(); } }, n));
    const other = h('input', {
      type: 'text', inputmode: 'numeric', placeholder: t('fFramesOther'), 'aria-label': t('fFramesOther'), 'data-field': 'frames',
      value: PRESETS.includes(d.frames) || d.frames == null ? '' : d.frames,
      oninput: e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); if (n > 0) { d.frames = n; mark(); } },
      onkeydown: e => { if (e.key === 'Enter') e.target.blur(); }
    });
    const mark = () => {
      chips.forEach((c, i) => c.classList.toggle('on', d.frames === PRESETS[i] && other.value === ''));
      other.classList.toggle('on', other.value !== '');
    };
    mark();

    return h('div', { class: 'form' },
      input('title', t('fTitle'), { cls: 'wide title' }),
      input('film', t('fFilm'), { ph: t('fFilmPh') }),
      input('camera', t('fCamera'), { ph: t('fCameraPh') }),
      input('iso', t('fIso'), { num: true }),
      input('ei', t('fEi'), { num: true }),
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, t('fPush')), push),
      h('div', { class: 'field' }),
      h('div', { class: 'field wide' }, h('span', { class: 'field-label' }, t('fFrames')), h('div', { class: 'chips' }, chips, other)),
      input('note', t('fNote'), { cls: 'wide' }));
  }
  function cleanRoll(d, fallbackTitle) {
    const o = pickRoll(d);
    o.title = (o.title || '').trim() || fallbackTitle;
    o.film = (o.film || '').trim(); o.camera = (o.camera || '').trim(); o.note = (o.note || '').trim();
    o.push = o.push || 0;
    o.frames = o.frames > 0 ? o.frames : 36;
    return o;
  }

  // ------------------------------------------------------------ Erstellen
  function openCreate() {
    const fallback = nextTitle();
    const d = { title: fallback, film: '', iso: null, ei: null, push: 0, camera: '', frames: 36, note: '' };
    const orig = JSON.stringify(d);
    let saving = false;
    const save = async () => {
      const roll = Object.assign({ id: uid(), createdAt: Date.now(), archived: false, askedFull: false }, cleanRoll(d, fallback));
      await DB.put('rolls', roll);
      S.rolls.push(roll);
      return roll;
    };
    const sheet = openSheet({
      title: t('newRoll'),
      beforeClose: async () => {
        if (saving || JSON.stringify(d) === orig) return true;
        const a = await askSave(t('askSave'));
        if (a === 'save') { try { await save(); refreshAll(); toast(t('saved')); } catch (e) { toast(t('saveFail')); return false; } return true; }
        return a === 'discard';
      }
    });
    sheet.body.append(rollForm(d));
    sheet.foot.append(h('button', {
      class: 'btn primary', 'data-act': 'finish', onclick: async () => {
        if (saving) return;
        saving = true;
        try {
          const roll = await save();
          sheet.close();
          refreshAll();
          openRoll(roll.id);
        } catch (e) { saving = false; toast(t('saveFail')); }
      }
    }, t('finish')));
  }

  // ------------------------------------------------------------ Aktiv und Archiv
  function openActive() {
    const act = S.rolls.filter(r => !r.archived);
    if (act.length === 1) openRoll(act[0].id);
    else openList('active');
  }

  // Filmname und ISO sind getrennte Felder; angezeigt werden sie zusammen
  function filmLabel(r) {
    const f = (r.film || '').trim();
    const iso = r.iso == null ? '' : String(r.iso);
    if (!iso) return f;
    if (new RegExp('(^|\\D)' + iso + '(\\D|$)').test(f)) return f;
    return f ? f + ' ' + iso : 'ISO ' + iso;
  }
  function rollRow(r, onTap, extra) {
    const sub = [filmLabel(r), r.camera, frameCount(r.id) + '/' + r.frames + ' Exp.'].filter(Boolean).join(', ');
    return h('button', { class: 'row' + (extra || ''), 'data-roll': r.id, onclick: onTap },
      h('span', { class: 'row-title' }, r.title),
      h('span', { class: 'row-side' }),
      h('span', { class: 'row-sub' }, sub));
  }

  function openList(kind) {
    const sheet = openSheet({ title: t(kind) });
    if (kind === 'active') sheet.setRight(h('button', { class: 'icon-btn', 'aria-label': t('newRoll'), 'data-act': 'add', onclick: () => openCreate() }, icon('plus')));
    sheet.render = () => {
      sheet.setTitle(t(kind));
      const rolls = S.rolls.filter(r => !!r.archived === (kind === 'archive')).sort((a, b) => b.createdAt - a.createdAt);
      if (!rolls.length) sheet.body.replaceChildren(h('p', { class: 'empty' }, t(kind === 'active' ? 'emptyActive' : 'emptyArchive')));
      else sheet.body.replaceChildren(...rolls.map(r => rollRow(r, () => openRoll(r.id))));
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Rollenansicht
  function openRoll(id) {
    const roll = rollById(id);
    if (!roll) return;
    const d = pickRoll(roll);
    let orig = JSON.stringify(d);
    const dirty = () => JSON.stringify(d) !== orig;
    const saveMaster = async () => {
      Object.assign(roll, cleanRoll(d, roll.title));
      await DB.put('rolls', roll);
      orig = JSON.stringify(d);
    };

    const sheet = openSheet({
      beforeClose: async () => {
        if (!rollById(id) || !dirty()) return true;
        const a = await askSave(t('askSave'));
        if (a === 'save') { try { await saveMaster(); refreshAll(); } catch (e) { toast(t('saveFail')); return false; } return true; }
        if (a === 'discard') return true;
        return false;
      }
    });
    sheet.rollId = id;
    sheet.setRight(h('button', { class: 'icon-btn', 'aria-label': t('more'), 'data-act': 'more', onclick: more }, icon('more')));

    const info = h('p', { class: 'roll-info' });
    const list = h('div', { class: 'shots' });
    // Stammdaten stehen als ruhige Unterzeile unter dem Titel; bearbeitet wird über das Menü
    const form = rollForm(d);
    form.hidden = true;
    const heading = h('h2', { class: 'roll-title' });
    const subline = h('p', { class: 'roll-sub' });
    const startEdit = () => { form.hidden = false; heading.hidden = true; subline.hidden = true; sheet.body.scrollTop = 0; };
    sheet.body.append(heading, subline, form, info, list);

    async function more() {
      const a = await ask(roll.title, [
        { label: t('moreEdit'), value: 'edit' },
        { label: t('moreExport'), value: 'export' },
        roll.archived ? { label: t('moreReactivate'), value: 'reactivate' } : { label: t('moreArchive'), value: 'archive' },
        { label: t('moreDelete'), value: 'delete', kind: 'outline' },
        { label: t('cancel'), value: null, kind: 'ghost' }
      ]);
      if (a === 'edit') startEdit();
      else if (a === 'export') openExport(id);
      else if (a === 'archive' || a === 'reactivate') {
        if (dirty()) Object.assign(roll, cleanRoll(d, roll.title));
        roll.archived = a === 'archive';
        await DB.put('rolls', roll);
        sheet.close();
        refreshAll();
        toast(t(a === 'archive' ? 'archived' : 'reactivated'));
      } else if (a === 'delete') {
        const ok = await ask(t('askDeleteRoll', { t: roll.title }), [
          { label: t('delete'), value: true, kind: 'primary' },
          { label: t('cancel'), value: null, kind: 'ghost' }
        ]);
        if (ok) { await deleteRoll(id); sheet.close(); refreshAll(); toast(t('deleted')); }
      }
    }

    sheet.render = () => {
      if (!rollById(id)) { sheet.close(); return; }
      const shots = rollShots(id);
      sheet.setTitle(h('span', { class: 'counter', 'data-count': '' }, pad2(frameCount(id)) + ' / ' + roll.frames));
      heading.textContent = roll.title;
      subline.textContent = [roll.camera, (filmLabel(roll) + (roll.push ? ' (' + fmtPush(roll.push) + ')' : '')).trim(), roll.frames + ' Exp.'].filter(Boolean).join(' / ');
      const since = activeSince(id);
      info.textContent = since != null ? t('activeSince', { d: fmtDate(since) }) : t('noShotsYet');
      list.replaceChildren(...shots.map(s => {
        const val = (v, f) => h('span', { class: v == null ? 'nil' : null }, v == null ? '–' : f(v));
        const meta = [
          s.date != null ? h('span', null, fmtDateTime(s.date)) : null,
          s.lat != null ? icon('pin') : null,
          s.audioId ? icon('mic') : null,
          s.note ? h('span', null, s.note) : null
        ];
        return h('button', { class: 'shot' + (s.sub > 1 ? ' sub' : ''), 'data-shot': noLabel(s.no, s.sub), onclick: () => openShot(id, s.id) },
          h('span', { class: 'shot-no' }, noLabel(s.no, s.sub)),
          h('span', null,
            h('span', { class: 'shot-vals' }, val(s.shutter, fmtShutter), val(s.aperture, fmtAperture), val(s.focal, fmtFocal)),
            h('span', { class: 'shot-meta' }, meta)),
          s.thumb ? h('img', { class: 'shot-thumb', src: s.thumb, alt: '' }) : h('span'));
      }));
      sheet.foot.className = 'sheet-foot center';
      if (roll.archived) sheet.foot.replaceChildren();
      else if (!sheet.foot.firstChild) sheet.foot.append(h('button', { class: 'shutter', 'aria-label': t('newShot'), 'data-act': 'shutter', onclick: () => openShot(id, null) }));
    };
    sheet.render();
  }

  async function deleteRoll(id) {
    const shots = S.shots.filter(s => s.rollId === id);
    for (const s of shots) {
      await dropMedia(s.photoId);
      await dropMedia(s.audioId);
      await DB.del('shots', s.id);
    }
    await DB.del('rolls', id);
    S.shots = S.shots.filter(s => s.rollId !== id);
    S.rolls = S.rolls.filter(r => r.id !== id);
  }

  async function checkFull(roll) {
    if (roll.archived || roll.askedFull || frameCount(roll.id) < roll.frames) return;
    roll.askedFull = true;
    await DB.put('rolls', roll);
    const a = await ask(t('askArchive', { t: roll.title }), [
      { label: t('moreArchive'), value: true, kind: 'primary' },
      { label: t('later'), value: null }
    ]);
    if (!a) return;
    roll.archived = true;
    await DB.put('rolls', roll);
    stack.slice().forEach(s => { if (s.rollId === roll.id) s.close(); });
    refreshAll();
    toast(t('archived'));
  }

  // ------------------------------------------------------------ Wahlrad
  function makeWheel(values, fmt, value, onChange) {
    const IH = 52;
    let idx = values.indexOf(value);
    if (idx < 0) idx = 0;
    const list = h('div', { class: 'wheel-list' });
    const items = values.map((v, i) => h('div', { class: 'wheel-item', onclick: () => list.scrollTo({ top: i * IH, behavior: 'smooth' }) }, fmt(v)));
    list.append(h('div', { class: 'wheel-pad' }), ...items, h('div', { class: 'wheel-pad' }));
    const mark = () => items.forEach((it, i) => it.classList.toggle('sel', i === idx));
    list.addEventListener('scroll', () => {
      const i = Math.min(values.length - 1, Math.max(0, Math.round(list.scrollTop / IH)));
      if (i !== idx) { idx = i; mark(); onChange(values[idx]); }
    }, { passive: true });
    mark();
    const el = h('div', { class: 'wheel' }, h('div', { class: 'wheel-band' }), list);
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
  function openShot(rollId, shotId) {
    const roll = rollById(rollId);
    if (!roll) return;
    const shot = shotId ? S.shots.find(s => s.id === shotId) : null;
    const isNew = !shot;
    const last = lastValues(rollId);
    const d = isNew
      ? { no: nextNo(rollId), shutter: last.shutter, aperture: last.aperture, focal: last.focal, lat: null, lon: null, acc: null, date: Date.now(), note: '', audioId: null, photoId: null, thumb: null }
      : { no: shot.no, shutter: shot.shutter, aperture: shot.aperture, focal: shot.focal, lat: shot.lat, lon: shot.lon, acc: shot.acc, date: shot.date, note: shot.note || '', audioId: shot.audioId || null, photoId: shot.photoId || null, thumb: shot.thumb || null };
    const orig = JSON.stringify(d);
    const wheelVal = { shutter: d.shutter != null ? d.shutter : last.shutter, aperture: d.aperture != null ? d.aperture : last.aperture, focal: d.focal != null ? d.focal : last.focal };

    let step = isNew ? 0 : LAST, jumped = false, saving = false;
    let newPhoto = null, newPhotoUrl = null, newAudio = null, newAudioUrl = null;
    let rec = null, player = null;
    const geo = { state: 'idle', token: 0 };

    const sheet = openSheet({
      beforeClose: async () => {
        if (saving) return true;
        const changed = isNew ? step > 0 : (JSON.stringify(d) !== orig || newPhoto || newAudio);
        if (!changed) return true;
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

    // --- Standort
    function locate() {
      if (!navigator.geolocation) { geo.state = 'fail'; refreshStep(); return; }
      const token = ++geo.token;
      geo.state = 'busy'; geo.why = null;
      refreshStep();
      let got = false, pending = 2;
      const ok = p => {
        if (token !== geo.token || sheet.closed) return;
        if (got && d.acc != null && p.coords.accuracy >= d.acc) return;
        got = true;
        d.lat = p.coords.latitude; d.lon = p.coords.longitude; d.acc = p.coords.accuracy;
        geo.state = 'ok';
        refreshStep();
      };
      const fail = e => {
        if (token !== geo.token || sheet.closed) return;
        if (e && e.code === 1) geo.why = 'denied';
        if (--pending > 0 || got) return;
        geo.state = 'fail';
        refreshStep();
      };
      // erst eine schnelle, grobe Ortung, parallel die genaue per GPS; die bessere gewinnt
      navigator.geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 });
      navigator.geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
    }
    const refreshStep = () => { if (!sheet.closed && (STEPS[step] === 'loc' || STEPS[step] === 'done')) render(); };

    // --- Sprachnotiz
    const audioBox = h('div', { class: 'audio-box' });
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
      if (rec) {
        const sec = Math.floor((Date.now() - rec.start) / 1000);
        audioBox.replaceChildren(h('button', { class: 'btn primary', 'data-act': 'rec-stop', onclick: () => stopRec(false) },
          h('span', { class: 'rec-dot' }), t('recStop') + '  ' + Math.floor(sec / 60) + ':' + pad2(sec % 60)));
      } else if (hasAudio()) {
        audioBox.replaceChildren(h('div', { class: 'audio-row' },
          h('button', { class: 'btn', 'data-act': 'play', onclick: togglePlay }, icon(player ? 'stop' : 'play'), player ? t('stop') : t('voiceNote')),
          h('button', { class: 'btn square', 'aria-label': t('removeAudio'), 'data-act': 'audio-remove', onclick: () => { if (player) { player.pause(); player = null; } newAudio = null; d.audioId = null; renderAudio(); } }, icon('trash'))));
      } else {
        audioBox.replaceChildren(h('button', { class: 'btn', 'data-act': 'rec-start', onclick: startRec }, icon('mic'), t('recStart')));
      }
    }

    // --- Referenzfoto
    const hasPhoto = () => !!(newPhoto || d.photoId);
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
      if (!sheet.closed && STEPS[step] === 'ref') render();
    }
    const camIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, 'data-in': 'camera', onchange: onPick });
    const libIn = h('input', { type: 'file', accept: 'image/*', hidden: true, 'data-in': 'library', onchange: onPick });

    // --- Schritte
    function stepContent(key) {
      if (key === 'no') {
        const sub = predictedSub();
        return h('div', { class: 'step-box' },
          h('div', { class: 'stepper' },
            h('button', { 'aria-label': '−', 'data-act': 'no-minus', onclick: () => { d.no = Math.max(0, d.no - 1); render(); } }, '−'),
            h('div', { class: 'bignum' }, pad2(d.no)),
            h('button', { 'aria-label': '+', 'data-act': 'no-plus', onclick: () => { d.no++; render(); } }, '+')),
          sub > 1 ? h('p', { class: 'hint' }, t('noExists', { n: d.no, m: noLabel(d.no, sub) })) : null);
      }
      if (key === 'shutter') return makeWheel(SHUTTERS, v => v, wheelVal.shutter, v => { wheelVal.shutter = v; });
      if (key === 'aperture') return makeWheel(APERTURES, fmtAperture, wheelVal.aperture, v => { wheelVal.aperture = v; });
      if (key === 'focal') return makeWheel(FOCALS, fmtFocal, wheelVal.focal, v => { wheelVal.focal = v; });
      if (key === 'loc') {
        const busy = geo.state === 'busy';
        const has = d.lat != null && !busy;
        return h('div', { class: 'step-box' },
          h('div', { class: 'big-value' + (has ? '' : ' dim'), 'data-loc': '' }, busy ? t('locBusy') : has ? fmtCoord(d.lat, d.lon) : t(geo.state === 'fail' ? 'locFail' : 'locNone')),
          has && d.acc != null ? h('p', { class: 'hint' }, '± ' + Math.round(d.acc) + ' m') : null,
          !busy && !has && geo.state === 'fail' && geo.why === 'denied' ? h('p', { class: 'hint', 'data-loc-denied': '' }, t('locDenied')) : null,
          h('button', { class: 'btn', disabled: busy, onclick: locate }, icon('pin'), t('locRetry')));
      }
      if (key === 'date') {
        return h('input', {
          class: 'date-input', type: 'datetime-local', value: toLocalInput(d.date), 'aria-label': t('st_date'),
          oninput: e => { const v = e.target.value; d.date = v ? new Date(v).getTime() : null; }
        });
      }
      if (key === 'notes') {
        if (d.audioId) mediaUrl(d.audioId);
        renderAudio();
        const ta = h('textarea', { class: 'input', placeholder: t('notePh'), 'aria-label': t('st_notes'), oninput: e => { d.note = e.target.value; } });
        ta.value = d.note;
        return h('div', { class: 'step-box' }, ta, audioBox);
      }
      if (key === 'ref') {
        if (hasPhoto()) {
          const img = h('img', { class: 'photo-preview', alt: '' });
          if (newPhotoUrl) img.src = newPhotoUrl;
          else mediaUrl(d.photoId).then(u => { if (u) img.src = u; });
          return h('div', { class: 'step-box' }, img, camIn, libIn,
            h('button', { class: 'btn', 'data-act': 'photo-remove', onclick: () => { newPhoto = null; d.photoId = null; d.thumb = null; render(); } }, icon('trash'), t('removePhoto')));
        }
        return h('div', { class: 'step-box' }, camIn, libIn,
          h('button', { class: 'btn', onclick: () => camIn.click() }, icon('camera'), t('takePhoto')),
          h('button', { class: 'btn', onclick: () => libIn.click() }, icon('image'), t('pickPhoto')));
      }
      // Übersicht
      const row = (i, value, cls) => h('button', { class: 'sum-row', 'data-jump': STEPS[i], onclick: () => { step = i; jumped = true; render(); } },
        h('span', { class: 'sum-label' }, t('st_' + STEPS[i])),
        h('span', { class: 'sum-value' + (value == null || value === '' ? ' nil' : '') + (cls ? ' ' + cls : '') }, value == null || value === '' ? '–' : value));
      const noteVal = d.note ? d.note : hasAudio() ? t('voiceNote') : null;
      return h('div', null,
        row(0, noLabel(d.no, predictedSub())),
        row(1, d.shutter == null ? null : fmtShutterUnit(d.shutter)),
        row(2, d.aperture == null ? null : fmtAperture(d.aperture)),
        row(3, d.focal == null ? null : fmtFocal(d.focal)),
        row(4, geo.state === 'busy' ? t('locBusy') : d.lat != null ? fmtCoord(d.lat, d.lon) : null, geo.state === 'busy' ? 'text' : ''),
        row(5, d.date == null ? null : fmtDateTime(d.date)),
        row(6, noteVal, 'text'),
        row(7, d.thumb ? h('img', { src: d.thumb, alt: t('photo') }) : hasPhoto() ? t('photo') : null),
        isNew ? null : h('div', { class: 'below' }, h('button', { class: 'btn outline', 'data-act': 'shot-delete', onclick: removeShot }, icon('trash'), t('deleteShot'))));
    }

    function commit(key) { if (key in wheelVal) d[key] = wheelVal[key]; }
    function clear(key) {
      if (key in wheelVal) d[key] = null;
      else if (key === 'loc') { geo.token++; geo.state = 'idle'; d.lat = d.lon = d.acc = null; }
      else if (key === 'date') d.date = null;
      else if (key === 'notes') { stopRec(true); if (player) { player.pause(); player = null; } d.note = ''; newAudio = null; d.audioId = null; }
      else if (key === 'ref') { newPhoto = null; d.photoId = null; d.thumb = null; }
    }
    function leave(key, target) {
      if (key === 'notes') { stopRec(false); if (player) { player.pause(); player = null; } }
      if (jumped) { jumped = false; step = LAST; } else step = target;
      render();
    }

    function render() {
      const key = STEPS[step];
      sheet.setTitle(t('shot') + ' ' + noLabel(d.no, predictedSub()));
      const content = stepContent(key);
      sheet.body.replaceChildren(
        h('div', { class: 'progress', 'aria-hidden': 'true' }, STEPS.map((_, i) => h('i', { class: i === step ? 'on' : i < step ? 'done' : '' }))),
        h('h2', { class: 'step-title' }, t('st_' + key)),
        content);
      sheet.body.classList.add('steps');
      if (key !== 'notes' && key !== 'done') content.classList.add('low');
      if (content.sync) content.sync();
      sheet.foot.className = 'sheet-foot three';
      const back = h('button', { class: 'btn ghost' + (step === 0 && !jumped ? ' invisible' : ''), 'data-act': 'back', onclick: () => leave(key, step - 1) }, t('back'));
      if (key === 'done') {
        sheet.foot.replaceChildren(back, h('span'), h('button', { class: 'btn primary', 'data-act': 'finish', onclick: finish }, t('finish')));
      } else {
        sheet.foot.replaceChildren(back,
          h('button', { class: 'btn ghost' + (key === 'no' ? ' invisible' : ''), 'data-act': 'skip', onclick: () => { clear(key); leave(key, step + 1); } }, t(jumped ? 'clear' : 'skip')),
          h('button', { class: 'btn primary', 'data-act': 'next', onclick: () => { commit(key); leave(key, step + 1); } }, t(jumped ? 'apply' : 'next')));
      }
    }

    async function finish() {
      if (saving) return;
      saving = true;
      try {
        if (rec) { const p = rec.done; stopRec(false); await p; }
        const sub = predictedSub();
        const old = isNew ? {} : { photoId: shot.photoId, audioId: shot.audioId };
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
      const ok = await ask(t('askDeleteShot', { n: noLabel(shot.no, shot.sub) }), [
        { label: t('delete'), value: true, kind: 'primary' },
        { label: t('cancel'), value: null, kind: 'ghost' }
      ]);
      if (!ok) return;
      saving = true;
      await dropMedia(shot.photoId);
      await dropMedia(shot.audioId);
      await DB.del('shots', shot.id);
      S.shots = S.shots.filter(s => s.id !== shot.id);
      sheet.close();
      refreshAll();
      toast(t('deleted'));
    }

    render();
    if (isNew) locate();
  }

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
  const offerFile = (msg, file) => ask(msg, [
    { label: t('share'), value: true, kind: 'primary', onTap: () => shareFile(file) },
    { label: t('close'), value: null, kind: 'ghost' }
  ], file.name);
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

  function buildCsv(roll) {
    const de = S.settings.lang === 'de';
    const num = v => (de ? String(v).replace('.', ',') : String(v));
    const date = ms => { const d = new Date(ms); return de ? pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear() : d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
    const time = ms => { const d = new Date(ms); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
    const meta = [[t('fTitle'), roll.title]].concat(rollMeta(roll).map(m => [m.label, m.value === '–' ? '' : m.value]), [[t('fNote'), roll.note || '']]);
    const header = [t('cShot'), t('cShutter'), t('cAperture'), t('cFocal'), t('cLat'), t('cLon'), t('cDate'), t('cTime'), t('cNotes'), t('cRef')];
    const rows = rollShots(roll.id).reverse().map(s => [
      noLabel(s.no, s.sub),
      s.shutter == null ? '' : fmtShutterUnit(s.shutter),
      s.aperture == null ? '' : 'f/' + num(s.aperture),
      s.focal == null ? '' : s.focal,
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
    for (const s of rollShots(roll.id).sort((a, b) => a.no - b.no || a.sub - b.sub)) {
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
      shots.push({ no: noLabel(s.no, s.sub), main, lines, note: s.note || '', image });
    }
    const meta = rollMeta(roll);
    if (roll.note) meta.push({ label: t('fNote'), value: roll.note, wide: true });
    return window.FilmExport.pdf({
      title: roll.title, subtitle: t('pdfExported', { d: fmtDate(Date.now()) }), pageLabel: t('pdfPage'), emptyText: t('pdfNoShots'),
      meta, shots, accent: THEMES[S.settings.theme].pdf, measure
    });
  }

  function openExport(preId) {
    let sel = preId || null, format = 'pdf', busy = false;
    const sheet = openSheet({ title: t('export') });
    const go = h('button', { class: 'btn primary', 'data-act': 'export', onclick: run });
    sheet.foot.append(go);

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
        kids.push(h('p', { class: 'section-label' }, t('exportFormat')),
          h('div', { class: 'seg' },
            ['pdf', 'csv'].map(f => h('button', { class: format === f ? 'on' : '', 'data-format': f, onclick: () => { format = f; sheet.render(); } },
              t(f === 'pdf' ? 'fmtPdf' : 'fmtCsv'), h('small', null, t(f === 'pdf' ? 'fmtPdfSub' : 'fmtCsvSub'))))));
        groups.forEach(([key, rolls]) => {
          if (!rolls.length) return;
          kids.push(h('p', { class: 'section-label' }, t(key)));
          rolls.sort((a, b) => b.createdAt - a.createdAt).forEach(r => kids.push(rollRow(r, () => { sel = r.id; sheet.render(); }, ' pick' + (sel === r.id ? ' on' : ''))));
        });
      }
      const top = sheet.body.scrollTop;
      sheet.body.replaceChildren(...kids);
      sheet.body.scrollTop = top;
      go.textContent = busy ? t('exporting') : t('doExport');
      go.disabled = !sel || busy;
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Einstellungen und Backup
  function loadSettings() {
    try { Object.assign(S.settings, JSON.parse(localStorage.getItem('filmlog.settings') || '{}')); } catch (e) {}
    if (!THEMES[S.settings.theme]) S.settings.theme = 'salbei';
    if (!window.I18N[S.settings.lang]) S.settings.lang = 'de';
  }
  function applySettings() {
    document.documentElement.dataset.theme = S.settings.theme;
    document.documentElement.lang = S.settings.lang;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', THEMES[S.settings.theme].bar);
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
      app: 'film-log', version: 1, exportedAt: new Date().toISOString(), settings: S.settings, rolls: S.rolls, shots: S.shots,
      media: media.map(m => ({ id: m.id, type: m.type, w: m.w, h: m.h, data: toB64(m.buf) }))
    };
    const d = new Date();
    return new File([JSON.stringify(data)], 'film-log-backup-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '.json', { type: 'application/json' });
  }

  async function restoreBackup(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch (e) { data = null; }
    if (!data || data.app !== 'film-log' || !Array.isArray(data.rolls) || !Array.isArray(data.shots)) { toast(t('restoreFail')); return; }
    const ok = await ask(t('askRestore'), [
      { label: t('restore'), value: true, kind: 'primary' },
      { label: t('cancel'), value: null, kind: 'ghost' }
    ], file.name);
    if (!ok) return;
    const media = (data.media || []).map(m => ({ id: m.id, type: m.type, w: m.w, h: m.h, buf: fromB64(m.data) }));
    await DB.run(['rolls', 'shots', 'media'], 'readwrite', tx => {
      const put = (name, list) => { const st = tx.objectStore(name); st.clear(); list.forEach(x => st.put(x)); };
      put('rolls', data.rolls); put('shots', data.shots); put('media', media);
    });
    urls.forEach(u => URL.revokeObjectURL(u));
    urls.clear();
    S.rolls = data.rolls;
    S.shots = data.shots;
    if (data.settings) {
      if (THEMES[data.settings.theme]) S.settings.theme = data.settings.theme;
      if (window.I18N[data.settings.lang]) S.settings.lang = data.settings.lang;
    }
    saveSettings();
    toast(t('restored'));
  }

  function openSettings() {
    const sheet = openSheet({ title: t('settings') });
    const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true, 'data-in': 'backup', onchange: async e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) { try { await restoreBackup(f); } catch (err) { toast(t('restoreFail')); } } } });
    let busy = false;
    sheet.render = () => {
      sheet.setTitle(t('settings'));
      sheet.body.replaceChildren(
        h('p', { class: 'section-label' }, t('setTheme')),
        h('div', { class: 'themes' }, Object.keys(THEMES).map(k => h('button', { class: 'theme' + (S.settings.theme === k ? ' on' : ''), 'data-theme-pick': k, onclick: () => { S.settings.theme = k; saveSettings(); } },
          h('span', null, t('th_' + k)),
          h('span', { class: 'swatches' }, THEMES[k].colors.map(c => h('i', { style: 'background:' + c })))))),
        h('p', { class: 'section-label' }, t('setLang')),
        h('div', { class: 'seg' }, [['de', 'Deutsch'], ['en', 'English']].map(([k, name]) => h('button', { class: S.settings.lang === k ? 'on' : '', 'data-lang': k, onclick: () => { S.settings.lang = k; saveSettings(); } }, name))),
        h('p', { class: 'section-label' }, t('setBackup')),
        h('p', { class: 'note' }, t('backupHint')),
        h('div', { class: 'btn-stack' },
          h('button', {
            class: 'btn', 'data-act': 'backup-save', onclick: async () => {
              if (busy) return;
              busy = true;
              try { const f = await makeBackup(); busy = false; await offerFile(t('backupReady'), f); } catch (e) { busy = false; toast(t('exportFail')); }
            }
          }, t('backupSave')),
          h('button', { class: 'btn', 'data-act': 'backup-restore', onclick: () => fileIn.click() }, t('backupRestore'))),
        fileIn);
    };
    sheet.render();
  }

  // ------------------------------------------------------------ Start
  async function init() {
    try { if (!localStorage.getItem('filmlog.settings') && !/^de/i.test(navigator.language || 'de')) S.settings.lang = 'en'; } catch (e) {}
    loadSettings();
    applySettings();
    renderHome();
    try {
      await DB.open();
      S.rolls = await DB.all('rolls');
      S.shots = await DB.all('shots');
    } catch (e) { toast(t('dbError')); }
    renderHome();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  init();
})();
