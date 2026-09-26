// Render the Monthly Journal: Instagram slides (1080x1350 PNG) and a PDF of the newspaper page.
// Usage: NODE_PATH=$(npm root -g) node tools/journal_render.js <ig.html> <journal/YYYY-MM.html> <outdir>
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [ig, pageFile, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.resolve(ig)); await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts && document.fonts.ready);
  const slides = await p.$$('section.s'); const over = [];
  for (let i = 0; i < slides.length; i++) {
    const o = await slides[i].evaluate(s => { const inn = s.querySelector('.in'), f = s.querySelector('.foot'); const kids = [...inn.children]; const bottom = Math.max(...kids.map(k => k.getBoundingClientRect().bottom)); return inn.scrollHeight > inn.clientHeight + 2 || (f && bottom > f.getBoundingClientRect().top - 4); });
    if (o) over.push(i + 1);
    await slides[i].screenshot({ path: path.join(out, `slide-${String(i + 1).padStart(2, '0')}.png`) });
  }
  const q = await b.newPage({ viewport: { width: 1180, height: 1600 } });
  await q.goto('file://' + path.resolve(pageFile)); await q.waitForTimeout(2500);
  await q.pdf({ path: path.join(out, path.basename(pageFile, '.html') + '-journal.pdf'), format: 'A3', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' } });
  await q.screenshot({ path: path.join(out, 'page-full.png'), fullPage: true });
  console.log(JSON.stringify({ slides: slides.length, overflowSlides: over }));
  await b.close();
})();
