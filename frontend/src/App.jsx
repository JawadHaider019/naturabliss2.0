import { lazy, Suspense, useEffect } from 'react'
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
    new Promise(resolve => setTimeout(resolve, 100)) // Small delay to avoid blocking
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

// ScrollToTop component with smooth behavior
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll for better UX
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
};

// Preload critical routes
const preloadRoutes = () => {
  const routes = [
    () => import('./pages/Home'),
    () => import('./pages/Collection'),
    () => import('./pages/Cart')
  ];
  
  // Start preloading after initial render
  setTimeout(() => {
    routes.forEach(preload => preload());
  }, 2000);
};

const App = () => {
  // Preload important routes after mount
  useEffect(() => {
    preloadRoutes();
  }, []);

  return (
    <div className="px-4 sm:px-[5vw] md:px-[6vw] lg:px-[8vw]">
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