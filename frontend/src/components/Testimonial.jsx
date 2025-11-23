import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { FaStar } from 'react-icons/fa'; 
import { useRef, useState, useEffect } from "react";
import Title from '../components/Title';


const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const Testimonial = () => {
    const sliderRef = useRef(null);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch approved testimonials from backend
    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/testimonials`);
            if (!response.ok) throw new Error('Failed to fetch testimonials');
            const data = await response.json();
            
            // Filter only approved testimonials
            const approvedTestimonials = data.filter(testimonial => testimonial.status === 'approved');
            setTestimonials(approvedTestimonials);
        } catch (error) {
            setError('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    // Load testimonials on component mount
    useEffect(() => {
        fetchTestimonials();
    }, []);

    const sliderSettings = {
        dots: true,
        infinite: testimonials.length > 1,
        speed: 600,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: testimonials.length > 1,
        autoplaySpeed: 5000,
        arrows: false,
        customPaging: () => (
            <div className="size-3 rounded-full bg-gray-300 transition-all duration-300 hover:bg-black"></div>
        ),
        dotsClass: "slick-dots flex justify-center gap-2 mt-4",
    };

    // Get platform label for display
    const getPlatformLabel = (platform) => {
        const labels = {
            website: 'Website',
            email: 'Email',
            facebook: 'Facebook',
            instagram: 'Instagram',
            tiktok: 'TikTok',
            whatsapp: 'WhatsApp'
        };
        return labels[platform] || 'Website';
    };

    if (loading) {
        return (
            <div className="relative my-10 px-4 md:px-20 lg:px-40">
                <div className="text-center text-2xl">
                    <Title text1={'CUSTOMER'} text2={'TESTIMONIALS'} />
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative my-10 px-4 md:px-20 lg:px-40">
                <div className="text-center text-2xl">
                    <Title text1={'CUSTOMER'} text2={'TESTIMONIALS'} />
                </div>
                <div className="text-center py-12">
                    <p className="text-red-600">Error: {error}</p>
                    <button 
                        onClick={fetchTestimonials}
                        className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition duration-300"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (testimonials.length === 0) {
        return (
            <div className="relative my-10 px-4 md:px-20 lg:px-40">
                <div className="text-center text-2xl">
                    <Title text1={'CUSTOMER'} text2={'TESTIMONIALS'} />
                </div>
                <div className="text-center py-12">
                    <p className="text-gray-600">No testimonials available yet.</p>
                    <p className="text-gray-500 text-sm mt-2">Check back later for customer reviews!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative my-10 px-4 md:px-20 lg:px-40">
            <div className="text-center text-2xl">
                <Title text1={'CUSTOMER'} text2={'TESTIMONIALS'} />
            </div>

            {/* Navigation Buttons */}
            {testimonials.length > 1 && (
                <>
                    <button 
                        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-200 p-3 shadow-md transition duration-300 hover:bg-black"
                        onClick={() => sliderRef.current.slickPrev()}
                    >
                        <IoIosArrowBack size={24} className="text-gray-700 hover:text-white" />
                    </button>

                    <button 
                        className="z-50 absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-gray-200 p-3 shadow-md transition duration-300 hover:bg-black"
                        onClick={() => sliderRef.current.slickNext()}
                    >
                        <IoIosArrowForward size={24} className="text-gray-700 hover:text-white" />
                    </button>
                </>
            )}

            <Slider ref={sliderRef} {...sliderSettings}>
                {testimonials.map((testimonial, index) => (
                    <div key={testimonial._id || index} className="flex items-center justify-center">
                        <div className="max-w-3xl rounded-lg bg-white p-8 text-center transition duration-300 hover:scale-105">
                            <p className="text-xl font-semibold text-gray-700">"{testimonial.content}"</p>
                            <p className="mt-4 text-sm font-medium text-gray-600">
                                - {testimonial.name}, via {getPlatformLabel(testimonial.platform)}
                            </p>
                            <div className="mt-2 flex justify-center">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <FaStar key={i} className="size-5 text-yellow-500" />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
}

export default Testimonial;
