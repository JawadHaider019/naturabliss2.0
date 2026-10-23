/**
 * Slick Carousel ARA & Accessibility Tree Sanitizer
 * 
 * Automatically resolves the Lighthouse / axe-core audit:
 * "ARIA hidden element must not be focusable or contain focusable elements"
 * 
 * Slick Carousel clones slides for infinite loops and marks them with aria-hidden="true".
 * If child buttons or links remain focusable, the accessibility tree becomes malformed.
 * This sanitizer ensures:
 * 1. All cloned slides (.slick-cloned) and inactive slides ([aria-hidden="true"]) are marked `inert`
 *    with all focusable child elements set to tabindex="-1", disabled, and aria-hidden="true".
 * 2. Active slides (.slick-active:not(.slick-cloned)) are restored to fully interactive state.
 */

let isObserverInitialized = false;

export function sanitizeSlickAria() {
  if (typeof document === 'undefined') return;

  try {
    // 1. Process all cloned and aria-hidden slides
    const hiddenOrClonedSlides = document.querySelectorAll(
      '.slick-slide.slick-cloned, .slick-slide[aria-hidden="true"]'
    );

    hiddenOrClonedSlides.forEach((slide) => {
      // Mark slide as inert and hidden
      slide.setAttribute('inert', '');
      slide.setAttribute('aria-hidden', 'true');
      slide.setAttribute('tabindex', '-1');

      // Unfocus and disable all interactive descendants
      const focusableElements = slide.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]'
      );

      focusableElements.forEach((el) => {
        el.setAttribute('tabindex', '-1');
        el.setAttribute('aria-hidden', 'true');
        if (el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
          el.setAttribute('disabled', 'true');
        }
      });
    });

    // 2. Restore active, visible non-cloned slides
    const activeSlides = document.querySelectorAll(
      '.slick-slide.slick-active:not(.slick-cloned), .slick-slide[aria-hidden="false"]:not(.slick-cloned)'
    );

    activeSlides.forEach((slide) => {
      slide.removeAttribute('inert');
      slide.removeAttribute('aria-hidden');

      const elementsToRestore = slide.querySelectorAll(
        'button, a, input, select, textarea'
      );

      elementsToRestore.forEach((el) => {
        if (el.getAttribute('disabled') === 'true') {
          el.removeAttribute('disabled');
        }
        if (el.getAttribute('aria-hidden') === 'true') {
          el.removeAttribute('aria-hidden');
        }
        if (el.getAttribute('tabindex') === '-1') {
          el.removeAttribute('tabindex');
        }
      });
    });
  } catch (err) {
    console.debug('Error sanitizing slick aria:', err);
  }
}

/**
 * Initializes global DOM observer to sanitize slick carousels dynamically as slides change.
 */
export function initSlickAriaObserver() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  if (isObserverInitialized) {
    sanitizeSlickAria();
    return () => {};
  }

  isObserverInitialized = true;

  // Run initial pass
  sanitizeSlickAria();

  let timeoutId = null;
  const debouncedSanitize = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      sanitizeSlickAria();
    }, 50);
  };

  const observer = new MutationObserver((mutations) => {
    let needsSanitize = false;
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      if (
        mutation.type === 'childList' ||
        (mutation.type === 'attributes' &&
          (mutation.attributeName === 'class' ||
            mutation.attributeName === 'aria-hidden' ||
            mutation.attributeName === 'tabindex'))
      ) {
        needsSanitize = true;
        break;
      }
    }
    if (needsSanitize) {
      debouncedSanitize();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'aria-hidden', 'tabindex'],
  });

  // Re-run on window resize and load
  window.addEventListener('resize', debouncedSanitize, { passive: true });
  window.addEventListener('load', debouncedSanitize, { passive: true });

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', debouncedSanitize);
    window.removeEventListener('load', debouncedSanitize);
    isObserverInitialized = false;
  };
}
