import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ArrowLeft,
    Save,
    Send,
    Eye,
    Plus,
    Settings,
    Clock,
    Globe,
    Check,
    AlertCircle,
    Copy,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import WordPressBlockItem from './WordPressBlockItem';
import WordPressBlockInserterModal, { AVAILABLE_BLOCKS } from './WordPressBlockInserterModal';
import WordPressInspectorSidebar from './WordPressInspectorSidebar';
import CustomTableEditorModal from './CustomTableEditorModal';
import ArticleFullscreenPreviewModal from './ArticleFullscreenPreviewModal';
import { markdownToBlocks, blocksToMarkdown, generateBlockId } from './blockSerializer';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function WordPressBlogEditor({
    post,
    onBack,
    onSaveSuccess,
    backendUrl,
    categories = []
}) {
    // Post metadata state
    const [postData, setPostData] = useState({
        _id: post?._id || null,
        title: post?.title || '',
        slug: post?.slug || '',
        excerpt: post?.excerpt || '',
        category: Array.isArray(post?.category) ? post.category : (post?.category ? [post.category] : ['Cold-Pressed Oils & Serums']),
        tags: Array.isArray(post?.tags) ? post.tags : ['organic', 'cold-pressed', 'skincare'],
        imageUrl: post?.imageUrl || '',
        author: post?.author || 'Natura Bliss Editorial',
        authorAvatar: post?.authorAvatar || '/logo.png',
        authorRole: post?.authorRole || 'Holistic Skincare Specialist',
        authorBio: post?.authorBio || 'Specialist in certified organic botanical oils and holistic beauty.',
        readTime: post?.readTime || 4,
        featured: Boolean(post?.featured),
        status: post?.status || 'draft',
        metaTitle: post?.metaTitle || post?.title || '',
        metaDescription: post?.metaDescription || post?.excerpt || ''
    });

    // Visual Blocks state
    const [blocks, setBlocks] = useState(() => {
        if (post?.content) {
            return markdownToBlocks(post.content);
        }
        return [
            {
                id: generateBlockId(),
                type: 'takeaways',
                heading: 'KEY TAKEAWAYS',
                lead: 'Essential points and botanical highlights at a glance:',
                items: [
                    '100% pure cold-pressed extraction preserves all vital fatty acids and antioxidants.',
                    'Best applied to damp skin or scalp for deep moisture retention.',
                    'Helps restore the natural lipid barrier and supports healthy cellular regeneration.'
                ]
            },
            {
                id: generateBlockId(),
                type: 'heading',
                level: 2,
                content: 'Botanical Properties & Natural Benefits'
            },
            {
                id: generateBlockId(),
                type: 'paragraph',
                content: 'Cold-pressed botanical oils have been celebrated for centuries across traditional herbal medicine. Unlike refined oils extracted with chemical solvents and heat, cold-pressed processing retains active phytochemicals, vital vitamins, and essential fatty acids.'
            },
            {
                id: generateBlockId(),
                type: 'tipp',
                title: 'Application Ritual',
                body: 'Dispense 3-4 drops into your palms, warm gently, and press into your skin or scalp in upward circular motions for 2 minutes.'
            }
        ];
    });

    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isInserterOpen, setIsInserterOpen] = useState(false);
    const [inserterIndex, setInserterIndex] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [activeEditingTableBlock, setActiveEditingTableBlock] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-generate slug from title if user hasn't explicitly set one
    const handleTitleChange = (newTitle) => {
        const updates = { title: newTitle };
        if (!post?._id || !postData.slug || postData.slug.startsWith('blog-post-') || postData.slug.startsWith('untitled-')) {
            const autoSlug = newTitle
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            updates.slug = autoSlug;
        }
        setPostData(prev => ({ ...prev, ...updates }));
    };

    // Calculate dynamic read time from word count
    useEffect(() => {
        const fullMarkdown = blocksToMarkdown(blocks);
        const words = fullMarkdown.trim().split(/\s+/).length;
        const calcMinutes = Math.max(1, Math.ceil(words / 190));
        setPostData(prev => ({ ...prev, readTime: calcMinutes }));
    }, [blocks]);

    // Block manipulation methods
    const handleAddBlock = (blockDef, atIndex = null) => {
        const newBlock = {
            id: generateBlockId(),
            type: blockDef.type,
            level: blockDef.level,
            ...(blockDef.defaultData || {})
        };

        if (atIndex !== null && atIndex >= 0) {
            const next = [...blocks];
            next.splice(atIndex + 1, 0, newBlock);
            setBlocks(next);
        } else {
            setBlocks([...blocks, newBlock]);
        }
        setSelectedBlockId(newBlock.id);
    };

    const handleUpdateBlock = (updatedBlock) => {
        setBlocks(blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
    };

    const handleMoveBlock = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= blocks.length) return;
        const next = [...blocks];
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);
        setBlocks(next);
    };

    const handleDuplicateBlock = (index) => {
        const target = blocks[index];
        const copy = JSON.parse(JSON.stringify(target));
        copy.id = generateBlockId();
        const next = [...blocks];
        next.splice(index + 1, 0, copy);
        setBlocks(next);
        setSelectedBlockId(copy.id);
    };

    const handleDeleteBlock = (index) => {
        if (blocks.length <= 1) {
            toast.info('An article must have at least one block.');
            return;
        }
        const next = blocks.filter((_, idx) => idx !== index);
        setBlocks(next);
    };

    // Table Editor integration
    const handleOpenTableEditor = (block) => {
        setActiveEditingTableBlock(block);
        setIsTableModalOpen(true);
    };

    const handleInsertTableData = ({ headers, rows }) => {
        if (activeEditingTableBlock) {
            handleUpdateBlock({
                ...activeEditingTableBlock,
                headers,
                rows
            });
        } else {
            handleAddBlock({
                type: 'table',
                defaultData: { headers, rows }
            });
        }
        setActiveEditingTableBlock(null);
    };

    // Inline image uploader using backend Cloudinary route
    const handleUploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post(`${backendUrl}/api/blogs/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    };

    // Save article handler
    const handleSave = async (targetStatus) => {
        try {
            if (!postData.title.trim()) {
                toast.error('Please enter an article title.');
                return;
            }

            setIsSaving(true);
            const markdownContent = blocksToMarkdown(blocks);

            // Auto excerpt if blank
            const plainText = markdownContent.replace(/<[^>]*>/g, '').replace(/[#*`_~]/g, '').trim();
            const finalExcerpt = postData.excerpt.trim() || (plainText.slice(0, 160) + '...');
            const finalMetaDesc = postData.metaDescription.trim() || finalExcerpt;

            const payload = {
                ...postData,
                content: markdownContent,
                excerpt: finalExcerpt,
                metaDescription: finalMetaDesc,
                status: targetStatus || postData.status
            };

            let response;
            if (postData._id) {
                response = await axios.put(`${backendUrl}/api/blogs/${postData._id}`, payload);
            } else {
                response = await axios.post(`${backendUrl}/api/blogs`, payload);
            }

            if (response.data.success) {
                toast.success(targetStatus === 'published' ? 'Article published live!' : 'Draft saved successfully!');
                onSaveSuccess?.(response.data.data);
            } else {
                toast.error(response.data.message || 'Failed to save article.');
            }
        } catch (err) {
            console.error('Error saving article:', err);
            toast.error(err.response?.data?.message || err.message || 'Error saving article.');
        } finally {
            setIsSaving(false);
        }
    };

    const currentMarkdown = useMemo(() => blocksToMarkdown(blocks), [blocks]);
    const selectedBlock = useMemo(() => blocks.find(b => b.id === selectedBlockId), [blocks, selectedBlockId]);

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
            {/* Top Navigation & Action Bar */}
            <header className="flex items-center justify-between px-6 py-3 bg-[#17220e] text-white border-b border-[#587a3b]/30 shrink-0 z-20">
                <div className="flex items-center gap-4 flex-1 mr-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Articles</span>
                    </button>

                    <div className="flex-1 max-w-xl">
                        <input
                            type="text"
                            value={postData.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Add article title (e.g. Benefits of Cold-Pressed Rosemary Oil)..."
                            className="w-full bg-transparent text-white font-display font-bold text-sm sm:text-base placeholder:text-gray-400 focus:outline-none border-b border-transparent focus:border-[#587a3b] transition-colors"
                        />
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                            <span className="text-[#c5a880]">URL:</span>
                            <span>/blog/{postData.slug || 'untitled-post'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                        title="Preview Live View"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSave('draft')}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Draft</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSave('published')}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-5 py-1.5 bg-[#587a3b] hover:bg-[#486530] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : postData.status === 'published' ? 'Update Live' : 'Publish Article'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-1.5 text-xs font-bold transition-colors ${
                            isSidebarOpen ? 'bg-[#587a3b] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="Toggle Inspector Sidebar"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Main Canvas + Sidebar Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visual Gutenberg Canvas */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100 flex justify-center">
                    <div className="w-full max-w-3xl space-y-4">
                        {/* Top Inserter Button */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wider">
                                Article Block Canvas ({blocks.length} blocks)
                            </span>
                            <button
                                type="button"
                                onClick={() => { setInserterIndex(0); setIsInserterOpen(true); }}
                                className="flex items-center gap-1 text-xs font-bold text-[#587a3b] hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Block at Top</span>
                            </button>
                        </div>

                        {/* Block Items */}
                        {blocks.map((block, index) => (
                            <WordPressBlockItem
                                key={block.id}
                                block={block}
                                index={index}
                                totalBlocks={blocks.length}
                                isSelected={selectedBlockId === block.id}
                                onSelect={() => setSelectedBlockId(block.id)}
                                onUpdateBlock={handleUpdateBlock}
                                onMoveUp={() => handleMoveBlock(index, -1)}
                                onMoveDown={() => handleMoveBlock(index, 1)}
                                onDuplicate={() => handleDuplicateBlock(index)}
                                onDelete={() => handleDeleteBlock(index)}
                                onInsertAfter={(idx) => {
                                    setInserterIndex(idx);
                                    setIsInserterOpen(true);
                                }}
                                onOpenTableEditor={handleOpenTableEditor}
                            />
                        ))}

                        {/* Bottom Inserter Button */}
                        <div className="py-6 text-center">
                            <button
                                type="button"
                                onClick={() => { setInserterIndex(null); setIsInserterOpen(true); }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#587a3b] hover:bg-[#486530] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-transform hover:scale-105"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add New Block</span>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Right Inspector Sidebar */}
                <WordPressInspectorSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    postData={postData}
                    onUpdatePostData={(updates) => setPostData(prev => ({ ...prev, ...updates }))}
                    selectedBlock={selectedBlock}
                    onUpdateSelectedBlock={handleUpdateBlock}
                    onAddBlock={(blockDef) => handleAddBlock(blockDef)}
                    onUploadImage={handleUploadImage}
                    categories={categories}
                />
            </div>

            {/* Inserter Modal */}
            <WordPressBlockInserterModal
                isOpen={isInserterOpen}
                onClose={() => setIsInserterOpen(false)}
                onSelectBlock={handleAddBlock}
                insertIndex={inserterIndex}
            />

            {/* Custom Table Editor Modal */}
            <CustomTableEditorModal
                isOpen={isTableModalOpen}
                onClose={() => { setIsTableModalOpen(false); setActiveEditingTableBlock(null); }}
                onInsert={handleInsertTableData}
                initialHeaders={activeEditingTableBlock?.headers}
                initialRows={activeEditingTableBlock?.rows}
            />

            {/* Fullscreen Realistic Preview Modal */}
            <ArticleFullscreenPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                postData={postData}
                markdownContent={currentMarkdown}
            />
        </div>
    );
}
