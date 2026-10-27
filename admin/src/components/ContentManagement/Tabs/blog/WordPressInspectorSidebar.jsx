import React, { useState } from 'react';
import {
    Settings,
    FileText,
    Sparkles,
    Calendar,
    Clock,
    User,
    UploadCloud,
    Tag,
    Globe,
    Check,
    AlertCircle,
    Copy,
    ExternalLink,
    X,
    Star,
    Layers,
    ShieldCheck
} from 'lucide-react';
import { AVAILABLE_BLOCKS } from './WordPressBlockInserterModal';

export const NATURA_TOPIC_HUBS = [
    { id: 'cold-pressed-oils', label: 'Cold-Pressed Oils & Serums', desc: 'Rosemary, Castor, Jojoba, Almond oils' },
    { id: 'hair-growth-scalp', label: 'Hair Growth & Scalp Care', desc: 'Scalp massage, follicle stimulation, oiling rituals' },
    { id: 'holistic-skincare', label: 'Holistic Skincare & Barrier Repair', desc: 'Hydration, clean beauty, facial massage' },
    { id: 'organic-soaps', label: 'Organic Soaps & Cleansing', desc: 'Handcrafted botanical soaps, natural lathering' },
    { id: 'herbal-wisdom', label: 'Herbal Wisdom & Ayurvedic Care', desc: 'Ancient herbal traditions and pure ingredients' },
    { id: 'diy-beauty', label: 'DIY Beauty Rituals & Recipes', desc: 'Homemade masks, hair packs, and elixirs' }
];

export const AUTHOR_PRESETS = [
    {
        name: 'Natura Bliss Editorial',
        role: 'Holistic Skincare Specialist',
        avatar: '/logo.png',
        bio: 'Specialist in certified organic botanical oils, cold-pressed extractions, and holistic hair & skin wellness.'
    },
    {
        name: 'Dr. Ayesha Malik',
        role: 'Dermatological Consultant',
        avatar: '/logo.png',
        bio: 'Dermatological consultant specializing in non-comedogenic plant lipids and epidermal barrier restoration.'
    },
    {
        name: 'Natura Botanical Lab',
        role: 'Formulation & Quality Team',
        avatar: '/logo.png',
        bio: 'Research and formulation team behind pure cold-pressed extractions and organic soap crafting.'
    }
];

export default function WordPressInspectorSidebar({
    isOpen,
    onClose,
    postData,
    onUpdatePostData,
    selectedBlock,
    onUpdateSelectedBlock,
    onAddBlock,
    onUploadImage,
    categories = []
}) {
    const [sidebarTab, setSidebarTab] = useState('document'); // 'document' | 'block' | 'snippets'
    const [tagInput, setTagInput] = useState('');
    const [copiedSlug, setCopiedSlug] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const currentTitle = postData.title || '';
    const currentSlug = postData.slug || '';
    const currentMetaTitle = postData.metaTitle || currentTitle;
    const currentMetaDesc = postData.metaDescription || postData.excerpt || '';
    const currentCover = postData.imageUrl || '';
    const currentCategories = Array.isArray(postData.category) ? postData.category : (postData.category ? [postData.category] : ['Cold-Pressed Oils & Serums']);
    const currentTags = Array.isArray(postData.tags) ? postData.tags : [];
    const currentAuthor = postData.author || 'Natura Bliss Editorial';
    const currentStatus = postData.status || 'draft';
    const currentFeatured = Boolean(postData.featured);

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        const cleaned = tagInput.trim().replace(/^#/, '');
        if (!currentTags.includes(cleaned)) {
            onUpdatePostData({ tags: [...currentTags, cleaned] });
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove) => {
        onUpdatePostData({ tags: currentTags.filter(t => t !== tagToRemove) });
    };

    const handleToggleCategory = (catName) => {
        if (currentCategories.includes(catName)) {
            if (currentCategories.length > 1) {
                onUpdatePostData({ category: currentCategories.filter(c => c !== catName) });
            }
        } else {
            onUpdatePostData({ category: [...currentCategories, catName] });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !onUploadImage) return;
        try {
            setIsUploading(true);
            const res = await onUploadImage(file);
            if (res?.imageUrl) {
                onUpdatePostData({ imageUrl: res.imageUrl });
            }
        } catch (err) {
            console.error('Image upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const copySlugLink = () => {
        const link = `https://naturabliss.pk/blog/${currentSlug}`;
        navigator.clipboard?.writeText(link);
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
    };

    // Calculate SEO tips
    const seoChecks = [
        {
            pass: currentTitle.length >= 25 && currentTitle.length <= 80,
            text: `Title length (${currentTitle.length} chars, ideal: 30-70)`
        },
        {
            pass: currentMetaDesc.length >= 100 && currentMetaDesc.length <= 165,
            text: `Meta Description (${currentMetaDesc.length} chars, ideal: 120-160)`
        },
        {
            pass: Boolean(currentCover),
            text: 'Featured Cover Image set'
        },
        {
            pass: currentCategories.length > 0,
            text: 'Primary Topic Category selected'
        },
        {
            pass: currentTags.length >= 2,
            text: `Tags assigned (${currentTags.length}/2 minimum)`
        }
    ];

    return (
        <aside className="w-80 sm:w-96 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-lg shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f8f2] border-b border-gray-200">
                <div className="flex items-center gap-1 bg-white p-0.5 border border-gray-200">
                    <button
                        type="button"
                        onClick={() => setSidebarTab('document')}
                        className={`px-3 py-1 text-xs font-bold transition-colors ${
                            sidebarTab === 'document' ? 'bg-[#587a3b] text-white shadow-xs' : 'text-gray-600 hover:text-black'
                        }`}
                    >
                        Article
                    </button>
                    <button
                        type="button"
                        onClick={() => setSidebarTab('block')}
                        className={`px-3 py-1 text-xs font-bold transition-colors ${
                            sidebarTab === 'block' ? 'bg-[#587a3b] text-white shadow-xs' : 'text-gray-600 hover:text-black'
                        }`}
                    >
                        Block
                    </button>
                    <button
                        type="button"
                        onClick={() => setSidebarTab('snippets')}
                        className={`px-3 py-1 text-xs font-bold transition-colors ${
                            sidebarTab === 'snippets' ? 'bg-[#587a3b] text-white shadow-xs' : 'text-gray-600 hover:text-black'
                        }`}
                    >
                        Library
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-gray-700">
                {/* 1. DOCUMENT SETTINGS TAB */}
                {sidebarTab === 'document' && (
                    <>
                        {/* Status & Featured Toggle */}
                        <div className="space-y-3 pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-800">Publish Status</span>
                                <span className={`px-2.5 py-0.5 font-bold uppercase text-[10px] ${
                                    currentStatus === 'published' ? 'bg-[#587a3b]/10 text-[#587a3b]' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {currentStatus}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                    <Star className={`w-3.5 h-3.5 ${currentFeatured ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                                    <span>Featured in Hero</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={currentFeatured}
                                    onChange={(e) => onUpdatePostData({ featured: e.target.checked })}
                                    className="w-4 h-4 text-[#587a3b] focus:ring-[#587a3b]"
                                />
                            </div>
                        </div>

                        {/* Permalink & Slug */}
                        <div className="space-y-2 pb-4 border-b border-gray-100">
                            <label className="font-bold text-gray-800 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-[#587a3b]" />
                                <span>URL Slug & Permalink</span>
                            </label>
                            <div className="flex items-center gap-1">
                                <span className="text-[11px] text-gray-400 font-mono">/blog/</span>
                                <input
                                    type="text"
                                    value={currentSlug}
                                    onChange={(e) => onUpdatePostData({ slug: e.target.value })}
                                    placeholder="post-slug-url"
                                    className="flex-1 px-2.5 py-1 font-mono text-xs border border-gray-300 focus:outline-none focus:border-[#587a3b]"
                                />
                                <button
                                    type="button"
                                    onClick={copySlugLink}
                                    title="Copy Link"
                                    className="p-1.5 border border-gray-300 hover:bg-gray-100 text-gray-600"
                                >
                                    {copiedSlug ? <Check className="w-3.5 h-3.5 text-[#587a3b]" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="space-y-2 pb-4 border-b border-gray-100">
                            <label className="font-bold text-gray-800 flex items-center justify-between">
                                <span>Featured Cover Image</span>
                                {isUploading && <span className="text-[10px] text-[#587a3b] font-bold">Uploading...</span>}
                            </label>
                            {currentCover ? (
                                <div className="relative border border-gray-200 overflow-hidden group">
                                    <img src={currentCover} alt="Cover preview" className="w-full h-32 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => onUpdatePostData({ imageUrl: '' })}
                                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-[#587a3b] cursor-pointer bg-gray-50 transition-colors">
                                    <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-[11px] font-bold text-gray-600">Click to upload cover photo</span>
                                    <span className="text-[10px] text-gray-400">PNG, JPG, WebP</span>
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                </label>
                            )}
                            <input
                                type="text"
                                value={currentCover}
                                onChange={(e) => onUpdatePostData({ imageUrl: e.target.value })}
                                placeholder="Or paste image URL (https://...)"
                                className="w-full px-2.5 py-1 text-xs border border-gray-300 font-mono"
                            />
                        </div>

                        {/* Topic Categories */}
                        <div className="space-y-2 pb-4 border-b border-gray-100">
                            <label className="font-bold text-gray-800 block">Topic Hubs / Category</label>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 p-2 bg-gray-50">
                                {NATURA_TOPIC_HUBS.map(cat => {
                                    const isSelected = currentCategories.includes(cat.label);
                                    return (
                                        <label
                                            key={cat.id}
                                            className={`flex items-start gap-2 p-1.5 cursor-pointer text-xs transition-colors ${
                                                isSelected ? 'bg-white font-bold text-[#3b5327] shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleCategory(cat.label)}
                                                className="mt-0.5 text-[#587a3b] focus:ring-[#587a3b]"
                                            />
                                            <div>
                                                <span>{cat.label}</span>
                                                <p className="text-[10px] text-gray-400 font-normal leading-tight">{cat.desc}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2 pb-4 border-b border-gray-100">
                            <label className="font-bold text-gray-800 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-[#587a3b]" />
                                <span>Tags & Keywords</span>
                            </label>
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                                    placeholder="Add tag (e.g. cold-pressed, rosemary)..."
                                    className="flex-1 px-2.5 py-1 border border-gray-300 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-3 py-1 bg-[#587a3b] text-white font-bold hover:bg-[#486530]"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {currentTags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f5f8f2] text-[#3b5327] border border-[#587a3b]/20 font-bold text-[10px]">
                                        <span>#{tag}</span>
                                        <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Author Selector */}
                        <div className="space-y-2 pb-4 border-b border-gray-100">
                            <label className="font-bold text-gray-800 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#587a3b]" />
                                <span>Author & Credentials</span>
                            </label>
                            <select
                                value={currentAuthor}
                                onChange={(e) => {
                                    const preset = AUTHOR_PRESETS.find(p => p.name === e.target.value);
                                    if (preset) {
                                        onUpdatePostData({
                                            author: preset.name,
                                            authorAvatar: preset.avatar,
                                            authorRole: preset.role,
                                            authorBio: preset.bio
                                        });
                                    } else {
                                        onUpdatePostData({ author: e.target.value });
                                    }
                                }}
                                className="w-full px-2.5 py-1.5 border border-gray-300 text-xs font-bold bg-white"
                            >
                                {AUTHOR_PRESETS.map(p => (
                                    <option key={p.name} value={p.name}>{p.name} ({p.role})</option>
                                ))}
                            </select>
                        </div>

                        {/* SEO Checklist & SERP Preview */}
                        <div className="space-y-3 pb-4 border-b border-gray-100">
                            <label className="font-bold text-gray-800 flex items-center justify-between">
                                <span>Google SERP Preview</span>
                                <span className="text-[10px] text-gray-400">Search Snippet</span>
                            </label>
                            <div className="p-3 bg-white border border-gray-200 space-y-1">
                                <div className="text-[11px] text-gray-400 font-sans truncate">
                                    https://naturabliss.pk › blog › {currentSlug || 'post-preview'}
                                </div>
                                <div className="text-sm font-bold text-[#1a0dab] line-clamp-1 hover:underline cursor-pointer">
                                    {currentMetaTitle || currentTitle || 'Natura Bliss Journal Article'}
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                    {currentMetaDesc || 'Read pure botanical skincare and hair wellness insights crafted by Natura Bliss specialists.'}
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <span className="font-bold text-gray-800 block text-[11px]">SEO Quality Checklist</span>
                                {seoChecks.map((check, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                        <span className={`w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold ${
                                            check.pass ? 'text-green-600' : 'text-amber-500'
                                        }`}>
                                            {check.pass ? '✓' : '○'}
                                        </span>
                                        <span className={check.pass ? 'text-gray-700' : 'text-gray-400'}>{check.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Meta Title & Meta Description */}
                        <div className="space-y-2">
                            <label className="font-bold text-gray-800 block">Custom Meta Title</label>
                            <input
                                type="text"
                                value={postData.metaTitle || ''}
                                onChange={(e) => onUpdatePostData({ metaTitle: e.target.value })}
                                placeholder="Defaults to post title if blank"
                                className="w-full px-2.5 py-1.5 border border-gray-300 text-xs"
                            />
                            <label className="font-bold text-gray-800 block pt-1">Meta Description / Excerpt</label>
                            <textarea
                                rows={3}
                                value={postData.metaDescription || postData.excerpt || ''}
                                onChange={(e) => onUpdatePostData({ metaDescription: e.target.value, excerpt: e.target.value })}
                                placeholder="120-160 character summary for search engines and card preview..."
                                className="w-full px-2.5 py-1.5 border border-gray-300 text-xs text-gray-700"
                            />
                        </div>
                    </>
                )}

                {/* 2. BLOCK SETTINGS TAB */}
                {sidebarTab === 'block' && (
                    <div className="space-y-4">
                        {selectedBlock ? (
                            <div className="space-y-3">
                                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">
                                    Active Block: {selectedBlock.type}
                                </span>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Edit the block content directly in the canvas. Use the block control bar to reorder, duplicate, or delete this item.
                                </p>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400 space-y-1">
                                <Settings className="w-8 h-8 mx-auto text-gray-300" />
                                <p className="font-bold text-xs">No block selected</p>
                                <p className="text-[11px]">Click any block in the canvas to inspect its settings.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. LIBRARY / SNIPPETS TAB */}
                {sidebarTab === 'snippets' && (
                    <div className="space-y-3">
                        <span className="font-bold text-[#3b5327] uppercase tracking-wider text-[11px] block">
                            Natura Bliss Signature Blocks
                        </span>
                        <p className="text-xs text-gray-500">
                            Click any block to insert it at the end of the article:
                        </p>
                        <div className="space-y-2 pt-1">
                            {AVAILABLE_BLOCKS.filter(b => b.category === 'signature').map(b => {
                                const Icon = b.icon;
                                return (
                                    <button
                                        key={b.title}
                                        type="button"
                                        onClick={() => onAddBlock(b)}
                                        className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-[#587a3b] transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-[#587a3b]/10 text-[#587a3b] flex items-center justify-center">
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-xs text-gray-800 group-hover:text-[#587a3b]">{b.title}</h5>
                                                <p className="text-[10px] text-gray-400 line-clamp-1">{b.desc}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#587a3b]">+ Add</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
