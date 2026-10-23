import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Clarity from "@microsoft/clarity"
import Loader from './components/Loader' // Import your custom loader

import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import Footer from './components/Footer'
import Favicon from './components/Favicon'
import Home from './pages/Home'

import FacebookPixel from './components/FacebookPixel'
import TikTokPixel from './components/TiktokPixel'

// Lazy load secondary pages
const Collection = lazy(() => import('./pages/Collection'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const Product = lazy(() => import('./pages/Product'))
const Deal = lazy(() => import('./pages/Deal'))
const Cart = lazy(() => import('./pages/Cart'))
const Orders = lazy(() => import('./pages/Orders'))
const PlaceOrder = lazy(() => import('./pages/PlaceOrder'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))

// Loading Spinner - Using loader
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white/50 backdrop-blur-sm">
    <Loader
      text="Loading"
      size="xl"
      color="rgb(84 119 55)"

    />
  </div>
)

// Scroll To Top
const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
  }, [pathname])

  return null
}

// Preload Routes
const preloadRoutes = () => {
  const routes = [
    () => import('./pages/Collection'),
    () => import('./pages/Cart')
  ]

  setTimeout(() => {
    routes.forEach(preload => preload())
  }, 2000)
}

const App = () => {
  const location = useLocation()

  // Initialize Clarity + Preload non-blocking after idle
  useEffect(() => {
    preloadRoutes()

    const timer = setTimeout(() => {
      try {
        Clarity.init("vmajox80q2")
      } catch (err) {
        // Silent error
      }
    }, 3500)

    return () => clearTimeout(timer)
  }, [])

  // Track SPA page navigation
  useEffect(() => {
    try {
      Clarity.event("page_view", {
        path: location.pathname
      })
    } catch {
      // Silent error
    }
  }, [location])

  return (
    <div className="px-4 sm:px-[1vw] md:px-[3vw] lg:px-[5vw] flex flex-col min-h-screen">
      <Favicon />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        theme="colored"
        style={{
          '--toastify-color-success': '#587a3b',
          '--toastify-text-color-success': '#ffffff',
          '--toastify-color-error': '#dc2626',
          '--toastify-text-color-error': '#ffffff',
          '--toastify-color-info': '#587a3b',
          '--toastify-text-color-info': '#ffffff',
          '--toastify-color-warning': '#d97706',
          '--toastify-text-color-warning': '#ffffff',
        }}
        toastStyle={{
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '0px',
        }}
      />

      <ScrollToTop />

      <FacebookPixel />
      <TikTokPixel />

      <Navbar />
      <SearchBar />

      <main id="main-content" role="main" className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/collection' element={<Collection />} />
            <Route path='/about' element={<About />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/product/:slug' element={<Product />} />
            <Route path="/deal/:dealId" element={<Deal />} />
            <Route path="/collection/product/:slug" element={<Product />} />
            <Route path='/login' element={<Login />} />
            <Route path='/cart' element={<Cart />} />
            <Route path='/blog' element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path='/orders' element={<Orders />} />
            <Route path='/place-order' element={<PlaceOrder />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}

export default App