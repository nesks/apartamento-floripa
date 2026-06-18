import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const TARGETS = [
  // Loft (SPA - precisa rolar galeria)
  { id: 5,  url: 'https://loft.com.br/imovel/apartamento-amaro-antonio-vieira-itacorubi-florianopolis-3-quartos-99m2/un1xr0mc?tipoTransacao=venda&mediaTab=true', kind: 'loft' },
  { id: 8,  url: 'https://loft.com.br/imovel/apartamento-amaral-antero-bastos-itacorubi-florianopolis-3-quartos-90m2/x8zvb42j?tipoTransacao=venda&mediaTab=true', kind: 'loft' },
  { id: 18, url: 'https://loft.com.br/imovel/apartamento-salvatina-feliciana-dos-santos-itacorubi-florianopolis-3-quartos-94m2/gpyzln8f?tipoTransacao=venda&mediaTab=true', kind: 'loft' },
  { id: 20, url: 'https://loft.com.br/imovel/apartamento-prof-ayrton-roberto-de-oliveira-itacorubi-florianopolis-3-quartos-89m2/47h9r9u9?tipoTransacao=venda&mediaTab=true', kind: 'loft' },

  // Chavesnamao (bloqueia headless?) - propId vem do "id-NNNNNN" da URL
  { id: 10, propId: '39884780', url: 'https://www.chavesnamao.com.br/imovel/apartamento-a-venda-3-quartos-com-garagem-sc-florianopolis-itacorubi-101m2-RS998000/id-39884780/', kind: 'cnm' },
  { id: 19, propId: '41400156', url: 'https://www.chavesnamao.com.br/imovel/apartamento-a-venda-3-quartos-com-garagem-sc-florianopolis-itacorubi-118m2-RS1150000/id-41400156/', kind: 'cnm' },
  { id: 21, propId: '39280044', url: 'https://www.chavesnamao.com.br/imovel/apartamento-a-venda-3-quartos-com-garagem-sc-florianopolis-itacorubi-145m2-RS1189500/id-39280044/', kind: 'cnm' },
  { id: 23, propId: '42523272', url: 'https://www.chavesnamao.com.br/imovel/apartamento-a-venda-3-quartos-com-garagem-sc-florianopolis-itacorubi-91m2-RS890000/id-42523272/', kind: 'cnm' },

  // Imovelweb (SPA)
  { id: 7,  url: 'https://www.imovelweb.com.br/propriedades/apartamento-residencial-paris-dakar-itacorubi-03-3024321966.html', kind: 'iw' },
  { id: 11, url: 'https://www.imovelweb.com.br/propriedades/apartamento-3-quartos-itacorubi-florianopolis-paris-3028870426.html', kind: 'iw' },

  // Remax / Quartier
  { id: 25, url: 'https://quartier.remax.com.br/pt-br/imoveis/apartamento/venda/florianopolis/710-rodovia-joao-paulo/590441064-23', kind: 'remax' },
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

function isPropertyImage(u, kind) {
  if (!u || u.startsWith('data:')) return false;
  if (!/\.(jpe?g|png|webp)(\?|$)/i.test(u)) return false;
  if (/logo|icon|favicon|placeholder|sprite|avatar|google|gstatic|gtag|youtube|ytimg|facebook|fbcdn/i.test(u)) return false;
  if (kind === 'loft')   return /content\.loft\.com\.br\/homes\//i.test(u);
  if (kind === 'cnm')    return /chavesnamao\.com\.br\/imn\//i.test(u) && /imoveis\//i.test(u);
  if (kind === 'iw')     return /imgs\.imovelweb\.com|st-prod\.adevinta|akamaized|imovelweb|chytrk\.com/i.test(u);
  if (kind === 'remax')  return /(remax|cloudinary|amazonaws|imobi|cdn)/i.test(u);
  return true;
}

// Extrai o "id de pasta" do imóvel principal a partir de uma URL conhecida (og:image).
function primaryKey(url, kind) {
  if (!url) return null;
  if (kind === 'cnm') {
    // /imn/.../N/imoveis/{accId}/{propId}/{slug}-{hash}-NN.jpg
    const m = url.match(/imoveis\/(\d+)\/(\d+)\//);
    return m ? `${m[1]}/${m[2]}` : null;
  }
  if (kind === 'loft') {
    const m = url.match(/\/homes\/([^/]+)\//);
    return m ? m[1] : null;
  }
  if (kind === 'iw') {
    // tipicamente algo como /pictures/2024/12/30/30/24321966/<id>-x.jpg
    const m = url.match(/(\d{6,})\/[\w-]+\.jpe?g/i);
    return m ? m[1] : null;
  }
  return null;
}

function upgradeCnm(u) {
  // /imn/0150x0150/N/... -> /imn/1200x0800/N/...
  return u.replace(/\/imn\/\d+x\d+\/[A-Z]\//, '/imn/1200x0800/N/');
}

async function downloadAll(urls, dir, referer) {
  await fs.mkdir(dir, { recursive: true });
  const saved = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': referer } });
      if (!res.ok) { console.log(`  ✗ ${res.status} ${url}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) { console.log(`  ✗ too small (${buf.length}b) ${url}`); continue; }
      const ext = (url.match(/\.(jpe?g|png|webp)/i)?.[1] || 'jpg').toLowerCase();
      const name = `${String(i + 1).padStart(2, '0')}.${ext === 'jpeg' ? 'jpg' : ext}`;
      await fs.writeFile(path.join(dir, name), buf);
      saved.push(name);
    } catch (e) {
      console.log(`  ✗ err ${url}: ${e.message}`);
    }
  }
  return saved;
}

async function scrapeOne(browser, t) {
  console.log(`\n--- id ${t.id} [${t.kind}] ---`);
  const ctx = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1400, height: 900 },
    locale: 'pt-BR',
  });
  const page = await ctx.newPage();
  const collected = new Set();

  page.on('response', async (res) => {
    const u = res.url();
    if (isPropertyImage(u, t.kind)) collected.add(u);
  });

  try {
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);

    // try to open photo gallery (common buttons)
    for (const sel of ['text=/Ver fotos/i', 'text=/Galeria/i', 'text=/Fotos/i', 'button:has(img)', '[aria-label*="foto" i]', '[aria-label*="galeria" i]']) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(800); break; }
      } catch {}
    }

    // scroll to trigger lazy load
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(400);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    // press arrow keys to advance gallery (lots of sites)
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowRight').catch(() => {});
      await page.waitForTimeout(200);
    }

    // collect from DOM
    const dom = await page.evaluate(() => {
      const out = new Set();
      let og = null;
      for (const img of document.querySelectorAll('img')) {
        if (img.src) out.add(img.src);
        if (img.dataset.src) out.add(img.dataset.src);
        if (img.srcset) {
          for (const part of img.srcset.split(',')) {
            const u = part.trim().split(/\s+/)[0];
            if (u) out.add(u);
          }
        }
      }
      for (const m of document.querySelectorAll('meta[property="og:image"], meta[name="og:image"]')) {
        if (m.content) { out.add(m.content); if (!og) og = m.content; }
      }
      for (const s of document.querySelectorAll('source')) {
        if (s.srcset) for (const part of s.srcset.split(',')) {
          const u = part.trim().split(/\s+/)[0]; if (u) out.add(u);
        }
      }
      return { urls: [...out], og };
    });
    for (const u of dom.urls) if (isPropertyImage(u, t.kind)) collected.add(u);
    var ogImage = dom.og;

    // varredura via regex no HTML cru (pega URLs em JSON inline / __NEXT_DATA__ etc)
    const html = await page.content();
    const reAll = /https?:\/\/[^"'\\\s)<>]+\.(?:jpe?g|png|webp)(?:\?[^"'\\\s)<>]*)?/gi;
    for (const m of html.matchAll(reAll)) {
      const u = m[0].replace(/\\u002F/gi, '/');
      if (isPropertyImage(u, t.kind)) collected.add(u);
    }
  } catch (e) {
    console.log(`  goto err: ${e.message}`);
  }

  let urls = [...collected];
  if (t.kind === 'cnm') urls = [...new Set(urls.map(upgradeCnm))];

  // restringir ao imóvel principal: propId explícito > og:image > heurística por pasta
  if (t.kind === 'cnm' && t.propId) {
    const before = urls.length;
    urls = urls.filter(u => u.includes('/' + t.propId + '/'));
    console.log(`  propId=${t.propId} (filtered ${before} -> ${urls.length})`);
  } else if (primaryKey(ogImage, t.kind)) {
    const pk = primaryKey(ogImage, t.kind);
    const before = urls.length;
    urls = urls.filter(u => u.includes(pk));
    console.log(`  primaryKey=${pk} (filtered ${before} -> ${urls.length})`);
  } else if (t.kind === 'cnm' || t.kind === 'loft' || t.kind === 'iw' || t.kind === 'remax') {
    // fallback: agrupar por "pasta" e ficar com o grupo mais frequente
    const groups = new Map();
    for (const u of urls) {
      const folder = u.replace(/\/[^/]+$/, '');
      groups.set(folder, (groups.get(folder) || 0) + 1);
    }
    const top = [...groups.entries()].sort((a,b)=>b[1]-a[1])[0];
    if (top) {
      urls = urls.filter(u => u.startsWith(top[0]));
      console.log(`  fallback folder=${top[0]} -> ${urls.length}`);
    }
  }

  // dedupe by basename
  const byBase = new Map();
  for (const u of urls) {
    const base = u.split('/').pop().split('?')[0];
    if (!byBase.has(base)) byBase.set(base, u);
  }
  urls = [...byBase.values()];

  console.log(`  found ${urls.length} candidate URLs`);
  const dir = path.join('imgs', String(t.id));
  const saved = await downloadAll(urls, dir, t.url);
  console.log(`  saved ${saved.length} files -> ${dir}`);

  await ctx.close();
  return { id: t.id, files: saved };
}

const browser = await chromium.launch({ headless: true });
const results = {};
for (const t of TARGETS) {
  const r = await scrapeOne(browser, t);
  results[r.id] = r.files;
}
await browser.close();
await fs.writeFile('imgs/_manifest.json', JSON.stringify(results, null, 2));
console.log('\nDone. Manifest written to imgs/_manifest.json');
