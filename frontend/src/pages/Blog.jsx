import { Link } from "react-router-dom";
import Title from "../components/Title";
import { FaCalendarAlt, FaArrowRight, FaUser, FaClock, FaTag, FaFire } from "react-icons/fa";
import { useState, useEffect } from "react";
import Loader from "../components/Loader";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch blogs from your backend API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/api/blogs?status=published`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blogs: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setBlogs(result.data || []);
        } else {
          throw new Error(result.message || 'Failed to fetch blogs');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (backendUrl) {
      fetchBlogs();
    } else {
      setError('Backend URL not configured');
      setLoading(false);
    }
  }, [backendUrl]);

  // Show loader while page is loading
  if (loading) {
    return <Loader />;
  }

  // Separate featured and regular blogs
  const featuredBlogs = blogs.filter(blog => blog.featured && blog.status === 'published');
  const regularBlogs = blogs.filter(blog => !blog.featured && blog.status === 'published');

  // Get latest 3 featured blogs for the hero section
  const heroFeatured = featuredBlogs.slice(0, 3);
  // Get remaining featured blogs
  const remainingFeatured = featuredBlogs.slice(3);
  // Get regular blogs for different sections
  const latestBlogs = regularBlogs.slice(0, 6);
  const trendingBlogs = regularBlogs.slice(6, 12);

  if (error) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200   p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Articles</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white   hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-3xl">
            <Title text1={"SKINCARE"} text2={"JOURNAL"} />
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Expert tips, natural ingredient insights, and holistic beauty wisdom for radiant, healthy skin
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section - Magazine Style */}
      {heroFeatured.length > 0 && (
        <section className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaFire className="text-black" />
                Featured Guides
              </h2>
              <div className="text-sm text-gray-100 bg-red-600 px-3 py-1 rounded-full">
                Must Read
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {heroFeatured.map((blog, index) => (
                <HeroStory key={blog._id} blog={blog} isMain={index === 0} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3">
            {/* Latest Articles Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-black pl-3">
                  Latest Articles
                </h2>
              
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {latestBlogs.map((blog, index) => (
                  <NewsCard key={blog._id} blog={blog} featured={index < 2} />
                ))}
              </div>

              {latestBlogs.length === 0 && (
                <div className="text-center py-12 bg-gray-50   border-2 border-dashed border-gray-300">
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No articles yet</h3>
                  <p className="text-gray-500">Check back later for new skincare insights.</p>
                </div>
              )}
            </section>

            {/* More Featured Stories */}
            {remainingFeatured.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-black pl-3">
                  Expert's Choice
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {remainingFeatured.map(blog => (
                    <FeaturedCard key={blog._id} blog={blog} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            {/* Trending Articles */}
            {trendingBlogs.length > 0 && (
              <div className="bg-black/10   p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaFire className="text-green-600" />
                  Trending Now
                </h3>
                <div className="space-y-4">
                  {trendingBlogs.slice(0, 5).map((blog, index) => (
                    <TrendingStory key={blog._id} blog={blog} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="bg-white border border-gray-200   p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Skin Concerns</h3>
              <div className="space-y-2">
                {Array.from(new Set(blogs.flatMap(blog => blog.category || []))).slice(0, 8).map(category => (
                  <div
                    key={category}
                    className="flex items-center justify-between py-2 px-3   hover:bg-black/10 transition-colors group"
                  >
                    <span className="text-gray-700 group-hover:text-gray-500">{category}</span>
                    <span className="text-gray-400 text-sm bg-gray-100 px-2 py-1 rounded-full">
                      {blogs.filter(blog => blog.category?.includes(category)).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hero Story Component (Large Featured)
const HeroStory = ({ blog, isMain }) => {
  if (isMain) {
    return (
      <div className="lg:col-span-2 group">
        <Link to={`/blog/${blog._id}`} className="block">
          <div className="relative overflow-hidden   bg-gray-900">
            {blog.imageUrl ? (
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center">
                <FaTag className="text-gray-400 text-4xl" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-300 transition-colors">
                {blog.title}
              </h3>
              
              <p className="text-gray-200 mb-4 line-clamp-2">
                {blog.excerpt || blog.metaDescription}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-300">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FaUser className="text-xs" />
                    {blog.author || 'Skincare Expert'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="text-xs" />
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                  <FaClock className="text-xs" />
                  {blog.readTime || 5} min read
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group">
      <Link to={`/blog/${blog._id}`} className="block">
        <div className="relative overflow-hidden   bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
          {blog.imageUrl ? (
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FaTag className="text-gray-400 text-xl" />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
                FEATURED
              </span>
            </div>
            
            <h4 className="font-bold text-gray-900 mb-2 group-hover:text-gray-500 transition-colors line-clamp-2">
              {blog.title}
            </h4>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              <span>{blog.readTime || 5} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// News Card Component
const NewsCard = ({ blog, featured = false }) => {
  if (featured) {
    return (
      <div className="group">
        <Link to={`/blog/${blog._id}`} className="block">
          <div className="flex flex-col sm:flex-row gap-4 bg-white   border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="sm:w-2/5 relative">
              {blog.imageUrl ? (
                <img
                  src={blog.imageUrl}
                  alt={blog.title}
                  className="w-full h-48 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-48 sm:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <FaTag className="text-gray-400 text-xl" />
                </div>
              )}
            </div>
            
            <div className="sm:w-3/5 p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-gray-500 transition-colors line-clamp-2">
                {blog.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {blog.excerpt || blog.metaDescription}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <FaUser className="text-xs" />
                    {blog.author || 'Skincare Expert'}
                  </span>
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="flex items-center gap-1">
                  <FaClock className="text-xs" />
                  {blog.readTime || 5} min
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group">
      <Link to={`/blog/${blog._id}`} className="block">
        <div className="bg-white   border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden">
          {blog.imageUrl && (
            <div className="relative overflow-hidden">
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-500 transition-colors line-clamp-2">
              {blog.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {blog.excerpt || blog.metaDescription}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1">
                <FaClock className="text-xs" />
                {blog.readTime || 5} min
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Featured Card Component
const FeaturedCard = ({ blog }) => {
  return (
    <div className="group">
      <Link to={`/blog/${blog._id}`} className="block">
        <div className="bg-white   border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
          {blog.imageUrl ? (
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FaTag className="text-gray-400 text-xl" />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                EXPERT'S PICK
              </span>
            </div>
            
            <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
              {blog.title}
            </h4>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              <span>{blog.readTime || 5} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Trending Story Component
const TrendingStory = ({ blog, rank }) => {
  return (
    <Link to={`/blog/${blog._id}`} className="flex items-start gap-3 group hover:bg-gray-50 p-2   transition-colors">
      <div className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-700 rounded-full text-xs font-bold flex items-center justify-center">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-gray-900 group-hover:text-gray-500 transition-colors line-clamp-2 text-sm">
          {blog.title}
        </h5>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{blog.readTime || 5} min read</span>
        </div>
      </div>
    </Link>
  );
};

export default Blog;