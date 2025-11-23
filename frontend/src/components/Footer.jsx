import { Link } from "react-router-dom"
import { assets } from "../assets/assets"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { 
  faFacebookF, 
  faInstagram, 
  faWhatsapp, 
  faTiktok,
} from "@fortawesome/free-brands-svg-icons"
import { 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons"
import { useState, useEffect } from "react"
import axios from "axios"

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Footer = () => {
    const [businessInfo, setBusinessInfo] = useState({
        company: {
            name: "Natura Bliss",
            description: "Handmade organic skincare crafted from pure, natural ingredients — gentle on your skin and kind to the planet.",
            foundedYear: 2024
        },
        contact: {
            customerSupport: {
                email: "naturabliss@gmail.com",
                phone: "+92-333-3333",
                
            }
        },
        location: {
            displayAddress: "123 Natural Street, Green Valley, PK",
            googleMapsLink: ""
        },
        socialMedia: {
            facebook: "",
            instagram: "",
            tiktok: "",
            whatsapp: ""
        },
        logos: {
            website: { url: "" }
        }
    })
    const [loading, setLoading] = useState(true)

    // Fetch business details from backend
    useEffect(() => {
        const fetchBusinessDetails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/business-details`)
                
                if (response.data.success && response.data.data) {
                    setBusinessInfo(response.data.data)
                }
            } catch (error) {
                // Error handling without console output
            } finally {
                setLoading(false)
            }
        }

        if (backendUrl) {
            fetchBusinessDetails()
        } else {
            setLoading(false)
        }
    }, [])

    // Social media platforms with their icons and data
    const socialPlatforms = [
        { 
            key: 'facebook', 
            icon: faFacebookF, 
            color: "bg-black hover:bg-gray-900",
            label: "Facebook",
            baseUrl: "https://facebook.com/"
        },
        { 
            key: 'instagram', 
            icon: faInstagram, 
            color: "bg-black hover:bg-gray-900",
            label: "Instagram",
            baseUrl: "https://instagram.com/"
        },
        { 
            key: 'tiktok', 
            icon: faTiktok, 
        color: "bg-black hover:bg-gray-900",
            label: "TikTok",
            baseUrl: "https://tiktok.com/@"
        },
        { 
            key: 'whatsapp', 
            icon: faWhatsapp, 
            color: "bg-black hover:bg-gray-900",
            label: "WhatsApp",
            baseUrl: "https://wa.me/"
        }
    ]

    // Get current year for copyright
    const currentYear = new Date().getFullYear()
    const copyrightText = `© ${currentYear} ${businessInfo.company?.name || 'Natura Bliss'}. All rights reserved.`
       
    // Logo display component
    const LogoDisplay = () => {
        if (businessInfo.logos?.website?.url) {
            return (
                <img 
                    src={businessInfo.logos.website.url} 
                    alt={`${businessInfo.company?.name || 'Natura Bliss'} Logo`} 
                    className="w-20 mb-4 object-contain"
                    onError={(e) => {
                        e.target.src = assets.logo
                    }}
                />
            )
        }
        
        return (
            <img src={assets.logo} className="w-20 mb-4" alt="Natura Bliss Logo" />
        )
    }

    if (loading) {
        return (
            <footer className="border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-16">
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                            {[...Array(4)].map((_, i) => (
                                <div key={i}>
                                    <div className="h-6 bg-gray-300 rounded mb-4 w-32"></div>
                                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        )
    }

    return (
        <footer className="mt-10 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* 4 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    
                    {/* Column 1: Brand */}
                    <div>
                        <LogoDisplay />
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {businessInfo.company?.description || "Handmade organic skincare crafted from pure, natural ingredients — gentle on your skin and kind to the planet."}
                        </p>
                    </div>

                    {/* Column 2: Company Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">COMPANY</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li><Link to="/about" className="hover:text-gray-300 transition-colors">ABOUT</Link></li>
                            <li><Link to="/collection" className="hover:text-gray-300 transition-colors">PRODUCTS</Link></li>
                            <li><Link to="/blog" className="hover:text-gray-300 transition-colors">BLOGS</Link></li>
                            <li><Link to="/contact" className="hover:text-gray-300 transition-colors">CONTACT</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Contact */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">CONTACT</h3>
                        <div className="space-y-3 text-gray-600 text-sm">
                            <div className="flex items-center space-x-2">
                                <FontAwesomeIcon icon={faPhone} className="text-black w-4" />
                                <span>{businessInfo.contact?.customerSupport?.phone || "+92-333-3333"}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FontAwesomeIcon icon={faEnvelope} className="text-black w-4" />
                                <span>{businessInfo.contact?.customerSupport?.email || "naturabliss@gmail.com"}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-black w-4 mt-1" />
                                <span>{businessInfo.location?.displayAddress || "123 Natural Street, Green Valley, PK"}</span>
                            </div>
                          
                        </div>
                    </div>

                    {/* Column 4: Social Media */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">FOLLOW US</h3>
                        <div className="flex space-x-3">
                            {socialPlatforms.map((platform) => {
                                const socialUrl = businessInfo.socialMedia?.[platform.key]
                                const isActive = !!socialUrl
                                
                                return (
                                    <a
                                        key={platform.key}
                                        href={isActive ? socialUrl : "#"}
                                        target={isActive ? "_blank" : "_self"}
                                        rel={isActive ? "noopener noreferrer" : ""}
                                        className={`w-10 h-10 rounded-full ${isActive ? platform.color : "bg-gray-400 cursor-not-allowed"} text-white flex items-center justify-center transition-all hover:scale-110`}
                                        aria-label={platform.label}
                                        title={isActive ? `Follow us on ${platform.label}` : `${platform.label} link not set`}
                                        onClick={!isActive ? (e) => e.preventDefault() : undefined}
                                    >
                                        <FontAwesomeIcon icon={platform.icon} size="sm" />
                                    </a>
                                )
                            })}
                        </div>
                        
                        {/* Social Media Status */}
                        <div className="mt-4 text-xs text-gray-500">
                            <p>
                                {Object.values(businessInfo.socialMedia || {}).filter(url => url).length > 0 
                                    ? "Follow us for updates and promotions" 
                                    : "Social links coming soon"
                                }
                            </p>
                        </div>
                    </div>

                </div>

                {/* Bottom Footer */}
                <div className="border-t border-gray-200 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                        <p className="text-gray-600 text-sm">
                            {copyrightText}
                        </p>
                        <div className="text-gray-500 text-sm">
                            Developed by <Link to='https://jawumitech.com/' className="text-gray-700 hover:text-gray-500">JawumiTech</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer