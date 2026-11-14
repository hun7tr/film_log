'use strict';
/* CSV and PDF builders. Pure functions: they receive prepared text and return file contents. */
(function (root) {

  function cell(v) {
    v = v == null ? '' : String(v);
    // keep spreadsheet apps from reading free text as a formula
    if (/^[=+\-@]/.test(v) && !/^[+\-]?\d+([.,]\d+)?$/.test(v)) v = "'" + v;
    return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function csv(meta, header, rows) {
    const out = [];
    meta.forEach(m => out.push(m.map(cell).join(';')));
    out.push('');
    out.push(header.map(cell).join(';'));
    rows.forEach(r => out.push(r.map(cell).join(';')));
    return out.join('\r\n') + '\r\n';
  }

  const CP1252 = { '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159 };

  // text -> PDF string body in WinAnsi, ASCII only (non-ASCII as octal escapes)
  function enc(s) {
    let o = '';
    for (const ch of String(s).replace(/−/g, '-').replace(/″/g, '"')) {
      let c = ch.codePointAt(0);
      if (c > 255 || (c >= 128 && c < 160)) c = CP1252[ch] != null ? CP1252[ch] : 63;
      if (c === 40 || c === 41 || c === 92) o += '\\' + String.fromCharCode(c);
      else if (c < 32 || c > 126) o += '\\' + c.toString(8).padStart(3, '0');
      else o += String.fromCharCode(c);
    }
    return o;
  }

  /*
   doc = {
     title, subtitle, pageLabel, emptyText,
     meta: [{label, value, wide}],
     shots: [{no, main, lines:[...], note, image:{bytes:Uint8Array,w,h}|null}],
     accent: [r,g,b], measure(text,size,bold) -> width in pt
   }
  */
  function pdf(doc) {
    const W = 595.28, H = 841.89, M = 48, CW = W - 2 * M;
    const INK = [28, 26, 24], GREY = [120, 114, 106], LINE = [214, 210, 202];
    const ACC = doc.accent || INK;
    const measure = doc.measure || ((s, size) => String(s).length * size * 0.5);
    const pages = [];
    const images = [];
    let ops, y;

    const col = c => c.map(v => (v / 255).toFixed(3)).join(' ');
    const n2 = v => v.toFixed(2);
    const newPage = () => { ops = []; pages.push(ops); y = M; };
    const text = (x, yy, s, size, bold, c) => {
      ops.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + col(c || INK) + ' rg 1 0 0 1 ' + n2(x) + ' ' + n2(H - yy) + ' Tm (' + enc(s) + ') Tj ET');
    };
    const rule = (yy, c, w, x1, x2) => {
      ops.push(col(c) + ' RG ' + (w || 0.5) + ' w ' + n2(x1 == null ? M : x1) + ' ' + n2(H - yy) + ' m ' + n2(x2 == null ? W - M : x2) + ' ' + n2(H - yy) + ' l S');
    };
    const wrap = (s, size, bold, maxW) => {
      const out = [];
      for (const para of String(s).split(/\r?\n/)) {
        let line = '';
        for (const word of para.split(/\s+/)) {
          const test = line ? line + ' ' + word : word;
          if (!line || measure(test, size, bold) <= maxW) line = test;
          else { out.push(line); line = word; }
        }
        out.push(line);
      }
      return out;
    };
    const fit = (s, size, bold, maxW) => {
      s = String(s);
      if (measure(s, size, bold) <= maxW) return s;
      while (s.length > 1 && measure(s + '…', size, bold) > maxW) s = s.slice(0, -1);
      return s + '…';
    };

    newPage();
    // heading
    text(M, y + 22, fit(doc.title, 24, true, CW), 24, true);
    y += 36;
    text(M, y + 6, doc.subtitle || '', 9, false, GREY);
    y += 18;
    ops.push(col(ACC) + ' rg ' + n2(M) + ' ' + n2(H - y - 3) + ' ' + n2(CW) + ' 3 re f');
    y += 21;

    // roll data, three columns
    const grid = doc.meta.filter(m => !m.wide), wide = doc.meta.filter(m => m.wide);
    const colW = CW / 3;
    grid.forEach((m, i) => {
      const cx = M + (i % 3) * colW, cy = y + Math.floor(i / 3) * 38;
      text(cx, cy + 8, m.label, 8, false, GREY);
      text(cx, cy + 23, fit(m.value, 11, false, colW - 12), 11, false);
    });
    y += Math.ceil(grid.length / 3) * 38;
    wide.forEach(m => {
      text(M, y + 8, m.label, 8, false, GREY);
      const ls = wrap(m.value, 11, false, CW);
      ls.forEach((l, i) => text(M, y + 23 + i * 15, l, 11, false));
      y += 23 + ls.length * 15;
    });
    y += 8;
    rule(y, INK, 0.8);
    y += 4;

    if (!doc.shots.length) text(M, y + 24, doc.emptyText || '', 11, false, GREY);

    const NUM_W = 52, IMG_W = 150, IMG_H = 112;
    doc.shots.forEach(s => {
      let iw = 0, ih = 0;
      if (s.image) {
        const k = Math.min(IMG_W / s.image.w, IMG_H / s.image.h);
        iw = s.image.w * k; ih = s.image.h * k;
      }
      const tw = CW - NUM_W - (s.image ? IMG_W + 16 : 0);
      const noteLines = s.note ? wrap(s.note, 10, false, tw) : [];
      const th = 16 + s.lines.length * 13 + (noteLines.length ? 5 + noteLines.length * 13 : 0);
      const bh = Math.max(th, ih) + 24;
      if (y + bh > H - M - 18) newPage();
      const top = y + 12;
      text(M, top + 13, s.no, 15, true, ACC);
      text(M + NUM_W, top + 11, fit(s.main, 12, true, tw), 12, true);
      let ty = top + 16;
      s.lines.forEach(l => { ty += 13; text(M + NUM_W, ty - 2, fit(l, 9, false, tw), 9, false, GREY); });
      if (noteLines.length) {
        ty += 5;
        noteLines.forEach(l => { ty += 13; text(M + NUM_W, ty - 2, l, 10, false); });
      }
      if (s.image) {
        images.push(s.image);
        ops.push('q ' + n2(iw) + ' 0 0 ' + n2(ih) + ' ' + n2(W - M - iw) + ' ' + n2(H - top - ih) + ' cm /Im' + images.length + ' Do Q');
      }
      y += bh;
      rule(y, LINE, 0.5);
    });

    pages.forEach((p, i) => {
      ops = p;
      const label = (doc.pageLabel || '') + ' ' + (i + 1) + '/' + pages.length;
      text(W - M - measure(label, 8, false), H - 28, label, 8, false, GREY);
      text(M, H - 28, fit(doc.title, 8, false, CW - 80), 8, false, GREY);
    });

    // ---- serialise
    const bytes = s => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };
    const objs = [];
    const add = (...parts) => { objs.push(parts.map(p => typeof p === 'string' ? bytes(p) : p)); return objs.length; };
    add('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push(null);
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const xo = images.map((im, i) => {
      const id = add('<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.bytes.length + ' >>\nstream\n', im.bytes, '\nendstream');
      return '/Im' + (i + 1) + ' ' + id + ' 0 R';
    }).join(' ');
    const kids = pages.map(p => {
      const content = p.join('\n');
      const cid = add('<< /Length ' + content.length + ' >>\nstream\n', content, '\nendstream');
      return add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ' + xo + ' >> >> /Contents ' + cid + ' 0 R >>');
    });
    objs[1] = [bytes('<< /Type /Pages /Count ' + kids.length + ' /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] >>')];

    const chunks = [];
    let len = 0;
    const push = p => { const u = typeof p === 'string' ? bytes(p) : p; chunks.push(u); len += u.length; };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const offsets = [];
    objs.forEach((parts, i) => {
      offsets.push(len);
      push((i + 1) + ' 0 obj\n');
      parts.forEach(push);
      push('\nendobj\n');
    });
    const xref = len;
    push('xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n');
    offsets.forEach(o => push(String(o).padStart(10, '0') + ' 00000 n \n'));
    push('trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    const out = new Uint8Array(len);
    let off = 0;
    chunks.forEach(c => { out.set(c, off); off += c.length; });
    return out;
  }

  root.FilmExport = { csv, pdf };
})(typeof window !== 'undefined' ? window : globalThis);
