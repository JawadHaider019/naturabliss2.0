import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    ArrowRight,
    ArrowLeft,
    Share2,
    ShieldCheck,
    Check,
    Copy,
    ChevronDown,
    Lightbulb,
    AlertTriangle,
    Sparkles,
    User,
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import Loader from '../components/Loader';
import Breadcrumbs from '../components/Breadcrumbs';
import { parseArticleMarkdown, formatInlineText, stripMarkdown } from '../utils/articleParser';
import { toast } from 'react-toastify';

// Safe JSON-LD Serializer
function safeJsonLd(obj) {
    if (!obj) return '{}';
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Reading progress & active TOC heading
    const [readProgress, setReadProgress] = useState(0);
    const [activeSectionId, setActiveSectionId] = useState('');
    const [helpfulFeedback, setHelpfulFeedback] = useState(null);
    const [copied, setCopied] = useState(false);

    const artRef = useRef(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Fetch blog details
    useEffect(() => {
        const fetchBlogPost = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${backendUrl}/api/blogs/${slug}`);
                if (!response.ok) {
                    throw new Error('Article not found.');
                }

                const result = await response.json();
                if (result.success && result.data) {
                    setBlog(result.data);
                    if (result.relatedBlogs && result.relatedBlogs.length > 0) {
                        setRelatedBlogs(result.relatedBlogs);
                    } else {
                        fetchRelatedFallback(result.data.category, result.data._id);
                    }
                } else {
                    throw new Error(result.message || 'Failed to load article.');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchRelatedFallback = async (categories, currentId) => {
            try {
                const catParam = Array.isArray(categories) && categories[0] ? `&category=${encodeURIComponent(categories[0])}` : '';
                const res = await fetch(`${backendUrl}/api/blogs?status=published&limit=4${catParam}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setRelatedBlogs(data.data.filter(b => b._id !== currentId).slice(0, 3));
                    }
                }
            } catch (e) {
                // Silent catch
            }
        };

        if (backendUrl && slug) {
            fetchBlogPost();
        }
    }, [slug, backendUrl]);

    // Parse Markdown content into rich HTML and Table of Contents headings
    const parsedContent = useMemo(() => {
        if (!blog?.content) return { html: '', headings: [] };
        return parseArticleMarkdown(blog.content);
    }, [blog?.content]);

    // Reading progress percentage calculation
    useEffect(() => {
        const handleScroll = () => {
            if (!artRef.current) return;
            const r = artRef.current.getBoundingClientRect();
            const h = r.height - window.innerHeight;
            if (h <= 0) return;
            const pct = Math.max(0, Math.min(100, (-r.top) / h * 100));
            setReadProgress(pct);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [blog]);

    // IntersectionObserver for Table of Contents scrollspy
    useEffect(() => {
        if (parsedContent.headings.length === 0) return;

        const ids = [...parsedContent.headings.map(h => h.id), 'faq-section', 'quellen-section'];
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSectionId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0px -65% 0px' }
        );

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [parsedContent.headings]);

    // Smooth scroll to section
    const handleTocClick = useCallback((e, targetId) => {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
            const navOffset = 90;
            const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: elementPosition - navOffset,
                behavior: 'smooth'
            });
            setActiveSectionId(targetId);
        }
    }, []);

    // Share handler
    const handleShare = useCallback(() => {
        const shareUrl = window.location.href;
        const shareTitle = blog?.title || 'Natura Bliss Journal';

        if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            navigator.share({ title: shareTitle, url: shareUrl }).catch(() => { });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                toast.success('Link copied to clipboard!');
                setTimeout(() => setCopied(false), 2000);
            });
        }
    }, [blog?.title]);

    if (loading) {
        return <Loader />;
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="font-display font-bold text-xl text-gray-800">Guide Not Found</h3>
                    <p className="text-xs text-gray-500">The requested article could not be retrieved.</p>
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#587a3b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#486530] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Journal</span>
                    </Link>
                </div>
            </div>
        );
    }

    const title = blog.title || 'Holistic Botanical Guide';
    const excerpt = blog.excerpt || blog.metaDescription || '';
    const cover = blog.imageUrl || 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=1200&q=80';
    const category = Array.isArray(blog.category) ? (blog.category[0] || 'Cold-Pressed Oils') : (blog.category || 'Cold-Pressed Oils');
    const author = blog.author || 'Natura Bliss Editorial';
    const authorRole = blog.authorRole || 'Holistic Skincare Specialist';
    const authorBio = blog.authorBio || 'Specialist in certified organic botanical oils, cold-pressed extractions, and holistic hair & skin wellness.';
    const readTime = blog.readTime || 4;
    const authorInitials = author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NB';
    const publishedFormatted = blog.publishDate || blog.createdAt ? new Date(blog.publishDate || blog.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';
    const reviewedFormatted = blog.reviewedDate || blog.updatedAt ? new Date(blog.reviewedDate || blog.updatedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : publishedFormatted;

    return (
        <div ref={artRef} className="bg-white min-h-screen font-sans text-gray-800 pb-20 selection:bg-[#587a3b]/20 selection:text-[#17220e]">
            {/* Top Reading Progress Bar */}
            <div
                className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#587a3b] via-[#8fae72] to-[#3b5327] z-50 transition-all duration-75 ease-out"
                style={{ width: `${readProgress}%` }}
                aria-hidden="true"
            />

            <SEO
                title={`${title} | Natura Bliss Journal`}
                description={excerpt}
                canonical={`https://naturabliss.pk/blog/${blog.slug}`}
                ogType="article"
                ogImage={cover}
            />

            {/* Structured Data JSON-LD for Article & Breadcrumbs */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: safeJsonLd({
                        '@context': 'https://schema.org',
                        '@type': 'BlogPosting',
                        headline: title,
                        description: excerpt,
                        image: [cover],
                        datePublished: blog.publishDate || blog.createdAt,
                        dateModified: blog.updatedAt || blog.publishDate,
                        author: {
                            '@type': 'Person',
                            name: author,
                            jobTitle: authorRole
                        },
                        publisher: {
                            '@type': 'Organization',
                            name: 'Natura Bliss Pakistan',
                            url: 'https://naturabliss.pk',
                            logo: {
                                '@type': 'ImageObject',
                                url: 'https://naturabliss.pk/logo.png'
                            }
                        },
                        mainEntityOfPage: {
                            '@type': 'WebPage',
                            '@id': `https://naturabliss.pk/blog/${blog.slug}`
                        }
                    })
                }}
            />

            {/* Structured Data JSON-LD for FAQPage (Google Rich Snippets) */}
            {parsedContent.faqs && parsedContent.faqs.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: safeJsonLd({
                            '@context': 'https://schema.org',
                            '@type': 'FAQPage',
                            mainEntity: parsedContent.faqs.map(item => ({
                                '@type': 'Question',
                                name: stripMarkdown(item.q),
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: stripMarkdown(item.a)
                                }
                            }))
                        })
                    }}
                />
            )}

            {/* 1. SIGNATURE CINEMATIC HERO BANNER */}
            <section className="relative min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden bg-[#17220e] text-white border-b border-[#587a3b]/20">
                {/* Back Button inside Hero */}
                <div className="absolute top-6 left-6 z-20">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/70 text-white text-xs font-bold transition-colors border border-white/10"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Journal</span>
                    </Link>
                </div>

                {/* Hero Background with zoom effect */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.06, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src={cover}
                            alt={title}
                            className="w-full h-full object-cover opacity-30"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#17220e] via-[#17220e]/85 to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#c5a880] block">
                            {category}
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-2xl sm:text-3xl md:text-5xl font-extrabold text-white leading-tight"
                    >
                        {title}
                    </motion.h1>

                    {excerpt && (
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-xs sm:text-sm md:text-base text-gray-200 max-w-2xl mx-auto font-light leading-relaxed"
                        >
                            {excerpt}
                        </motion.p>
                    )}
                </div>
            </section>

            {/* 2. BREADCRUMBS */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                <Breadcrumbs
                    items={[
                        { label: 'Blog', href: '/blog' },
                        { label: category, href: `/blog?category=${encodeURIComponent(category)}` },
                        { label: title }
                    ]}
                />
            </div>

            {/* 3. E-E-A-T TRUST STRIP */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="bg-[#f5f8f2] border border-gray-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#587a3b] text-white font-bold flex items-center justify-center font-display text-sm shrink-0">
                            {authorInitials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-xs sm:text-sm">{author}</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3b5327] bg-[#e8efe2] px-2 py-0.5">
                                    <ShieldCheck className="w-3 h-3 text-[#587a3b]" />
                                    Admin
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-500 font-light hidden sm:inline">{authorBio}</span>
                        </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#587a3b]" />
                            <span>Published: {publishedFormatted}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{readTime} Min Read</span>
                        </span>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-[#587a3b] text-gray-700 hover:text-[#587a3b] font-bold transition-colors ml-2"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. MAIN TWO-COLUMN ARTICLE WORKSPACE */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
                {/* Left Column: Sticky Table of Contents & Actions */}
                <aside className="hidden lg:block lg:col-span-4">
                    <div className="sticky top-12 space-y-6">
                        {/* Table of Contents Box */}
                        <div className="bg-[#f5f8f2] border border-gray-200 p-6 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-[#587a3b]" />
                                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#3b5327]">
                                        Table of Contents
                                    </h3>
                                </div>
                                <span className="text-[10px] font-mono text-gray-400">
                                    {Math.round(readProgress)}% Read
                                </span>
                            </div>

                            {parsedContent.headings.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No section headings detected</p>
                            ) : (
                                <nav className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
                                    {parsedContent.headings.map((h, i) => {
                                        const isCurrent = activeSectionId === h.id;
                                        return (
                                            <a
                                                key={i}
                                                href={`#${h.id}`}
                                                onClick={(e) => handleTocClick(e, h.id)}
                                                className={`block text-xs py-1.5 transition-colors border-l-2 pl-3 ${isCurrent
                                                    ? 'border-[#587a3b] font-bold text-[#3b5327] bg-[#e8efe2]/50'
                                                    : 'border-transparent text-gray-600 hover:text-[#587a3b]'
                                                    } ${h.level === 3 ? 'ml-3' : ''}`}
                                            >
                                                {h.text}
                                            </a>
                                        );
                                    })}

                                    {parsedContent.faqs && parsedContent.faqs.length > 0 && (
                                        <a
                                            href="#faq-section"
                                            onClick={(e) => handleTocClick(e, 'faq-section')}
                                            className={`block text-xs py-1.5 transition-colors border-l-2 pl-3 ${activeSectionId === 'faq-section'
                                                ? 'border-[#587a3b] font-bold text-[#3b5327] bg-[#e8efe2]/50'
                                                : 'border-transparent text-gray-600 hover:text-[#587a3b]'
                                                }`}
                                        >
                                            Frequently Asked Questions
                                        </a>
                                    )}

                                    {parsedContent.hasQuellen && (
                                        <a
                                            href="#quellen-section"
                                            onClick={(e) => handleTocClick(e, 'quellen-section')}
                                            className={`block text-xs py-1.5 transition-colors border-l-2 pl-3 ${activeSectionId === 'quellen-section'
                                                ? 'border-[#587a3b] font-bold text-[#3b5327] bg-[#e8efe2]/50'
                                                : 'border-transparent text-gray-600 hover:text-[#587a3b]'
                                                }`}
                                        >
                                            Sources & Scientific References
                                        </a>
                                    )}
                                </nav>
                            )}
                        </div>

                        {/* Quick Social Share Card */}
                        <div className="p-5 bg-white border border-gray-200 space-y-3">
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                                Share this Holistic Ritual
                            </span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(title + ' ' + window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-center py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white text-xs font-bold transition-colors"
                                >
                                    WhatsApp
                                </a>
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-center py-2 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white text-xs font-bold transition-colors"
                                >
                                    Facebook
                                </a>
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="p-2 border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                                    title="Copy Link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Column: Main Content */}
                <main className="lg:col-span-8 space-y-10">
                    {/* Rendered HTML with custom block styling */}
                    <article
                        className="prose max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: parsedContent.html }}
                    />

                    {/* Author Bio Card */}
                    <section className="bg-[#f5f8f2] border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-16 h-16 bg-[#587a3b] text-white font-bold flex items-center justify-center font-display text-xl shrink-0 shadow-sm">
                            {authorInitials}
                        </div>
                        <div className="space-y-2 text-center sm:text-left flex-1">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#587a3b] block">
                                ABOUT THE AUTHOR
                            </span>
                            <h3 className="font-display font-bold text-gray-900 text-lg">
                                {author}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                                {authorBio}
                            </p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-bold text-[#587a3b]">
                                <Link to="/blog" className="hover:underline">All Journal Guides</Link>
                                <span>•</span>
                                <Link to="/about" className="hover:underline">About Natura Bliss</Link>
                                <span>•</span>
                                <Link to="/collection" className="hover:underline">Shop Pure Remedies</Link>
                            </div>
                        </div>
                    </section>

                    {/* Reader Helpful Feedback Widget */}
                    <div className="bg-white border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h4 className="font-display font-bold text-sm text-gray-900">Was this guide helpful?</h4>
                            <p className="text-xs text-gray-500">Your feedback helps us refine our holistic beauty research.</p>
                        </div>

                        {helpfulFeedback ? (
                            <span className="text-[#587a3b] font-bold px-4 py-2 bg-[#f5f8f2] border border-[#587a3b]/20 flex items-center gap-1.5 text-xs">
                                <Check className="w-4 h-4 text-[#587a3b]" />
                                <span>Thank you for your feedback!</span>
                            </span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setHelpfulFeedback('yes')}
                                    className="px-5 py-2 border border-[#587a3b] text-[#587a3b] hover:bg-[#587a3b] hover:text-white font-bold text-xs transition-colors"
                                >
                                    Yes, helpful
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHelpfulFeedback('no')}
                                    className="px-5 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold text-xs transition-colors"
                                >
                                    Not really
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* 5. RELATED ARTICLES SECTION */}
            {relatedBlogs.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-gray-200 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#587a3b] block">
                                FURTHER READING
                            </span>
                            <h3 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                                Related Holistic Guides
                            </h3>
                        </div>
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#587a3b] hover:underline"
                        >
                            <span>View All Articles</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedBlogs.map((rel, rIdx) => {
                            const relSlug = rel.slug || rel._id;
                            const relCat = Array.isArray(rel.category) ? (rel.category[0] || 'Care Guide') : (rel.category || 'Care Guide');
                            return (
                                <Link
                                    key={rel._id || rIdx}
                                    to={`/blog/${relSlug}`}
                                    className="group bg-white border border-gray-200 hover:border-[#587a3b]/40 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden"
                                >
                                    <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                                        <img
                                            src={rel.imageUrl || 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=800&q=80'}
                                            alt={rel.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#3b5327]">
                                            {relCat}
                                        </span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                                <Clock className="w-3 h-3" />
                                                <span>{rel.readTime || 3} Min Read</span>
                                            </div>
                                            <h4 className="font-display font-bold text-sm text-gray-900 group-hover:text-[#587a3b] transition-colors line-clamp-2">
                                                {rel.title}
                                            </h4>
                                            {rel.excerpt && (
                                                <p className="text-xs text-gray-600 line-clamp-2 font-light">
                                                    {rel.excerpt}
                                                </p>
                                            )}
                                        </div>
                                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#587a3b]">
                                            <span>Read Article</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}