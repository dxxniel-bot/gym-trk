// gym//TRK · tools/shortcut/aea.cjs · abre un atajo FIRMADO (contenedor AEA1 de Apple) para ver qué lleva dentro
//
// Un .shortcut firmado es: 'AEA1' + perfil 0 (firmado, SIN cifrar) + datos de firma (plist con la cadena de certificados)
// + firma ECDSA + cabeceras + el contenido comprimido con LZFSE. El contenido es un Apple Archive con un solo archivo,
// `Shortcut.wflow`, que es el plist del atajo. Aquí NO se comprueba la firma (eso lo hace el iPhone con la llave de
// Apple): se lee lo que el servicio de firma metió, para comparar que sean nuestras acciones y no otras.
//
//   const { openSigned } = require('./aea.cjs');  openSigned(buffer) → { workflow, certs, rawSize, checksumOk, files }
//   node tools/shortcut/aea.cjs <archivo.shortcut>   → resumen
'use strict';
const crypto = require('crypto');
const { parseBinary, parse } = require('./plist.cjs');

// ───────────── LZFSE (solo descompresión; bloques bvx2 y bvx-, que es lo que produce el compresor de Apple) ─────────────
const L_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 5, 8];
const L_BASE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 28, 60];
const M_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 5, 8, 11];
const M_BASE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 24, 56, 312];
const D_EXTRA = [], D_BASE = [];
(() => { let base = 0; for (let b = 0; b < 16; b++) for (let k = 0; k < 4; k++) { D_EXTRA.push(b); D_BASE.push(base); base += 1 << b; } })();
const FREQ_NBITS = [2, 3, 2, 5, 2, 3, 2, 8, 2, 3, 2, 5, 2, 3, 2, 14, 2, 3, 2, 5, 2, 3, 2, 8, 2, 3, 2, 5, 2, 3, 2, 14];
const FREQ_VALUE = [0, 2, 1, 4, 0, 3, 1, -1, 0, 2, 1, 5, 0, 3, 1, -1, 0, 2, 1, 6, 0, 3, 1, -1, 0, 2, 1, 7, 0, 3, 1, -1];
const N_L = 20, N_M = 20, N_D = 64, N_LIT = 256, S_L = 64, S_M = 64, S_D = 256, S_LIT = 1024;

// tabla de decodificación FSE: por estado → { k: bits a leer, delta, sym | (vbits, vbase) }
function fseTable(nstates, freq, vbits, vbase) {
  const t = [], nclz = Math.clz32(nstates); let sum = 0;
  for (let i = 0; i < freq.length; i++) {
    const f = freq[i]; if (!f) continue;
    sum += f; if (sum > nstates) throw new Error('LZFSE: frecuencias de más');
    const k = Math.clz32(f) - nclz, j0 = ((2 * nstates) >> k) - f;
    for (let j = 0; j < f; j++) {
      const e = j < j0 ? { k, delta: ((f + j) << k) - nstates } : { k: k - 1, delta: (j - j0) << (k - 1) };
      e.sym = i; if (vbits) { e.vbits = vbits[i]; e.vbase = vbase[i]; }
      t.push(e);
    }
  }
  while (t.length < nstates) t.push(null);
  return t;
}
// flujo de bits que se lee de atrás hacia adelante: el tramo es un entero little-endian y se saca primero lo más alto
function bitsBackward(buf, start, end, pad) {
  let pos = (end - start) * 8 + pad;   // pad ≤ 0: bits de relleno al final del último byte
  if (pos < 0) throw new Error('LZFSE: tramo de bits vacío');
  return n => {
    if (!n) return 0;
    pos -= n; if (pos < 0) throw new Error('LZFSE: se acabaron los bits');
    const by = start + (pos >> 3), sh = pos & 7; let v = 0;
    for (let i = 0; i < 4; i++) { const p = by + i; if (p < end) v += buf[p] * Math.pow(2, 8 * i); }   // hasta 32 bits, sin signo
    return Math.floor(v / Math.pow(2, sh)) % Math.pow(2, n);
  };
}
const bitField = (lo, hi, off, n) => {   // campo de n bits (≤ 32) a partir del bit `off` de un entero de 64 bits partido en dos de 32
  let v = 0n; const x = (BigInt(hi) << 32n) | BigInt(lo); v = (x >> BigInt(off)) & ((1n << BigInt(n)) - 1n); return Number(v);
};
function lzfseDecode(src, expect) {
  const out = Buffer.alloc(expect); let o = 0, p = 0;
  for (;;) {
    if (p + 4 > src.length) throw new Error('LZFSE: flujo cortado');
    const magic = src.toString('latin1', p, p + 4);
    if (magic === 'bvx$') break;
    if (magic === 'bvx-') { const n = src.readUInt32LE(p + 4); src.copy(out, o, p + 8, p + 8 + n); o += n; p += 8 + n; continue; }
    if (magic !== 'bvx2') throw new Error('LZFSE: bloque ' + JSON.stringify(magic) + ' no soportado');
    const nRaw = src.readUInt32LE(p + 4), w = i => src.readUInt32LE(p + 8 + 4 * i);
    const f = (word, off, n) => bitField(w(word * 2), w(word * 2 + 1), off, n);
    const nLit = f(0, 0, 20), litBytes = f(0, 20, 20), nMatch = f(0, 40, 20), litPad = f(0, 60, 3) - 7;
    const litState = [f(1, 0, 10), f(1, 10, 10), f(1, 20, 10), f(1, 30, 10)], lmdBytes = f(1, 40, 20), lmdPad = f(1, 60, 3) - 7;
    const hdr = f(2, 0, 32); let lS = f(2, 32, 10), mS = f(2, 42, 10), dS = f(2, 52, 10);
    // tablas de frecuencia: empaquetadas en bits tras los 32 bytes fijos de la cabecera
    const freq = []; { let acc = 0, nb = 0, q = p + 32; const end = p + hdr;
      for (let i = 0; i < N_L + N_M + N_D + N_LIT; i++) {
        while (q < end && nb + 8 <= 32) { acc += src[q] * Math.pow(2, nb); nb += 8; q++; }
        const b = acc % 32, n = FREQ_NBITS[b]; if (n > nb) throw new Error('LZFSE: tabla de frecuencias cortada');
        freq.push(n === 8 ? 8 + (Math.floor(acc / 16) % 16) : n === 14 ? 24 + (Math.floor(acc / 16) % 1024) : FREQ_VALUE[b]);
        acc = Math.floor(acc / Math.pow(2, n)); nb -= n;
      }
      if (nb >= 8 || q !== end) throw new Error('LZFSE: cabecera mal medida'); }
    const tL = fseTable(S_L, freq.slice(0, N_L), L_EXTRA, L_BASE), tM = fseTable(S_M, freq.slice(N_L, N_L + N_M), M_EXTRA, M_BASE);
    const tD = fseTable(S_D, freq.slice(N_L + N_M, N_L + N_M + N_D), D_EXTRA, D_BASE), tLit = fseTable(S_LIT, freq.slice(N_L + N_M + N_D));
    // literales: 4 estados intercalados
    const lits = Buffer.alloc(nLit + 4), a = p + hdr; { const pull = bitsBackward(src, a, a + litBytes, litPad);
      for (let i = 0; i < nLit; i += 4) for (let s = 0; s < 4; s++) { const e = tLit[litState[s]]; if (!e) throw new Error('LZFSE: estado de literal inválido'); litState[s] = e.delta + pull(e.k); lits[i + s] = e.sym; } }
    // (L, M, D): L literales, luego M bytes copiados de D bytes atrás
    const b0 = a + litBytes, pull = bitsBackward(src, b0, b0 + lmdBytes, lmdPad), stop = o + nRaw; let li = 0, D = -1;
    const val = (t, s) => { const e = t[s]; if (!e) throw new Error('LZFSE: estado inválido'); const x = pull(e.k + e.vbits); return [e.delta + Math.floor(x / Math.pow(2, e.vbits)), e.vbase + (x % Math.pow(2, e.vbits))]; };
    for (let n = 0; n < nMatch; n++) {
      let r = val(tL, lS); lS = r[0]; const L = r[1]; r = val(tM, mS); mS = r[0]; const M = r[1]; r = val(tD, dS); dS = r[0]; if (r[1]) D = r[1];
      if (li + L > nLit || o + L + M > stop) throw new Error('LZFSE: se pasa del tamaño');
      lits.copy(out, o, li, li + L); o += L; li += L;
      if (M) { if (D <= 0 || D > o) throw new Error('LZFSE: distancia inválida'); for (let k = 0; k < M; k++, o++) out[o] = out[o - D]; }
    }
    if (o !== stop) throw new Error('LZFSE: el bloque no dio su tamaño');
    p = b0 + lmdBytes;
  }
  if (o !== expect) throw new Error('LZFSE: salieron ' + o + ' bytes, se esperaban ' + expect);
  return out;
}

// ───────────── Apple Archive (AA01): lista de { PAT: ruta, data } ─────────────
function appleArchive(buf) {
  const files = []; let p = 0;
  while (p + 6 <= buf.length) {
    const magic = buf.toString('latin1', p, p + 4); if (magic !== 'AA01' && magic !== 'YAA1') throw new Error('Apple Archive: cabecera desconocida ' + JSON.stringify(magic));
    const hs = buf.readUInt16LE(p + 4), end = p + hs, e = {}; let q = p + 6, blob = 0;
    while (q + 4 <= end) {
      const key = buf.toString('latin1', q, q + 3), ty = String.fromCharCode(buf[q + 3]); q += 4;
      if (ty === '*') continue;
      else if ('1248'.indexOf(ty) >= 0) { const n = +ty; e[key] = n === 8 ? Number(buf.readBigUInt64LE(q)) : buf.readUIntLE(q, n); q += n; }
      else if (ty === 'P') { const n = buf.readUInt16LE(q); e[key] = buf.toString('utf8', q + 2, q + 2 + n); q += 2 + n; }
      else if (ty === 'S') q += 8; else if (ty === 'T') q += 12;
      else if (ty === 'A') { blob += buf.readUInt16LE(q); if (key === 'DAT') e._len = buf.readUInt16LE(q); q += 2; }
      else if (ty === 'B') { blob += buf.readUInt32LE(q); if (key === 'DAT') e._len = buf.readUInt32LE(q); q += 4; }
      else if (ty === 'C') { const n = Number(buf.readBigUInt64LE(q)); blob += n; if (key === 'DAT') e._len = n; q += 8; }
      else if (ty === 'F') q += 4; else if (ty === 'G') q += 20; else if (ty === 'H') q += 32; else if (ty === 'I') q += 48; else if (ty === 'J') q += 64;
      else throw new Error('Apple Archive: campo ' + key + ty + ' no previsto');
    }
    if (e._len != null) e.data = buf.slice(end, end + e._len);
    files.push(e); p = end + blob;
  }
  return files;
}

// ───────────── contenedor AEA1 (perfil 0: firmado, sin cifrar) ─────────────
function openSigned(buf) {
  if (buf.toString('latin1', 0, 4) !== 'AEA1') throw new Error('no es un archivo firmado (no empieza con AEA1)');
  const profile = buf.readUIntLE(4, 3); if (profile !== 0) throw new Error('perfil AEA ' + profile + ': va cifrado, no se puede leer');
  const authLen = buf.readUInt32LE(8), auth = buf.slice(12, 12 + authLen); let certs = [];
  // de cada certificado se anotan sus nombres legibles (cadenas DER con su largo delante); no se valida la cadena
  const names = c => { const out = []; for (let i = 2; i < c.length - 2; i++) { const n = c[i + 1]; if ((c[i] === 0x0c || c[i] === 0x13) && n >= 4 && n < 80 && i + 2 + n <= c.length) { const s = c.toString('latin1', i + 2, i + 2 + n); if (/^[A-Za-z0-9 .,:()\-]+$/.test(s) && out.indexOf(s) < 0) out.push(s); } } return out; };
  try { const a = parseBinary(auth); certs = (a.SigningCertificateChain || []).map(c => ({ bytes: c.length, nombres: names(c) })); } catch (_) {}
  let p = 12 + authLen + 128 + 32 + 32 + 32;             // firma (128) · llave/efímera (32) · sal (32) · MAC de la cabecera raíz (32)
  const rawSize = Number(buf.readBigUInt64LE(p)), container = Number(buf.readBigUInt64LE(p + 8)), segSize = buf.readUInt32LE(p + 16), perCluster = buf.readUInt32LE(p + 20);
  const comp = String.fromCharCode(buf[p + 24]), cks = buf[p + 25];
  if (container !== buf.length) throw new Error('AEA: el tamaño declarado (' + container + ') no es el del archivo (' + buf.length + ')');
  if (comp !== 'e' && comp !== '-') throw new Error('AEA: compresión ' + JSON.stringify(comp) + ' no soportada');
  const nSeg = Math.ceil(rawSize / segSize); if (nSeg > perCluster) throw new Error('AEA: más de un clúster (archivo demasiado grande para un atajo)');
  p += 48 + 32;                                            // cabecera raíz (48) · MAC de la cabecera del clúster (32)
  const segs = []; for (let i = 0; i < nSeg; i++) segs.push({ raw: buf.readUInt32LE(p + i * 40), size: buf.readUInt32LE(p + i * 40 + 4), sum: buf.slice(p + i * 40 + 8, p + i * 40 + 40) });
  p += perCluster * 40 + 32 + perCluster * 32;            // cabeceras de segmento · MAC del clúster siguiente · MAC de cada segmento
  const parts = []; let checksumOk = true;
  segs.forEach(s => { const c = buf.slice(p, p + s.size); p += s.size; const d = (comp === '-' || s.size === s.raw) ? c : lzfseDecode(c, s.raw);
    if (cks === 2 && !crypto.createHash('sha256').update(d).digest().equals(s.sum)) checksumOk = false; parts.push(d); });
  const raw = Buffer.concat(parts); if (raw.length !== rawSize) throw new Error('AEA: contenido de ' + raw.length + ' bytes, se esperaban ' + rawSize);
  const files = appleArchive(raw), wf = files.find(f => /Shortcut\.wflow$/.test(f.PAT || '') && f.data);
  if (!wf) throw new Error('AEA: no trae Shortcut.wflow (trae: ' + files.map(f => f.PAT).join(', ') + ')');
  return { workflow: parse(wf.data), certs, rawSize, checksumOk, checksumKind: cks, files: files.map(f => ({ ruta: f.PAT || '', bytes: f.data ? f.data.length : 0 })) };
}

if (require.main === module) {
  const f = process.argv[2]; if (!f) { console.error('uso: node aea.cjs <archivo.shortcut firmado>'); process.exit(2); }
  const r = openSigned(require('fs').readFileSync(f)), n = {};
  (r.workflow.WFWorkflowActions || []).forEach(a => { n[a.WFWorkflowActionIdentifier] = (n[a.WFWorkflowActionIdentifier] || 0) + 1; });
  console.log(JSON.stringify({ archivos: r.files, certificados: r.certs, sumaOk: r.checksumOk, cliente: r.workflow.WFWorkflowClientVersion, acciones: (r.workflow.WFWorkflowActions || []).length, ids: n }, null, 1));
}
module.exports = { openSigned, lzfseDecode, appleArchive };
