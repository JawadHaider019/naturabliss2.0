import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";

import { 
  FaCalendarAlt, 
  FaUser, 
  FaClock, 
  FaShare, 
 
  FaArrowLeft, 
  FaSpinner,
  FaEye,
  FaTag,
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaLink,
  FaTimes
} from "react-icons/fa";

const BlogPost = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/api/blogs/${id}`);
        
        if (!response.ok) {
          throw new Error('Blog post not found');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setBlog(result.data);
          // Fetch related blogs based on categories
          fetchRelatedBlogs(result.data.category);
        } else {
          throw new Error(result.message || 'Failed to fetch blog post');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedBlogs = async (categories) => {
      try {
        if (!categories || categories.length === 0) return;
        
        const response = await fetch(`${backendUrl}/api/blogs?category=${categories[0]}&limit=4`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Filter out the current blog post
            const filtered = result.data.filter(blog => blog._id !== id);
            setRelatedBlogs(filtered.slice(0, 4));
          }
        }
      } catch (err) {
        // Silent fail for related blogs
      }
    };

    if (backendUrl) {
      fetchBlogPost();
    } else {
      setError('Backend URL not configured');
      setLoading(false);
    }
  }, [id, backendUrl]);

  const shareBlog = (platform) => {
    const url = window.location.href;
    const title = blog?.title || '';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      default:
        break;
    }
  };

  const openShareModal = () => {
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setCopied(false);
  };

  // Function to format blog content with proper styling
  const formatBlogContent = (content) => {
    if (!content) return '';
    
    // Replace markdown-style formatting
    let formattedContent = content
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-bold text-gray-900">$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic text-gray-700">$1</em>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
      // Links
      .replace(/\[([^\[]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>')
      // Lists
      .replace(/^\s*[\*\-]\s+(.*)/gim, '<li class="ml-4 mb-2">$1</li>')
      // Blockquotes
      .replace(/^>\s+(.*)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4 bg-gray-50 py-2">$1</blockquote>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap list items in ul tags
    formattedContent = formattedContent.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc ml-6 mb-4">$1</ul>');

    return `<div class="space-y-4">${formattedContent}</div>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-gray-600 mx-auto mb-4" />
              <span className="text-gray-600 text-lg font-medium">Loading article...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="bg-white border border-gray-300 p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FaEye className="text-gray-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Article Not Found</h3>
              <p className="text-gray-600 mb-6">{error || 'The requested article could not be found.'}</p>
              <Link 
                to="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium"
              >
                <FaArrowLeft className="text-sm" />
                Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Share this article</h3>
              <button 
                onClick={closeShareModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button 
                onClick={() => shareBlog('facebook')}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-700 transition-colors">
                  <FaFacebookF className="text-white text-lg" />
                </div>
                <span className="text-sm text-gray-700">Facebook</span>
              </button>
              
              <button 
                onClick={() => shareBlog('whatsapp')}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-700 transition-colors">
                  <FaWhatsapp className="text-white text-lg" />
                </div>
                <span className="text-sm text-gray-700">WhatsApp</span>
              </button>
              
              <button 
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-gray-700 transition-colors">
                  <FaLink className="text-white text-lg" />
                </div>
                <span className="text-sm text-gray-700">
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>
              
              <button 
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-pink-700 transition-colors">
                  <FaInstagram className="text-white text-lg" />
                </div>
                <span className="text-sm text-gray-700">
                  {copied ? 'Copied!' : 'Instagram'}
                </span>
              </button>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link 
          to="/blog"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300 mb-8 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </Link>
      </div>

      {/* Article Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Image - Separate Section */}
        <div className="mb-8">
          {blog.imageUrl ? (
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full h-96 object-cover"
            />
          ) : (
            <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FaEye className="text-gray-400 text-4xl" />
            </div>
          )}
        </div>

        {/* Article Header - Separate Section */}
        <div className="bg-white p-8 mb-8">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.category?.map((cat, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium border border-gray-300"
              >
                {cat}
              </span>
            ))}
            {blog.featured && (
              <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 text-sm font-bold">
                FEATURED
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>
          
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <FaUser className="text-sm" />
              <span className="font-medium">{blog.author || 'Staff Writer'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-sm" />
              <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-sm" />
              <span>{blog.readTime || 5} min read</span>
            </div>
          </div>
        </div>

        {/* Main Article Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Column */}
          <div className="lg:col-span-3">
            <div className="bg-white">
              {/* Excerpt */}
              {blog.excerpt && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <p className="text-xl text-gray-700 leading-relaxed font-medium">
                    {blog.excerpt}
                  </p>
                </div>
              )}

              {/* Share Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Share this article:</span>
                <div className="flex gap-3">
                  <button 
                    onClick={openShareModal}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white transition-colors duration-300 border border-gray-300"
                  >
                    <FaShare className="text-sm" />
                    Share
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="blog-content-container">
                <div className="text-gray-800 leading-8">
                  {blog.content ? (
                    <div 
                      className="blog-content"
                      dangerouslySetInnerHTML={{ 
                        __html: formatBlogContent(blog.content).replace(
                          /!\[video\]\((.*?)\)/g, 
                          '<div class="video-container my-6"><video controls src="$1" class="w-full"></video></div>'
                        ) 
                      }} 
                    />
                  ) : (
                    <div className="space-y-6">
                      <p className="text-lg text-gray-800">
                        Welcome to our comprehensive guide on this important topic. In this detailed article, 
                        we'll explore the key aspects and provide you with valuable insights that you can 
                        apply in your daily life or professional work.
                      </p>
                      
                      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Understanding the Core Concepts</h2>
                      <p className="text-gray-800">
                        Before diving into the specifics, it's essential to understand the fundamental 
                        principles that form the foundation of this subject. These core concepts will 
                        help you grasp the more complex ideas we'll discuss later.
                      </p>

                      <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Key Insights and Analysis</h3>
                      <p className="text-gray-800">
                        Through extensive research and careful analysis, we've identified several crucial 
                        insights that can significantly impact your understanding and approach to this topic. 
                        These findings are based on real-world data and practical experience.
                      </p>

                      <blockquote className="border-l-4 border-gray-400 pl-6 italic text-gray-600 my-8 bg-gray-50 py-4">
                        "The most profound discoveries often come from questioning what we take for granted 
                        and exploring new perspectives on familiar challenges."
                      </blockquote>

                      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Practical Applications</h2>
                      <p className="text-gray-800">
                        Theory is important, but practical application is where real value is created. 
                        We've compiled actionable strategies and step-by-step guidance to help you 
                        implement these concepts effectively in your specific context.
                      </p>

                      <div className="bg-gray-50 p-6 my-8 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Quick Summary</h4>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Understand the fundamental principles first</li>
                          <li>• Apply insights to your specific situation</li>
                          <li>• Measure results and adjust accordingly</li>
                          <li>• Share knowledge with others</li>
                        </ul>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Looking Forward</h2>
                      <p className="text-gray-800">
                        As we continue to explore this evolving field, new opportunities and challenges 
                        will undoubtedly emerge. Staying informed and adaptable will be key to long-term 
                        success and continued growth.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaTag className="text-gray-600" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors duration-300 border border-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Author Info */}
            <div className="bg-gray-50 p-6 mb-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">About the Author</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                  <FaUser className="text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{blog.author || 'Staff Writer'}</h4>
                  <p className="text-gray-600 text-sm">Content Creator</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Expert in digital content creation and industry insights.
              </p>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedBlogs.length > 0 && (
          <section className="mt-16">
            <div className="border-b border-gray-200 pb-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Related Articles
              </h2>
              <p className="text-gray-600 mt-2">More stories in the same category</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBlogs.map(relatedBlog => (
                <RelatedBlogCard key={relatedBlog._id} blog={relatedBlog} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Related Blog Card Component
const RelatedBlogCard = ({ blog }) => {
  return (
    <Link to={`/blog/${blog._id}`} className="group">
      <div className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 h-full flex flex-col">
        {blog.imageUrl && (
          <div className="relative overflow-hidden">
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300 line-clamp-2 text-sm leading-tight">
              {blog.title}
            </h4>
            
            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
              {blog.excerpt || blog.metaDescription}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
            <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <FaClock className="text-xs" />
              {blog.readTime || 5} min
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogPost;