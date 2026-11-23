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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArticleMarkdown, stripMarkdown } from '../src/utils/articleParser.js';

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
let products, blogs, categories, business;
try {
  const [p, b, c, biz] = await Promise.all([
    getJson(`${API}/api/product/list?status=published`),
    getJson(`${API}/api/blogs?status=published&limit=500`),
    getJson(`${API}/api/categories`).catch(() => []),
    getJson(`${API}/api/business-details`).catch(() => null),
  ]);
  products = (p.products || []).filter(x => x.status === 'published' && x.slug);
  blogs = (b.data || []).filter(x => x.status === 'published' && x.slug);
  categories = Array.isArray(c) ? c : (c.categories || c.data || []);
  business = biz?.data || {};
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

  if (!html.includes('<div id="root"></div>')) fail('template has no empty <div id="root"></div>');
  html = html.replace('<div id="root"></div>', () => `<div id="root">${o.body ? shell(o.body) : ''}</div>`);
  return html;
}

// ---------------------------------------------------------------------------------------------
// Static body markup (plain HTML + small scoped stylesheet; React replaces it on boot)
// ---------------------------------------------------------------------------------------------
const STYLE = `<style>
.pr{font-family:Outfit,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1f2937;line-height:1.65;max-width:1200px;margin:0 auto;padding:16px}
.pr a{color:#587a3b}.pr h1{font-family:Prata,Georgia,serif;font-size:clamp(26px,4vw,38px);line-height:1.2;color:#17220e;margin:.4em 0}
.pr h2{font-size:22px;color:#17220e;margin:1.6em 0 .5em}.pr img{max-width:100%;height:auto}
.pr-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;border-bottom:2px solid #587a3b;padding-bottom:12px;margin-bottom:16px}
.pr-head nav ul,.pr-foot ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px 18px}
.pr-head nav a,.pr-foot a{text-decoration:none;color:#374151}.pr-crumbs{font-size:14px;color:#6b7280}
.pr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;padding:0;list-style:none}
.pr-card{border:1px solid #e5e7eb;padding:12px;background:#fff}.pr-card a{text-decoration:none}
.pr-price{font-size:22px;font-weight:600;color:#17220e}.pr-price s{color:#9ca3af;font-weight:400;font-size:16px;margin-left:8px}
.pr-foot{border-top:2px solid #e5e7eb;margin-top:48px;padding-top:24px;font-size:14px;color:#6b7280;display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.pr-foot ul{flex-direction:column}.pr-foot h2{font-size:15px;margin:0 0 8px}
</style>`;

const NAV = [['/', 'Home'], ['/collection', 'Shop'], ['/blog', 'Guides'], ['/about', 'About'], ['/contact', 'Contact']];

function header() {
  return `<header class="pr-head">
  <a href="/"><img src="/logo.png" alt="Natura Bliss logo" width="56" height="56" /></a>
  <nav aria-label="Main"><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></nav>
</header>`;
}

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

const shell = (main) => `${STYLE}<div class="pr">${header()}<main>${main}</main>${footer()}</div>`;

const crumbsHtml = (items) => `<nav class="pr-crumbs" aria-label="Breadcrumb">${items
  .map(([n, u], i) => (i < items.length - 1 ? `<a href="${u}">${esc(n)}</a> › ` : `<span>${esc(n)}</span>`)).join('')}</nav>`;

const productCard = (p) => `<li class="pr-card"><a href="/product/${esc(p.slug)}">
  ${p.image?.[0] ? `<img src="${esc(p.image[0])}" alt="${esc(`${BRAND} ${p.name}`)}" width="400" height="400" loading="lazy" />` : ''}
  <strong>${esc(p.name)}</strong></a><br>${pkr(salePrice(p))}</li>`;

const blogCard = (b) => `<li class="pr-card"><a href="/blog/${esc(b.slug)}"><strong>${esc(b.title)}</strong></a>
  <p>${esc(clip(b.excerpt || b.metaDescription || b.content, 150))}</p></li>`;

// ---------------------------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------------------------
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
    body: `${crumbsHtml(crumbs)}
<article>
  <h1>${esc(p.name)}</h1>
  ${images.map((src, i) => `<img src="${esc(src)}" alt="${esc(`${BRAND} ${p.name}${i ? ` – photo ${i + 1}` : ''}`)}" width="600" height="600"${i ? ' loading="lazy"' : ''} />`).join('\n  ')}
  <p class="pr-price">${pkr(price)}${price < p.price ? `<s>${pkr(p.price)}</s>` : ''}</p>
  <p>${inStock ? 'In stock' : 'Out of stock'} · Cash on delivery across Pakistan · 7-day returns on damaged items</p>
  ${(p.variants || []).length ? `<h2>Sizes</h2><ul>${p.variants.map(v => `<li>${esc(v.name)}: ${pkr(v.discountprice && v.discountprice < v.price ? v.discountprice : v.price)}</li>`).join('')}</ul>` : ''}
  <h2>Description</h2><p>${esc(plain(p.description))}</p>
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
    ogType: 'article',
    graph,
    body: `${crumbsHtml(crumbs)}
<article>
  <h1>${esc(b.title)}</h1>
  <p class="pr-crumbs">By ${esc(b.author || BRAND)}${b.authorRole ? `, ${esc(b.authorRole)}` : ''}${published ? ` · Published <time datetime="${published}">${fmt(published)}</time>` : ''}${modified && modified !== published ? ` · Updated <time datetime="${modified}">${fmt(modified)}</time>` : ''}</p>
  ${b.imageUrl ? `<img src="${esc(b.imageUrl)}" alt="${esc(b.title)}" width="1200" height="630" />` : ''}
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
