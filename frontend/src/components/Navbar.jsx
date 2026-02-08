import {useContext, useState, useEffect} from 'react'
import { assets } from '../assets/assets'
import {Link, NavLink } from 'react-router-dom'
import {ShopContext} from '../context/ShopContext'
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

// Import directly from environment variables
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const [visible, setVisible] = useState(false)
  const [websiteLogo, setWebsiteLogo] = useState("")
  const [loading, setLoading] = useState(false) // Start with false to avoid blocking render
  const {getCartCount,token,setToken,setCartItems} = useContext(ShopContext)
  const navigate = useNavigate(); 

  // Fetch website logo from backend - with better error handling
  useEffect(() => {
    const fetchWebsiteLogo = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`${backendUrl}/api/business-details`, {
          timeout: 5000 // 5 second timeout
        });
        
        if (response.data.success && response.data.data?.logos?.website?.url) {
          setWebsiteLogo(response.data.data.logos.website.url);
        } else {
          setWebsiteLogo("");
        }
      } catch (error) {
        setWebsiteLogo("");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if backendUrl is available
    if (backendUrl) {
      fetchWebsiteLogo();
    } else {
      setLoading(false);
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

  // Simple logo display - always show something
  const LogoDisplay = () => {
    // If we have a website logo and not loading, use it
    if (!loading && websiteLogo) {
      return (
        <img 
          src={websiteLogo} 
          alt="Website Logo" 
          className='w-14 sm:w-20 object-contain'
          onError={(e) => {
            // Show asset logo if website logo fails
            e.target.src = assets.logo;
          }}
        />
      );
    }

    return (
      <img src={assets.logo} className='w-20 object-contain' alt="Logo" />
    );
  };

  return (
    <div className="sticky top-0 z-50 bg-white">
      <div className="flex items-center justify-between py-1 font-medium">
        <Link to='/'><LogoDisplay /></Link>

        <ul className='hidden gap-5 text-sm text-gray-700 sm:flex'>
          <NavLink 
            to='/' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
            }
          >
            <p>HOME</p>
            <hr className='hidden h-[1.5px] w-2/4 border-none bg-gray-700' />
          </NavLink>
          <NavLink 
            to='/collection' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
            }
          >
            <p>COLLECTION</p>
            <hr className='hidden h-[1.5px] w-2/4 border-none bg-gray-700' />
          </NavLink>
          <NavLink 
            to='/about' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
            }
          >
            <p>ABOUT</p>
            <hr className='hidden h-[1.5px] w-2/4 border-none bg-gray-700' />
          </NavLink>
          <NavLink 
            to='/blog' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
            }
          >
            <p>BLOG</p>
            <hr className='hidden h-[1.5px] w-2/4 border-none bg-gray-700' />
          </NavLink>
          <NavLink 
            to='/contact' 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
            }
          >
            <p>CONTACT</p>
            <hr className='hidden h-[1.5px] w-2/4 border-none bg-gray-700' />
          </NavLink>
        </ul>
        
        <div className='flex items-center gap-6'>
          {/* Search icon removed */}
          
          {/* Orders Icon - Always visible */}
          <div className="relative cursor-pointer" onClick={() => navigate('/orders')}>
            <img src={assets.order_icon} className="w-5 h-5 cursor-pointer" alt="Orders" />
          </div>
          
          <div className='group relative'>
            <img onClick={()=> token ? null: navigate('/login') } src={assets.profile_icon} className='w-5 cursor-pointer' alt="Profile Icon" />
            {token && (
              <div className='absolute right-0 z-10 hidden pt-4 group-hover:block'>
                <div className='flex w-36 flex-col gap-2 rounded bg-slate-100 px-5 py-3 text-gray-500'>
                  <p onClick={logout} className="cursor-pointer hover:text-black">Logout</p>
                </div>
              </div>
            )}   
          </div>
          <Link to='/cart' className='relative'>
            <img src={assets.cart_icon} className='w-5 min-w-5 cursor-pointer' alt="Cart"/>
            <p className='absolute bottom-[-5px] right-[-5px] aspect-square w-4 rounded-full bg-black text-center text-[8px] leading-4 text-white'>{getCartCount()}</p>
          </Link>
          <img onClick={()=>setVisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer sm:hidden' alt="" />
        </div>
        
        {/* Mobile menu - Fixed */}
        <div className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out ${visible ? "translate-x-0" : "translate-x-full"}`}>
          <div className='flex h-full flex-col'>
            <div onClick={()=>setVisible(false)} className='flex items-center gap-4 border-b p-4 cursor-pointer'>
              <img className="h-5 rotate-180" src={assets.dropdown_icon} alt="Close menu" />
              <p>Close</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLink 
                to='/' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 ${isActive ? 'text-black bg-gray-50' : 'text-gray-600'}`
                }
              >
                HOME
              </NavLink>
              <NavLink 
                to='/collection' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 ${isActive ? 'text-black bg-gray-50' : 'text-gray-600'}`
                }
              >
                COLLECTION
              </NavLink>
              <NavLink 
                to='/about' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 ${isActive ? 'text-black bg-gray-50' : 'text-gray-600'}`
                }
              >
                ABOUT
              </NavLink>
              <NavLink 
                to='/blog' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 ${isActive ? 'text-black bg-gray-50' : 'text-gray-600'}`
                }
              >
                BLOG
              </NavLink>
              <NavLink 
                to='/contact' 
                onClick={handleMobileNavClick}
                className={({ isActive }) => 
                  `block border-b py-4 pl-6 ${isActive ? 'text-black bg-gray-50' : 'text-gray-600'}`
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
                className="block border-b py-4 pl-6 text-gray-600 cursor-pointer hover:text-black hover:bg-gray-50"
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