'use strict';
/* CSV import: reads tables from other apps, guesses which column is which, turns rows into rolls and shots. */
(function (root) {
  const norm = s => String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9#]+/g, ' ').trim();

  // column names other apps use, per field
  const SYN = {
    no: ['shot', 'shot no', 'shot number', 'frame', 'frame no', 'frame number', 'frame count', 'frame #', 'exposure number', 'bild', 'bildnummer', 'nummer', 'nr', 'no', '#', 'foto', 'vue', 'fotograma', 'numero', 'num'],
    shutter: ['shutter', 'shutter speed', 'shutterspeed', 'exposure time', 'speed', 'tv', 'belichtungszeit', 'verschlusszeit', 'vitesse', 'vitesse d obturation', 'velocidad', 'velocidad de obturacion', 'obturador', 'velocidade', 'velocidade do obturador'],
    aperture: ['aperture', 'f stop', 'fstop', 'f number', 'fnumber', 'av', 'blende', 'ouverture', 'apertura', 'abertura', 'diafragma'],
    focal: ['focal length', 'focal', 'focallength', 'focal length mm', 'brennweite', 'brennweite mm', 'focale', 'distancia focal'],
    flash: ['flash', 'flash used', 'flash fired', 'blitz'],
    lat: ['latitude', 'lat', 'gps latitude', 'breite', 'breitengrad', 'latitud'],
    lon: ['longitude', 'lon', 'lng', 'long', 'gps longitude', 'lange', 'langengrad', 'longitud'],
    loc: ['location', 'coordinates', 'coords', 'gps', 'position', 'standort', 'koordinaten', 'ort', 'lieu', 'emplacement', 'ubicacion', 'coordenadas', 'local', 'localizacao'],
    date: ['date', 'datetime', 'date time', 'timestamp', 'taken', 'date taken', 'created', 'datum', 'aufnahmedatum', 'fecha', 'data'],
    time: ['time', 'uhrzeit', 'zeit', 'heure', 'hora'],
    notes: ['note', 'notes', 'comment', 'comments', 'description', 'remarks', 'notiz', 'notizen', 'kommentar', 'beschreibung', 'remarque', 'remarques', 'nota', 'notas', 'observacoes', 'comentario'],
    roll: ['roll', 'roll name', 'roll title', 'film roll', 'rolle', 'titel', 'title', 'name', 'rouleau', 'titre', 'carrete', 'titulo', 'rolo'],
    film: ['film', 'film stock', 'filmstock', 'stock', 'emulsion', 'film type', 'pellicule', 'pelicula', 'filme'],
    iso: ['iso', 'asa', 'film speed', 'box speed', 'box iso'],
    camera: ['camera', 'camera name', 'camera model', 'body', 'kamera', 'appareil', 'appareil photo', 'camara']
  };
  const FIELDS = Object.keys(SYN);

  function parseCsv(text) {
    text = String(text).replace(/^﻿/, '');
    const head = text.split(/\r?\n/).slice(0, 15).join('\n').replace(/"[^"]*"/g, '');
    const count = ch => head.split(ch).length - 1;
    const delim = [';', '\t', ','].sort((a, b) => count(b) - count(a))[0];
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const clean = rows.map(r => r.map(c => c.trim().replace(/^'(?=[=+\-@])/, '')));
    const filled = r => r.filter(c => c !== '').length;
    const hi = clean.findIndex(r => filled(r) >= 3);
    if (hi < 0) return { meta: [], header: [], rows: [] };
    return {
      meta: clean.slice(0, hi).filter(r => r.length >= 2 && r[0] !== '' && r[1] !== '').map(r => [r[0], r[1]]),
      header: clean[hi],
      rows: clean.slice(hi + 1).filter(r => filled(r) > 0)
    };
  }

  /* header -> {field: columnIndex}. learned: {normalised header: field} from earlier imports. extra: {field: [names]} */
  function guess(header, learned, extra) {
    const cand = [];
    header.forEach((hd, ci) => {
      const n = norm(hd);
      if (!n) return;
      if (learned && learned[n] && FIELDS.includes(learned[n])) cand.push({ f: learned[n], ci, score: 1000 });
      FIELDS.forEach(f => {
        SYN[f].concat(extra && extra[f] ? extra[f].map(norm) : []).forEach(s => {
          if (!s) return;
          if (n === s) cand.push({ f, ci, score: 200 + s.length });
          else if ((' ' + n + ' ').includes(' ' + s + ' ')) cand.push({ f, ci, score: s.length });
        });
      });
    });
    cand.sort((a, b) => b.score - a.score);
    const map = {}, used = new Set();
    cand.forEach(c => {
      if (map[c.f] != null || used.has(c.ci)) return;
      map[c.f] = c.ci;
      used.add(c.ci);
    });
    return map;
  }

  const num = v => {
    const s = String(v == null ? '' : v).trim();
    if (!s) return null;
    const x = parseFloat(s.replace(',', '.').replace(/[^\d.\-]/g, ''));
    if (isNaN(x)) return null;
    return /[sw]\s*$/i.test(s) && x > 0 ? -x : x;
  };
  function parseShutter(v) {
    let s = String(v == null ? '' : v).trim().toLowerCase();
    if (!s) return null;
    if (/^b(ulb)?$/.test(s)) return 'B';
    s = s.replace(/\s*(seconds?|secs?|sek\.?|s|"|″)$/, '').replace(',', '.').trim();
    let m = s.match(/^1\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (m) return '1/' + Math.round(parseFloat(m[1]));
    m = s.match(/^(\d+(?:\.\d+)?)$/);
    if (!m) return null;
    const x = parseFloat(m[1]);
    if (x >= 1) return Math.round(x) + 's';
    return x > 0 ? '1/' + Math.round(1 / x) : null;
  }
  function parseAperture(v) {
    const m = String(v == null ? '' : v).replace(',', '.').replace(/^\s*1\s*:/, '').match(/(\d+(?:\.\d+)?)/);
    return m ? String(parseFloat(m[1])) : null;
  }
  function parseFocal(v) {
    const m = String(v == null ? '' : v).replace(',', '.').match(/(\d+(?:\.\d+)?)/);
    return m ? Math.round(parseFloat(m[1])) : null;
  }
  function parseFlash(v) {
    const n = norm(v);
    if (!n) return null;
    if (['yes', 'y', 'true', '1', 'on', 'fired', 'ja', 'an', 'oui', 'si', 'sim'].includes(n)) return true;
    if (['no', 'n', 'false', '0', 'off', 'nein', 'aus', 'non', 'nao', 'none'].includes(n)) return false;
    return null;
  }
  function parseNo(v) {
    const m = String(v == null ? '' : v).match(/(\d+)(?:\.(\d+))?/);
    return m ? { no: parseInt(m[1], 10), sub: m[2] ? parseInt(m[2], 10) : null } : null;
  }
  function parseLoc(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return null;
    let a, b;
    if (s.includes(';')) { const p = s.split(';'); a = num(p[0]); b = num(p[1]); }
    else { const m = s.match(/(-?\d+(?:\.\d+)?)[^\d\-]+(-?\d+(?:\.\d+)?)/); if (m) { a = parseFloat(m[1]); b = parseFloat(m[2]); } }
    return a != null && b != null && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? { lat: a, lon: b } : null;
  }
  const slashParts = s => { const m = String(s || '').match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null; };
  // true when the dates of a file can only be month/day/year
  const detectMdy = values => { let mdy = false, dmy = false; values.forEach(v => { const p = slashParts(v); if (p) { if (p[1] > 12) mdy = true; if (p[0] > 12) dmy = true; } }); return mdy && !dmy; };

  function parseDate(ds, ts, mdy) {
    const s = String(ds == null ? '' : ds).trim(), t = String(ts == null ? '' : ts).trim();
    if (!s && !t) return null;
    if (/^\d{10}$/.test(s)) return parseInt(s, 10) * 1000;
    if (/^\d{13}$/.test(s)) return parseInt(s, 10);
    if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+\-]\d{2}:?\d{2})$/.test(s)) { const x = Date.parse(s); if (!isNaN(x)) return x; }
    let y, mo, d, rest = '';
    let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(.*)$/);
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; rest = m[4]; }
    else if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})(.*)$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; rest = m[4]; }
    else if ((m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(.*)$/))) {
      const a = +m[1], b = +m[2];
      if (a > 12 || (!mdy && b <= 12)) { d = a; mo = b; } else { mo = a; d = b; }
      y = +m[3]; rest = m[4];
    } else {
      const x = Date.parse((s + ' ' + t).trim());
      return isNaN(x) ? null : x;
    }
    if (y < 100) y += y < 70 ? 2000 : 1900;
    let hh = 12, mi = 0, ss = 0;
    const tm = (t || rest).match(/(\d{1,2})[:.h](\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (tm) {
      hh = +tm[1]; mi = +tm[2]; ss = tm[3] ? +tm[3] : 0;
      if (tm[4]) { const pm = /pm/i.test(tm[4]); if (pm && hh < 12) hh += 12; if (!pm && hh === 12) hh = 0; }
    }
    const out = new Date(y, mo - 1, d, hh, mi, ss).getTime();
    return isNaN(out) ? null : out;
  }

  /* -> [{roll: {...}, shots: [...]}]. metaMap: {normalised label: roll key} for "label;value" lines above the table */
  function build(parsed, map, opts) {
    opts = opts || {};
    const get = (row, f) => (map[f] != null && row[map[f]] != null ? row[map[f]] : '');
    const meta = {};
    (parsed.meta || []).forEach(p => { const k = opts.metaMap && opts.metaMap[norm(p[0])]; if (k) meta[k] = p[1]; });
    const mdy = map.date != null && detectMdy(parsed.rows.map(r => get(r, 'date')));
    const groups = new Map();
    parsed.rows.forEach(r => { const k = get(r, 'roll'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
    const out = [];
    groups.forEach((rows, key) => {
      const first = f => { const r = rows.find(x => get(x, f) !== ''); return r ? get(r, f) : ''; };
      const seen = {};
      const shots = rows.map((r, i) => {
        const pn = parseNo(get(r, 'no'));
        const no = pn ? pn.no : i + 1;
        seen[no] = (seen[no] || 0) + 1;
        let loc = map.lat != null && map.lon != null ? { lat: num(get(r, 'lat')), lon: num(get(r, 'lon')) } : parseLoc(get(r, 'loc'));
        if (loc && (loc.lat == null || loc.lon == null || Math.abs(loc.lat) > 90 || Math.abs(loc.lon) > 180)) loc = null;
        return {
          no, sub: pn && pn.sub ? pn.sub : seen[no],
          shutter: parseShutter(get(r, 'shutter')), aperture: parseAperture(get(r, 'aperture')), focal: parseFocal(get(r, 'focal')),
          flash: parseFlash(get(r, 'flash')),
          lat: loc ? loc.lat : null, lon: loc ? loc.lon : null, acc: null,
          date: parseDate(get(r, 'date'), get(r, 'time'), mdy),
          note: get(r, 'notes')
        };
      });
      const frames = meta.frames ? parseInt(String(meta.frames).split('/').pop(), 10) : 0;
      const n = new Set(shots.map(s => s.no)).size;
      const pushM = String(meta.push || '').replace('−', '-').match(/[+\-]?\d+/);
      const isoNum = v => { const x = parseInt(String(v || '').replace(/\D/g, ''), 10); return isNaN(x) ? null : x; };
      out.push({
        roll: {
          title: key || meta.title || opts.title || 'Import',
          film: first('film') || meta.film || '', camera: first('camera') || meta.camera || '',
          iso: isoNum(first('iso') || meta.iso), ei: isoNum(meta.ei), push: pushM ? parseInt(pushM[0], 10) : 0,
          frames: frames >= n ? frames : n <= 36 ? 36 : n,
          note: meta.note || ''
        },
        shots
      });
    });
    return out;
  }

  root.FilmImport = { FIELDS, norm, parseCsv, guess, build, parseShutter, parseAperture, parseDate, parseLoc, parseFlash };
})(typeof window !== 'undefined' ? window : globalThis);
