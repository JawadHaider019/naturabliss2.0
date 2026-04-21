import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Clarity from "@microsoft/clarity"
import Loader from './components/Loader' // Import your custom loader

// Lazy load components
const Navbar = lazy(() => import('./components/Navbar'))
const SearchBar = lazy(() => import('./components/SearchBar'))
const Footer = lazy(() => import('./components/Footer'))
const Favicon = lazy(() => import('./components/Favicon'))

import FacebookPixel from './components/FacebookPixel'
import TikTokPixel from './components/TiktokPixel'

// Pages
const Home = lazy(() => import('./pages/Home'))
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
    () => import('./pages/Home'),
    () => import('./pages/Collection'),
    () => import('./pages/Cart')
  ]

  setTimeout(() => {
    routes.forEach(preload => preload())
  }, 2000)
}

const App = () => {

  const location = useLocation()

  // Initialize Clarity + Preload
  useEffect(() => {
    preloadRoutes()

    // Initialize Microsoft Clarity
    Clarity.init("vmajox80q2")

  }, [])

  // Track SPA page navigation
  useEffect(() => {
    Clarity.event("page_view", {
      path: location.pathname
    })
  }, [location])

  return (
    <div className="px-4 sm:px-[2vw] md:px-[6vw] lg:px-[8vw]">

      <Suspense fallback={<LoadingSpinner />}>
        <Favicon />

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          theme="colored"
          style={{
            '--toastify-color-success': '#000000',
            '--toastify-text-color-success': '#ffffff',
            '--toastify-color-error': '#dc2626',
            '--toastify-text-color-error': '#ffffff',
          }}
          toastStyle={{
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
          }}
        />

        <ScrollToTop />

        <FacebookPixel />
        <TikTokPixel />

        <Navbar />
        <SearchBar />

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

        <Footer />

      </Suspense>

    </div>
  )
}

export default App