import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import Title from '../components/Title';
import Loader from '../components/Loader';
import SEO from '../components/SEO';
import {
    Calendar,
    Clock,
    ArrowRight,
    BookOpen,
    Sparkles,
    Search,
    X,
    User,
    Tag,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Safe JSON-LD Serializer
function safeJsonLd(obj) {
    if (!obj) return '{}';
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

// Date Formatter
function formatPostDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return String(dateStr);
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return String(dateStr);
    }
}

// Memoized Blog Card Component matching Campuna architecture with Natura Bliss aesthetic
const BlogCard = memo(function BlogCard({ post, index }) {
    const postImage = post.imageUrl || 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=800&q=80';
    const postSlug = post.slug || post._id;
    const category = Array.isArray(post.category) ? (post.category[0] || 'Holistic Care') : (post.category || 'Holistic Care');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group bg-white border border-gray-200 hover:border-[#587a3b]/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden select-none h-full"
        >
            <Link to={`/blog/${postSlug}`} className="flex flex-col flex-1">
                {/* Cover Image with 16:10 aspect ratio */}
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden shrink-0">
                    <img
                        src={postImage}
                        alt={post.title || 'Journal Guide'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=800&q=80';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {category && (
                        <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#3b5327] shadow-xs border border-gray-200">
                                {category}
                            </span>
                        </div>
                    )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-[11px] font-mono text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#587a3b] shrink-0" />
                                {formatPostDate(post.createdAt || post.publishDate)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                {post.readTime || 3} Min Read
                            </span>
                        </div>

                        <h3 className="font-display font-bold text-gray-900 text-lg group-hover:text-[#587a3b] transition-colors duration-200 line-clamp-2 leading-snug">
                            {post.title}
                        </h3>

                        {post.excerpt && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed font-light">
                                {post.excerpt}
                            </p>
                        )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-[#587a3b] inline-block" />
                            {post.author || 'Natura Bliss'}
                        </span>

                        <div className="flex items-center gap-1 text-xs font-bold text-[#587a3b] group-hover:translate-x-1 transition-transform">
                            <span>Read Guide</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

export default function Blog() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${backendUrl}/api/blogs?status=published&limit=100`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch articles: ${response.status}`);
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

    // Categories list dynamically derived from blogs
    const availableCategories = useMemo(() => {
        const cats = new Set(['All']);
        blogs.forEach(b => {
            const arr = Array.isArray(b.category) ? b.category : [b.category].filter(Boolean);
            arr.forEach(c => cats.add(c));
        });
        return Array.from(cats);
    }, [blogs]);

    // Filtered blogs
    const filteredBlogs = useMemo(() => {
        return blogs.filter(blog => {
            const matchesCategory = activeCategory === 'All' ||
                (Array.isArray(blog.category) ? blog.category.includes(activeCategory) : blog.category === activeCategory);

            const matchesSearch = !searchQuery.trim() ||
                (blog.title && blog.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (blog.tags && blog.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

            return matchesCategory && matchesSearch;
        });
    }, [blogs, activeCategory, searchQuery]);

    // Featured articles for top hero card
    const featuredArticles = useMemo(() => {
        return blogs.filter(b => b.featured);
    }, [blogs]);

    const heroFeatured = featuredArticles.length > 0 ? featuredArticles[0] : (blogs.length > 0 ? blogs[0] : null);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title="Skincare Journal, Cold-Pressed Oils & Holistic Guides | Natura Bliss Pakistan"
                description="Expert guides on cold-pressed rosemary oil, pure castor oil benefits, holistic barrier repair, and organic soap rituals in Pakistan."
                canonical="https://naturabliss.pk/blog"
            />

            {/* Structured Data JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: safeJsonLd({
                        '@context': 'https://schema.org',
                        '@type': 'Blog',
                        name: 'Natura Bliss Skincare & Haircare Journal',
                        description: 'Expert guides on pure cold-pressed botanical oils, holistic hair growth rituals, and natural beauty wisdom.',
                        url: 'https://naturabliss.pk/blog',
                        publisher: {
                            '@type': 'Organization',
                            name: 'Natura Bliss Pakistan',
                            url: 'https://naturabliss.pk'
                        }
                    })
                }}
            />

            {/* Header Section */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                    <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#587a3b] block mb-2">
                        Holistic Beauty & Botanical Wisdom
                    </span>
                    <div className="text-3xl sm:text-4xl">
                        <Title text1={"SKINCARE"} text2={"JOURNAL"} />
                    </div>
                    <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                        Expert guides, botanical formulation science, and holistic beauty rituals for radiant skin and hair.
                    </p>
                </div>
            </div>

            <main className="max-w-8xl mx-auto px-4 sm:px-6  py-10 space-y-10">
                <div className="space-y-10">
                    {/* Featured Hero Showcase Card (if available) */}
                    {heroFeatured && !searchQuery && activeCategory === 'All' && (
                        <section className="relative overflow-hidden bg-[#17220e] text-white border border-[#587a3b]/30 shadow-xl group">
                            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                                <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6 z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#587a3b] text-white">
                                                Featured Guide
                                            </span>
                                            <span className="text-xs font-mono text-gray-300">
                                                {formatPostDate(heroFeatured.createdAt || heroFeatured.publishDate)}
                                            </span>
                                        </div>

                                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                                            {heroFeatured.title}
                                        </h2>

                                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light line-clamp-3">
                                            {heroFeatured.excerpt || 'Discover the botanical science and traditional wisdom behind pure holistic wellness rituals.'}
                                        </p>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between border-t border-white/10">
                                        <div className="flex items-center gap-2 text-xs text-gray-300">
                                            <Clock className="w-4 h-4 text-[#c5a880]" />
                                            <span>{heroFeatured.readTime || 4} Min Read</span>
                                            <span>•</span>
                                            <span>By {heroFeatured.author || 'Natura Bliss'}</span>
                                        </div>

                                        <Link
                                            to={`/blog/${heroFeatured.slug || heroFeatured._id}`}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#587a3b] hover:bg-[#486530] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
                                        >
                                            <span>Read Article</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full overflow-hidden">
                                    <img
                                        src={heroFeatured.imageUrl || 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=1200&q=80'}
                                        alt={heroFeatured.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#17220e] via-transparent to-transparent" />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Search & Category Filter Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-2 border-b border-gray-100">
                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 scrollbar-none">
                            {availableCategories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === cat
                                        ? 'bg-[#587a3b] text-white shadow-xs'
                                        : 'bg-[#f5f8f2] text-gray-700 hover:bg-[#e8efe2]'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[260px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles (e.g. rosemary, castor)..."
                                className="w-full bg-white border border-gray-300 pl-9 pr-8 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#587a3b]"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Count & Reset */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                        <span>
                            {filteredBlogs.length} Article{filteredBlogs.length === 1 ? '' : 's'} Available
                            {activeCategory !== 'All' ? ` in “${activeCategory}”` : ''}
                        </span>
                        {(searchQuery || activeCategory !== 'All') && (
                            <button
                                type="button"
                                onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                                className="text-[#587a3b] font-bold hover:underline"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>

                    {/* Article Grid */}
                    {filteredBlogs.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 border border-gray-200 p-8 space-y-4">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
                            <h3 className="font-display font-bold text-gray-800 text-lg">No Articles Found</h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto">
                                No guides match your current filter or search criteria.
                            </p>
                            <button
                                type="button"
                                onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                                className="px-5 py-2.5 bg-[#587a3b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#486530] transition-colors"
                            >
                                Show All Guides
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {filteredBlogs.map((blog, idx) => (
                                <BlogCard key={blog._id || idx} post={blog} index={idx} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}