#!/usr/bin/env node
// Builds the legal pages (privacy policy, terms of use; Hebrew + English) from planning's drafts in the app repo -
// ONLY the parts the owner has approved. One command, run from the site repo's root:
//
//   node _legal/build.mjs [--date DD/MM/YYYY]
//
// Source: the draft files on origin/main of the app repo (read with `git show` after a fetch, so an uncommitted
// edit of planning's never leaks). Each draft opens with a banner (lines starting with ">"); its line
// "אושר לפרסום: ..." lists what may go up, separated by ";":
//   הפתיחה           the title and the opening lines before section 1
//   N                the whole of section N, with its sub-sections
//   הפתיחה של N      section N's heading and the text before its first sub-section
//   N.M              sub-section N.M (its section's heading comes with it)
// The same numbers pick the English text. A draft with no such line is not built, and a page of it that
// is already in the repo is deleted. The banner itself never goes up.
//
// The date line - "גרסת הפיילוט. בתוקף מ-<date>." / "Pilot version. Effective from <date>." - carries the
// publication date (default: today). Folders starting with "_" are not served by GitHub Pages.
//
// Hebrew in this file is on purpose: it is read by the Write tool's encoding, never through a command line.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const APP_REPO = '/Users/yair/dev/fitmanage';

const DOCS = {
  privacy: {
    draft: 'plan/privacy-policy-draft-2026-10-13.md',
    he: { file: 'privacy.html', title: 'מדיניות הפרטיות — פיטופוליס', desc: 'מדיניות הפרטיות של FITOPOLIS — מה נשמר, למה ומי רואה אותו.' },
    en: { file: 'privacy-en.html', title: 'Privacy Policy — FITOPOLIS', desc: 'The FITOPOLIS privacy policy — what is kept, why, and who sees it.' },
  },
  terms: {
    draft: 'plan/terms-of-use-draft-2026-10-21.md',
    he: { file: 'terms.html', title: 'תנאי השימוש — פיטופוליס', desc: 'תנאי השימוש של FITOPOLIS — מי יכול להשתמש, מה האפליקציה היא ומה היא לא.' },
    en: { file: 'terms-en.html', title: 'Terms of Use — FITOPOLIS', desc: 'The FITOPOLIS terms of use — who may use the app, and what it is and is not.' },
  },
};

const CHROME = {
  he: {
    dir: 'rtl', skip: 'דלג לתוכן הראשי', navLabel: 'ניווט ראשי', home: 'בית', support: 'תמיכה',
    other: 'English', otherLang: 'en', fontLang: 'hebrew',
    back: 'חזרה לדף הבית', a11y: 'הצהרת נגישות', terms: 'תנאי השימוש', privacy: 'מדיניות הפרטיות', del: 'מחיקת חשבון', copy: '© 2026 פיטופוליס',
    suffix: '',
  },
  en: {
    dir: 'ltr', skip: 'Skip to main content', navLabel: 'Main', home: 'Home', support: 'Support',
    other: 'עברית', otherLang: 'he', fontLang: 'latin',
    back: 'Back to home', a11y: 'Accessibility statement', terms: 'Terms of Use', privacy: 'Privacy Policy', del: 'Delete account', copy: '© 2026 FITOPOLIS',
    suffix: '-en',
  },
};

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const LOGO = '<span class="logotype" aria-label="FITOPOLIS">\n        <span class="fit">FIT</span>\n        <svg aria-hidden="true" class="o-mark" viewBox="0 0 100 100"><path d="M47 9.61A40.5 40.5 0 0 0 47 90.39L47 73.31A23.5 23.5 0 0 1 47 26.69Z" fill="#F07C1A"/><path d="M53 9.61A40.5 40.5 0 0 1 53 90.39L53 73.31A23.5 23.5 0 0 0 53 26.69Z" fill="#12939D"/></svg>\n        <span class="polis">POLIS</span>\n      </span>';

// ── the date ────────────────────────────────────────────────────────────────
function parseDate() {
  const i = process.argv.indexOf('--date');
  let d, m, y;
  if (i > 0) {
    const mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(process.argv[i + 1] || '');
    if (!mm) throw new Error('--date wants DD/MM/YYYY');
    [d, m, y] = [Number(mm[1]), Number(mm[2]), Number(mm[3])];
  } else {
    const t = new Date();
    [d, m, y] = [t.getDate(), t.getMonth() + 1, t.getFullYear()];
  }
  return {
    he: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
    en: `${d} ${MONTHS_EN[m - 1]} ${y}`,
  };
}

// ── markdown subset -> HTML blocks ──────────────────────────────────────────
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let leftoverBrackets = 0;

function inline(raw, lang) {
  const c = CHROME[lang];
  let s = esc(raw);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // [fitopolis.co.il/page.html] -> a link to the page in the same language
  s = s.replace(/\[fitopolis\.co\.il\/([a-z-]+)\.html\]/g, (_, p) => `<a href="/${p}${c.suffix}.html">fitopolis.co.il/${p}${c.suffix}.html</a>`);
  s = s.replace(/\[([^\]]+)\]/g, (_, t) => `<span class="fill-in" data-fill-in>[${t}]</span>`);
  s = s.replace(/support@fitopolis\.co\.il/g, '<a href="mailto:support@fitopolis.co.il">support@fitopolis.co.il</a>');
  return s;
}

/** Lines -> { title, intro:[html], sections:[{num,title,pre:[html],subs:[{id,title,blocks:[html]}]}] } */
function parse(lines, lang) {
  const doc = { title: '', intro: [], sections: [] };
  let cur = null;      // current section
  let sub = null;      // current sub-section
  const push = (html) => {
    if (sub) sub.blocks.push(html);
    else if (cur) cur.pre.push(html);
    else doc.intro.push(html);
  };
  const slug = (n) => 's' + n.replace(/\./g, '-');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    let m;
    if ((m = line.match(/^# (.+)$/))) { doc.title = m[1]; i += 1; continue; }
    if ((m = line.match(/^## (\d+)\. (.+)$/))) {
      cur = { num: m[1], title: m[2], pre: [], subs: [] }; sub = null;
      doc.sections.push(cur); i += 1; continue;
    }
    if ((m = line.match(/^### (\d+\.\d+) (.+)$/))) {
      sub = { id: m[1], title: m[2], blocks: [] }; cur.subs.push(sub); i += 1; continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i += 1; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      const out = ['<div class="table-scroll"><table>', '  <thead><tr>' + head.map((h) => `<th scope="col">${inline(h, lang)}</th>`).join('') + '</tr></thead>', '  <tbody>'];
      for (const r of body) out.push('    <tr>' + r.map((x, k) => (k === 0 ? `<th scope="row">${inline(x, lang)}</th>` : `<td>${inline(x, lang)}</td>`)).join('') + '</tr>');
      out.push('  </tbody>', '</table></div>');
      push(out.join('\n')); continue;
    }
    if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i += 1; }
      push('<ul>\n' + items.map((t) => `  <li><span>${inline(t, lang)}</span></li>`).join('\n') + '\n</ul>'); continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||- )/.test(lines[i])) { para.push(lines[i]); i += 1; }
    push(`<p>${inline(para.join(' '), lang)}</p>`);
  }
  doc.slug = slug;
  return doc;
}

// ── what the owner approved ─────────────────────────────────────────────────
function approvedOf(banner) {
  const line = banner.split('\n').find((l) => l.includes('אושר לפרסום:'));
  if (!line) return null;
  const list = line.split('אושר לפרסום:')[1].replace(/\*\*/g, '').trim().replace(/\.$/, '');
  const a = { opening: false, whole: new Set(), pre: new Set(), subs: new Set() };
  for (const raw of list.split(';')) {
    const t = raw.trim();
    let m;
    if (t === 'הפתיחה') a.opening = true;
    else if ((m = /^הפתיחה של (\d+)$/.exec(t))) a.pre.add(m[1]);
    else if (/^\d+$/.test(t)) a.whole.add(t);
    else if (/^\d+\.\d+$/.test(t)) a.subs.add(t);
    else throw new Error(`cannot read the approved-list item: "${t}"`);
  }
  return a;
}

function render(doc, ap, lang, dateStr) {
  const out = [];
  const lead = [];
  if (ap.opening) {
    for (const p of doc.intro) {
      let h = p;
      if (lang === 'he' && /^<p>גרסת הפיילוט\./.test(h)) h = `<p>גרסת הפיילוט. בתוקף מ-${dateStr}.</p>`;
      if (lang === 'en' && /^<p>Pilot version\./.test(h)) h = `<p>Pilot version. Effective from ${dateStr}.</p>`;
      lead.push(h.replace(/^<p>/, '').replace(/<\/p>$/, ''));
    }
  }
  const slugOf = doc.slug;
  for (const s of doc.sections) {
    const whole = ap.whole.has(s.num);
    const preOn = whole || ap.pre.has(s.num);
    const subsOn = s.subs.filter((x) => whole || ap.subs.has(x.id));
    if (!preOn && subsOn.length === 0) continue;
    out.push('  <section>', `    <h2 id="${slugOf(s.num)}">${inline(`${s.num}. ${s.title}`, lang)}</h2>`);
    if (preOn) for (const b of s.pre) out.push(indent(b));
    for (const x of subsOn) {
      out.push(`    <h3 id="${slugOf(x.id)}">${inline(`${x.id} ${x.title}`, lang)}</h3>`);
      for (const b of x.blocks) out.push(indent(b));
    }
    out.push('  </section>', '');
  }
  return { lead, body: out.join('\n') };
}

const indent = (html) => html.split('\n').map((l) => '    ' + l).join('\n');

function page(docKey, lang, doc, rendered) {
  const d = DOCS[docKey][lang];
  const o = DOCS[docKey][CHROME[lang].otherLang];
  const c = CHROME[lang];
  const exists = (f) => fs.existsSync(path.join(ROOT, f));
  const foot = [`<a href="/">${c.back}</a>`];
  if (exists(DOCS.terms[lang].file)) foot.push(`<a href="${DOCS.terms[lang].file}">${c.terms}</a>`);
  if (exists(DOCS.privacy[lang].file)) foot.push(`<a href="${DOCS.privacy[lang].file}">${c.privacy}</a>`);
  if (exists(`delete-account${c.suffix}.html`)) foot.push(`<a href="delete-account${c.suffix}.html">${c.del}</a>`);
  foot.push(`<a href="accessibility.html">${c.a11y}</a>`, `<span>${c.copy}</span>`);
  const head = (lang === 'he' ? DOCS[docKey].he : DOCS[docKey].en);
  return `<!doctype html>
<html lang="${lang}" dir="${c.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${head.title}</title>
  <meta name="description" content="${head.desc}">
  <meta name="theme-color" content="#12939D">
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="apple-touch-icon" href="assets/icon-180.png">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/rubik-400-${c.fontLang}.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/fredoka-600-${c.fontLang}.woff2" crossorigin>
  <link rel="stylesheet" href="assets/fonts/fonts.css">
  <link rel="stylesheet" href="css/style.css?v=24">
  <link rel="canonical" href="https://fitopolis.co.il/${d.file}">
  <link rel="alternate" hreflang="he" href="https://fitopolis.co.il/${DOCS[docKey].he.file}">
  <link rel="alternate" hreflang="en" href="https://fitopolis.co.il/${DOCS[docKey].en.file}">
</head>
<body class="page-wrap">
<a class="skip-link" href="#main">${c.skip}</a>

<!-- GENERATED by _legal/build.mjs from the owner-approved parts of planning's draft - edit the draft, not this file. -->
<header class="container topbar topbar-menu">
  ${LOGO.replace(/\n      /g, '\n  ')}
  <nav class="site-nav" aria-label="${c.navLabel}">
    <a href="/">${c.home}</a>
    <a href="support.html">${c.support}</a>
    <a href="${o.file}" lang="${c.otherLang}" hreflang="${c.otherLang}">${c.other}</a>
  </nav>
</header>

<main id="main" tabindex="-1" class="page-main legal legal-long">
  <h1 class="reveal">${doc.title}</h1>
${rendered.lead.map((l, k) => `  <p class="lead reveal d${k + 1}">${l}</p>`).join('\n')}

${rendered.body}
</main>

<footer class="closing inner-footer">
  <div class="container">
    <div class="footer-bar">
      ${LOGO}
      <div class="links">
        ${foot.join('\n        ')}
      </div>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

// ── run ─────────────────────────────────────────────────────────────────────
execFileSync('git', ['-C', APP_REPO, 'fetch', '-q'], { stdio: 'inherit' });
const date = parseDate();
leftoverBrackets = 0; // counted on the pages that are written, not on the whole draft
const built = [];
for (const [key, cfg] of Object.entries(DOCS)) {
  const src = execFileSync('git', ['-C', APP_REPO, 'show', `origin/main:${cfg.draft}`], { encoding: 'utf8' });
  const blocks = src.split(/\n---\n/);
  const banner = blocks[0].startsWith('>') ? blocks[0] : '';
  const ap = approvedOf(banner);
  if (!ap) {
    for (const l of ['he', 'en']) fs.rmSync(path.join(ROOT, cfg[l].file), { force: true });
    console.log(`${key}: nothing approved - not built`);
    continue;
  }
  const he = blocks[1], en = blocks[2];
  if (!he || !en) throw new Error(`${cfg.draft}: expected banner, Hebrew, English`);
  for (const [lang, text] of [['he', he], ['en', en]]) {
    const doc = parse(text.split('\n'), lang);
    const rendered = render(doc, ap, lang, date[lang]);
    const html = page(key, lang, doc, rendered);
    leftoverBrackets += (html.match(/data-fill-in/g) || []).length;
    fs.writeFileSync(path.join(ROOT, cfg[lang].file), html, 'utf8');
  }
  built.push(key);
  console.log(`${key}: built ${cfg.he.file} and ${cfg.en.file} - opening ${ap.opening}, whole [${[...ap.whole]}], openings [${[...ap.pre]}], parts [${[...ap.subs]}]`);
}
console.log(leftoverBrackets ? `WARNING: ${leftoverBrackets} unfilled [bracket] left in the text` : 'No unfilled brackets.');
