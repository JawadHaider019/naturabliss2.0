import Title from '../components/Title';
import { assets } from '../assets/assets';
import { FaLeaf, FaHands, FaShieldAlt, FaRecycle, FaQuoteLeft, FaSeedling, FaHeart, FaEye } from 'react-icons/fa'; 
import Testimonial from '../components/Testimonial';
import NewsletterBox from '../components/NewsletterBox';
import { useState, useEffect } from 'react';

const About = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // Fetch team members from backend API
  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch(`${backendUrl}/api/teams`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const activeMembers = data.data
          .filter(member => member.isActive !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setTeamMembers(activeMembers);
      } else {
        throw new Error(data.message || 'Failed to fetch team members');
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err.message);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return (
    <div className="border-t pt-14">
      {/* Magazine Cover Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
        <img
          className="w-full h-[70vh] object-cover"
          src={assets.about_img}
          alt="Natura Bliss - Pakistan's First All-Natural Personal Care Brand"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white px-4">
          <h1 className="text-oswald  lg:text-8xl text-7xl font-serif font-bold mb-6 tracking-tight">
            NATURA <span className="text-oswald text-holo">BLISS</span>
          </h1>
          <p className="text-xl md:text-2xl font-light max-w-3xl leading-relaxed">
            "Jahan Khusboo Hai Kudrat Ki" - Where Nature's Fragrance Lives
          </p>
          <div className="w-24 h-1 bg-white mt-8"></div>
        </div>
      </div>

      {/* Editorial Introduction */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-block border-b-2 border-green-700 pb-2 mb-8">
            <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Featured Story</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
            The Story Behind Pakistan's All Natural Personal Care Brand
          </h2>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 mb-8">
            <span>FEATURE</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>ORGANIC SKINCARE</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>NATURAL BEAUTY</span>
          </div>
        </div>

        {/* Main Editorial Content */}
        <div className="prose prose-lg max-w-none">
          {/* Opening Paragraph with Drop Cap */}
          <div className="flex mb-8">
            <div className="text-6xl md:text-7xl font-serif font-bold text-green-700 float-left mr-4 mt-2 leading-none">F</div>
            <p className="text-gray-700 text-lg leading-relaxed">
              or years, we searched for personal care products that were truly natural — soaps, shampoos, and creams that were free from harsh chemicals and gentle enough for daily use. But every time we read the ingredients behind so-called "organic" and "gentle" products, the truth was disappointing — artificial fragrances, preservatives, and harsh synthetics hiding behind beautiful labels.
            </p>
          </div>

          {/* Pull Quote */}
          <div className="my-12 p-8 bg-gray-100 border-l-4 border-green-500">
            <FaQuoteLeft className="text-green-400 text-2xl mb-4" />
            <p className="text-gray-700 italic text-xl leading-relaxed font-light">
              "We knew there had to be a better way — something real, pure, and honest. So, we began to experiment."
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed mb-8">
            From <strong>charcoal for detox</strong> and <strong>neem for cleansing</strong>, to <strong>coconut oil for nourishment</strong> and <strong>herbal extracts for healing</strong>, we tested, failed, and tried again — until we discovered the perfect balance between nature and care.
          </p>

          <div className="grid md:grid-cols-2 gap-12 my-16">
            <div>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6 pb-3 border-b">Our Founding Belief</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                And that's how <strong>Natura Bliss</strong> was born — not from a business plan, but from a belief:
                <br />
                <em className="text-green-700">"Logo ko harmful chemicals se bachana aur unhe wapas kudrat ke qarib lana."</em>
              </p>
              <p className="text-gray-700 leading-relaxed">
                Today, <strong>Natura Bliss</strong> stands proudly as <strong>Pakistan's first all-natural personal care brand</strong>, creating <strong>pure, handcrafted, and chemical-free</strong> products designed to nourish, protect, and enhance your skin, hair, and overall well-being.
              </p>
            </div>
            <div className="bg-gray-100 p-8 border border-green-200">
              <FaQuoteLeft className="text-green-400 text-3xl mb-4" />
              <p className="text-gray-700 italic text-lg leading-relaxed">
                "What nature creates is what's best for humanity. Your skin's best friend is nature — and we're just the messenger helping you reconnect."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Philosophy - Magazine Feature */}
      <div className="bg-gray-50 py-20 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
             <div className="text-center text-3xl">
                <Title text1={'OUR'} text2={'PHILOSOPHY'} />
            </div>
          
            <p className="text-gray-600 max-w-2xl mx-auto">Real beauty comes from purity — not perfection</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                At Natura Bliss, we believe that real beauty comes from purity — not perfection. Every soap, cream, and oil is made by hand, with love and care, using 100% organic, naturally derived ingredients.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                Each formula carries nature's strength — <strong>amla, neem, aloe vera, rice, coconut oil, and essential oils</strong> — chosen for their healing power and timeless effectiveness.
              </p>
              <blockquote className="text-xl font-serif text-gray-800 italic leading-relaxed border-l-4 border-green-500 pl-6 py-4">
                "Jo cheez nature ne banai hai, wo hi insaan ke liye behtareen hai."
              </blockquote>
              <p className="text-gray-700 leading-relaxed mt-6">
                Our products aren't luxury items — they're a way of life. A reminder that what's natural will always be best for you.
              </p>
            </div>
            <div className="relative">
              <img
                src={assets.about_img3}
                alt="Natura Bliss Natural Ingredients"
                className="w-full h-96 object-cover border border-gray-200"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 border border-gray-200 max-w-xs">
                <p className="text-sm text-gray-600 italic">
                  "Handmade with love, powered by nature's purest ingredients"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Mission Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6">
         <div className="text-center text-3xl">
                <Title text1={'OUR'} text2={'MISSION'} />
            </div>
          
          <div className="bg-white p-8  text-center">
            <p className="text-gray-700 text-xl leading-relaxed font-light italic">
              To create pure, handmade, and sustainable personal care products that protect your skin, respect the planet, and bring you closer to the essence of nature.
            </p>
          </div>
        </div>
      </div>

      {/* Our Promise - Magazine Feature */}
      <div className="bg-white py-20 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-center text-3xl">
                <Title text1={'OUR'} text2={'PROMISE'} />
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">Our commitment to purity, transparency, and your wellbeing</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <FaShieldAlt className="text-green-700 text-2xl" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Chemical-Free by Design</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                No parabens, sulfates, silicones, or artificial colors.
              </p>
            </div>

            <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <FaSeedling className="text-green-700 text-2xl" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Certified Organic</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Made from plant-based, eco-friendly ingredients.
              </p>
            </div>

            <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <FaRecycle className="text-green-700 text-2xl" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Sustainable & Honest</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Eco-conscious packaging and ethical sourcing.
              </p>
            </div>

            <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <FaEye className="text-green-700 text-2xl" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Transparency Always</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                You deserve to know what touches your skin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Movement Section - Full Width Banner */}
      <div className="bg-green-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8">A Movement Toward Clean Beauty</h2>
          <p className="text-xl leading-relaxed mb-8 opacity-90 max-w-3xl mx-auto">
            Natura Bliss isn't just a brand — it's a movement. A movement for clean, honest, and effective self-care. When you choose Natura Bliss, you choose to protect your body, cherish the planet, and celebrate beauty in its truest, most natural form.
          </p>
          <div className="w-24 h-1 bg-green-300 mx-auto mb-8"></div>
          <p className="text-2xl opacity-90 font-light">
            Welcome to a world where nature takes care of you. 🌿✨
          </p>
        </div>
      </div>

    {/* Why Choose Us - Magazine Feature */}
<div className=" py-20 border-y border-gray-200">
  <div className="max-w-6xl mx-auto px-6">
    <div className="text-center mb-16">
      <div className="text-center text-3xl">
        <Title text1={'WHY CHOOSE'} text2={'NATURA BLISS'} />
      </div>
      <p className="text-gray-600 max-w-2xl mx-auto">Experience the difference of truly natural personal care</p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
          <FaLeaf className="text-green-700 text-2xl" />
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">100% Natural Ingredients</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Pure, organic ingredients free from harsh chemicals and artificial additives.
        </p>
      </div>

      <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
          <FaHands className="text-orange-500 text-2xl" />
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Handmade with Care</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Each product carefully crafted by hand with love and attention to detail.
        </p>
      </div>

      <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
          <FaShieldAlt className="text-blue-500 text-2xl" />
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Safe for All Skin</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Gentle formulas suitable for all skin types, including sensitive skin.
        </p>
      </div>

      <div className="bg-white p-8 border border-gray-200 text-center group hover:border-green-300 transition-colors">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
          <FaHeart className="text-purple-500 text-2xl" />
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">Visible Results</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Experience the transformative power of nature with noticeable benefits.
        </p>
      </div>
    </div>
  </div>
</div>

      {/* Meet the Team - Magazine Style */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block border-b-2 border-gray-300 pb-2 mb-4">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">The People Behind</span>
            </div>
              <div className="text-center text-3xl">
                <Title text1={'MEET'} text2={'OUR TEAM'} />
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">The passionate individuals dedicated to bringing you nature's purest offerings</p>
          </div>

          {error && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200">
                <span className="text-red-600 text-sm">Unable to load team members: {error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white border border-gray-200 animate-pulse">
                  <div className="h-80 w-full bg-gray-300"></div>
                  <div className="p-6 border-t border-gray-100">
                    <div className="h-7 bg-gray-300 mb-3"></div>
                    <div className="h-5 bg-gray-300 mb-4 w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300"></div>
                      <div className="h-3 bg-gray-300"></div>
                      <div className="h-3 bg-gray-300 w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : teamMembers.length === 0 ? (
              <div className="col-span-full text-center py-16 border border-gray-200 bg-gray-50">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Team Members Yet</h3>
                <p className="text-gray-500">Our amazing team information will be displayed here soon.</p>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div key={member._id} className="bg-white border border-gray-200 group hover:shadow-lg transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                      src={member.image?.url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}
                      alt={member.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
                      }}
                    />
                  </div>
                  <div className="p-6 border-t border-gray-100 text-center">
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">{member.name}</h3>
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-green-700 uppercase tracking-wide border-b border-green-200 pb-1">
                        {member.role}
                      </span>
                    </div>
                    {member.description && (
                      <p className="text-gray-600 text-sm leading-relaxed font-light">
                        {member.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Closing Signature */}
      <div className="max-w-2xl mx-auto px-6 py-16 text-center border-t border-gray-200">
        <p className="text-gray-600 text-lg mb-8">Thank you for trusting us. Here's to skin that feels great, looks radiant and lives naturally.</p>
        <div className="border-t border-gray-200 pt-8">
          <p className="text-gray-900 font-serif text-xl font-bold">With gratitude,</p>
          <p className="text-gray-600">The Natura Bliss Team</p>
        </div>
      </div>

      <Testimonial />
      <NewsletterBox />
    </div>
  );
};

export default About;