// Play Store asset composer. Renders framed screenshots, Chromebook shots, the app icon, and the
// feature graphic at EXACT Play Console dimensions using playwright-core (cached Chromium), then
// strips the alpha channel with pngjs so every flattened asset is a true 24-bit PNG (no transparency).
const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
const fs = require('fs');

const TEAL = '#0C4C60', TEAL2 = '#12667F', ORANGE = '#E28A4B';
const b64 = (p) => fs.readFileSync(p).toString('base64');
const uri = (p) => 'data:image/png;base64,' + b64(p);
const FONT = `@font-face{font-family:'P';font-weight:800;src:url(data:font/ttf;base64,${b64('assets/Poppins-Bold.ttf')})}@font-face{font-family:'P';font-weight:600;src:url(data:font/ttf;base64,${b64('assets/Poppins-Regular.ttf')})}`;

// Extract the eggWhole SVG from the art source for the feature graphic.
const art = fs.readFileSync('src/art/art.ts', 'utf8');
const eggMatch = art.match(/eggWhole:\s*`([\s\S]*?)`,/) || art.match(/eggWhole:\s*'([\s\S]*?)',/);
const EGG = eggMatch ? eggMatch[1] : '';

// Strip alpha -> 24-bit RGB PNG (images are already opaque, so this is a lossless flatten).
function stripAlpha(buf) {
  const src = PNG.sync.read(buf);
  const out = new PNG({ width: src.width, height: src.height, colorType: 2 });
  src.data.copy(out.data);
  return PNG.sync.write(out, { colorType: 2 });
}
const dims = (buf) => `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)} colorType=${buf[25]}`;

const SHOTS = [
  { src: 'capshots/today.png',           cap: 'Keep habits.<br>Hatch a friend.' },
  { src: 'capshots/companion.png',       cap: 'Raise a happy companion' },
  { src: 'capshots/habits.png',          cap: 'Track any habit' },
  { src: 'capshots/garden.png',          cap: 'Grow a garden of perks' },
  { src: 'capshots/insights.png',        cap: 'See every stat' },
  { src: 'capshots/shop_companions.png', cap: 'Collect five companions' },
  { src: 'capshots/achievements.png',    cap: 'Earn every badge' },
  { src: 'capshots/recap.png',           cap: 'Celebrate each week' },
];

// Parameterised "captioned app column on brand canvas" — used for phone (1080x1920) and the
// optional 7"/10" tablet sets. The screenshot keeps its aspect (contain by width) and is centred.
function framedHTML(imgUri, cap, W, H, phoneW, capPx, mt) {
  return `<style>${FONT}*{margin:0;box-sizing:border-box}.c{width:${W}px;height:${H}px;background:linear-gradient(160deg,${TEAL},${TEAL2});display:flex;flex-direction:column;align-items:center;font-family:P}
  .cap{color:#fff;font-weight:800;font-size:${capPx}px;line-height:1.12;text-align:center;margin-top:${mt}px;padding:0 ${Math.round(W*0.065)}px;letter-spacing:-1.2px}
  .ph{margin-top:${Math.round(capPx*0.8)}px;width:${phoneW}px;border-radius:${Math.round(phoneW*0.05)}px;overflow:hidden;box-shadow:0 36px 84px rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.10)}
  .ph img{width:100%;display:block}</style>
  <div class="c"><div class="cap">${cap}</div><div class="ph"><img src="${imgUri}"></div></div>`;
}
function chromebookHTML(imgUri) {
  return `<style>${FONT}*{margin:0;box-sizing:border-box}.c{width:1920px;height:1080px;background:linear-gradient(160deg,${TEAL},${TEAL2});display:flex;align-items:center;justify-content:center;font-family:P}
  .ph{height:984px;border-radius:36px;overflow:hidden;box-shadow:0 32px 78px rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.10)}
  .ph img{height:100%;display:block}</style>
  <div class="c"><div class="ph"><img src="${imgUri}"></div></div>`;
}
function featureHTML() {
  return `<style>${FONT}*{margin:0;box-sizing:border-box}.c{width:1024px;height:500px;background:linear-gradient(155deg,${TEAL},${TEAL2});display:flex;align-items:center;padding:0 70px;font-family:P;overflow:hidden;position:relative}
  .egg{flex:none;width:300px;height:360px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 14px 24px rgba(0,0,0,.3))}
  .egg svg{height:340px;width:auto;display:block}
  .txt{margin-left:44px}
  .name{color:#fff;font-weight:800;font-size:92px;letter-spacing:-2px;line-height:1}
  .tag{color:#BFE3F3;font-weight:600;font-size:33px;margin-top:16px;line-height:1.25;max-width:520px}
  .dot{position:absolute;border-radius:50%;background:rgba(255,255,255,.06)}
  </style>
  <div class="c">
    <div class="dot" style="width:280px;height:280px;right:-70px;top:-90px"></div>
    <div class="dot" style="width:180px;height:180px;right:120px;bottom:-80px"></div>
    <div class="egg">${EGG}</div>
    <div class="txt"><div class="name">HabitHatch</div><div class="tag">Keep your habits. Hatch a friend.</div></div>
  </div>`;
}

(async () => {
  ['phone/raw', 'phone/framed', 'chromebook', 'tablet-7', 'tablet-10'].forEach((d) => fs.mkdirSync('store/screenshots/' + d, { recursive: true }));
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const shot = async () => { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(120); return page.screenshot({ type: 'png' }); };

  for (let i = 0; i < SHOTS.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    // RAW: capture is already 1080x1920; just flatten to 24-bit.
    const raw = stripAlpha(fs.readFileSync(SHOTS[i].src));
    fs.writeFileSync(`store/screenshots/phone/raw/${n}.png`, raw);
    const imgUri = uri(SHOTS[i].src);
    // FRAMED phone 1080x1920
    await page.setViewportSize({ width: 1080, height: 1920 });
    await page.setContent(framedHTML(imgUri, SHOTS[i].cap, 1080, 1920, 906, 68, 82));
    fs.writeFileSync(`store/screenshots/phone/framed/${n}.png`, stripAlpha(await shot()));
    // CHROMEBOOK 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setContent(chromebookHTML(imgUri));
    fs.writeFileSync(`store/screenshots/chromebook/${n}.png`, stripAlpha(await shot()));
    // 7" TABLET 1200x1920
    await page.setViewportSize({ width: 1200, height: 1920 });
    await page.setContent(framedHTML(imgUri, SHOTS[i].cap, 1200, 1920, 900, 62, 60));
    fs.writeFileSync(`store/screenshots/tablet-7/${n}.png`, stripAlpha(await shot()));
    // 10" TABLET 1600x2560
    await page.setViewportSize({ width: 1600, height: 2560 });
    await page.setContent(framedHTML(imgUri, SHOTS[i].cap, 1600, 2560, 1180, 92, 100));
    fs.writeFileSync(`store/screenshots/tablet-10/${n}.png`, stripAlpha(await shot()));
    console.log(`  ${n} ${SHOTS[i].src.split('/')[1]}  raw+framed+chromebook+tablet7+tablet10`);
  }

  // APP ICON 512x512 (alpha allowed; source is opaque egg-on-teal)
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<style>*{margin:0}img{width:512px;height:512px;display:block}</style><img src="${uri('assets/icon/habithatch-icon.png')}">`);
  fs.writeFileSync('store/app-icon-512.png', stripAlpha(await shot()));

  // FEATURE GRAPHIC 1024x500
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(featureHTML());
  fs.writeFileSync('store/feature-graphic-1024x500.png', stripAlpha(await shot()));

  await browser.close();

  // Verify every output
  console.log('\n=== VERIFY ===');
  const check = (p) => console.log(p, '->', dims(fs.readFileSync(p)));
  for (let i = 1; i <= 8; i++) { const n = String(i).padStart(2, '0'); check(`store/screenshots/phone/raw/${n}.png`); check(`store/screenshots/phone/framed/${n}.png`); check(`store/screenshots/chromebook/${n}.png`); check(`store/screenshots/tablet-7/${n}.png`); check(`store/screenshots/tablet-10/${n}.png`); }
  check('store/app-icon-512.png');
  check('store/feature-graphic-1024x500.png');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
