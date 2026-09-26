// Render the Monthly Journal: one 1080x1350 PNG per page (Instagram carousel) + a PDF of all pages.
// Usage: NODE_PATH=$(npm root -g) node tools/journal_render.js journal/YYYY-MM.html <outdir>
// Prints {"pages":N,"overflowPages":[…]} – any page listed there has text cut off and must be shortened.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [pageFile, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const p = await b.newPage({ viewport: { width: 1200, height: 1500 } });
  await p.goto('file://' + path.resolve(pageFile), { waitUntil: 'load' });
  await p.evaluate(async () => { await document.fonts.ready; });
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelectorAll('.pw').forEach(w => w.style.setProperty('--s', 1)));
  const pgs = await p.$$('section.pg'); const over = [];
  for (let i = 0; i < pgs.length; i++) {
    const o = await pgs[i].evaluate(s => { const inn = s.querySelector('.in'); return inn.scrollHeight > inn.clientHeight + 2 || inn.scrollWidth > inn.clientWidth + 2; });
    if (o) over.push(i + 1);
    await pgs[i].screenshot({ path: path.join(out, `page-${String(i + 1).padStart(2, '0')}.png`) });
  }
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: path.join(out, path.basename(pageFile, '.html') + '-journal.pdf'), width: '1080px', height: '1350px', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  console.log(JSON.stringify({ pages: pgs.length, overflowPages: over }));
  await b.close();
})();
