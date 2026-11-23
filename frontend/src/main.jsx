import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'

// Product and blog-post pages render their own JSON-LD once React loads; drop the build-time copy
// there so the rendered DOM doesn't contain two Product/BlogPosting entities.
if (/^\/(product|collection\/product|blog)\/[^/]+/.test(window.location.pathname)) {
  document.querySelectorAll('script[data-prerender]').forEach(el => el.remove())
}

createRoot(document.getElementById('root')).render(
  <ShopContextProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  </ShopContextProvider>

)
