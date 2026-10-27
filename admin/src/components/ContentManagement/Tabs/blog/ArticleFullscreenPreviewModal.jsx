import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Eye,
    Calendar,
    Clock,
    Share2,
    ShieldCheck,
    ChevronDown,
    Copy,
    Check,
    Sparkles,
    ArrowLeft
} from 'lucide-react';
import { parseArticleMarkdown, formatInlineText } from './articleParser';

export default function ArticleFullscreenPreviewModal({
    isOpen,
    onClose,
    postData,
    markdownContent
}) {
    const [copied, setCopied] = useState(false);
    const [helpful, setHelpful] = useState(null);

    const parsed = useMemo(() => {
        return parseArticleMarkdown(markdownContent || '');
    }, [markdownContent]);

    if (!isOpen) return null;

    const title = postData.title || 'Untitled Holistic Guide';
    const excerpt = postData.excerpt || postData.metaDescription || 'Expert natural beauty guidance handcrafted with pure botanicals.';
    const cover = postData.imageUrl || 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=1200&q=80';
    const category = Array.isArray(postData.category) ? (postData.category[0] || 'Cold-Pressed Oils') : (postData.category || 'Cold-Pressed Oils');
    const author = postData.author || 'Natura Bliss Editorial';
    const authorRole = postData.authorRole || 'Holistic Skincare Specialist';
    const authorBio = postData.authorBio || 'Specialist in certified organic botanical oils, cold-pressed extractions, and holistic hair & skin wellness.';
    const readTime = postData.readTime || 4;
    const dateFormatted = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const handleCopy = () => {
        navigator.clipboard?.writeText(window.location.origin + `/blog/${postData.slug || 'preview'}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col overflow-hidden"
            >
                {/* Preview Top Bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-[#17220e] text-white border-b border-[#587a3b]/30 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#587a3b] text-white font-bold text-[10px] uppercase tracking-wider">
                            Live Preview Mode
                        </span>
                        <span className="text-xs text-gray-300 hidden sm:inline">
                            Exact 1:1 preview matching the public Natura Bliss website
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copied ? 'Copied Link' : 'Copy Preview Link'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Article Container */}
                <div className="flex-1 overflow-y-auto bg-white font-sans text-gray-800 pb-20">
                    {/* Reading Progress Indicator */}
                    <div className="sticky top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#587a3b] via-[#8fae72] to-[#3b5327] z-30" />

                    {/* Signature Cinematic Hero Banner */}
                    <div className="relative min-h-[360px] sm:min-h-[420px] flex items-center justify-center overflow-hidden bg-[#17220e] text-white mx-4 sm:mx-8 md:mx-12 mt-6 border border-[#587a3b]/20 shadow-xl">
                        <div className="absolute inset-0 z-0">
                            <img src={cover} alt={title} className="w-full h-full object-cover opacity-35" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#17220e] via-[#17220e]/80 to-transparent" />
                        </div>

                        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
                            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#c5a880] block">
                                {category}
                            </span>
                            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-extrabold text-white leading-tight">
                                {title}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
                                {excerpt}
                            </p>
                        </div>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 text-xs text-gray-500 font-medium">
                        <span className="hover:text-black cursor-pointer">Home</span>
                        <span className="mx-2 text-gray-300">/</span>
                        <span className="hover:text-black cursor-pointer">Journal</span>
                        <span className="mx-2 text-gray-300">/</span>
                        <span className="text-[#587a3b] font-bold">{category}</span>
                        <span className="mx-2 text-gray-300">/</span>
                        <span className="text-gray-400 truncate max-w-xs inline-block align-bottom">{title}</span>
                    </div>

                    {/* E-E-A-T Editorial Strip */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="bg-[#f5f8f2] border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#587a3b] text-white font-bold flex items-center justify-center font-display text-sm">
                                    {author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NB'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 text-sm">{author}</span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3b5327] bg-[#e8efe2] px-2 py-0.5">
                                            <ShieldCheck className="w-3 h-3 text-[#587a3b]" />
                                            {authorRole}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-gray-500">{authorBio}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-[#587a3b]" />
                                    {dateFormatted}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-[#587a3b]" />
                                    {readTime} Min Read
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Layout: Left TOC + Right Content */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Sidebar: Table of Contents */}
                        <aside className="hidden lg:block lg:col-span-4">
                            <div className="sticky top-12 space-y-4">
                                <div className="bg-[#f5f8f2] border border-gray-200 p-5 space-y-3">
                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                                        <span className="w-2 h-2 bg-[#587a3b]"></span>
                                        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#3b5327]">
                                            Table of Contents
                                        </h3>
                                    </div>
                                    {parsed.headings.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No section headings detected</p>
                                    ) : (
                                        <nav className="space-y-1.5">
                                            {parsed.headings.map((h, i) => (
                                                <a
                                                    key={i}
                                                    href={`#${h.id}`}
                                                    className={`block text-xs py-1 transition-colors hover:text-[#587a3b] ${
                                                        h.level === 3 ? 'pl-4 text-gray-500' : 'font-bold text-gray-800'
                                                    }`}
                                                >
                                                    {h.text}
                                                </a>
                                            ))}
                                        </nav>
                                    )}
                                </div>

                                <div className="p-4 bg-white border border-gray-200 space-y-2">
                                    <span className="text-[11px] font-bold text-gray-700 block">Share this Guide</span>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-[#25D366]/10 text-[#25D366] text-xs font-bold">WhatsApp</span>
                                        <span className="px-3 py-1 bg-[#1877F2]/10 text-[#1877F2] text-xs font-bold">Facebook</span>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Right Content */}
                        <main className="lg:col-span-8">
                            <article
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: parsed.html }}
                            />

                            {/* Author Bio Card */}
                            <div className="mt-12 p-6 bg-[#f5f8f2] border border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                <div className="w-14 h-14 bg-[#587a3b] text-white font-bold flex items-center justify-center font-display text-lg shrink-0">
                                    {author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-1 text-center sm:text-left">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#587a3b] block">ABOUT THE AUTHOR</span>
                                    <h4 className="font-display font-bold text-base text-gray-900">{author}</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">{authorBio}</p>
                                </div>
                            </div>

                            {/* Reader Feedback */}
                            <div className="mt-6 p-4 bg-white border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <span className="font-medium text-gray-700">Was this holistic guide helpful to you?</span>
                                {helpful ? (
                                    <span className="text-[#587a3b] font-bold flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Thank you for your feedback!
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setHelpful('yes')}
                                            className="px-4 py-1.5 border border-[#587a3b] text-[#587a3b] hover:bg-[#587a3b] hover:text-white font-bold transition-colors"
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setHelpful('no')}
                                            className="px-4 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                                        >
                                            No
                                        </button>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
