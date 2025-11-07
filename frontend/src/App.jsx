import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Collection from './pages/Collection'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Product from './pages/Product'
import Deal from './pages/Deal';
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import PlaceOrder from './pages/PlaceOrder'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import SearchBar from './components/SearchBar'
import { ToastContainer } from 'react-toastify'
import Footer from './components/Footer'
import 'react-toastify/dist/ReactToastify.css'
import Favicon from './components/Favicon' 

// ScrollToTop component that handles scrolling when route changes
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top instantly when route changes
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[6vw] lg:px-[8vw]">
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
          // Success toast - black background with white text
          '--toastify-color-success': '#000000',
          '--toastify-text-color-success': '#ffffff',
          // Error toast - red background with white text
          '--toastify-color-error': '#dc2626', 
          '--toastify-text-color-error': '#ffffff',
          // Progress bar colors
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
      <Footer/>
    </div>
  )
}

export default App