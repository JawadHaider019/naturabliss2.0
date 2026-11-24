import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'
import { onAppReady, markAppReady } from './utils/appReady'

// Brand fonts: requested here (after the static page has painted) rather than in <head>, so on
// slow phones they don't compete with the HTML, CSS and hero image.
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Prata&display=swap'
if (!document.querySelector(`link[href="${FONTS_URL}"]`)) {
  const fonts = document.createElement('link')
  fonts.rel = 'stylesheet'
  fonts.href = FONTS_URL
  document.head.appendChild(fonts)
}

// Product and blog-post pages render their own JSON-LD once React loads; drop the build-time copy
// there so the rendered DOM doesn't contain two Product/BlogPosting entities.
const dropPrerenderSchema = () => {
  if (/^\/(product|collection\/product|blog)\/[^/]+/.test(window.location.pathname)) {
    document.querySelectorAll('script[data-prerender]').forEach(el => el.remove())
  }
}

// Static-first loading: production pages arrive with prerendered HTML inside #root. Keep it on
// screen while React renders the real app invisibly beside it, then swap once the page signals
// that its main content is ready (see utils/appReady.js). Pages without prerendered HTML
// (cart, checkout, dev server) mount directly.
const staticRoot = document.getElementById('root')
let mountNode = staticRoot

if (staticRoot.firstElementChild) {
  mountNode = document.createElement('div')
  mountNode.setAttribute('aria-hidden', 'true')
  // visibility:hidden still lays out (carousels can measure) but paints nothing
  mountNode.style.cssText = 'position:absolute;top:0;left:0;width:100%;visibility:hidden;pointer-events:none;'
  staticRoot.after(mountNode)

  onAppReady(() => {
    staticRoot.remove()
    mountNode.removeAttribute('style')
    mountNode.removeAttribute('aria-hidden')
    mountNode.id = 'root'
    dropPrerenderSchema()
  })
  // Never leave visitors on the static page if a request hangs
  setTimeout(markAppReady, 6000)
} else {
  dropPrerenderSchema()
}

createRoot(mountNode).render(
  <ShopContextProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ShopContextProvider>
)
