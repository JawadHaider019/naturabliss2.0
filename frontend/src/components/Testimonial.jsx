import React, { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaStar, FaQuoteLeft, FaTiktok, FaInstagram, FaFacebook, FaWhatsapp, FaGlobe } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import Title from '../components/Title';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const Testimonial = () => {
    const sliderRef = useRef(null);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSlide, setActiveSlide] = useState(0);

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
        } catch (err) {
            console.error('Error fetching testimonials:', err);
            setError('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const sliderSettings = {
        dots: false,
        infinite: testimonials.length > 1,
        speed: 600,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: testimonials.length > 1,
        autoplaySpeed: 6000,
        arrows: false,
        beforeChange: (current, next) => setActiveSlide(next),
    };

    const getPlatformInfo = (platform) => {
        switch (platform?.toLowerCase()) {
            case 'tiktok':
                return { label: 'TikTok', icon: <FaTiktok className="text-black text-xs" />, bg: 'bg-neutral-100 text-neutral-800' };
            case 'instagram':
                return { label: 'Instagram', icon: <FaInstagram className="text-pink-600 text-xs" />, bg: 'bg-pink-50 text-pink-700' };
            case 'facebook':
                return { label: 'Facebook', icon: <FaFacebook className="text-blue-600 text-xs" />, bg: 'bg-blue-50 text-blue-700' };
            case 'whatsapp':
                return { label: 'WhatsApp', icon: <FaWhatsapp className="text-green-600 text-xs" />, bg: 'bg-green-50 text-green-700' };
            default:
                return { label: 'Verified Buyer', icon: <FaGlobe className="text-emerald-600 text-xs" />, bg: 'bg-emerald-50 text-emerald-800' };
        }
    };

    if (loading) {
        return (
            <div className="relative my-14 px-4 sm:px-10 lg:px-20 max-w-6xl mx-auto">
                <div className="py-2 text-center text-2xl md:text-3xl mb-8">
                    <Title text1={'CUSTOMER'} text2={'TESTIMONIALS'} />
                </div>
                <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent"></div>
                </div>
            </div>
        );
    }

    if (error || testimonials.length === 0) {
        return null;
    }

    return (
        <section className="relative my-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
            {/* Header Title */}
            <div className="py-2 text-center text-2xl md:text-3xl mb-8">
                <Title text1={'CUSTOMER'} text2={'TESTIMONIALS'} />
                <p className="text-[14px] md:text-[16px] text-gray-600 font-light px-4 max-w-2xl mx-auto">
                    Discover genuine stories and experiences shared by our valued customers.
                </p>
            </div>

            {/* Testimonial Card Container */}
            <div className="relative group">
                {/* Navigation Buttons */}
                {testimonials.length > 1 && (
                    <>
                        <button
                            aria-label="Previous Testimonial"
                            onClick={() => sliderRef.current?.slickPrev()}
                            className="absolute -left-2 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:text-white hover:bg-[#587a3b] hover:border-[#587a3b] transition-all duration-300 active:scale-95"
                        >
                            <IoIosArrowBack size={20} className="relative right-0.5" />
                        </button>

                        <button
                            aria-label="Next Testimonial"
                            onClick={() => sliderRef.current?.slickNext()}
                            className="absolute -right-2 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:text-white hover:bg-[#587a3b] hover:border-[#587a3b] transition-all duration-300 active:scale-95"
                        >
                            <IoIosArrowForward size={20} className="relative left-0.5" />
                        </button>
                    </>
                )}

                {/* Slider */}
                <div className="rounded-3xl bg-gradient-to-b from-white  to-neutral-50  shadow-sm p-6 sm:p-12 md:p-14 relative overflow-hidden">
                    {/* Background Decorative Quote Mark */}
                    <FaQuoteLeft className="absolute top-4 left-6  sm:top-8 sm:left-10 text-[#587a3b]/60 text-6xl sm:text-8xl select-none pointer-events-none z-10 opacity-80" />

                    <Slider ref={sliderRef} {...sliderSettings}>
                        {testimonials.map((testimonial, index) => {
                            const platform = getPlatformInfo(testimonial.platform);
                            const ratingCount = Math.min(5, Math.max(1, Number(testimonial.rating) || 5));

                            return (
                                <div key={testimonial._id || index} className="outline-none">
                                    <div className="max-w-3xl mx-auto text-center pt-10 flex flex-col items-center justify-center relative z-10 px-2 sm:px-6">

                                        {/* 5-Star Rating */}
                                        <div className="flex items-center gap-1.5 mb-5">
                                            {[...Array(ratingCount)].map((_, i) => (
                                                <FaStar key={i} className="text-amber-400 text-base sm:text-lg drop-shadow-sm" />
                                            ))}
                                        </div>

                                        {/* Quote Text */}
                                        <p className="text-base sm:text-xl md:text-2xl font-normal text-gray-800 leading-relaxed sm:leading-loose tracking-wide italic">
                                            "{testimonial.content}"
                                        </p>

                                        {/* Author and Platform info */}
                                        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                            <span className="font-semibold text-gray-900 text-sm sm:text-base tracking-wide">
                                                {testimonial.name || 'Anonymous Customer'}
                                            </span>
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-gray-100 ${platform.bg}`}>
                                                {platform.icon}
                                                <span>{platform.label}</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </Slider>
                </div>

                {/* Custom Pagination Indicator Dots */}
                {testimonials.length > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                        {testimonials.map((_, idx) => (
                            <button
                                key={idx}
                                aria-label={`Go to slide ${idx + 1}`}
                                onClick={() => sliderRef.current?.slickGoTo(idx)}
                                className={`transition-all duration-300 rounded-full ${activeSlide === idx
                                    ? 'w-7 h-2 bg-[#587a3b]'
                                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Testimonial;
