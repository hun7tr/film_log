'use strict';
/* Writes shot data as standard EXIF into a JPEG. Pure functions, no dependencies. */
(function (root) {
  const enc = new TextEncoder();
  const cat = parts => {
    let n = 0;
    parts.forEach(p => { n += p.length; });
    const out = new Uint8Array(n);
    let o = 0;
    parts.forEach(p => { out.set(p, o); o += p.length; });
    return out;
  };
  const u16 = v => new Uint8Array([v & 255, (v >> 8) & 255]);
  const u32 = v => new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]);
  const zstr = s => { const b = enc.encode(s); const u = new Uint8Array(b.length + 1); u.set(b); return u; };
  const plain = s => String(s).normalize('NFKD').replace(/[^\x20-\x7e]/g, '');

  const E = {
    ascii: (tag, s) => { const b = zstr(s); return { tag, type: 2, count: b.length, bytes: b }; },
    short: (tag, v) => ({ tag, type: 3, count: 1, bytes: u16(v) }),
    long: (tag, v) => ({ tag, type: 4, count: 1, bytes: u32(v) }),
    srational: (tag, pairs) => ({ tag, type: 10, count: pairs.length, bytes: cat(pairs.flatMap(p => [u32(p[0] >>> 0), u32(p[1] >>> 0)])) }),
    rational: (tag, pairs) => ({ tag, type: 5, count: pairs.length, bytes: cat(pairs.flatMap(p => [u32(p[0] >>> 0), u32(p[1] >>> 0)])) }),
    undef: (tag, b) => ({ tag, type: 7, count: b.length, bytes: b }),
    byte: (tag, b) => ({ tag, type: 1, count: b.length, bytes: b })
  };
  const ifdSize = es => 2 + 12 * es.length + 4 + es.reduce((n, e) => n + (e.bytes.length > 4 ? e.bytes.length + (e.bytes.length & 1) : 0), 0);
  function buildIfd(es, offset) {
    es = es.slice().sort((a, b) => a.tag - b.tag);
    const head = [u16(es.length)], data = [];
    let dOff = offset + 2 + 12 * es.length + 4;
    es.forEach(e => {
      head.push(u16(e.tag), u16(e.type), u32(e.count));
      if (e.bytes.length <= 4) { const v = new Uint8Array(4); v.set(e.bytes); head.push(v); }
      else {
        head.push(u32(dOff));
        data.push(e.bytes);
        dOff += e.bytes.length;
        if (e.bytes.length & 1) { data.push(new Uint8Array(1)); dOff++; }
      }
    });
    head.push(u32(0));
    return cat(head.concat(data));
  }

  const p2 = n => String(n).padStart(2, '0');
  const exifDate = ms => { const d = new Date(ms); return d.getFullYear() + ':' + p2(d.getMonth() + 1) + ':' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); };
  const dms = v => { const a = Math.abs(v), d = Math.floor(a), mf = (a - d) * 60, m = Math.floor(mf); return [[d, 1], [m, 1], [Math.round((mf - m) * 60 * 100), 100]]; };

  /* meta: {description, model, date(ms), exposure:[num,den], fnumber, iso, focal, flash, ev (thirds of a stop), lat, lon, comment} — every field optional */
  function tiff(meta, orientation) {
    const dt = meta.date != null ? exifDate(meta.date) : null;
    const ifd0 = [E.ascii(0x0131, 'Film_Log')];
    if (meta.description) ifd0.push(E.ascii(0x010E, meta.description));
    if (meta.model) ifd0.push(E.ascii(0x0110, meta.model));
    if (orientation) ifd0.push(E.short(0x0112, orientation));
    if (dt) ifd0.push(E.ascii(0x0132, dt));

    const exif = [E.undef(0x9000, enc.encode('0232'))];
    if (meta.exposure) exif.push(E.rational(0x829A, [meta.exposure]));
    if (meta.fnumber) exif.push(E.rational(0x829D, [[Math.round(meta.fnumber * 10), 10]]));
    if (meta.iso) exif.push(E.short(0x8827, Math.min(65535, meta.iso)));
    if (dt) exif.push(E.ascii(0x9003, dt), E.ascii(0x9004, dt));
    if (meta.ev != null) exif.push(E.srational(0x9204, [[meta.ev, 3]]));
    if (meta.flash != null) exif.push(E.short(0x9209, meta.flash ? 1 : 0));
    if (meta.focal) exif.push(E.rational(0x920A, [[Math.round(meta.focal * 10), 10]]));
    if (meta.comment) exif.push(E.undef(0x9286, cat([new Uint8Array([0x41, 0x53, 0x43, 0x49, 0x49, 0, 0, 0]), enc.encode(plain(meta.comment))])));

    const gps = meta.lat != null && meta.lon != null ? [
      E.byte(0, new Uint8Array([2, 3, 0, 0])),
      E.ascii(1, meta.lat >= 0 ? 'N' : 'S'), E.rational(2, dms(meta.lat)),
      E.ascii(3, meta.lon >= 0 ? 'E' : 'W'), E.rational(4, dms(meta.lon))
    ] : null;

    const pExif = E.long(0x8769, 0), pGps = E.long(0x8825, 0);
    ifd0.push(pExif);
    if (gps) ifd0.push(pGps);
    const o0 = 8, oE = o0 + ifdSize(ifd0), oG = oE + ifdSize(exif);
    pExif.bytes = u32(oE);
    pGps.bytes = u32(oG);
    return cat([new Uint8Array([0x49, 0x49, 0x2A, 0, 8, 0, 0, 0]), buildIfd(ifd0, o0), buildIfd(exif, oE), gps ? buildIfd(gps, oG) : new Uint8Array(0)]);
  }

  // keeps the rotation flag a scanner may have set
  function readOrientation(t) {
    try {
      const le = t[0] === 0x49;
      const r16 = o => (le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]);
      const r32 = o => (le ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3])) >>> 0;
      const off = r32(4), n = r16(off);
      for (let i = 0; i < n; i++) {
        const e = off + 2 + i * 12;
        if (r16(e) === 0x0112) { const v = r16(e + 8); return v >= 1 && v <= 8 ? v : 0; }
      }
    } catch (e) {}
    return 0;
  }

  const isJpeg = b => b.length > 3 && b[0] === 0xFF && b[1] === 0xD8;

  function writeExif(bytes, meta) {
    if (!isJpeg(bytes)) throw new Error('not a jpeg');
    let pos = 2, orientation = 0;
    const keep = [];
    while (pos + 4 <= bytes.length && bytes[pos] === 0xFF) {
      const m = bytes[pos + 1];
      if (m === 0xDA || m === 0xD9) break;
      if ((m >= 0xD0 && m <= 0xD7) || m === 0x01 || m === 0xFF) { keep.push(bytes.subarray(pos, pos + (m === 0xFF ? 1 : 2))); pos += m === 0xFF ? 1 : 2; continue; }
      const len = (bytes[pos + 2] << 8) | bytes[pos + 3];
      if (len < 2) break;
      const isExif = m === 0xE1 && len >= 8 && bytes[pos + 4] === 0x45 && bytes[pos + 5] === 0x78 && bytes[pos + 6] === 0x69 && bytes[pos + 7] === 0x66 && bytes[pos + 8] === 0 && bytes[pos + 9] === 0;
      if (isExif) orientation = readOrientation(bytes.subarray(pos + 10, pos + 2 + len)) || orientation;
      else keep.push(bytes.subarray(pos, pos + 2 + len));
      pos += 2 + len;
    }
    const t = tiff(meta, orientation);
    const len = 2 + 6 + t.length;
    if (len > 65535) throw new Error('exif too large');
    return cat([new Uint8Array([0xFF, 0xD8, 0xFF, 0xE1, len >> 8, len & 255, 0x45, 0x78, 0x69, 0x66, 0, 0]), t].concat(keep, [bytes.subarray(pos)]));
  }

  const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

  root.FilmScan = { writeExif, isJpeg, natural };
})(typeof window !== 'undefined' ? window : globalThis);
