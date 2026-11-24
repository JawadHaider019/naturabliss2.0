/**
 * Post-build prerender for Natura Bliss.
 *
 * Runs after `vite build`. Fetches published products + blog posts from the API and writes one
 * static HTML file per indexable route into dist/, each with its own <title>, meta description,
 * canonical, Open Graph tags, JSON-LD and real, crawlable body content. React still boots on top
 * of it in the browser (createRoot replaces the #root contents), so users see the normal app.
 *
 * Why: crawlers that don't execute JavaScript (GPTBot, ClaudeBot, PerplexityBot, most link
 * previews) previously saw the same homepage HTML on every URL.
 *
 * Output (served by Vercel with cleanUrls: /product/rice-soap -> product/rice-soap.html):
 *   index.html, collection.html, about.html, contact.html, blog.html,
 *   product/<slug>.html, blog/<slug>.html, _app.html (SPA shell), 404.html, sitemap.xml
 *
 * The build FAILS if the API can't be reached, so Vercel keeps serving the previous deployment
 * instead of publishing a site where every product URL 404s.
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArticleMarkdown, stripMarkdown } from '../src/utils/articleParser.js';
import { getOptimizedImageUrl } from '../src/utils/imageOptimizer.js';
import {
  staticNavbar, staticHomeHero, heroBannerUrls, staticCategories, staticWhatsApp,
  staticProductTop, productMainImageUrl as productImageUrl, staticBlogHero,
} from './static-shell.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const SITE = 'https://naturabliss.pk';
const BRAND = 'Natura Bliss';
const LOGO = `${SITE}/logo.png`;

// ---------------------------------------------------------------------------------------------
// Env: Vite's .env files aren't loaded into process.env for plain node scripts, so read them.
// ---------------------------------------------------------------------------------------------
async function loadEnvFile(file) {
  try {
    const txt = await fs.readFile(path.resolve(__dirname, '..', file), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* file optional */ }
}
await loadEnvFile('.env.production');
await loadEnvFile('.env');

const API = (process.env.PRERENDER_API_URL || process.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
if (!API) fail('No API URL. Set PRERENDER_API_URL or VITE_BACKEND_URL.');

function fail(msg) {
  console.error(`\n[prerender] FAILED: ${msg}\n`);
  process.exit(1);
}

// Render free tier can take ~60s to wake up, so retry generously.
async function getJson(url, { tries = 4, timeoutMs = 90_000 } = {}) {
  let lastErr;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      console.warn(`[prerender] ${url} attempt ${i}/${tries} failed: ${err.message}`);
      if (i < tries) await new Promise(r => setTimeout(r, 5000 * i));
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const plain = (s = '') => stripMarkdown(String(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const clip = (s, n = 158) => {
  const t = plain(s);
  if (t.length <= n) return t;
  return t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
};

const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

const isoDate = (d) => {
  const t = d ? new Date(d) : null;
  return t && !isNaN(t) ? t.toISOString() : undefined;
};

const abs = (u) => (!u ? u : /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);

const pkr = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`;

const salePrice = (p) => (p.discountprice && p.discountprice < p.price ? p.discountprice : p.price);

// ---------------------------------------------------------------------------------------------
// Fetch data
// ---------------------------------------------------------------------------------------------
console.log(`[prerender] API: ${API}`);
let products, blogs, categories, business, banners, comments;
try {
  const [p, b, c, biz, bn, cm] = await Promise.all([
    getJson(`${API}/api/product/list?status=published`),
    getJson(`${API}/api/blogs?status=published&limit=500`),
    getJson(`${API}/api/categories`).catch(() => []),
    getJson(`${API}/api/business-details`).catch(() => null),
    getJson(`${API}/api/banners/active`).catch(() => null),
    getJson(`${API}/api/comments`).catch(() => []),
  ]);
  products = (p.products || []).filter(x => x.status === 'published' && x.slug);
  blogs = (b.data || []).filter(x => x.status === 'published' && x.slug);
  categories = Array.isArray(c) ? c : (c.categories || c.data || []);
  business = biz?.data || {};
  comments = Array.isArray(cm) ? cm : [];
  // Same filtering/sorting as components/Hero.jsx
  banners = (Array.isArray(bn?.data) ? bn.data : [])
    .filter(x => x.desktopImageUrl && x.mobileImageUrl)
    .sort((x, y) => x.order - y.order);
} catch (err) {
  fail(`could not fetch data from ${API}: ${err.message}`);
}
if (products.length === 0) fail('API returned 0 published products, refusing to deploy an empty catalogue.');
console.log(`[prerender] ${products.length} products, ${blogs.length} blog posts`);

const catName = new Map();
const subName = new Map();
for (const c of categories) {
  catName.set(String(c._id), c.name);
  for (const s of c.subcategories || []) subName.set(String(s._id), s.name);
}
const categoryOf = (p) => catName.get(String(p.category)) || '';

const phone = business.contact?.customerSupport?.phone || '+923241572294';
const email = business.contact?.customerSupport?.email || '';
const social = business.socialMedia || {};
const sameAs = [social.facebook, social.instagram, social.tiktok].filter(Boolean).map(u => u.split('?')[0]);
const whatsapp = social.whatsapp || `https://wa.me/${phone.replace(/\D/g, '')}`;

// ---------------------------------------------------------------------------------------------
// Template handling
// ---------------------------------------------------------------------------------------------
// dist/index.html is overwritten with the prerendered homepage, so keep a pristine copy of Vite's
// output outside dist/ to allow re-running `npm run prerender` without rebuilding.
const TEMPLATE_CACHE = path.resolve(__dirname, '../node_modules/.cache/prerender-template.html');
let template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
if (template.includes('<div id="root"></div>')) {
  await fs.mkdir(path.dirname(TEMPLATE_CACHE), { recursive: true });
  await fs.writeFile(TEMPLATE_CACHE, template);
} else {
  template = await fs.readFile(TEMPLATE_CACHE, 'utf8').catch(() => fail('dist/ already prerendered and no cached template; run `npm run build`.'));
}

// Sitewide schema: Organization + WebSite. Pages append their own nodes to the @graph.
const ORG = {
  '@type': ['Organization', 'OnlineStore'],
  '@id': `${SITE}/#organization`,
  name: BRAND,
  alternateName: 'Natura Bliss Pakistan',
  url: SITE,
  logo: LOGO,
  image: LOGO,
  description: business.company?.description ||
    'Natura Bliss makes cold-pressed oils, handmade soaps and herbal hair and skin care in Talagang, Punjab, Pakistan.',
  ...(business.company?.foundedYear ? { foundingDate: String(business.company.foundedYear) } : {}),
  address: { '@type': 'PostalAddress', addressLocality: 'Talagang', addressRegion: 'Punjab', addressCountry: 'PK' },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: phone,
    ...(email ? { email } : {}),
    contactType: 'customer service',
    areaServed: 'PK',
    availableLanguage: ['English', 'Urdu'],
  },
  ...(sameAs.length ? { sameAs } : {}),
  currenciesAccepted: 'PKR',
  paymentAccepted: 'Cash on Delivery',
  areaServed: { '@type': 'Country', name: 'Pakistan' },
};
const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: SITE,
  name: BRAND,
  publisher: { '@id': `${SITE}/#organization` },
  inLanguage: 'en-PK',
};

const breadcrumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({
    '@type': 'ListItem', position: i + 1, name, item: `${SITE}${url}`,
  })),
});

function setMetaTag(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

/**
 * Build a full HTML document from the template.
 * @param {object} o
 *   path       URL path, e.g. "/product/rice-soap" (used for canonical / og:url)
 *   title      full <title>
 *   description
 *   image      absolute og:image URL
 *   ogType
 *   graph      extra JSON-LD @graph nodes
 *   body       HTML placed inside #root (replaced by React on boot)
 *   noindex
 *   canonical  false to omit (404 / app shell)
 */
const cssCache = new Map();
function mainCss(href) {
  if (!cssCache.has(href)) {
    const css = fsSync.readFileSync(path.join(DIST, href), 'utf8');
    if (/<\/style/i.test(css)) fail(`${href} contains "</style", cannot inline it`);
    cssCache.set(href, css);
  }
  return cssCache.get(href);
}

function renderPage(o) {
  let html = template;
  const url = `${SITE}${o.path === '/' ? '/' : o.path}`;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(o.title)}</title>`);
  html = setMetaTag(html, 'name', 'description', o.description);
  html = setMetaTag(html, 'name', 'robots', o.noindex
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  html = setMetaTag(html, 'property', 'og:type', o.ogType || 'website');
  html = setMetaTag(html, 'property', 'og:title', o.title);
  html = setMetaTag(html, 'property', 'og:description', o.description);
  html = setMetaTag(html, 'property', 'og:image', o.image || LOGO);
  html = setMetaTag(html, 'name', 'twitter:title', o.title);
  html = setMetaTag(html, 'name', 'twitter:description', o.description);
  html = setMetaTag(html, 'name', 'twitter:image', o.image || LOGO);
  // og:image dimensions in the template describe the 512px logo; drop them for other images.
  if (o.image && o.image !== LOGO) html = html.replace(/\s*<meta property="og:image:(width|height)"[^>]*>/g, '');

  // canonical / og:url / hreflang
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*"[^>]*>/g, '');
  if (o.canonical !== false) {
    html = setMetaTag(html, 'property', 'og:url', url);
    html = html.replace('</head>',
      `  <link rel="canonical" href="${url}" />\n` +
      `  <link rel="alternate" hreflang="en-PK" href="${url}" />\n` +
      `  <link rel="alternate" hreflang="x-default" href="${url}" />\n</head>`);
  } else {
    html = html.replace(/\s*<meta property="og:url"[^>]*>/, '');
  }

  // JSON-LD: one graph per page. data-prerender lets main.jsx drop it once React adds its own.
  const graph = o.schema === false ? null : [ORG, WEBSITE, ...(o.graph || [])];
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  if (graph) {
    html = html.replace('</head>',
      `  <script type="application/ld+json" data-prerender>${jsonLd({ '@context': 'https://schema.org', '@graph': graph })}</script>\n</head>`);
  }

  // Largest image of the page: fetch it first (same URL React requests, so it is reused)
  for (const p of o.preload || []) {
    const src = p.srcset
      ? `imagesrcset="${esc(p.srcset)}" imagesizes="${p.sizes}"${p.type ? ` type="${p.type}"` : ''}`
      : `href="${esc(p.href)}"`;
    html = html.replace('</head>', `  <link rel="preload" as="image" ${src} fetchpriority="high"${p.media ? ` media="${p.media}"` : ''} />\n</head>`);
  }
  // Page data for the first React render (utils/preloadedData.js)
  if (o.data) {
    html = html.replace('</head>', `  <script id="nb-data" type="application/json">${jsonLd(o.data)}</script>
</head>`);
  }

  // Start loading the app script once the static page has finished loading (window load: HTML,
  // CSS, hero image), instead of alongside it. The static HTML doesn't
  // need JavaScript to render, so on slow phones the document, CSS and hero image get the bandwidth
  // and the main thread first; React then builds the app invisibly and swaps it in. (Pages without static content keep Vite's normal script tags.)
  if (o.body) {
    const entry = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/);
    if (!entry) fail('could not find the Vite entry script in the template');
    const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">\s*/g)];
    html = html.replace(entry[0], '');
    for (const m of preloads) html = html.replace(m[0], '');
    // Only the vendor chunk is needed by every page; the slick chunk only by the home hero
    const early = preloads.map(m => m[1]).filter(u => /vendor/.test(u) || (o.path === '/' && /slick/.test(u)));
    const loader = `<script>(function(){var done=false,d0=document;function go(){if(done)return;done=true;var d=document,h=d.head;${JSON.stringify(early)}.forEach(function(u){var l=d.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=u;h.appendChild(l)});var s=d.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(entry[1])};h.appendChild(s)}function afterPaint(){requestAnimationFrame(function(){setTimeout(go,0)})}if(d0.readyState==='complete')afterPaint();else window.addEventListener('load',afterPaint);setTimeout(go,3000)})();</script>`;
    html = html.replace('</body>', `${loader}\n</body>`);
  }

  // Inline the main stylesheet on static-first pages. It was the only render-blocking request
  // (PageSpeed: "Render-blocking requests, est. savings 320 ms"); inlined, the first paint needs
  // nothing but the HTML. All url() references in it are absolute (/assets/...) or data: URIs.
  if (o.body) {
    const link = html.match(/<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/);
    if (link) {
      const css = mainCss(link[1]);
      html = html.replace(link[0], () => `<style data-inline-css="${link[1]}">${css}</style>`);
    }
  }

  if (!html.includes('<div id="root"></div>')) fail('template has no empty <div id="root"></div>');
  html = html.replace('<div id="root"></div>', () => `<div id="root">${o.body ? shell(o.body, o.hero, o.path, o.extra) : ''}</div>`);
  return html;
}

// ---------------------------------------------------------------------------------------------
// Static body markup (plain HTML + small scoped stylesheet; React replaces it on boot)
// ---------------------------------------------------------------------------------------------
const STYLE = `<style>
.pr{color:#1f2937;line-height:1.65;max-width:1200px;margin:0 auto;padding:16px 0}
.pr a{color:#587a3b}.pr h1{font-family:Prata,'Prata Fallback',Georgia,serif;font-size:clamp(26px,4vw,38px);line-height:1.2;color:#17220e;margin:.4em 0}
.pr h2{font-size:22px;color:#17220e;margin:1.6em 0 .5em}.pr img{max-width:100%;height:auto}
.pr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;padding:0;list-style:none}
.pr-card{border:1px solid #e5e7eb;padding:12px;background:#fff}.pr-card a{text-decoration:none}
.pr-price{font-size:22px;font-weight:600;color:#17220e}.pr-price s{color:#9ca3af;font-weight:400;font-size:16px;margin-left:8px}
.pr-foot{border-top:2px solid #e5e7eb;margin-top:48px;padding-top:24px;font-size:14px;color:#6b7280;display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.pr-foot ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.pr-foot a{text-decoration:none;color:#374151}.pr-foot h2{font-size:15px;margin:0 0 8px}.pr-crumbs{font-size:14px;color:#6b7280}
.nb-hero-box{aspect-ratio:3/4}.nb-hero-img{height:auto;aspect-ratio:3/4;object-fit:cover;display:block}
@media (min-width:1024px){.nb-hero-box{aspect-ratio:auto;height:90vh}.nb-hero-img{height:100%;aspect-ratio:auto}}
.pr-foot,.pr main>h2~*,.pr article>*:nth-child(n+6),.pr article .article-body>*{content-visibility:auto;contain-intrinsic-block-size:auto 500px}
</style>`;

function footer() {
  const cats = [...new Set(products.map(categoryOf).filter(Boolean))];
  const topGuides = blogs.slice(0, 6);
  return `<footer class="pr-foot">
  <section><h2>${BRAND}</h2>
    <p>Cold-pressed oils, handmade soaps and herbal hair &amp; skin care, made in Talagang, Punjab. Cash on delivery across Pakistan.</p>
    <p>Phone / WhatsApp: <a href="tel:${esc(phone)}">${esc(phone)}</a>${email ? `<br>Email: <a href="mailto:${esc(email)}">${esc(email)}</a>` : ''}</p>
  </section>
  <section><h2>Shop</h2><ul>
    <li><a href="/collection">All products</a></li>
    ${cats.map(c => `<li><a href="/collection">${esc(c)}</a></li>`).join('')}
  </ul></section>
  <section><h2>Guides</h2><ul>
    ${topGuides.map(b => `<li><a href="/blog/${esc(b.slug)}">${esc(b.title)}</a></li>`).join('')}
    <li><a href="/blog">All guides</a></li>
  </ul></section>
  <section><h2>Help</h2><ul>
    <li><a href="/contact">Contact us</a></li>
    <li><a href="/about">About Natura Bliss</a></li>
    <li><a href="${esc(whatsapp)}" rel="noopener">Order on WhatsApp</a></li>
    ${sameAs.map(u => `<li><a href="${esc(u)}" rel="noopener">${esc(new URL(u).hostname.replace('www.', ''))}</a></li>`).join('')}
  </ul></section>
  <p style="grid-column:1/-1">&copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
</footer>`;
}

// Same outer wrapper / navbar / <main> as App.jsx, so swapping in the app changes nothing visible
const LOGO_URL = business.logos?.website?.url
  ? getOptimizedImageUrl(business.logos.website.url, { width: 160, quality: 'auto' })
  : '/logo-96.png';
const shell = (main, hero = '', pagePath = '/', extra = '') => `${STYLE}<div class="px-4 sm:px-[1vw] md:px-[3vw] lg:px-[5vw] flex flex-col min-h-screen">${staticNavbar(pagePath, LOGO_URL)}<main id="main-content" role="main" class="flex-grow min-h-[100svh]">${hero}<div class="pr">${main}</div></main><div class="pr">${footer()}</div></div>${extra}`;

// Blog covers in public/blogs have WebP variants (name-800.webp, name.webp) generated alongside
// the JPEG. Use them when present; covers uploaded later without variants keep the JPEG.
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const existsSync = (p) => { try { return fsSync.statSync(p).isFile(); } catch { return false; } };
function coverSrcSet(url) {
  const m = /^\/blogs\/([\w-]+)\.jpe?g$/i.exec(url || '');
  if (!m) return null;
  const base = `/blogs/${m[1]}`;
  if (!existsSync(path.join(PUBLIC_DIR, `${base}-800.webp`)) || !existsSync(path.join(PUBLIC_DIR, `${base}.webp`))) return null;
  return `${base}-800.webp 800w, ${base}.webp 1200w`;
}
const thumbUrl = (src) => getOptimizedImageUrl(src, { width: 400, quality: 'auto' });

const crumbsHtml = (items) => `<nav class="pr-crumbs" aria-label="Breadcrumb">${items
  .map(([n, u], i) => (i < items.length - 1 ? `<a href="${u}">${esc(n)}</a> › ` : `<span>${esc(n)}</span>`)).join('')}</nav>`;

const productCard = (p) => `<li class="pr-card"><a href="/product/${esc(p.slug)}">
  ${p.image?.[0] ? `<img src="${esc(thumbUrl(p.image[0]))}" alt="${esc(`${BRAND} ${p.name}`)}" width="400" height="400" loading="lazy" />` : ''}
  <strong>${esc(p.name)}</strong></a><br>${pkr(salePrice(p))}</li>`;

const blogCard = (b) => `<li class="pr-card"><a href="/blog/${esc(b.slug)}"><strong>${esc(b.title)}</strong></a>
  <p>${esc(clip(b.excerpt || b.metaDescription || b.content, 150))}</p></li>`;

// ---------------------------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------
// LCP images served from our own origin
// The hero banner and each product's main photo are the pages' largest paint. Fetched from
// Cloudinary, the browser first has to open a new connection (DNS + TCP + TLS, ~3 round trips on
// mobile). Copied into dist/media at build time (content-hashed, cached for a year via
// vercel.json), they arrive over the connection the page already uses. The React components use
// the same URL from the embedded page data, so nothing is downloaded twice.
// ---------------------------------------------------------------------------------------------
const MEDIA_DIR = path.join(DIST, 'media');
async function localizeImage(src, { name, ...opts }) {
  const url = getOptimizedImageUrl(src, { ...opts, format: 'webp' });
  if (!/^https:\/\/res\.cloudinary\.com\//.test(url || '')) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const file = `${name}-${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10)}.webp`;
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await fs.writeFile(path.join(MEDIA_DIR, file), buf);
    return `/media/${file}`;
  } catch {
    return null; // fall back to the Cloudinary URL
  }
}
if (banners[0]) {
  const [m, d] = await Promise.all([
    localizeImage(banners[0].mobileImageUrl, { name: 'hero-mobile', width: 750, quality: 'auto' }),
    localizeImage(banners[0].desktopImageUrl, { name: 'hero-desktop', width: 1400, quality: 'auto' }),
  ]);
  if (m) banners[0].localMobileUrl = m;
  if (d) banners[0].localDesktopUrl = d;
}
for (let i = 0; i < products.length; i += 6) {
  await Promise.all(products.slice(i, i + 6).map(async (p) => {
    if (!p.image?.[0]) return;
    const u = await localizeImage(p.image[0], { name: `product-${p.slug}`, width: 700, quality: 'auto' });
    if (u) p.localImage = u;
  }));
}
console.log(`[prerender] local LCP images: hero ${banners[0]?.localMobileUrl ? 'yes' : 'no'}, products ${products.filter(p => p.localImage).length}/${products.length}`);

const pages = []; // { file, html, sitemap?: { loc, lastmod } }
const add = (file, opts, sitemap) => pages.push({ file, html: renderPage(opts), sitemap });

const newest = (dates) => dates.map(d => new Date(d)).filter(d => !isNaN(d)).sort((a, b) => b - a)[0];
const latestBlog = newest(blogs.map(b => b.updatedAt || b.publishDate));
const latestProduct = newest(products.map(p => p.date));
const latestAny = newest([latestBlog, latestProduct].filter(Boolean)) || new Date();

// Home ----------------------------------------------------------------------------------------
add('index.html', {
  path: '/',
  title: 'Natura Bliss | Cold-Pressed Oils & Herbal Skincare in Pakistan',
  description: 'Cold-pressed oils, handmade soaps and herbal hair & skin care made in Talagang, Pakistan. No parabens, sulfates or mineral oil. Cash on delivery nationwide.',
  graph: [{
    '@type': 'ItemList',
    name: 'Natura Bliss products',
    itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/product/${p.slug}`, name: p.name })),
  }],
  hero: `${banners.length ? staticHomeHero(banners[0]) : ''}${staticCategories(categories)}`,
  extra: staticWhatsApp(),
  ...(banners.length ? (() => {
    const u = heroBannerUrls(banners[0]);
    return { preload: [{ href: u.mobile, media: '(max-width: 1023px)' }, { href: u.desktop, media: '(min-width: 1024px)' }] };
  })() : {}),
  data: { banners, categories: categories.map(c => ({ _id: c._id, name: c.name, image: c.image })) },
  body: `<h1>Pure Cold-Pressed Oils &amp; Herbal Skincare, Made in Talagang</h1>
<p>${BRAND} makes cold-pressed oils, handmade soaps and herbal hair and skin care in small batches in Talagang, Punjab. No parabens, sulfates or mineral oil. Cash on delivery to every city in Pakistan.</p>
<p><a href="/collection">Shop all products</a> · <a href="${esc(whatsapp)}" rel="noopener">Order on WhatsApp</a></p>
<h2>Products</h2><ul class="pr-grid">${products.map(productCard).join('')}</ul>
<h2>Hair &amp; skin guides</h2><ul class="pr-grid">${blogs.slice(0, 9).map(blogCard).join('')}</ul>`,
}, { loc: '/', lastmod: latestAny });

// Collection ----------------------------------------------------------------------------------
{
  const byCat = new Map();
  for (const p of products) {
    const c = categoryOf(p) || 'Other';
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(p);
  }
  add('collection.html', {
    path: '/collection',
    title: 'Shop Cold-Pressed Oils, Soaps & Herbal Hair Care | Natura Bliss',
    description: `Browse all ${products.length} Natura Bliss products: cold-pressed oils, handmade soaps, herbal shampoo and skin care. Prices in PKR with cash on delivery across Pakistan.`,
    graph: [
      breadcrumbs([['Home', '/'], ['Shop', '/collection']]),
      {
        '@type': 'CollectionPage', name: 'All products', url: `${SITE}/collection`,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/product/${p.slug}` })),
        },
      },
    ],
    body: `${crumbsHtml([['Home', '/'], ['Shop', '/collection']])}
<h1>All Products</h1>
${[...byCat].map(([c, list]) => `<h2>${esc(c)}</h2><ul class="pr-grid">${list.map(productCard).join('')}</ul>`).join('\n')}`,
  }, { loc: '/collection', lastmod: latestProduct });
}

// Products ------------------------------------------------------------------------------------
for (const p of products) {
  const url = `/product/${p.slug}`;
  const price = salePrice(p);
  const inStock = (p.quantity ?? 1) > 0 || (p.variants || []).some(v => v.quantity > 0);
  const cat = categoryOf(p);
  const images = (p.image || []).filter(Boolean);
  const related = products.filter(x => x !== p && x.category === p.category).slice(0, 4);
  const relatedBlogs = blogs.filter(b => {
    const name = p.name.toLowerCase().replace(/\s+(oil|soap|cream)$/, '');
    return (b.title + ' ' + (b.tags || []).join(' ')).toLowerCase().includes(name);
  }).slice(0, 3);
  const crumbs = [['Home', '/'], ['Shop', '/collection'], ...(cat ? [[cat, '/collection']] : []), [p.name, url]];

  const variantOffers = (p.variants || []).filter(v => v.price > 0).map(v => ({
    '@type': 'Offer',
    name: v.name,
    price: String(v.discountprice && v.discountprice < v.price ? v.discountprice : v.price),
    priceCurrency: 'PKR',
    availability: v.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: `${SITE}${url}`,
    ...(v.sku ? { sku: v.sku } : {}),
  }));

  const offerShared = {
    priceCurrency: 'PKR',
    url: `${SITE}${url}`,
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${SITE}/#organization` },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4, unitCode: 'DAY' },
      },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'PK',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 7,
    },
  };

  const offers = variantOffers.length > 1
    ? {
      '@type': 'AggregateOffer',
      lowPrice: String(Math.min(...variantOffers.map(o => +o.price))),
      highPrice: String(Math.max(...variantOffers.map(o => +o.price))),
      offerCount: variantOffers.length,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      offers: variantOffers,
      ...offerShared,
    }
    : {
      '@type': 'Offer',
      price: String(price),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      ...offerShared,
    };

  const list = (items) => (items || []).filter(Boolean).map(x => `<li>${esc(plain(x))}</li>`).join('');

  add(`product/${p.slug}.html`, {
    path: url,
    title: `${p.name} Price in Pakistan | ${BRAND}`,
    description: clip(`${p.name} by ${BRAND}, ${pkr(price)}. ${plain(p.description)}`, 158),
    image: images[0],
    ...(images[0] ? {
      preload: [{ href: p.localImage || productImageUrl(images[0]) }],
    } : {}),
    hero: (() => {
      // Same rating figures Product.jsx shows once reviews load
      const revs = comments.filter(c => String(c.productId) === String(p._id));
      const rating = revs.length ? revs.reduce((sum, r) => sum + (r.rating || 0), 0) / revs.length : 0;
      return staticProductTop(p, { categoryName: cat, rating, reviewCount: revs.length });
    })(),
    data: { product: p },
    ogType: 'product',
    graph: [
      breadcrumbs(crumbs),
      {
        '@type': 'Product',
        '@id': `${SITE}${url}#product`,
        name: p.name,
        url: `${SITE}${url}`,
        description: clip(p.description, 1000),
        image: images,
        sku: p._id,
        brand: { '@type': 'Brand', name: BRAND },
        ...(cat ? { category: cat } : {}),
        offers,
        // aggregateRating intentionally omitted: only add it from real, on-page reviews.
      },
    ],
    // Title, photos, price and description are in the replica top section (hero) above
    body: `<article>
  <p>${inStock ? 'In stock' : 'Out of stock'} · Cash on delivery across Pakistan · 7-day returns on damaged items</p>
  ${(p.variants || []).length ? `<h2>Sizes</h2><ul>${p.variants.map(v => `<li>${esc(v.name)}: ${pkr(v.discountprice && v.discountprice < v.price ? v.discountprice : v.price)}</li>`).join('')}</ul>` : ''}
  ${p.benefits?.length ? `<h2>Benefits</h2><ul>${list(p.benefits)}</ul>` : ''}
  ${p.ingredients?.length ? `<h2>Ingredients</h2><ul>${list(p.ingredients)}</ul>` : ''}
  ${p.howToUse ? `<h2>How to use</h2><p>${esc(plain(p.howToUse))}</p>` : ''}
  ${relatedBlogs.length ? `<h2>Guides</h2><ul>${relatedBlogs.map(b => `<li><a href="/blog/${esc(b.slug)}">${esc(b.title)}</a></li>`).join('')}</ul>` : ''}
  ${related.length ? `<h2>You may also like</h2><ul class="pr-grid">${related.map(productCard).join('')}</ul>` : ''}
</article>`,
  }, { loc: url, lastmod: p.date });
}

// Blog index ----------------------------------------------------------------------------------
add('blog.html', {
  path: '/blog',
  title: `Hair & Skin Care Guides for Pakistan | ${BRAND} Journal`,
  description: 'Practical guides on hair fall, dandruff, melasma, acne and dry skin in Pakistan’s climate and water, and how to use cold-pressed oils safely.',
  graph: [
    breadcrumbs([['Home', '/'], ['Guides', '/blog']]),
    {
      '@type': 'Blog', '@id': `${SITE}/blog#blog`, name: `${BRAND} Journal`, url: `${SITE}/blog`,
      publisher: { '@id': `${SITE}/#organization` },
      blogPost: blogs.map(b => ({ '@type': 'BlogPosting', headline: b.title, url: `${SITE}/blog/${b.slug}` })),
    },
  ],
  body: `${crumbsHtml([['Home', '/'], ['Guides', '/blog']])}
<h1>Hair &amp; Skin Care Guides</h1>
<ul class="pr-grid">${blogs.map(blogCard).join('')}</ul>`,
}, { loc: '/blog', lastmod: latestBlog });

// Blog posts ----------------------------------------------------------------------------------
for (const b of blogs) {
  const url = `/blog/${b.slug}`;
  const parsed = parseArticleMarkdown(b.content || '');
  const desc = clip(b.metaDescription || b.excerpt || b.content);
  const published = isoDate(b.publishDate || b.createdAt);
  const modified = isoDate(b.reviewedDate || b.updatedAt) || published;
  const cat = Array.isArray(b.category) ? b.category[0] : b.category;
  const crumbs = [['Home', '/'], ['Guides', '/blog'], [b.title, url]];
  const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const graph = [
    breadcrumbs(crumbs),
    {
      '@type': 'BlogPosting',
      '@id': `${SITE}${url}#article`,
      headline: b.title,
      description: desc,
      ...(b.imageUrl ? { image: [abs(b.imageUrl)] } : {}),
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      author: {
        '@type': b.author && !/natura bliss|admin/i.test(b.author) ? 'Person' : 'Organization',
        name: b.author && b.author !== 'Admin' ? b.author : BRAND,
        ...(b.authorRole ? { jobTitle: b.authorRole } : {}),
        ...(b.authorBio ? { description: b.authorBio } : {}),
      },
      publisher: { '@id': `${SITE}/#organization` },
      mainEntityOfPage: `${SITE}${url}`,
      ...(cat ? { articleSection: cat } : {}),
      ...(b.tags?.length ? { keywords: b.tags.join(', ') } : {}),
      wordCount: plain(b.content).split(' ').length,
      inLanguage: 'en-PK',
    },
  ];
  if (parsed.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: parsed.faqs.map(f => ({
        '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
      })),
    });
  }

  add(`blog/${b.slug}.html`, {
    path: url,
    title: b.metaTitle && b.metaTitle.includes(BRAND) ? b.metaTitle : `${b.metaTitle || b.title} | ${BRAND}`,
    description: desc,
    image: abs(b.imageUrl) || undefined,
    ...(b.imageUrl ? (() => {
      const set = coverSrcSet(b.imageUrl);
      return {
        preload: [set ? { srcset: set, sizes: '100vw', type: 'image/webp' } : { href: b.imageUrl }],
      };
    })() : {}),
    hero: staticBlogHero(b, coverSrcSet(b.imageUrl)),
    data: { blog: b },
    ogType: 'article',
    graph,
    body: `<article>
  <p class="pr-crumbs">By ${esc(b.author || BRAND)}${b.authorRole ? `, ${esc(b.authorRole)}` : ''}${published ? ` · Published <time datetime="${published}">${fmt(published)}</time>` : ''}${modified && modified !== published ? ` · Updated <time datetime="${modified}">${fmt(modified)}</time>` : ''}</p>
  ${parsed.html}
  ${b.authorBio ? `<h2>About the author</h2><p>${esc(b.authorBio)}</p>` : ''}
</article>`,
  }, { loc: url, lastmod: modified });
}

// About / Contact (content is client-side; give them unique head + crawlable contact basics) -----
add('about.html', {
  path: '/about',
  title: `About ${BRAND}: Cold-Pressed Oils Made in Talagang, Pakistan`,
  description: `Who we are and how we make our oils and soaps. ${BRAND} cold-presses oils and handmakes soaps in Talagang, Punjab, and delivers across Pakistan.`,
  graph: [breadcrumbs([['Home', '/'], ['About', '/about']]), { '@type': 'AboutPage', url: `${SITE}/about`, about: { '@id': `${SITE}/#organization` } }],
  body: `${crumbsHtml([['Home', '/'], ['About', '/about']])}
<h1>About ${BRAND}</h1>
<p>${esc(business.company?.description || ORG.description)}</p>
<p>Based in Talagang, Punjab${business.company?.foundedYear ? `, since ${esc(business.company.foundedYear)}` : ''}. Questions? Call or WhatsApp <a href="tel:${esc(phone)}">${esc(phone)}</a>.</p>`,
}, { loc: '/about', lastmod: null });

add('contact.html', {
  path: '/contact',
  title: `Contact ${BRAND} | WhatsApp, Phone & Email`,
  description: `Contact ${BRAND} by WhatsApp or phone on ${phone}${email ? ` or email ${email}` : ''}. We reply within 24 hours and deliver across Pakistan with cash on delivery.`,
  graph: [breadcrumbs([['Home', '/'], ['Contact', '/contact']]), { '@type': 'ContactPage', url: `${SITE}/contact`, about: { '@id': `${SITE}/#organization` } }],
  body: `${crumbsHtml([['Home', '/'], ['Contact', '/contact']])}
<h1>Contact ${BRAND}</h1>
<ul>
  <li>WhatsApp: <a href="${esc(whatsapp)}" rel="noopener">message us on WhatsApp</a></li>
  <li>Phone: <a href="tel:${esc(phone)}">${esc(phone)}</a></li>
  ${email ? `<li>Email: <a href="mailto:${esc(email)}">${esc(email)}</a></li>` : ''}
  <li>Location: Talagang, Punjab, Pakistan</li>
</ul>`,
}, { loc: '/contact', lastmod: null });

// SPA shell for app-only routes (cart, login, orders, checkout, deals). noindex is sent as an
// X-Robots-Tag header from vercel.json for the private ones; deals stay indexable.
pages.push({
  file: '_app.html',
  html: renderPage({
    path: '/', canonical: false, schema: false,
    title: BRAND, description: ORG.description, body: '',
  }),
});

// 404 page. Still boots React, so a product added after the last deploy keeps working for
// shoppers (React fetches it) while crawlers get an honest 404 until the next build.
pages.push({
  file: '404.html',
  html: renderPage({
    path: '/404', canonical: false, schema: false, noindex: true,
    title: `Page not found | ${BRAND}`,
    description: 'This page doesn’t exist. Browse our products or guides instead.',
    body: `<h1>Page not found</h1>
<p>Sorry, we couldn’t find that page. Try the <a href="/collection">shop</a> or our <a href="/blog">guides</a>.</p>`,
  }),
});

// ---------------------------------------------------------------------------------------------
// Write files + sitemap
// ---------------------------------------------------------------------------------------------
for (const { file, html } of pages) {
  const out = path.join(DIST, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, html);
}

const day = (d) => (d && !isNaN(new Date(d)) ? new Date(d).toISOString().slice(0, 10) : null);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter(p => p.sitemap).map(({ sitemap: s }) => `  <url>
    <loc>${SITE}${s.loc}</loc>${day(s.lastmod) ? `\n    <lastmod>${day(s.lastmod)}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`;
await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap);

console.log(`[prerender] wrote ${pages.length} HTML files + sitemap.xml (${pages.filter(p => p.sitemap).length} URLs)`);
