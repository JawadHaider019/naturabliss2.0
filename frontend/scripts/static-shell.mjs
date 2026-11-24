/**
 * Static replicas of the app's above-the-fold UI, used by scripts/prerender.mjs.
 *
 * The prerendered HTML is what visitors see until React has built the real page and swaps it in
 * (src/main.jsx). If the two looked different, every page load would visibly "change style".
 * These functions therefore output the SAME markup and Tailwind classes as the components they
 * mirror, so the swap is invisible:
 *
 *   staticNavbar      -> src/components/Navbar.jsx
 *   staticHomeHero    -> src/components/Hero.jsx (BannerItem)
 *   staticCategories  -> src/components/ShopByCategory.jsx (+ Title.jsx)
 *   staticWhatsApp    -> src/components/WhatsApp.jsx
 *   staticBreadcrumbs -> src/components/Breadcrumbs.jsx
 *   staticProductTop  -> src/pages/Product.jsx (gallery, title, rating, price, description)
 *   staticBlogHero    -> src/pages/BlogPost.jsx (hero section + breadcrumbs)
 *
 * When you change the markup of one of those components, update its replica here too.
 * Tailwind picks up the classes because tailwind.config.js scans ./scripts as well.
 */
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaHome, FaChevronRight, FaWhatsapp, FaStar, FaStarHalf, FaRegStar } from 'react-icons/fa';
import { ArrowLeft } from 'lucide-react';
import { getOptimizedImageUrl } from '../src/utils/imageOptimizer.js';

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const icon = (C, props = {}) => renderToStaticMarkup(h(C, props));

// ---------------------------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------------------------
const NAV = [['/', 'HOME'], ['/collection', 'COLLECTION'], ['/about', 'ABOUT'], ['/blog', 'BLOG'], ['/contact', 'CONTACT']];
const isActive = (to, path) => (to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`));
const svg = (cls, sw, d) => `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="${sw}"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"></path></svg>`;

export function staticNavbar(path, logoUrl) {
  const links = NAV.map(([to, label]) => `<a href="${to}" class="flex flex-col items-center gap-1 transition-colors duration-200 ${isActive(to, path) ? 'text-[#587a3b] font-semibold' : 'hover:text-[#587a3b]'}"${isActive(to, path) ? ' aria-current="page"' : ''}><p>${label}</p><hr class="hidden h-[2px] w-2/4 border-none bg-[#587a3b]"></a>`).join('');
  return `<div class="sticky top-0 z-50 bg-white">
<div class="bg-[#4a6732] text-white text-[11px] sm:text-xs py-1.5 px-3 text-center font-medium tracking-wide flex items-center justify-center gap-1.5 shadow-sm"><span>🇵🇰</span><span><strong>Cash on Delivery Across Pakistan</strong> &bull; 100% Pure &amp; Organic &bull; Fast Doorstep Delivery</span></div>
<div class="flex items-center justify-between py-1 font-medium">
<a href="/"><img src="${esc(logoUrl)}" alt="Natura Bliss Logo" width="80" height="80" class="w-14 sm:w-20 h-14 sm:h-20 object-contain"></a>
<nav aria-label="Main Navigation" class="hidden gap-6 text-sm text-gray-700 sm:flex">${links}</nav>
<div class="flex items-center gap-6">
<a href="/orders" class="relative cursor-pointer group" title="Orders">${svg('w-5 h-5 text-gray-800 group-hover:text-[#587a3b] transition-colors duration-200 cursor-pointer', 1.8, 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4')}</a>
<div class="group relative"><a href="/login" class="cursor-pointer" title="Account">${svg('w-5 h-5 text-gray-800 group-hover:text-[#587a3b] transition-colors duration-200', 1.8, 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z')}</a></div>
<a href="/cart" class="relative group" title="Cart">${svg('w-5 h-5 text-gray-800 group-hover:text-[#587a3b] transition-colors duration-200 cursor-pointer', 1.8, 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z')}<p class="cart-badge absolute bottom-[-5px] right-[-5px] aspect-square w-4 rounded-full bg-[#587a3b] text-center text-[8px] leading-4 text-white font-bold">0</p></a>
<div class="cursor-pointer sm:hidden" title="Menu">${svg('w-6 h-6 text-gray-800 hover:text-[#587a3b] transition-colors duration-200', 2, 'M4 6h16M4 12h16M4 18h16')}</div>
</div>
</div>
</div>`;
}

// ---------------------------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------------------------
// Local copies (dist/media, see prerender.mjs) when available; Hero.jsx prefers the same fields
export const heroBannerUrls = (b) => ({
  mobile: b.localMobileUrl || getOptimizedImageUrl(b.mobileImageUrl, { width: 750, quality: 'auto' }),
  desktop: b.localDesktopUrl || getOptimizedImageUrl(b.desktopImageUrl, { width: 1400, quality: 'auto' }),
});

// Hero.jsx picks mobile/desktop by window width (< 1024); here a <picture> and the nb-hero-*
// rules in the page style do the same with CSS.
export function staticHomeHero(banner) {
  const u = heroBannerUrls(banner);
  return `<div class="hero-slider-container relative w-full overflow-hidden" aria-label="Featured banners" role="region" style="background-color:#FAF8F5">
<div class="relative w-full select-none"><div class="relative w-full overflow-hidden nb-hero-box"><picture><source media="(min-width: 1024px)" srcset="${esc(u.desktop)}"><img src="${esc(u.mobile)}" alt="${esc(banner.altText || 'Natura Bliss Banner')}" width="750" height="1000" class="w-full nb-hero-img" fetchpriority="high"></picture></div></div>
</div>`;
}

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop';

export const staticTitle = (t1, t2) => `<div class="mb-3 inline-flex items-center gap-2"><p class="text-gray-500 ">${t1} <span class="font-medium text-gray-700">${t2}</span></p></div>`;

export function staticCategories(categories) {
  const items = categories
    .map(c => ({ name: (c.name || c.title || '').trim(), image: (c.image || '').trim() || DEFAULT_CATEGORY_IMAGE }))
    .filter(c => c.name);
  if (!items.length) return '';
  return `<section class="my-10 md:my-16 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto">
<div class="py-2 text-center text-2xl md:text-3xl mb-6 sm:mb-10">${staticTitle('SHOP BY', 'CATEGORY')}</div>
<div class="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">${items.map(c => `<a href="/collection?category=${encodeURIComponent(c.name)}" class="group flex flex-col items-center select-none w-[140px] sm:w-[170px] md:w-[190px] lg:w-[200px]"><div class="w-full aspect-[4/5] bg-[#F4F2EC] overflow-hidden relative rounded-sm shadow-sm transition-all duration-300 group-hover:shadow-md"><img src="${esc(getOptimizedImageUrl(c.image, { width: 280, quality: 'auto' }))}" alt="${esc(c.name)}" width="180" height="225" loading="lazy" decoding="async" class="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"></div><p class="mt-3.5 text-[11px] sm:text-xs md:text-[13px] font-medium tracking-widest text-neutral-800 uppercase text-center group-hover:text-[#587a3b] transition-colors">${esc(c.name.toUpperCase())}</p></a>`).join('')}</div>
</section>`;
}

export function staticWhatsApp() {
  const url = `https://wa.me/923241572294?text=${encodeURIComponent('Assalam O Alaikum. I am interested in Natura Bliss products. Please guide me')}`;
  return `<div class="fixed bottom-[100px] right-8 z-50"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" class="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110">${icon(FaWhatsapp, { className: 'text-white text-2xl' })}</a></div>`;
}

// ---------------------------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------------------------
export function staticBreadcrumbs(items) {
  const full = [{ label: 'Home', path: '/' }, ...items];
  return `<nav aria-label="Breadcrumb" class="py-2.5 mb-3 text-xs sm:text-sm text-gray-500"><ol class="flex items-center flex-wrap gap-1.5 list-none m-0 p-0">${full.map((it, i) => {
    const last = i === full.length - 1;
    const inner = !last && it.path
      ? `<a href="${esc(it.path)}" class="hover:text-[#587a3b] transition-colors flex items-center gap-1 text-gray-600">${i === 0 ? icon(FaHome, { className: 'text-xs text-gray-400' }) : ''}<span>${esc(it.label)}</span></a>`
      : `<span class="text-gray-900 font-semibold truncate max-w-[220px] sm:max-w-md" aria-current="page">${esc(it.label)}</span>`;
    return `<li class="flex items-center gap-1.5">${inner}${last ? '' : icon(FaChevronRight, { className: 'text-[10px] text-gray-400 flex-shrink-0', 'aria-hidden': 'true' })}</li>`;
  }).join('')}</ol></nav>`;
}

// ---------------------------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------------------------
const stars = (rating) => [1, 2, 3, 4, 5].map(i => `<span class="text-yellow-400">${icon(i <= rating ? FaStar : i - 0.5 <= rating ? FaStarHalf : FaRegStar)}</span>`).join('');

/** Same price logic as Product.jsx (first variant selected by default). */
function productPrices(p) {
  const v = p.variants?.length ? p.variants[0] : null;
  const src = v || p;
  const hasDiscount = src.discountprice !== undefined && src.discountprice !== null && src.discountprice > 0 && src.discountprice < src.price;
  return {
    actual: Number(hasDiscount ? src.discountprice : src.price),
    original: hasDiscount ? Number(src.price) : null,
    discountPercentage: hasDiscount && src.price > 0 ? Math.round(((src.price - src.discountprice) / src.price) * 100) : null,
  };
}

export const productMainImageUrl = (src) => getOptimizedImageUrl(src, { width: 700, quality: 'auto' });

/** "More variants" list from Product.jsx, first variant selected. */
function staticVariants(p) {
  if (!p.variants?.length) return '';
  const rows = p.variants.map((v, idx) => {
    const sel = idx === 0;
    const hasDisc = v.discountprice !== undefined && v.discountprice !== null && v.discountprice > 0 && v.discountprice < v.price;
    const vPrice = hasDisc ? v.discountprice : v.price;
    const vOrig = hasDisc ? v.price : null;
    return `<div class="flex items-center justify-between px-4 py-3 sm:py-3.5 rounded-xl border transition-all duration-150 cursor-pointer w-full select-none ${sel ? 'border-[#587a3b] bg-[#587a3b] text-white shadow-md' : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'}">
<div class="flex items-center gap-3 min-w-0"><div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'border-white bg-[#587a3b]' : 'border-gray-400 bg-white'}">${sel ? '<div class="w-2.5 h-2.5 rounded-full bg-white"></div>' : ''}</div>${v.image ? `<img src="${esc(getOptimizedImageUrl(v.image, { width: 96, quality: 'auto' }))}" alt="${esc(v.name)}" width="40" height="40" loading="lazy" class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0 border ${sel ? 'border-gray-600' : 'border-gray-200'}">` : ''}<span class="text-sm sm:text-base truncate ${sel ? 'font-bold text-white' : 'font-semibold text-gray-900'}">${esc(v.name)}</span></div>
${vPrice !== undefined ? `<div class="flex items-center gap-2 flex-shrink-0 ml-3"><span class="text-sm sm:text-base font-bold ${sel ? 'text-white' : 'text-gray-900'}">Rs.  ${Number(vPrice).toFixed(2)}</span>${vOrig ? `<span class="text-xs sm:text-sm line-through ${sel ? 'text-gray-300' : 'text-gray-400'}">Rs.  ${Number(vOrig).toFixed(2)}</span>` : ''}</div>` : ''}
</div>`;
  }).join('');
  return `<div class="mt-6 sm:w-4/5"><p class="text-xs sm:text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">MORE VARIANTS</p><div class="space-y-2.5">${rows}</div></div>`;
}

export function staticProductTop(p, { categoryName, rating = 0, reviewCount = 0 }) {
  const images = (p.image || []).filter(Boolean);
  const { actual, original, discountPercentage } = productPrices(p);
  const crumbs = [{ label: 'Collection', path: '/collection' }, ...(categoryName ? [{ label: categoryName, path: `/collection?category=${encodeURIComponent(categoryName)}` }] : []), { label: p.name }];
  return `<div class="container mx-auto px-4 border-t-2 pt-10">
${staticBreadcrumbs(crumbs)}
<div class="flex flex-col gap-12 sm:flex-row sm:gap-12">
<div class="flex flex-1 flex-col-reverse gap-3 sm:flex-row">
<div class="flex w-full justify-between overflow-x-auto sm:w-[18%] sm:flex-col sm:justify-normal sm:overflow-y-auto">${images.map((src, i) => `<img src="${esc(getOptimizedImageUrl(src, { width: 160, quality: 'auto' }))}" alt="Product Thumbnail ${i + 1}" width="80" height="80" loading="lazy" decoding="async" class="w-[24%] shrink-0 cursor-pointer sm:mb-3 sm:w-full object-cover h-20 sm:h-24 rounded border transition-all ${i === 0 ? 'border-black' : 'border-gray-200 hover:border-gray-400'}">`).join('')}</div>
<div class="relative w-full sm:w-4/5">${discountPercentage ? `<div class="absolute right-2 top-2 rounded-full bg-[#587a3b] px-2.5 py-1 text-xs font-medium text-white shadow">${discountPercentage}% OFF</div>` : ''}${images[0] ? `<img src="${esc(p.localImage || productMainImageUrl(images[0]))}" alt="${esc(p.name)}" width="600" height="600" class="h-auto w-full object-cover max-h-[480px] rounded-lg shadow-sm" fetchpriority="high">` : ''}</div>
</div>
<div class="flex-1">
<h1 class="mt-2 text-2xl sm:text-3xl font-medium text-gray-900">${esc(p.name)}</h1>
<div class="mt-2 flex items-center gap-1">${stars(rating)}<p class="pl-2 text-sm font-semibold">${rating.toFixed(1)}</p><span class="text-sm text-gray-500">(${reviewCount} reviews)</span></div>
<div class="mt-5 flex items-center gap-4"><p class="text-3xl font-medium text-gray-900">Rs.  ${actual.toFixed(2)}</p>${original && original !== actual ? `<p class="text-base text-gray-400 line-through">Rs.  ${original.toFixed(2)}</p>` : ''}</div>
<p class="mt-4 text-gray-600 leading-relaxed md:w-4/5">${esc(p.description)}</p>
${staticVariants(p)}
</div>
</div>
</div>`;
}

// ---------------------------------------------------------------------------------------------
// Blog post
// ---------------------------------------------------------------------------------------------
export function staticBlogHero(b, coverSrcSet) {
  const cover = b.imageUrl || 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=1200&q=80';
  const category = Array.isArray(b.category) ? (b.category[0] || 'Cold-Pressed Oils') : (b.category || 'Cold-Pressed Oils');
  const excerpt = b.excerpt || b.metaDescription || '';
  const title = b.title || 'Holistic Botanical Guide';
  return `<section class="relative min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden bg-[#17220e] text-white border-b border-[#587a3b]/20">
<div class="absolute top-6 left-6 z-20"><a href="/blog" class="inline-flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/70 text-white text-xs font-bold transition-colors border border-white/10">${icon(ArrowLeft, { className: 'w-3.5 h-3.5' })}<span>Back to Journal</span></a></div>
<div class="absolute inset-0 z-0"><div class="w-full h-full"><picture>${coverSrcSet ? `<source type="image/webp" srcset="${esc(coverSrcSet)}" sizes="100vw">` : ''}<img src="${esc(cover)}" alt="${esc(title)}" class="w-full h-full object-cover opacity-30" fetchpriority="high"></picture></div><div class="absolute inset-0 bg-gradient-to-t from-[#17220e] via-[#17220e]/85 to-transparent"></div></div>
<div class="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center space-y-4">
<div><span class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#c5a880] block">${esc(category)}</span></div>
<h1 class="font-display text-2xl sm:text-3xl md:text-5xl font-extrabold text-white leading-tight">${esc(title)}</h1>
${excerpt ? `<p class="text-xs sm:text-sm md:text-base text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">${esc(excerpt)}</p>` : ''}
</div>
</section>
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">${staticBreadcrumbs([{ label: 'Blog', path: '/blog' }, { label: category, path: `/blog?category=${encodeURIComponent(category)}` }, { label: title }])}</div>`;
}
