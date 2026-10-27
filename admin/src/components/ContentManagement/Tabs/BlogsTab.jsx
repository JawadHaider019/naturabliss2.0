import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    Star,
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    Globe,
    CheckCircle2,
    AlertCircle,
    FileText,
    Sparkles,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import WordPressBlogEditor from './blog/WordPressBlogEditor';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function BlogsTab({ blogs: initialBlogs = [], setBlogs: setParentBlogs, categories = [] }) {
    const [blogs, setBlogs] = useState(initialBlogs);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [featuredOnly, setFeaturedOnly] = useState(false);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, blog: null });

    // Fetch blogs from API
    const fetchBlogs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${backendUrl}/api/blogs?limit=100`);
            if (res.data?.success) {
                const fetched = res.data.data || [];
                setBlogs(fetched);
                if (setParentBlogs) setParentBlogs(fetched);
            }
        } catch (err) {
            console.error('Error fetching blogs:', err);
            toast.error('Failed to load articles.');
        } finally {
            setLoading(false);
        }
    }, [setParentBlogs]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    // Metrics calculations
    const stats = useMemo(() => {
        const total = blogs.length;
        const published = blogs.filter(b => b.status === 'published').length;
        const drafts = blogs.filter(b => b.status === 'draft').length;
        const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
        return { total, published, drafts, totalViews };
    }, [blogs]);

    // Filtered blogs
    const filteredBlogs = useMemo(() => {
        return blogs.filter(blog => {
            const matchesSearch = !searchQuery.trim() ||
                (blog.title && blog.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (blog.slug && blog.slug.toLowerCase().includes(searchQuery.toLowerCase()));

            const blogCats = Array.isArray(blog.category) ? blog.category : [blog.category].filter(Boolean);
            const matchesCategory = selectedCategory === 'All' || blogCats.includes(selectedCategory);

            const matchesStatus = selectedStatus === 'All' || blog.status === selectedStatus;
            const matchesFeatured = !featuredOnly || Boolean(blog.featured);

            return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
        });
    }, [blogs, searchQuery, selectedCategory, selectedStatus, featuredOnly]);

    // Toggle publish status
    const handleTogglePublish = async (blog) => {
        try {
            const res = await axios.patch(`${backendUrl}/api/blogs/${blog._id}/publish-status`);
            if (res.data?.success) {
                const nextStatus = blog.status === 'published' ? 'draft' : 'published';
                setBlogs(blogs.map(b => b._id === blog._id ? { ...b, status: nextStatus } : b));
                toast.success(`Article ${nextStatus === 'published' ? 'published live' : 'moved to draft'}`);
            }
        } catch (err) {
            toast.error('Failed to update status.');
        }
    };

    // Toggle featured
    const handleToggleFeatured = async (blog) => {
        try {
            const res = await axios.patch(`${backendUrl}/api/blogs/${blog._id}/featured`);
            if (res.data?.success) {
                setBlogs(blogs.map(b => b._id === blog._id ? { ...b, featured: !b.featured } : b));
                toast.success(`Article ${!blog.featured ? 'featured in hero' : 'unfeatured'}`);
            }
        } catch (err) {
            toast.error('Failed to toggle featured state.');
        }
    };

    // Delete blog
    const executeDelete = async () => {
        if (!deleteModal.blog) return;
        try {
            const res = await axios.delete(`${backendUrl}/api/blogs/${deleteModal.blog._id}`);
            if (res.data?.success) {
                setBlogs(blogs.filter(b => b._id !== deleteModal.blog._id));
                toast.success('Article deleted successfully.');
                setDeleteModal({ isOpen: false, blog: null });
            }
        } catch (err) {
            toast.error('Failed to delete article.');
        }
    };

    const handleCreateNew = () => {
        setSelectedBlog(null);
        setIsEditing(true);
    };

    const handleEditBlog = (blog) => {
        setSelectedBlog(blog);
        setIsEditing(true);
    };

    // If editor mode is active, render full WordPress Gutenberg Blog Editor
    if (isEditing) {
        return (
            <WordPressBlogEditor
                post={selectedBlog}
                onBack={() => {
                    setIsEditing(false);
                    setSelectedBlog(null);
                    fetchBlogs();
                }}
                onSaveSuccess={() => {
                    setIsEditing(false);
                    setSelectedBlog(null);
                    fetchBlogs();
                }}
                backendUrl={backendUrl}
                categories={categories}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-6 border border-gray-200">
                <div>
                    <h2 className="font-display font-bold text-xl text-gray-900">
                        Natura Bliss Journal & Article CMS
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        WordPress-style Gutenberg block editor, SEO controls, and holistic beauty rituals
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchBlogs}
                        className="p-2 border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                        title="Refresh articles"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#587a3b] hover:bg-[#486530] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Article</span>
                    </button>
                </div>
            </div>


                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-white border border-gray-200 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Articles</span>
                            <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
                            <span className="text-[10px] text-gray-400">All saved posts</span>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-green-600">Published Live</span>
                            <div className="text-2xl font-extrabold text-[#587a3b]">{stats.published}</div>
                            <span className="text-[10px] text-gray-400">Visible on public journal</span>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Drafts</span>
                            <div className="text-2xl font-extrabold text-gray-600">{stats.drafts}</div>
                            <span className="text-[10px] text-gray-400">Work in progress</span>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c5a880]">Reader Engagement</span>
                            <div className="text-2xl font-extrabold text-gray-900">{stats.totalViews}</div>
                            <span className="text-[10px] text-gray-400">Total article views</span>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white p-4 border border-gray-200 space-y-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search articles by title, excerpt, slug, or keywords..."
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-[#587a3b]"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 text-xs border border-gray-300 bg-white font-bold"
                                >
                                    <option value="All">All Categories</option>
                                    <option value="Cold-Pressed Oils & Serums">Cold-Pressed Oils</option>
                                    <option value="Hair Growth & Scalp Care">Hair Growth & Scalp</option>
                                    <option value="Holistic Skincare & Barrier Repair">Holistic Skincare</option>
                                    <option value="Organic Soaps & Cleansing">Organic Soaps</option>
                                    <option value="Herbal Wisdom & Ayurvedic Care">Herbal Wisdom</option>
                                    <option value="DIY Beauty Rituals & Recipes">DIY Rituals</option>
                                </select>

                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-3 py-2 text-xs border border-gray-300 bg-white font-bold"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="published">Published Only</option>
                                    <option value="draft">Drafts Only</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setFeaturedOnly(!featuredOnly)}
                                    className={`px-3 py-2 text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                                        featuredOnly
                                            ? 'bg-amber-500 text-white border-amber-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <Star className={`w-3.5 h-3.5 ${featuredOnly ? 'fill-white' : ''}`} />
                                    <span>Featured Only</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Articles Table */}
                    <div className="bg-white border border-gray-200 overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-[#f5f8f2] text-gray-700 border-b border-gray-200">
                                    <th className="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px] w-20">Cover</th>
                                    <th className="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px]">Article Details</th>
                                    <th className="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px] w-48">Category & Tags</th>
                                    <th className="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px] w-36">Author & Read</th>
                                    <th className="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px] w-24 text-center">Views</th>
                                    <th className="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px] w-28 text-center">Status</th>
                                    <th className="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px] w-32 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && blogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-500">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#587a3b] mb-2"></div>
                                            <p className="text-xs font-bold">Loading articles...</p>
                                        </td>
                                    </tr>
                                ) : filteredBlogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400 space-y-2">
                                            <FileText className="w-10 h-10 mx-auto text-gray-300" />
                                            <p className="font-bold text-sm text-gray-700">No articles match your filters</p>
                                            <p className="text-xs">Try clearing the search query or creating a new post.</p>
                                            <button
                                                type="button"
                                                onClick={handleCreateNew}
                                                className="mt-2 px-4 py-2 bg-[#587a3b] text-white font-bold text-xs"
                                            >
                                                Create First Article
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBlogs.map((blog) => {
                                        const catList = Array.isArray(blog.category) ? blog.category : [blog.category].filter(Boolean);
                                        return (
                                            <tr key={blog._id} className="hover:bg-gray-50 transition-colors">
                                                {/* Cover Thumbnail */}
                                                <td className="p-3 sm:p-4">
                                                    <div className="w-16 h-12 bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                                                        {blog.imageUrl ? (
                                                            <img src={blog.imageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold bg-[#f5f8f2]">
                                                                NO IMG
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Title & Slug */}
                                                <td className="p-3 sm:p-4 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleFeatured(blog)}
                                                            title={blog.featured ? 'Remove from Hero featured' : 'Feature in Hero'}
                                                            className="text-amber-500 hover:scale-110 transition-transform"
                                                        >
                                                            <Star className={`w-4 h-4 ${blog.featured ? 'fill-amber-500' : 'text-gray-300'}`} />
                                                        </button>
                                                        <h4
                                                            onClick={() => handleEditBlog(blog)}
                                                            className="font-display font-bold text-sm text-gray-900 hover:text-[#587a3b] transition-colors cursor-pointer line-clamp-1"
                                                        >
                                                            {blog.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                                                        <span>/blog/{blog.slug}</span>
                                                    </div>
                                                </td>

                                                {/* Categories & Tags */}
                                                <td className="p-3 sm:p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {catList.map((cat, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-[#f5f8f2] text-[#3b5327] font-bold text-[10px] border border-[#587a3b]/20">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Author & Read Time */}
                                                <td className="p-3 sm:p-4 space-y-1 text-gray-600">
                                                    <div className="flex items-center gap-1 font-bold text-[11px]">
                                                        <User className="w-3 h-3 text-[#587a3b]" />
                                                        <span>{blog.author || 'Admin'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{blog.readTime || 1} min read</span>
                                                    </div>
                                                </td>

                                                {/* Views */}
                                                <td className="p-3 sm:p-4 text-center font-mono font-bold text-gray-700">
                                                    {blog.views || 0}
                                                </td>

                                                {/* Status Toggle */}
                                                <td className="p-3 sm:p-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePublish(blog)}
                                                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                                            blog.status === 'published'
                                                                ? 'bg-[#587a3b]/15 text-[#587a3b] border border-[#587a3b]/30 hover:bg-[#587a3b]/25'
                                                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {blog.status}
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-3 sm:p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditBlog(blog)}
                                                            className="p-1.5 text-gray-600 hover:text-[#587a3b] hover:bg-gray-100 transition-colors"
                                                            title="Edit in Gutenberg Editor"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <a
                                                            href={`/blog/${blog.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                                                            title="View live post"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModal({ isOpen: true, blog })}
                                                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-colors"
                                                            title="Delete Article"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl p-6 text-center space-y-4">
                        <Trash2 className="w-10 h-10 text-red-500 mx-auto" />
                        <h4 className="font-display font-bold text-base text-gray-900">Delete Journal Article?</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Are you sure you want to permanently delete &ldquo;{deleteModal.blog?.title}&rdquo;? This cannot be undone.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: false, blog: null })}
                                className="px-4 py-2 border border-gray-300 text-xs font-bold text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeDelete}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                            >
                                Permanently Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}