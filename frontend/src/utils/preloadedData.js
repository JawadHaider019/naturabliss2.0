/**
 * Page data embedded by scripts/prerender.mjs as <script id="nb-data" type="application/json">.
 * Lets the first render use the same data as the static HTML instead of waiting for the API.
 * Only valid for the URL the page was loaded on, so callers check the slug they expect.
 */
let cache;

export const getPreloadedData = () => {
  if (cache !== undefined) return cache;
  try {
    const el = typeof document !== 'undefined' && document.getElementById('nb-data');
    cache = el ? JSON.parse(el.textContent) : null;
  } catch {
    cache = null;
  }
  return cache;
};
