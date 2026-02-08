import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Lazy load components with preloading
const Navbar = lazy(() => import('./components/Navbar'))
const SearchBar = lazy(() => import('./components/SearchBar'))
const Footer = lazy(() => import('./components/Footer'))
const Favicon = lazy(() => import('./components/Favicon'))

// Lazy load pages with preloading strategy
const Home = lazy(() => 
  Promise.all([
    import('./pages/Home'),
    new Promise(resolve => setTimeout(resolve, 100))
  ]).then(([module]) => module)
)

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

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
  </div>
)

// ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
};

// Meta Pixel Initialization Hook
const useFacebookPixel = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Initialize Meta Pixel only once
    if (!window.fbq) {
      !function(f,b,e,v,n,t,s) {
        if(f.fbq)return;
        n=f.fbq=function() {
          n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)
        };
        if(!f._fbq)f._fbq=n;
        n.push=n;
        n.loaded=!0;
        n.version='2.0';
        n.queue=[];
        t=b.createElement(e);
        t.async=!0;
        t.src=v;
        s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s);
      }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
      
      // Initialize with your Pixel ID
      window.fbq('init', '913853534399435');
    }
  }, []); // Empty dependency - runs only once

  // Track page views on route change
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
      
      // Optional: Track custom page events based on route
      const pageData = {
        page_path: location.pathname,
        page_title: document.title,
      };
      
      // Send custom event with page info (optional but useful)
      window.fbq('trackCustom', 'PageView', pageData);
    }
  }, [location.pathname]); // Runs on every route change
};

// Preload critical routes
const preloadRoutes = () => {
  const routes = [
    () => import('./pages/Home'),
    () => import('./pages/Collection'),
    () => import('./pages/Cart')
  ];
  
  setTimeout(() => {
    routes.forEach(preload => preload());
  }, 2000);
};

// Helper function to track events from anywhere
export const trackFacebookEvent = (eventName, data = {}) => {
  if (window.fbq) {
    window.fbq('track', eventName, data);
  } else {
    console.warn('Facebook Pixel not initialized');
  }
};

// Component to track specific page interactions
const FacebookPixelTracker = () => {
  useFacebookPixel();
  return null;
};

const App = () => {
  // Preload important routes after mount
  useEffect(() => {
    preloadRoutes();
  }, []);

  return (
    <div className="px-4 sm:px-[2vw] md:px-[6vw] lg:px-[8vw]">
      <Suspense fallback={<LoadingSpinner />}>
        <Favicon />
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{
            '--toastify-color-success': '#000000',
            '--toastify-text-color-success': '#ffffff',
            '--toastify-color-error': '#dc2626', 
            '--toastify-text-color-error': '#ffffff',
            '--toastify-color-progress-success': '#10b981',
            '--toastify-color-progress-error': '#fca5a5',
          }}
          toastStyle={{
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
          }}
        />
        
        <ScrollToTop />
        <FacebookPixelTracker /> {/* Add this line */}
        
        <Navbar/>
        <SearchBar/>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/collection' element={<Collection/>}/>
            <Route path='/about' element={<About/>}/>
            <Route path='/contact' element={<Contact/>}/>
            <Route path='/product/:productId' element={<Product/>}/>
            <Route path="/deal/:dealId" element={<Deal />} />
            <Route path="/collection/product/:productId" element={<Product />} />
            <Route path='/login' element={<Login/>}/>
            <Route path='/cart' element={<Cart/>}/>
            <Route path='/blog' element={<Blog/>}/>
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path='/orders' element={<Orders/>}/>
            <Route path='/place-order' element={<PlaceOrder/>}/>
          </Routes>
        </Suspense>
   
        <Footer/>
      </Suspense>
    </div>
  )
}

export default App