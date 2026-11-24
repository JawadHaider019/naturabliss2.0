/**
 * Run marketing/analytics scripts (Facebook, TikTok, Clarity, GA) after the first user
 * interaction instead of during page load, where they blocked the main thread for ~1.4 s on
 * mobile. A fallback timer still loads them for visitors who only read.
 */
const EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
const FALLBACK_MS = 15000;

let triggered = false;
const queue = [];

const fire = () => {
  if (triggered) return;
  triggered = true;
  EVENTS.forEach((e) => window.removeEventListener(e, fire, { passive: true }));
  queue.splice(0).forEach((fn) => {
    try { fn(); } catch { /* never let a tracker break the page */ }
  });
};

if (typeof window !== 'undefined') {
  EVENTS.forEach((e) => window.addEventListener(e, fire, { once: true, passive: true }));
  setTimeout(fire, FALLBACK_MS);
}

export const runAfterInteraction = (fn) => {
  if (triggered) {
    try { fn(); } catch { /* ignore */ }
  } else {
    queue.push(fn);
  }
};
