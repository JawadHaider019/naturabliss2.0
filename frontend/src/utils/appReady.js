/**
 * "App ready" signal for the static-first page load.
 *
 * Production pages ship prerendered HTML (scripts/prerender.mjs) that is visible immediately.
 * React renders the real app invisibly next to it, and main.jsx swaps the two once the page
 * calls markAppReady(), i.e. when its main content (hero banner, product, article) is on screen.
 * That keeps the largest paint in the first HTML response and avoids a content -> spinner ->
 * content flash.
 */
let ready = false;
const listeners = [];

export const markAppReady = () => {
  if (ready) return;
  ready = true;
  // Let React commit the frame first so the app is fully painted when it becomes visible
  requestAnimationFrame(() => listeners.splice(0).forEach((fn) => fn()));
};

export const onAppReady = (fn) => {
  if (ready) requestAnimationFrame(fn);
  else listeners.push(fn);
};

export const isAppReady = () => ready;
