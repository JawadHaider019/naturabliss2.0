import {useContext, useState, useEffect} from 'react'
import { assets } from '../assets/assets'
import {Link, NavLink } from 'react-router-dom'
import {ShopContext} from '../context/ShopContext'
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { getBusinessDetails } from "../services/businessService";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";

// Import directly from environment variables
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const [visible, setVisible] = useState(false)
  const [websiteLogo, setWebsiteLogo] = useState("")
  const {getCartCount,token,setToken,setCartItems} = useContext(ShopContext)
  const navigate = useNavigate(); 

  // Fetch website logo from shared cached business service
  useEffect(() => {
    const fetchWebsiteLogo = async () => {
      const data = await getBusinessDetails(backendUrl);
      if (data?.logos?.website?.url) {
        setWebsiteLogo(data.logos.website.url);
      }
    };

    if (backendUrl) {
      fetchWebsiteLogo();
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setCartItems({})
    toast.success("Logged out successfully")
    navigate('/login')
  }

  // Close mobile menu when navigating
  const handleMobileNavClick = () => {
    setVisible(false);
  };

  // Simple logo display with fixed dimensions to prevent layout shift
  const LogoDisplay = () => {
    const displayLogo = websiteLogo
      ? getOptimizedImageUrl(websiteLogo, { width: 160, quality: 'auto' })
      : assets.logo;

    return (
      <img 
        src={displayLogo} 
        alt="Natura Bliss Logo" 
        width="80"
        height="80"
        className='w-14 sm:w-20 h-14 sm:h-20 object-contain'
        onError={(e) => {
          e.target.src = assets.logo;
        }}
      />
    );
  };

  return (
    <div className="sticky top-0 z-50 bg-white">
      {/* Pakistan Geo & Trust Announcement Bar */}
      <div className="bg-[#4a6732] text-white text-[11px] sm:text-xs py-1.5 px-3 text-center font-medium tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
        <span>🇵🇰</span>
        <span><strong>Cash on Delivery Across Pakistan</strong> &bull; 100% Pure &amp; Organic &bull; Fast Doorstep Delivery</span>
      </div>

      <div className="flex items-center justify-between py-1 font-medium">
        <Link to='/'><LogoDisplay /></Link>

        <nav aria-label="Main Navigation" className='hidden gap-6 text-sm text-gray-700 sm:flex'>
          <NavLink 
            to='/' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-[#587a3b] font-semibold' : 'hover:text-[#587a3b]'}`
            }
          >
            <p>HOME</p>
            <hr className='hidden h-[2px] w-2/4 border-none bg-[#587a3b]' />
          </NavLink>
          <NavLink 
            to='/collection' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-[#587a3b] font-semibold' : 'hover:text-[#587a3b]'}`
            }
          >
            <p>COLLECTION</p>
            <hr className='hidden h-[2px] w-2/4 border-none bg-[#587a3b]' />
          </NavLink>
          <NavLink 
            to='/about' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-[#587a3b] font-semibold' : 'hover:text-[#587a3b]'}`
            }
          >
            <p>ABOUT</p>
            <hr className='hidden h-[2px] w-2/4 border-none bg-[#587a3b]' />
          </NavLink>
          <NavLink 
            to='/blog' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-[#587a3b] font-semibold' : 'hover:text-[#587a3b]'}`
            }
          >
            <p>BLOG</p>
            <hr className='hidden h-[2px] w-2/4 border-none bg-[#587a3b]' />
          </NavLink>
          <NavLink 
            to='/contact' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-[#587a3b] font-semibold' : 'hover:text-[#587a3b]'}`
            }
          >
            <p>CONTACT</p>
            <hr className='hidden h-[2px] w-2/4 border-none bg-[#587a3b]' />
          </NavLink>
        </nav>
        
        <div className='flex items-center gap-6'>
          {/* Orders Icon - Always visible */}
          <div className="relative cursor-pointer group" onClick={() => navigate('/orders')} title="Orders">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-800 group-hover:text-[#587a3b] transition-colors duration-200 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          
          <div className='group relative'>
            <div onClick={()=> token ? null: navigate('/login') } className="cursor-pointer" title="Account">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-800 group-hover:text-[#587a3b] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {token && (
              <div className='absolute right-0 z-10 hidden pt-4 group-hover:block'>
                <div className='flex w-36 flex-col gap-2 rounded bg-slate-100 px-5 py-3 text-gray-600 shadow-md'>
                  <p onClick={logout} className="cursor-pointer hover:text-[#587a3b] transition-colors">Logout</p>
                </div>
              </div>
            )}   
          </div>
          <Link to='/cart' className='relative group' title="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-800 group-hover:text-[#587a3b] transition-colors duration-200 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className='cart-badge absolute bottom-[-5px] right-[-5px] aspect-square w-4 rounded-full bg-[#587a3b] text-center text-[8px] leading-4 text-white font-bold'>{getCartCount()}</p>
          </Link>
          <div onClick={()=>setVisible(true)} className="cursor-pointer sm:hidden" title="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-800 hover:text-[#587a3b] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        </div>
        
        {/* Mobile menu - Fixed */}
        <div className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out ${visible ? "translate-x-0" : "translate-x-full"}`}>
          <div className='flex h-full flex-col'>
            <div onClick={()=>setVisible(false)} className='flex items-center gap-4 border-b p-4 cursor-pointer text-gray-700 hover:text-[#587a3b] transition-colors'>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="font-semibold text-sm">Close</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLink 
                to='/' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 transition-colors ${isActive ? 'text-[#587a3b] bg-olive-50/60 font-semibold' : 'text-gray-600 hover:text-[#587a3b] hover:bg-gray-50'}`
                }
              >
                HOME
              </NavLink>
              <NavLink 
                to='/collection' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 transition-colors ${isActive ? 'text-[#587a3b] bg-olive-50/60 font-semibold' : 'text-gray-600 hover:text-[#587a3b] hover:bg-gray-50'}`
                }
              >
                COLLECTION
              </NavLink>
              <NavLink 
                to='/about' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 transition-colors ${isActive ? 'text-[#587a3b] bg-olive-50/60 font-semibold' : 'text-gray-600 hover:text-[#587a3b] hover:bg-gray-50'}`
                }
              >
                ABOUT
              </NavLink>
              <NavLink 
                to='/blog' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 transition-colors ${isActive ? 'text-[#587a3b] bg-olive-50/60 font-semibold' : 'text-gray-600 hover:text-[#587a3b] hover:bg-gray-50'}`
                }
              >
                BLOG
              </NavLink>
              <NavLink 
                to='/contact' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 transition-colors ${isActive ? 'text-[#587a3b] bg-olive-50/60 font-semibold' : 'text-gray-600 hover:text-[#587a3b] hover:bg-gray-50'}`
                }
              >
                CONTACT
              </NavLink>
              {/* Add Orders link to mobile menu too */}
              <div 
                onClick={() => {
                  navigate('/orders');
                  handleMobileNavClick();
                }}
                className="block border-b py-4 pl-6 text-gray-600 cursor-pointer hover:text-[#587a3b] hover:bg-gray-50 transition-colors"
              >
                ORDERS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar