#!/usr/bin/env node
// Notion "HTML" export -> JSON pages for Kretya Wiki (dry run: reads files, writes one JSON file).
// Usage: node scripts/notion-import/convert.mjs "<export dir>" "<out.json>"
//
// Output: array of { key, parent_key, position, title, icon, cover, kind, schema, props, body },
// parents before children. Bodies are Markdown in the subset our Tiptap editor reads
// (GitHub alerts for callouts, <details> toggles, <div data-columns> columns, wiki:<key> links).

import fs from 'node:fs';
import path from 'node:path';
import jsdom from 'jsdom';

const { JSDOM } = jsdom;

const [, , exportDirArg, outArg] = process.argv;
if (!exportDirArg || !outArg) {
  console.error('Usage: node scripts/notion-import/convert.mjs "<export dir>" "<out.json>"');
  process.exit(1);
}
const EXPORT_DIR = path.resolve(exportDirArg);
const OUT = path.resolve(outArg);

const EXCLUDED_TITLES = new Set(['data pribadi', 'ktp']);
const ID_RE = /([0-9a-f]{32})(?=\.(?:html|csv)$)/;

// ---------- stats ----------
const stats = {
  blocks: {},
  unhandled: {},
  skipped: {},
  sixteen: [],
  unresolvedLinks: [],
};
const bump = (obj, k, n = 1) => { obj[k] = (obj[k] || 0) + n; };

// ---------- helpers ----------
const dashless = (id) => (id || '').replace(/-/g, '').toLowerCase();
const isRemote = (u) => /^https?:\/\//i.test(u || '');
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();
const norm = (s) => clean(s).toLowerCase();

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function stemOf(file) {
  // "Name <32hex>.html" -> "Name"
  return path.basename(file).replace(/ ?[0-9a-f]{32}\.(html|csv)$/, '').replace(/\.(html|csv)$/, '');
}

function slugify(name) {
  const s = (name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return s || 'prop';
}

// 16-digit numbers (national ID / card shaped), contiguous or in 4-4-4-4 groups.
const SIXTEEN_RE = /(?<![\d])(?:\d{16}|\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4})(?![\d])/g;
function strip16(str, where) {
  if (typeof str !== 'string' || !str) return str;
  // protect wiki keys (32 hex) from accidental matches
  const keys = [];
  let s = str.replace(/wiki:[0-9a-f]{32}/g, (m) => { keys.push(m); return `\u0000${keys.length - 1}\u0000`; });
  s = s.replace(SIXTEEN_RE, (m) => {
    stats.sixteen.push({ where, masked: m.slice(0, 4) + '…' + m.slice(-2) });
    return '';
  });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keys[+i]);
}

// ---------- number / date parsing ----------
function parseNumber(text) {
  const t = clean(text);
  if (!t) return null;
  const m = t.match(/^(-?)\s*(?:[A-Za-z]{1,4}\.?|[$€£¥₹])?\s*(-?)\s*([\d.,]+)\s*(%)?$/);
  if (!m) return null;
  let n = m[3];
  m[1] = m[1] || m[2];
  if (!/\d/.test(n)) return null;
  const hasC = n.includes(','), hasD = n.includes('.');
  if (hasC && hasD) {
    if (n.lastIndexOf(',') > n.lastIndexOf('.')) n = n.replace(/\./g, '').replace(',', '.');
    else n = n.replace(/,/g, '');
  } else if (hasC) {
    n = /^\d{1,3}(,\d{3})+$/.test(n) ? n.replace(/,/g, '') : n.replace(',', '.');
  } else if (hasD) {
    if (/^\d{1,3}(\.\d{3}){2,}$/.test(n)) n = n.replace(/\./g, '');
  }
  const v = Number((m[1] || '') + n);
  return Number.isFinite(v) ? v : null;
}

function parseDate(td) {
  const time = td.querySelector('time');
  const dt = time?.getAttribute('datetime');
  if (dt && /^\d{4}-\d{2}-\d{2}/.test(dt)) return dt.slice(0, 10);
  let t = clean(td.textContent).replace(/^@/, '');
  if (!t) return null;
  t = t.split('→')[0].trim();
  const iso = t.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const d = new Date(t.replace(/\s+\d{1,2}:\d{2}\s*(AM|PM)?$/i, ''));
  if (!Number.isNaN(d.getTime())) {
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  return null;
}

// ---------- load export ----------
const files = walk(EXPORT_DIR);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const csvFiles = files.filter((f) => f.endsWith('.csv'));

/** @type {Map<string, any>} key -> page record */
const pages = new Map();
for (const file of htmlFiles) {
  const rel = path.relative(EXPORT_DIR, file);
  const doc = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
  const article = doc.querySelector('article');
  const fileId = (path.basename(file).match(ID_RE) || [])[1];
  const key = dashless(article?.id) || fileId;
  if (!key) { bump(stats.skipped, 'html without id'); continue; }
  const header = doc.querySelector('article > header') || doc.querySelector('header');
  const titleEl = header?.querySelector('.page-title');
  const title = clean(titleEl?.textContent) || clean(doc.title) || 'Untitled';

  let icon = null;
  const iconBox = header?.querySelector('.page-header-icon');
  if (iconBox) {
    const em = iconBox.querySelector('[data-emoji]');
    const img = iconBox.querySelector('img');
    if (em) icon = em.getAttribute('data-emoji') || clean(em.textContent) || null;
    else if (img && isRemote(img.getAttribute('src'))) icon = img.getAttribute('src');
    else if (clean(iconBox.textContent)) icon = clean(iconBox.textContent);
  }
  let cover = null;
  const coverImg = header?.querySelector('img.page-cover-image');
  if (coverImg && isRemote(coverImg.getAttribute('src'))) cover = coverImg.getAttribute('src');
  else if (coverImg) bump(stats.skipped, 'local cover image');

  pages.set(key, {
    key, file, rel, doc, title, icon, cover,
    propsTable: header?.querySelector('table.properties') || null,
    body: doc.querySelector('.page-body'),
    description: header?.querySelector('.page-description'),
  });
}

// ---------- databases ----------
/** collection id -> db record */
const dbs = new Map();
const rowOf = new Map(); // row page key -> { dbKey, index }

function propTypesFromRowPages(rowKeys) {
  // name -> Set(notion types)
  const out = new Map();
  for (const k of rowKeys) {
    const pg = pages.get(k);
    if (!pg?.propsTable) continue;
    for (const tr of pg.propsTable.querySelectorAll('tr.property-row')) {
      const name = clean(tr.querySelector('th')?.textContent);
      const cls = [...tr.classList].find((c) => c.startsWith('property-row-') && c !== 'property-row');
      if (!name || !cls) continue;
      if (!out.has(name)) out.set(name, new Set());
      out.get(name).add(cls.slice('property-row-'.length));
    }
  }
  return out;
}

function cellKind(td) {
  if (td.querySelector('input.checkbox, .checkbox')) return 'checkbox';
  if (td.querySelector('.selected-value')) return td.querySelectorAll('.selected-value').length > 1 ? 'multi_select' : 'select';
  if (td.querySelector('time')) return 'date';
  return null;
}

function buildSchema(colNames, cellsByCol, notionTypes) {
  const used = new Set();
  return colNames.map((name, ci) => {
    let id = slugify(name);
    let n = 2;
    while (used.has(id)) id = `${slugify(name)}-${n++}`;
    used.add(id);
    const cells = cellsByCol[ci] || [];
    const nonEmpty = cells.filter((td) => clean(td.textContent) || td.querySelector('input,.selected-value,time'));
    const nt = [...(notionTypes.get(name) || [])][0];
    const allNumeric = nonEmpty.length > 0 && nonEmpty.every((td) => parseNumber(td.textContent) !== null);
    let type;
    switch (nt) {
      case 'number': type = 'number'; break;
      case 'checkbox': type = 'checkbox'; break;
      case 'date': case 'created_time': case 'last_edited_time': type = 'date'; break;
      case 'select': case 'status': type = 'select'; break;
      case 'multi_select': type = 'multi_select'; break;
      case 'url': type = 'url'; break;
      case 'formula': case 'rollup': {
        const k = nonEmpty.map(cellKind).find(Boolean);
        type = k === 'checkbox' ? 'checkbox' : k === 'date' ? 'date' : allNumeric ? 'number' : 'text';
        break;
      }
      case undefined: {
        const kinds = nonEmpty.map(cellKind);
        if (kinds.length && kinds.every((k) => k === 'checkbox')) type = 'checkbox';
        else if (kinds.includes('multi_select')) type = 'multi_select';
        else if (kinds.length && kinds.every((k) => k === 'select')) type = 'select';
        else if (kinds.length && kinds.every((k) => k === 'date')) type = 'date';
        else if (allNumeric) type = 'number';
        else if (nonEmpty.length && nonEmpty.every((td) => isRemote(clean(td.textContent)))) type = 'url';
        else type = 'text';
        break;
      }
      default: type = 'text';
    }
    const col = { id, name, type };
    if (type === 'select' || type === 'multi_select') {
      const opts = new Map();
      for (const td of cells) {
        for (const sv of td.querySelectorAll('.selected-value')) {
          const nm = clean(sv.textContent);
          if (!nm || opts.has(nm)) continue;
          const c = [...sv.classList].find((x) => x.startsWith('select-value-color-'));
          opts.set(nm, { name: nm, color: c ? c.slice('select-value-color-'.length) : 'default' });
        }
      }
      col.options = [...opts.values()];
    }
    return col;
  });
}

function cellValue(td, type) {
  if (!td) return undefined;
  switch (type) {
    case 'checkbox': {
      if (td.querySelector('.checkbox-on')) return true;
      if (td.querySelector('.checkbox-off')) return false;
      const t = norm(td.textContent);
      if (t === 'yes' || t === 'true') return true;
      if (t === 'no' || t === 'false') return false;
      return undefined;
    }
    case 'number': { const v = parseNumber(td.textContent); return v === null ? undefined : v; }
    case 'date': return parseDate(td) ?? undefined;
    case 'select': { const sv = td.querySelector('.selected-value'); const t = clean(sv ? sv.textContent : td.textContent); return t || undefined; }
    case 'multi_select': {
      const arr = [...td.querySelectorAll('.selected-value')].map((s) => clean(s.textContent)).filter(Boolean);
      return arr.length ? arr : undefined;
    }
    case 'url': { const a = td.querySelector('a[href]'); const t = a ? a.getAttribute('href') : clean(td.textContent); return t || undefined; }
    default: { const t = clean(td.textContent); return t || undefined; }
  }
}

function linkKeyFromHref(a) {
  const pid = a.getAttribute('data-notion-page-id');
  if (pid) return dashless(pid);
  const href = a.getAttribute('href') || '';
  if (isRemote(href) || href.startsWith('mailto:')) return null;
  let dec = href;
  try { dec = decodeURIComponent(href); } catch { /* keep raw */ }
  const m = dec.match(/([0-9a-f]{32})\.html/) || href.match(/([0-9a-f]{32})\.html/);
  return m ? m[1] : null;
}

for (const pg of pages.values()) {
  if (!pg.body) continue;
  for (const div of pg.body.querySelectorAll('div.collection-content')) {
    const collId = dashless(div.id);
    const table = div.querySelector('table.collection-content');
    if (!collId || !table) continue;
    const title = clean(div.querySelector('.collection-title')?.textContent) || 'Untitled';
    const ths = [...table.querySelectorAll('thead th')];
    const names = ths.map((th) => clean(th.textContent));
    const trs = [...table.querySelectorAll('tbody > tr')];
    // the title column is the one whose cells are td.cell-title
    let titleIdx = trs.length ? [...trs[0].children].findIndex((td) => td.classList.contains('cell-title')) : 0;
    if (titleIdx < 0) titleIdx = 0;
    const rows = trs.map((tr, index) => {
      const tcell = tr.children[titleIdx];
      const a = tcell?.querySelector('a');
      const rowKey = dashless(tr.id) || (a && linkKeyFromHref(a));
      // name -> td: the view's visible columns first, then the row page's own properties table
      // (a view can hide properties that the row pages still carry)
      const cells = new Map();
      names.forEach((nm, i) => { if (i !== titleIdx && tr.children[i]) cells.set(nm, tr.children[i]); });
      const rp = pages.get(rowKey);
      if (rp?.propsTable) {
        for (const ptr of rp.propsTable.querySelectorAll('tr.property-row')) {
          const nm = clean(ptr.querySelector('th')?.textContent);
          const td = ptr.querySelector('td');
          if (nm && td && !cells.has(nm) && nm !== names[titleIdx]) cells.set(nm, td);
        }
      }
      return { key: rowKey, title: clean(tcell?.textContent) || 'Untitled', cells, index };
    });
    const notionTypes = propTypesFromRowPages(rows.map((r) => r.key));
    const colNames = names.filter((_, i) => i !== titleIdx);
    for (const nm of notionTypes.keys()) if (!colNames.includes(nm) && nm !== names[titleIdx]) colNames.push(nm);
    const cellsByCol = colNames.map((nm) => rows.map((r) => r.cells.get(nm)).filter(Boolean));
    const schema = buildSchema(colNames, cellsByCol, notionTypes);
    // full-page database: the host body holds only this collection
    const meaningful = [...pg.body.children].filter(
      (el) => !(el.tagName === 'P' && !clean(el.textContent) && !el.querySelector('img,a')) && el.tagName !== 'BR',
    );
    // (only when the collection carries the page's own title; otherwise it is an inline db with its own name)
    const fullPage = meaningful.length === 1 && meaningful[0] === div && norm(title) === norm(pg.title);
    dbs.set(collId, {
      collId, key: fullPage ? pg.key : collId, title: fullPage ? pg.title : title,
      host: pg.key, fullPage, schema, rows, source: 'html',
    });
  }
}

// CSV-only databases (no HTML table for them)
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}
const csvOnly = [];
for (const file of csvFiles) {
  const id = (path.basename(file).match(ID_RE) || [])[1];
  if (!id || dbs.has(id) || /_all\.csv$/.test(file)) continue;
  csvOnly.push(path.relative(EXPORT_DIR, file));
  const rowsRaw = parseCsv(fs.readFileSync(file, 'utf8'));
  if (!rowsRaw.length) continue;
  const [header, ...data] = rowsRaw;
  // host page: "<dir>.html" sibling of the csv's folder
  const dir = path.dirname(file);
  const host = [...pages.values()].find((p) => path.dirname(p.file) === path.dirname(dir) && stemOf(p.file) === path.basename(dir))
    || [...pages.values()].find((p) => path.dirname(p.file) === dir && false);
  const fake = (v) => ({ textContent: v, querySelector: () => null, querySelectorAll: () => [], classList: { contains: () => false } });
  const names = header.slice(1);
  const cellsByCol = names.map((_, ci) => data.map((r) => fake(r[ci + 1] || '')));
  const schema = names.map((name, ci) => {
    const vals = data.map((r) => (r[ci + 1] || '').trim()).filter(Boolean);
    let type = 'text';
    if (vals.length && vals.every((v) => /^(yes|no)$/i.test(v))) type = 'checkbox';
    else if (vals.length && vals.every((v) => parseNumber(v) !== null)) type = 'number';
    else if (vals.length && vals.every((v) => isRemote(v))) type = 'url';
    return { id: slugify(name), name, type };
  });
  const rowFolder = path.join(dir, stemOf(file));
  const rows = data.map((r, index) => {
    const title = clean(r[0]) || 'Untitled';
    const pg = [...pages.values()].find((p) => path.dirname(p.file) === rowFolder && p.title === title);
    return { key: pg?.key || `${id.slice(0, 24)}${String(index).padStart(8, '0')}`, title, csv: r, index };
  });
  dbs.set(id, { collId: id, key: id, title: stemOf(file), host: host?.key || null, fullPage: false, schema, rows, source: 'csv', cellsByCol });
}

// row membership
for (const db of dbs.values()) {
  for (const r of db.rows) if (r.key) rowOf.set(r.key, { dbKey: db.key, index: r.index });
}
const dbByKey = new Map([...dbs.values()].map((d) => [d.key, d]));
const collToKey = new Map([...dbs.values()].map((d) => [d.collId, d.key]));

// ---------- tree ----------
const parentOf = new Map(); // key -> parent key | null
const orphanNotes = [];

// folder-based parent for regular pages
const byDirStem = new Map(); // "<dir>\0<stem>" -> [page]
for (const p of pages.values()) {
  const k = `${path.dirname(p.file)}\0${stemOf(p.file)}`;
  if (!byDirStem.has(k)) byDirStem.set(k, []);
  byDirStem.get(k).push(p);
}
function referencedKeys(pg) {
  const keys = [];
  if (!pg.body) return keys;
  for (const el of pg.body.querySelectorAll('a[href], div.collection-content')) {
    if (el.tagName === 'DIV') { const k = collToKey.get(dashless(el.id)); if (k) keys.push(k); continue; }
    if (el.closest('table.collection-content')) continue;
    const k = linkKeyFromHref(el); if (k) keys.push(k);
  }
  return keys;
}
for (const p of pages.values()) {
  if (rowOf.has(p.key)) { parentOf.set(p.key, rowOf.get(p.key).dbKey); continue; }
  if (dbByKey.has(p.key) && dbByKey.get(p.key).fullPage) {
    // full-page db keeps the page's own place in the tree (fall through)
  }
  const dir = path.dirname(p.file);
  if (path.resolve(dir) === EXPORT_DIR) { parentOf.set(p.key, null); continue; }
  const pdir = path.dirname(dir);
  let base = path.basename(dir);
  let cands = byDirStem.get(`${pdir}\0${base}`) || [];
  const dis = base.match(/^(.*) ([0-9a-f]{4})-([0-9a-f]{4})$/);
  if (!cands.length && dis) {
    cands = (byDirStem.get(`${pdir}\0${dis[1]}`) || []).filter((c) => c.key.startsWith(dis[2]) && c.key.endsWith(dis[3]));
  }
  if (cands.length > 1) cands = cands.filter((c) => referencedKeys(c).includes(p.key));
  if (cands.length >= 1) { parentOf.set(p.key, cands[0].key); continue; }
  // folder is a database's row folder (sub-page of nothing) or unknown: fall back to any page that links here
  const linker = [...pages.values()].find((c) => c.key !== p.key && referencedKeys(c).includes(p.key));
  if (linker) { parentOf.set(p.key, linker.key); orphanNotes.push(`${p.rel} -> parent by link`); continue; }
  parentOf.set(p.key, null);
  orphanNotes.push(`${p.rel} -> top level (no parent found)`);
}
for (const db of dbs.values()) {
  if (db.fullPage) continue;
  parentOf.set(db.key, db.host);
  // csv rows without an html page
  for (const r of db.rows) if (!pages.has(r.key)) parentOf.set(r.key, db.key);
}
for (const db of dbs.values()) for (const r of db.rows) if (!pages.has(r.key)) parentOf.set(r.key, db.key);

// ---------- exclusion ----------
const titleOf = (k) => pages.get(k)?.title ?? dbByKey.get(k)?.title ?? [...dbs.values()].flatMap((d) => d.rows).find((r) => r.key === k)?.title;
const allKeys = new Set([...pages.keys(), ...dbByKey.keys(), ...[...dbs.values()].flatMap((d) => d.rows.map((r) => r.key))]);
const excluded = new Set();
const excludedRoots = [];
function isExcluded(k, seen = new Set()) {
  if (excluded.has(k)) return true;
  if (!k || seen.has(k)) return false;
  seen.add(k);
  if (EXCLUDED_TITLES.has(norm(titleOf(k)))) return true;
  const par = parentOf.get(k);
  return par ? isExcluded(par, seen) : false;
}
for (const k of allKeys) {
  if (EXCLUDED_TITLES.has(norm(titleOf(k)))) excludedRoots.push(k);
}
for (const k of allKeys) if (isExcluded(k)) excluded.add(k);
// Also exclude any file physically inside an excluded page's folder
for (const p of pages.values()) {
  const parts = p.rel.split(path.sep).slice(0, -1);
  if (parts.some((seg) => EXCLUDED_TITLES.has(norm(seg)))) excluded.add(p.key);
}

// ---------- markdown rendering ----------
function escapeText(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/([*`[\]<>~])/g, '\\$1')
    .replace(/(^|[^A-Za-z0-9])_|_(?=[^A-Za-z0-9]|$)/g, (m) => m.replace('_', '\\_'));
}
function escapeLineStart(line) {
  return line
    .replace(/^(\s*)([#>+])(?=\s|$)/, '$1\\$2')
    .replace(/^(\s*)(#{1,6})(?=\s)/, '$1\\$2')
    .replace(/^(\s*)-(?=\s|$)/, '$1\\-')
    .replace(/^(\s*)(\d+)([.)])(?=\s|$)/, '$1$2\\$3')
    .replace(/^(\s*)(---+|\*\*\*+|___+)\s*$/, '$1\\$2');
}

function wikiLink(key, title) {
  const t = escapeText(clean(title) || titleOf(key) || 'Untitled');
  if (!key || !allKeys.has(key)) { stats.unresolvedLinks.push(title); return t; }
  if (excluded.has(key)) { bump(stats.blocks, 'link to excluded page (plain text)'); return t; }
  return `[${t}](wiki:${key})`;
}

function wrapMark(inner, mark) {
  if (!inner.trim()) return inner;
  const m = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return `${m[1]}${mark}${m[2]}${mark}${m[3]}`;
}

function inline(node, ctx = {}) {
  let out = '';
  for (const n of node.childNodes) {
    if (n.nodeType === 3) { out += escapeText(n.textContent.replace(/ /g, ' ')); continue; }
    if (n.nodeType !== 1) continue;
    const tag = n.tagName.toLowerCase();
    const cls = n.classList;
    if (tag === 'br') { out += '\n'; continue; }
    if (tag === 'img') { continue; } // inline icons / local images
    if (tag === 'input') { continue; }
    if (cls.contains('icon') && tag === 'span') { continue; } // page icons in mentions/links
    if (tag === 'strong' || tag === 'b') { out += wrapMark(inline(n, ctx), '**'); bump(stats.blocks, 'bold'); continue; }
    if (tag === 'em' || tag === 'i') { out += wrapMark(inline(n, ctx), '*'); bump(stats.blocks, 'italic'); continue; }
    if (tag === 'del' || tag === 's' || tag === 'strike') { out += wrapMark(inline(n, ctx), '~~'); bump(stats.blocks, 'strike'); continue; }
    if (tag === 'code') { const t = n.textContent.replace(/`/g, 'ˋ'); out += t ? `\`${t}\`` : ''; bump(stats.blocks, 'code'); continue; }
    if (tag === 'a') {
      const href = n.getAttribute('href') || '';
      const key = linkKeyFromHref(n);
      const text = inline(n, ctx).replace(/\n/g, ' ');
      if (key) { out += wikiLink(key, n.textContent); bump(stats.blocks, 'page link/mention'); continue; }
      if (isRemote(href) || href.startsWith('mailto:')) {
        out += `[${text.trim() || escapeText(href)}](${href.replace(/\)/g, '%29').replace(/ /g, '%20')})`;
        bump(stats.blocks, 'link');
        continue;
      }
      bump(stats.skipped, 'local link (file not exported)');
      out += text;
      continue;
    }
    if (tag === 'mark' || tag === 'span' || tag === 'time' || tag === 'u' || tag === 'sup' || tag === 'sub' || tag === 'small') {
      if (tag === 'mark' || [...cls].some((c) => c.startsWith('highlight-'))) bump(stats.blocks, 'highlight (color dropped)');
      out += inline(n, ctx);
      continue;
    }
    if (tag === 'div' || tag === 'p') { out += inline(n, ctx); continue; }
    bump(stats.unhandled, `inline <${tag}>`);
    out += inline(n, ctx);
  }
  return out;
}

const indent = (md, pad) => md.split('\n').map((l) => (l ? pad + l : l)).join('\n');

/** renders a container's element children to markdown blocks */
function blocks(container, ctx) {
  const out = []; // { md, list: 'ul'|'ol'|'todo'|null }
  // bare text / inline elements sitting directly in a container are grouped into a paragraph
  const INLINE = /^(STRONG|B|EM|I|DEL|S|STRIKE|CODE|A|MARK|SPAN|TIME|U|SUP|SUB|SMALL|BR|IMG)$/;
  let run = null;
  const flush = () => {
    if (!run) return;
    const t = paragraph(inline(run, ctx));
    if (t) { out.push({ md: t }); bump(stats.blocks, 'paragraph (bare inline run)'); }
    run = null;
  };
  for (const n of [...container.childNodes]) {
    if (n.nodeType === 3 || (n.nodeType === 1 && INLINE.test(n.tagName))) {
      if (!run) run = container.ownerDocument.createElement('span');
      run.appendChild(n.cloneNode(true));
      continue;
    }
    if (n.nodeType !== 1) continue;
    flush();
    const r = block(n, ctx);
    if (r && r.md && r.md.trim()) out.push(r);
  }
  flush();
  let md = '';
  for (let i = 0; i < out.length; i++) {
    if (i > 0) md += out[i].list && out[i].list === out[i - 1].list ? '\n' : '\n\n';
    md += out[i].md;
  }
  return md;
}

function paragraph(text) {
  // Notion preserves newlines inside a paragraph: split into separate paragraphs
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map(escapeLineStart).join('\n\n');
}

function listItem(li, marker, ctx) {
  const lead = []; const nested = [];
  for (const c of li.childNodes) {
    if (c.nodeType === 1 && /^(UL|OL|DIV|DETAILS|FIGURE|ASIDE|TABLE|BLOCKQUOTE|PRE|H[1-6]|HR)$/.test(c.tagName)
      && !(c.tagName === 'DIV' && !c.children.length && !clean(c.textContent))) nested.push(c);
    else lead.push(c);
  }
  const holder = li.ownerDocument.createElement('span');
  for (const c of lead) holder.appendChild(c.cloneNode(true));
  const text = inline(holder, ctx).replace(/\s*\n\s*/g, ' ').trim();
  let md = `${marker} ${text}`.trimEnd();
  for (const c of nested) {
    const inner = c.tagName === 'DIV' && c.classList.contains('indented') ? blocks(c, ctx) : (block(c, ctx)?.md || '');
    if (inner.trim()) md += '\n' + indent(inner, '  ');
  }
  return md;
}

function gfmTable(rows) {
  if (!rows.length) return '';
  const w = Math.max(...rows.map((r) => r.length));
  const norm2 = rows.map((r) => [...r, ...Array(w - r.length).fill('')].map((c) => c.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim() || ' '));
  const line = (r) => `| ${r.join(' | ')} |`;
  return [line(norm2[0]), line(norm2[0].map(() => '---')), ...norm2.slice(1).map(line)].join('\n');
}

function calloutTone(el) {
  const bg = (el.getAttribute('data-notion-callout-background') || [...el.classList].find((c) => c.startsWith('block-color-')) || '').toLowerCase();
  if (/green/.test(bg)) return 'TIP';
  if (/yellow|orange/.test(bg)) return 'WARNING';
  if (/red/.test(bg)) return 'CAUTION';
  if (/blue/.test(bg)) return 'NOTE';
  // Gray / default: the outline-only callout.
  return 'NEUTRAL';
}

function block(el, ctx) {
  const tag = el.tagName.toLowerCase();
  const cls = el.classList;
  const B = (name) => bump(stats.blocks, name);

  if (tag === 'p') {
    const t = paragraph(inline(el, ctx));
    if (t) B('paragraph');
    return { md: t };
  }
  if (/^h[1-6]$/.test(tag)) {
    const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3;
    const t = inline(el, ctx).replace(/\s*\n\s*/g, ' ').trim();
    if (!t) return null;
    B(`heading h${tag[1]}`);
    return { md: `${'#'.repeat(level)} ${t}` };
  }
  if (tag === 'ul' || tag === 'ol') {
    const todo = cls.contains('to-do-list');
    const kind = todo ? 'todo' : tag;
    let n = parseInt(el.getAttribute('start') || '1', 10) || 1;
    const items = [...el.children].filter((c) => c.tagName === 'LI').map((li) => {
      let marker;
      if (todo) marker = li.querySelector(':scope > .checkbox-on, :scope > input[checked]') ? '- [x]' : '- [ ]';
      else if (tag === 'ol') marker = `${n++}.`;
      else marker = '-';
      return listItem(li, marker, ctx);
    });
    B(todo ? 'to-do item' : tag === 'ol' ? 'numbered item' : 'bulleted item');
    return { md: items.join('\n'), list: kind };
  }
  if (tag === 'hr') { B('divider'); return { md: '---' }; }
  if (tag === 'br') return null;
  if (tag === 'details') {
    const summary = el.querySelector(':scope > summary');
    const sum = summary ? inline(summary, ctx).replace(/\s*\n\s*/g, ' ').trim() : '';
    const holder = el.ownerDocument.createElement('div');
    for (const c of el.children) if (c !== summary) holder.appendChild(c.cloneNode(true));
    const inner = blocks(holder, ctx);
    B('toggle');
    return { md: `<details>\n<summary>${sum}</summary>\n\n${inner}\n\n</details>`.replace(/\n\n\n\n/g, '\n\n') };
  }
  if ((tag === 'aside' || tag === 'figure') && cls.contains('callout')) {
    const kids = [...el.children];
    let emoji = '';
    let content = kids[1] || kids[0];
    if (kids.length >= 2) {
      const em = kids[0].querySelector('[data-emoji]');
      if (em) emoji = em.getAttribute('data-emoji') || clean(em.textContent);
      else if (!kids[0].querySelector('img') && clean(kids[0].textContent).length <= 4) emoji = clean(kids[0].textContent);
    } else content = el;
    let inner = blocks(content, ctx);
    if (!inner.trim()) inner = paragraph(inline(content, ctx));
    if (emoji) {
      inner = inner.replace(/^((?:#{1,6} |- \[[ x]\] |- |\d+\. )?)/, `$1${emoji} `);
    }
    B('callout');
    const lines = [`[!${calloutTone(el)}]`, ...inner.split('\n')];
    return { md: lines.map((l) => (l ? `> ${l}` : '>')).join('\n') };
  }
  if (tag === 'div' && cls.contains('column-list')) {
    const cols = [...el.children].filter((c) => c.classList.contains('column'));
    B('columns');
    const parts = cols.map((c) => `<div data-column>\n\n${blocks(c, ctx)}\n\n</div>`.replace(/\n\n\n\n/, '\n\n'));
    return { md: `<div data-columns>\n${parts.join('\n')}\n</div>` };
  }
  if (tag === 'div' && cls.contains('collection-content')) {
    const k = collToKey.get(dashless(el.id));
    const db = dbByKey.get(k);
    if (db?.fullPage) return null; // the page itself is the database
    B('inline database (link line)');
    return { md: wikiLink(k, db?.title || clean(el.querySelector('.collection-title')?.textContent)) };
  }
  if (tag === 'figure' && cls.contains('link-to-page')) {
    const a = el.querySelector('a');
    if (!a) return null;
    B('link-to-page');
    return { md: wikiLink(linkKeyFromHref(a), a.textContent) };
  }
  if (tag === 'figure' && cls.contains('image')) {
    const img = el.querySelector('img');
    const src = img?.getAttribute('src') || '';
    if (isRemote(src)) { B('image (remote)'); return { md: `![](${src})` }; }
    bump(stats.skipped, 'local image');
    return null;
  }
  if (tag === 'figure' && el.querySelector('a.bookmark')) {
    const a = el.querySelector('a.bookmark');
    const href = a.getAttribute('href') || '';
    if (!isRemote(href)) { bump(stats.skipped, 'bookmark without remote url'); return null; }
    const title = clean(el.querySelector('.bookmark-title')?.textContent) || href;
    B('bookmark');
    return { md: `[${escapeText(title)}](${href}#embed=card)` };
  }
  if (tag === 'figure' && el.querySelector(':scope > .source')) {
    const a = el.querySelector('.source a');
    const href = a?.getAttribute('href') || '';
    if (!isRemote(href) || /notion\.comundefined/.test(href)) { bump(stats.skipped, 'embed/file without remote url'); return null; }
    B('embed (as card)');
    return { md: `[${escapeText(href)}](${href}#embed=card)` };
  }
  if (tag === 'table' && cls.contains('properties')) return null;
  if (tag === 'table') {
    const rows = [...el.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => inline(c, ctx)));
    B(cls.contains('simple-table') ? 'simple table' : 'html table');
    return { md: gfmTable(rows) };
  }
  if (tag === 'pre') {
    const code = el.querySelector('code') || el;
    const lang = ([...code.classList].find((c) => c.startsWith('language-')) || '').replace('language-', '');
    B('code block');
    return { md: '```' + lang + '\n' + code.textContent.replace(/\n$/, '') + '\n```' };
  }
  if (tag === 'blockquote') {
    const inner = el.children.length ? blocks(el, ctx) : paragraph(inline(el, ctx));
    B('quote');
    return { md: inner.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n') };
  }
  if (tag === 'div' && cls.contains('indented')) { return { md: blocks(el, ctx) }; }
  if (tag === 'figcaption') { const t = paragraph(inline(el, ctx)); return { md: t ? `*${t}*` : '' }; }
  if (tag === 'figure' || tag === 'div' || tag === 'section') {
    if (!el.children.length && !clean(el.textContent)) return null;
    if (tag !== 'div' || el.className) bump(stats.unhandled, `${tag}${el.className ? '.' + [...cls].join('.') : ''} (children rendered)`);
    return { md: el.children.length ? blocks(el, ctx) : paragraph(inline(el, ctx)) };
  }
  bump(stats.unhandled, `<${tag}${el.className ? '.' + [...cls].join('.') : ''}>`);
  return { md: paragraph(inline(el, ctx)) };
}

function tidy(md) {
  return md
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function propsTableMd(table) {
  const rows = [];
  for (const tr of table.querySelectorAll('tr')) {
    const name = clean(tr.querySelector('th')?.textContent);
    const td = tr.querySelector('td');
    if (!name || !td) continue;
    let v;
    if (td.querySelector('.checkbox-on')) v = '✓';
    else if (td.querySelector('.checkbox-off')) v = '';
    else v = clean(inline(td).replace(/\n/g, ' '));
    if (v) rows.push([escapeText(name), v]);
  }
  if (!rows.length) return '';
  return gfmTable([['Property', 'Value'], ...rows]);
}

function pageBody(pg, { withProps }) {
  if (!pg?.body) return '';
  let md = blocks(pg.body, { page: pg.key });
  const desc = pg.description ? paragraph(inline(pg.description)) : '';
  if (desc) md = `${desc}\n\n${md}`;
  if (withProps && pg.propsTable) {
    const t = propsTableMd(pg.propsTable);
    if (t) { md = `${t}\n\n${md}`; bump(stats.blocks, 'properties table (page)'); }
  }
  return tidy(md);
}

// ---------- assemble ----------
const records = new Map();
function addRecord(r) { records.set(r.key, r); }

for (const pg of pages.values()) {
  if (excluded.has(pg.key)) continue;
  const db = dbByKey.get(pg.key);
  const row = rowOf.get(pg.key);
  if (db?.fullPage) continue; // emitted with the db below
  addRecord({
    key: pg.key, parent_key: parentOf.get(pg.key) ?? null, position: 0,
    title: pg.title, icon: pg.icon, cover: pg.cover,
    kind: 'page', schema: null, props: null,
    body: pageBody(pg, { withProps: !row }),
  });
}
for (const db of dbs.values()) {
  if (excluded.has(db.key)) continue;
  const host = pages.get(db.fullPage ? db.key : db.host);
  addRecord({
    key: db.key, parent_key: db.fullPage ? (parentOf.get(db.key) ?? null) : db.host, position: 0,
    title: db.title, icon: db.fullPage ? host?.icon ?? null : null, cover: db.fullPage ? host?.cover ?? null : null,
    kind: 'database',
    schema: db.schema.map(({ id, name, type, options }) => (options ? { id, name, type, options } : { id, name, type })),
    props: null,
    body: db.fullPage && host?.description ? tidy(paragraph(inline(host.description))) : '',
  });
  for (const r of db.rows) {
    if (excluded.has(r.key)) continue;
    const props = {};
    db.schema.forEach((col, ci) => {
      let v;
      if (db.source === 'html') v = cellValue(r.cells.get(col.name), col.type);
      else {
        const raw = (r.csv[ci + 1] || '').trim();
        v = col.type === 'number' ? parseNumber(raw) ?? undefined
          : col.type === 'checkbox' ? (raw ? /^yes$/i.test(raw) : undefined) : raw || undefined;
      }
      // fill gaps from the row page's own properties table
      if (v === undefined && pages.get(r.key)?.propsTable) {
        const tr = [...pages.get(r.key).propsTable.querySelectorAll('tr')].find((x) => clean(x.querySelector('th')?.textContent) === col.name);
        if (tr) v = cellValue(tr.querySelector('td'), col.type);
      }
      if (v !== undefined) props[col.id] = v;
    });
    const pg = pages.get(r.key);
    const existing = records.get(r.key);
    addRecord({
      key: r.key, parent_key: db.key, position: r.index,
      title: pg?.title || r.title, icon: pg?.icon ?? null, cover: pg?.cover ?? null,
      kind: existing?.kind || 'page', schema: existing?.schema ?? null, props,
      body: existing?.body ?? (pg ? pageBody(pg, { withProps: false }) : ''),
    });
  }
}

// positions for non-row children: order of first reference in the parent's body
const childrenOf = new Map();
for (const r of records.values()) {
  const p = r.parent_key;
  if (p && !records.has(p)) { orphanNotes.push(`${r.title}: parent ${p} missing -> top level`); r.parent_key = null; }
  if (!childrenOf.has(r.parent_key)) childrenOf.set(r.parent_key, []);
  childrenOf.get(r.parent_key).push(r);
}
for (const [pk, kids] of childrenOf) {
  if (pk && dbByKey.has(pk)) { kids.sort((a, b) => a.position - b.position); continue; }
  const refs = pk && pages.get(pk) ? referencedKeys(pages.get(pk)) : [];
  const rank = (k) => { const i = refs.indexOf(k); return i < 0 ? Infinity : i; };
  kids.sort((a, b) => rank(a.key) - rank(b.key) || a.title.localeCompare(b.title));
  kids.forEach((k, i) => { k.position = i; });
}

// safety net: strip 16-digit numbers everywhere
for (const r of records.values()) {
  r.title = strip16(r.title, `${r.title} (title)`);
  r.body = strip16(r.body, r.title);
  if (r.props) for (const [k, v] of Object.entries(r.props)) {
    if (typeof v === 'string') r.props[k] = strip16(v, `${r.title} (prop ${k})`);
    else if (Array.isArray(v)) r.props[k] = v.map((x) => strip16(x, `${r.title} (prop ${k})`));
  }
}

// emit parents before children (DFS by position)
const ordered = [];
(function emit(pk) {
  for (const r of (childrenOf.get(pk) || [])) {
    ordered.push({
      key: r.key, parent_key: r.parent_key, position: r.position, title: r.title,
      icon: r.icon, cover: r.cover, kind: r.kind, schema: r.schema, props: r.props, body: r.body,
    });
    emit(r.key);
  }
})(null);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(ordered, null, 2));

// ---------- summary ----------
const dbRecs = ordered.filter((r) => r.kind === 'database');
console.log(`Notion export: ${EXPORT_DIR}`);
console.log(`Files: ${htmlFiles.length} html, ${csvFiles.length} csv`);
console.log(`Output: ${OUT}`);
console.log(`\nTotal pages: ${ordered.length} (${ordered.filter((r) => r.parent_key === null).length} top level, ${dbRecs.length} databases, ${ordered.filter((r) => r.props).length} database rows)`);
console.log(`\nDatabases:`);
for (const d of dbRecs) {
  const rows = ordered.filter((r) => r.parent_key === d.key).length;
  const parent = d.parent_key ? ordered.find((r) => r.key === d.parent_key)?.title : '(top)';
  console.log(`  - ${d.title} [in: ${parent}] rows=${rows}: ${d.schema.map((c) => `${c.name}:${c.type}`).join(', ') || '(title only)'}`);
}
console.log(`\nCSV files used (no HTML table): ${csvOnly.length ? csvOnly.join(', ') : 'none (all ' + csvFiles.length + ' csv are represented by HTML tables)'}`);
const exclTitles = {};
for (const k of excluded) bump(exclTitles, titleOf(k) || k);
console.log(`\nExcluded: ${excluded.size} pages (roots: ${excludedRoots.length}) -> ${Object.entries(exclTitles).map(([t, n]) => `${t} x${n}`).join(', ')}`);
console.log(`\nBlocks converted:`);
for (const [k, v] of Object.entries(stats.blocks).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
console.log(`\nSkipped: ${Object.entries(stats.skipped).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'}`);
console.log(`Unhandled elements: ${Object.entries(stats.unhandled).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'}`);
console.log(`Unresolved page links (target not in export): ${stats.unresolvedLinks.length}${stats.unresolvedLinks.length ? ' -> ' + [...new Set(stats.unresolvedLinks.map(clean))].join(', ') : ''}`);
console.log(`Tree notes: ${orphanNotes.length ? '\n  ' + orphanNotes.join('\n  ') : 'none'}`);
console.log(`16-digit numbers stripped: ${stats.sixteen.length}${stats.sixteen.length ? ' -> ' + stats.sixteen.map((s) => `${s.where} [${s.masked}]`).join('; ') : ''}`);
