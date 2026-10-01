// gym//TRK · tools/shortcut/plist.cjs · plist de Apple en node puro (sin dependencias)
//   toXML(obj)        objeto JS → plist XML (lo que escribe build.cjs)
//   parseXML(texto)   plist XML → objeto JS (para validar lo que se escribió)
//   parseBinary(buf)  bplist00 → objeto JS (los atajos públicos que Apple sirve vienen así)
//   parse(buf)        detecta cuál de los dos es
// Tipos: dict → objeto · array → arreglo · string · integer/real → número · true/false · date → {__date:iso} · data → Buffer
'use strict';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// un real se marca con new Real(n) cuando hace falta que un entero salga como <real> (no se usa hoy, pero el lector lo respeta)
class Real { constructor(n) { this.n = +n; } }

function toXML(root) {
  const out = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">'];
  const w = (v, ind) => {
    const p = '\t'.repeat(ind);
    if (v === null || v === undefined) throw new Error('plist: valor nulo no se puede escribir');
    if (v === true) return out.push(p + '<true/>');
    if (v === false) return out.push(p + '<false/>');
    if (v instanceof Real) return out.push(p + '<real>' + v.n + '</real>');
    if (typeof v === 'number') { if (!isFinite(v)) throw new Error('plist: número no finito'); return out.push(p + (Number.isInteger(v) ? '<integer>' + v + '</integer>' : '<real>' + v + '</real>')); }
    if (typeof v === 'string') return out.push(p + '<string>' + esc(v) + '</string>');
    if (Buffer.isBuffer(v)) return out.push(p + '<data>' + v.toString('base64') + '</data>');
    if (Array.isArray(v)) { if (!v.length) return out.push(p + '<array/>'); out.push(p + '<array>'); v.forEach(x => w(x, ind + 1)); return out.push(p + '</array>'); }
    if (typeof v === 'object') {
      if (typeof v.__date === 'string') return out.push(p + '<date>' + esc(v.__date) + '</date>');
      const ks = Object.keys(v); if (!ks.length) return out.push(p + '<dict/>');
      out.push(p + '<dict>'); ks.forEach(k => { out.push(p + '\t<key>' + esc(k) + '</key>'); w(v[k], ind + 1); }); return out.push(p + '</dict>');
    }
    throw new Error('plist: tipo no soportado ' + typeof v);
  };
  w(root, 0); out.push('</plist>');
  return out.join('\n') + '\n';
}

function parseXML(text) {
  const s = String(text); let i = s.indexOf('<plist'); if (i < 0) throw new Error('plist XML: falta <plist>');
  i = s.indexOf('>', i) + 1;
  const un = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const tag = () => { ws(); if (s[i] !== '<') throw new Error('plist XML: se esperaba una etiqueta en ' + i); const j = s.indexOf('>', i); const t = s.slice(i + 1, j); i = j + 1; return t; };
  const body = name => { const j = s.indexOf('</' + name + '>', i); if (j < 0) throw new Error('plist XML: sin cierre de <' + name + '>'); const t = s.slice(i, j); i = j + name.length + 3; return t; };
  const val = t => {
    if (t === 'true/') return true; if (t === 'false/') return false;
    if (t === 'dict/') return {}; if (t === 'array/') return []; if (t === 'string/') return '';
    if (t === 'string') return un(body('string'));
    if (t === 'integer') return parseInt(body('integer'), 10);
    if (t === 'real') return parseFloat(body('real'));
    if (t === 'date') return { __date: body('date') };
    if (t === 'data') return Buffer.from(body('data').replace(/\s/g, ''), 'base64');
    if (t === 'array') { const a = []; for (;;) { const n = tag(); if (n === '/array') return a; a.push(val(n)); } }
    if (t === 'dict') { const o = {}; for (;;) { const n = tag(); if (n === '/dict') return o; if (n !== 'key') throw new Error('plist XML: se esperaba <key>, llegó <' + n + '>'); const k = un(body('key')); o[k] = val(tag()); } }
    throw new Error('plist XML: etiqueta desconocida <' + t + '>');
  };
  const v = val(tag()); if (tag() !== '/plist') throw new Error('plist XML: sobra contenido tras la raíz'); return v;
}

function parseBinary(buf) {
  if (buf.slice(0, 8).toString('latin1') !== 'bplist00') throw new Error('bplist: cabecera desconocida');
  const tr = buf.slice(buf.length - 32);
  const offSize = tr[6], refSize = tr[7];
  const num = Number(tr.readBigUInt64BE(8)), top = Number(tr.readBigUInt64BE(16)), tbl = Number(tr.readBigUInt64BE(24));
  const uint = (o, n) => { let v = 0n; for (let k = 0; k < n; k++) v = (v << 8n) | BigInt(buf[o + k]); return Number(v); };
  const offs = []; for (let k = 0; k < num; k++) offs.push(uint(tbl + k * offSize, offSize));
  const lenAt = (o, lo) => { if (lo !== 15) return [lo, o + 1]; const m = buf[o + 1], n = 1 << (m & 15); return [uint(o + 2, n), o + 2 + n]; };
  const seen = new Map();
  const obj = idx => {
    if (seen.has(idx)) return seen.get(idx);
    const o = offs[idx], b = buf[o], hi = b >> 4, lo = b & 15; let v;
    if (hi === 0) { v = lo === 8 ? false : lo === 9 ? true : null; }
    else if (hi === 1) { const n = 1 << lo; v = n === 8 ? Number(buf.readBigInt64BE(o + 1)) : uint(o + 1, n); }
    else if (hi === 2) { v = lo === 2 ? buf.readFloatBE(o + 1) : buf.readDoubleBE(o + 1); }
    else if (hi === 3) { v = { __date: new Date((buf.readDoubleBE(o + 1) + 978307200) * 1000).toISOString() }; }
    else if (hi === 4) { const [n, p] = lenAt(o, lo); v = Buffer.from(buf.slice(p, p + n)); }
    else if (hi === 5) { const [n, p] = lenAt(o, lo); v = buf.slice(p, p + n).toString('latin1'); }
    else if (hi === 6) { const [n, p] = lenAt(o, lo); const t = Buffer.from(buf.slice(p, p + n * 2)); t.swap16(); v = t.toString('utf16le'); }
    else if (hi === 8) { v = uint(o + 1, lo + 1); }
    else if (hi === 10 || hi === 12) { const [n, p] = lenAt(o, lo); v = []; seen.set(idx, v); for (let k = 0; k < n; k++) v.push(obj(uint(p + k * refSize, refSize))); return v; }
    else if (hi === 13) { const [n, p] = lenAt(o, lo); v = {}; seen.set(idx, v); for (let k = 0; k < n; k++) { const key = obj(uint(p + k * refSize, refSize)); v[key] = obj(uint(p + (n + k) * refSize, refSize)); } return v; }
    else throw new Error('bplist: tipo 0x' + b.toString(16) + ' no soportado');
    seen.set(idx, v); return v;
  };
  return obj(top);
}

function parse(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  const head = buf.slice(0, 8).toString('latin1');
  if (head === 'bplist00') return parseBinary(buf);
  if (head.slice(0, 4) === 'AEA1') throw new Error('archivo firmado (AEA1): no se puede leer sin la llave de Apple');
  return parseXML(buf.toString('utf8'));
}

module.exports = { toXML, parseXML, parseBinary, parse, Real };
