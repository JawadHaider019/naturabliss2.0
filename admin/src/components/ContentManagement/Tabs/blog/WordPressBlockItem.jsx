import React from 'react';
import {
    ChevronUp,
    ChevronDown,
    Copy,
    Trash2,
    Plus,
    X,
    Table as TableIcon,
    Image as ImageIcon,
    Lightbulb,
    AlertTriangle,
    Sparkles,
    ListOrdered,
    Layers,
    Compass,
    HelpCircle,
    ShieldCheck,
    Quote,
    Heading2,
    Heading3,
    Heading4,
    Type,
    UploadCloud
} from 'lucide-react';
import RichWysiwygEditor from './RichWysiwygEditor';

export default function WordPressBlockItem({
    block,
    index,
    totalBlocks,
    isSelected,
    onSelect,
    onUpdateBlock,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
    onInsertAfter,
    onOpenTableEditor
}) {
    const updateBlockData = (updates) => {
        onUpdateBlock({ ...block, ...updates });
    };

    const getBlockHeader = () => {
        switch (block.type) {
            case 'paragraph': return { icon: Type, title: 'Paragraph', color: 'text-gray-700' };
            case 'heading': return { icon: block.level === 3 ? Heading3 : block.level === 4 ? Heading4 : Heading2, title: `Heading (H${block.level || 2})`, color: 'text-[#3b5327]' };
            case 'quote': return { icon: Quote, title: 'Quote', color: 'text-gray-700' };
            case 'list': return { icon: ListOrdered, title: block.style === 'numbered' ? 'Numbered List' : 'Bullet List', color: 'text-gray-700' };
            case 'takeaways': return { icon: Sparkles, title: 'Key Takeaways', color: 'text-[#587a3b]' };
            case 'tipp': return { icon: Lightbulb, title: 'Expert Tip', color: 'text-[#587a3b]' };
            case 'warnung': return { icon: AlertTriangle, title: 'Caution / Notice', color: 'text-amber-600' };
            case 'schritte': return { icon: ListOrdered, title: 'Step-by-Step Ritual', color: 'text-[#3b5327]' };
            case 'grid': return { icon: Layers, title: '3-Column Info Cards', color: 'text-gray-800' };
            case 'cta': return { icon: Compass, title: 'Product CTA Banner', color: 'text-[#587a3b]' };
            case 'faq': return { icon: HelpCircle, title: 'FAQ Accordion', color: 'text-[#3b5327]' };
            case 'quellen': return { icon: ShieldCheck, title: 'Scientific Sources', color: 'text-gray-700' };
            case 'table': return { icon: TableIcon, title: 'Comparison Table', color: 'text-gray-800' };
            case 'image': return { icon: ImageIcon, title: 'Image', color: 'text-gray-800' };
            case 'divider': return { icon: Type, title: 'Divider', color: 'text-gray-400' };
            default: return { icon: Type, title: 'Block', color: 'text-gray-600' };
        }
    };

    const { icon: BlockIcon, title: blockTitle, color: titleColor } = getBlockHeader();

    return (
        <div
            onClick={onSelect}
            className={`group relative mb-6 transition-all border ${
                isSelected
                    ? 'border-[#587a3b] bg-white shadow-md ring-1 ring-[#587a3b]/30'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            {/* Block Action Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400 font-bold">#{index + 1}</span>
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                        <BlockIcon className={`w-3.5 h-3.5 ${titleColor}`} />
                        <span className={titleColor}>{blockTitle}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                        disabled={index === totalBlocks - 1}
                        title="Move Down"
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                        title="Duplicate"
                        className="p-1 text-gray-400 hover:text-[#587a3b] rounded"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title="Delete"
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Block Body Content */}
            <div className="p-4 sm:p-5">
                {/* 1. PARAGRAPH */}
                {block.type === 'paragraph' && (
                    <RichWysiwygEditor
                        value={block.content || ''}
                        onChange={(content) => updateBlockData({ content })}
                        placeholder="Write paragraph content..."
                        minHeight="120px"
                    />
                )}

                {/* 2. HEADING */}
                {block.type === 'heading' && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            {[2, 3, 4].map(lvl => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => updateBlockData({ level: lvl })}
                                    className={`px-2.5 py-0.5 text-xs font-bold ${
                                        block.level === lvl
                                            ? 'bg-[#587a3b] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    H{lvl}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={block.content || ''}
                            onChange={(e) => updateBlockData({ content: e.target.value })}
                            placeholder={`Heading text (H${block.level || 2})...`}
                            className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#587a3b] font-display font-bold ${
                                block.level === 3 ? 'text-lg text-[#3b5327]' : block.level === 4 ? 'text-base text-gray-800' : 'text-xl text-gray-900'
                            }`}
                        />
                    </div>
                )}

                {/* 3. QUOTE */}
                {block.type === 'quote' && (
                    <div className="border-l-4 border-[#587a3b] pl-3 py-1">
                        <textarea
                            rows={3}
                            value={block.content || ''}
                            onChange={(e) => updateBlockData({ content: e.target.value })}
                            placeholder="Enter holistic quote or highlighted excerpt..."
                            className="w-full bg-[#f5f8f2] p-2 text-sm italic text-gray-800 border border-gray-200 focus:outline-none focus:border-[#587a3b]"
                        />
                    </div>
                )}

                {/* 4. LIST */}
                {block.type === 'list' && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1">
                            <button
                                type="button"
                                onClick={() => updateBlockData({ style: block.style === 'numbered' ? 'bullet' : 'numbered' })}
                                className="text-xs font-bold text-[#587a3b] hover:underline"
                            >
                                Switch to {block.style === 'numbered' ? 'Bullet list' : 'Numbered list'}
                            </button>
                            <button
                                type="button"
                                onClick={() => updateBlockData({ items: [...(block.items || []), 'New item'] })}
                                className="text-xs font-bold text-[#587a3b] flex items-center gap-1 hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Item</span>
                            </button>
                        </div>
                        <div className="space-y-1.5">
                            {(block.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="w-5 text-center font-bold text-[#587a3b] text-xs">
                                        {block.style === 'numbered' ? `${idx + 1}.` : '•'}
                                    </span>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const next = [...block.items];
                                            next[idx] = e.target.value;
                                            updateBlockData({ items: next });
                                        }}
                                        placeholder="List item text..."
                                        className="flex-1 px-2.5 py-1 text-xs border border-gray-200 focus:outline-none focus:border-[#587a3b]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = block.items.filter((_, i) => i !== idx);
                                            updateBlockData({ items: next });
                                        }}
                                        className="text-gray-300 hover:text-red-500 p-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. TAKEAWAYS */}
                {block.type === 'takeaways' && (
                    <div className="bg-[#f5f8f2] border border-[#587a3b]/40 p-4 space-y-3">
                        <input
                            type="text"
                            value={block.heading || 'KEY TAKEAWAYS'}
                            onChange={(e) => updateBlockData({ heading: e.target.value })}
                            placeholder="Heading (e.g. KEY TAKEAWAYS)"
                            className="w-full text-xs font-bold uppercase tracking-wider text-[#3b5327] bg-white px-2.5 py-1.5 border border-gray-200"
                        />
                        <textarea
                            rows={2}
                            value={block.lead || ''}
                            onChange={(e) => updateBlockData({ lead: e.target.value })}
                            placeholder="Lead summary sentence..."
                            className="w-full text-xs text-gray-700 bg-white p-2 border border-gray-200 focus:outline-none"
                        />
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-[#3b5327]">
                                <span>Core Takeaway Bullets</span>
                                <button
                                    type="button"
                                    onClick={() => updateBlockData({ items: [...(block.items || []), 'New takeaway insight'] })}
                                    className="flex items-center gap-1 text-[#587a3b] hover:underline"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Bullet</span>
                                </button>
                            </div>
                            {(block.items || []).map((it, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="w-4 h-4 bg-[#587a3b] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                                    <input
                                        type="text"
                                        value={it}
                                        onChange={(e) => {
                                            const next = [...block.items];
                                            next[idx] = e.target.value;
                                            updateBlockData({ items: next });
                                        }}
                                        placeholder="Takeaway bullet..."
                                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = block.items.filter((_, i) => i !== idx);
                                            updateBlockData({ items: next });
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. TIPP */}
                {block.type === 'tipp' && (
                    <div className="bg-[#f5f8f2] border-l-4 border-[#587a3b] p-4 space-y-2">
                        <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockData({ title: e.target.value })}
                            placeholder="Tip Title (e.g. Expert Scalp Massage Ritual)"
                            className="w-full text-xs font-bold text-[#3b5327] bg-white px-2.5 py-1.5 border border-gray-200"
                        />
                        <textarea
                            rows={3}
                            value={block.body || ''}
                            onChange={(e) => updateBlockData({ body: e.target.value })}
                            placeholder="Tip details..."
                            className="w-full text-xs text-gray-700 bg-white p-2 border border-gray-200"
                        />
                    </div>
                )}

                {/* 7. WARNUNG */}
                {block.type === 'warnung' && (
                    <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 space-y-2">
                        <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockData({ title: e.target.value })}
                            placeholder="Warning / Caution Title (e.g. Patch Test Notice)"
                            className="w-full text-xs font-bold text-amber-900 bg-white px-2.5 py-1.5 border border-amber-200"
                        />
                        <textarea
                            rows={3}
                            value={block.body || ''}
                            onChange={(e) => updateBlockData({ body: e.target.value })}
                            placeholder="Caution details..."
                            className="w-full text-xs text-amber-900 bg-white p-2 border border-amber-200"
                        />
                    </div>
                )}

                {/* 8. SCHRITTE */}
                {block.type === 'schritte' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#3b5327]">Ritual Step-by-Step Cards</span>
                            <button
                                type="button"
                                onClick={() => updateBlockData({
                                    steps: [...(block.steps || []), { num: (block.steps?.length || 0) + 1, title: 'New Step', text: 'Step details' }]
                                })}
                                className="flex items-center gap-1 text-xs font-bold text-[#587a3b] hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Step</span>
                            </button>
                        </div>
                        {(block.steps || []).map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200">
                                <span className="w-6 h-6 bg-[#587a3b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {sIdx + 1}
                                </span>
                                <div className="flex-1 space-y-1.5">
                                    <input
                                        type="text"
                                        value={step.title || ''}
                                        onChange={(e) => {
                                            const next = [...block.steps];
                                            next[sIdx] = { ...next[sIdx], title: e.target.value };
                                            updateBlockData({ steps: next });
                                        }}
                                        placeholder="Step Title"
                                        className="w-full px-2 py-1 text-xs font-bold border border-gray-200 bg-white"
                                    />
                                    <textarea
                                        rows={2}
                                        value={step.text || ''}
                                        onChange={(e) => {
                                            const next = [...block.steps];
                                            next[sIdx] = { ...next[sIdx], text: e.target.value };
                                            updateBlockData({ steps: next });
                                        }}
                                        placeholder="Step description..."
                                        className="w-full px-2 py-1 text-xs border border-gray-200 bg-white"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = block.steps.filter((_, i) => i !== sIdx);
                                        updateBlockData({ steps: next });
                                    }}
                                    className="text-gray-300 hover:text-red-500 p-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 9. GRID */}
                {block.type === 'grid' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800">3-Column Info Cards</span>
                            <button
                                type="button"
                                onClick={() => updateBlockData({
                                    cards: [...(block.cards || []), { kicker: 'Ritual', title: 'Card Title', text: 'Card details' }]
                                })}
                                className="flex items-center gap-1 text-xs font-bold text-[#587a3b] hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Card</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {(block.cards || []).map((card, cIdx) => (
                                <div key={cIdx} className="p-3 bg-gray-50 border border-gray-200 space-y-1.5 relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = block.cards.filter((_, i) => i !== cIdx);
                                            updateBlockData({ cards: next });
                                        }}
                                        className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={card.kicker || ''}
                                        onChange={(e) => {
                                            const next = [...block.cards];
                                            next[cIdx] = { ...next[cIdx], kicker: e.target.value };
                                            updateBlockData({ cards: next });
                                        }}
                                        placeholder="Kicker (e.g. Dry Scalp)"
                                        className="w-full px-2 py-0.5 text-[10px] font-bold uppercase text-[#587a3b] bg-white border border-gray-200"
                                    />
                                    <input
                                        type="text"
                                        value={card.title || ''}
                                        onChange={(e) => {
                                            const next = [...block.cards];
                                            next[cIdx] = { ...next[cIdx], title: e.target.value };
                                            updateBlockData({ cards: next });
                                        }}
                                        placeholder="Card Title"
                                        className="w-full px-2 py-1 text-xs font-bold text-gray-900 bg-white border border-gray-200"
                                    />
                                    <textarea
                                        rows={2}
                                        value={card.text || ''}
                                        onChange={(e) => {
                                            const next = [...block.cards];
                                            next[cIdx] = { ...next[cIdx], text: e.target.value };
                                            updateBlockData({ cards: next });
                                        }}
                                        placeholder="Card text..."
                                        className="w-full px-2 py-1 text-xs text-gray-600 bg-white border border-gray-200"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 10. CTA */}
                {block.type === 'cta' && (
                    <div className="bg-[#2f4220] p-4 text-white space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={block.kicker || ''}
                                onChange={(e) => updateBlockData({ kicker: e.target.value })}
                                placeholder="Kicker (e.g. NATURA BLISS RITUALS)"
                                className="px-2.5 py-1 text-xs text-[#c5a880] font-bold bg-[#17220e] border border-[#587a3b]/40"
                            />
                            <input
                                type="text"
                                value={block.title || ''}
                                onChange={(e) => updateBlockData({ title: e.target.value })}
                                placeholder="CTA Title (e.g. Explore Cold-Pressed Oils)"
                                className="px-2.5 py-1 text-xs text-white font-bold bg-[#17220e] border border-[#587a3b]/40"
                            />
                        </div>
                        <input
                            type="text"
                            value={block.subtitle || ''}
                            onChange={(e) => updateBlockData({ subtitle: e.target.value })}
                            placeholder="Subtitle / Description text..."
                            className="w-full px-2.5 py-1 text-xs text-gray-200 bg-[#17220e] border border-[#587a3b]/40"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={block.url || ''}
                                onChange={(e) => updateBlockData({ url: e.target.value })}
                                placeholder="Link URL (/collection or https://...)"
                                className="px-2.5 py-1 text-xs text-gray-200 font-mono bg-[#17220e] border border-[#587a3b]/40"
                            />
                            <input
                                type="text"
                                value={block.label || ''}
                                onChange={(e) => updateBlockData({ label: e.target.value })}
                                placeholder="Button Text (e.g. Shop Pure Remedies)"
                                className="px-2.5 py-1 text-xs text-white font-bold bg-[#587a3b] border border-[#587a3b]"
                            />
                        </div>
                    </div>
                )}

                {/* 11. FAQ */}
                {block.type === 'faq' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#3b5327]">FAQ Accordion Questions</span>
                            <button
                                type="button"
                                onClick={() => updateBlockData({
                                    faqs: [...(block.faqs || []), { q: 'New Question?', a: 'Answer text.' }]
                                })}
                                className="flex items-center gap-1 text-xs font-bold text-[#587a3b] hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add FAQ</span>
                            </button>
                        </div>
                        {(block.faqs || []).map((faq, fIdx) => (
                            <div key={fIdx} className="p-3 bg-gray-50 border border-gray-200 space-y-1.5 relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = block.faqs.filter((_, i) => i !== fIdx);
                                        updateBlockData({ faqs: next });
                                    }}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <input
                                    type="text"
                                    value={faq.q || ''}
                                    onChange={(e) => {
                                        const next = [...block.faqs];
                                        next[fIdx] = { ...next[fIdx], q: e.target.value };
                                        updateBlockData({ faqs: next });
                                    }}
                                    placeholder="Question (e.g. How often to oil scalp?)"
                                    className="w-full px-2.5 py-1 text-xs font-bold text-gray-900 bg-white border border-gray-200"
                                />
                                <textarea
                                    rows={2}
                                    value={faq.a || ''}
                                    onChange={(e) => {
                                        const next = [...block.faqs];
                                        next[fIdx] = { ...next[fIdx], a: e.target.value };
                                        updateBlockData({ faqs: next });
                                    }}
                                    placeholder="Answer explanation..."
                                    className="w-full px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-200"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* 12. QUELLEN */}
                {block.type === 'quellen' && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800">Scientific Sources & Citations</span>
                            <button
                                type="button"
                                onClick={() => updateBlockData({
                                    sources: [...(block.sources || []), 'Clinical Study / Journal Reference']
                                })}
                                className="flex items-center gap-1 text-xs font-bold text-[#587a3b] hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Source</span>
                            </button>
                        </div>
                        {(block.sources || []).map((src, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-400">{sIdx + 1}.</span>
                                <input
                                    type="text"
                                    value={src}
                                    onChange={(e) => {
                                        const next = [...block.sources];
                                        next[sIdx] = e.target.value;
                                        updateBlockData({ sources: next });
                                    }}
                                    placeholder="Source reference..."
                                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = block.sources.filter((_, i) => i !== sIdx);
                                        updateBlockData({ sources: next });
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 13. TABLE */}
                {block.type === 'table' && (
                    <div className="border border-gray-200 p-4 bg-gray-50 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800">
                                Table: {block.headers?.length || 0} Columns × {block.rows?.length || 0} Rows
                            </span>
                            <button
                                type="button"
                                onClick={() => onOpenTableEditor(block)}
                                className="px-3 py-1.5 bg-[#587a3b] text-white text-xs font-bold hover:bg-[#486530] flex items-center gap-1.5 shadow-xs"
                            >
                                <TableIcon className="w-3.5 h-3.5" />
                                <span>Edit Table visually</span>
                            </button>
                        </div>
                        <div className="max-h-36 overflow-x-auto text-[11px] bg-white border border-gray-200 p-2">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        {(block.headers || []).map((h, i) => (
                                            <th key={i} className="p-1 font-bold text-gray-700">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(block.rows || []).slice(0, 3).map((r, ri) => (
                                        <tr key={ri} className="border-b">
                                            {r.map((c, ci) => (
                                                <td key={ci} className="p-1 text-gray-600 truncate max-w-[140px]">{c}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(block.rows?.length || 0) > 3 && (
                                <p className="text-[10px] text-gray-400 text-center pt-1">+ {(block.rows?.length || 0) - 3} more rows</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 14. IMAGE */}
                {block.type === 'image' && (
                    <div className="space-y-3 p-3 bg-gray-50 border border-gray-200">
                        {block.url ? (
                            <div className="relative border border-gray-200 max-h-60 overflow-hidden bg-black/5">
                                <img src={block.url} alt={block.alt || 'Article visual'} className="w-full h-auto object-cover max-h-60" />
                                <button
                                    type="button"
                                    onClick={() => updateBlockData({ url: '' })}
                                    className="absolute top-2 right-2 p-1 bg-black/60 text-white hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 border-2 border-dashed border-gray-300 text-center space-y-2 bg-white">
                                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
                                <p className="text-xs text-gray-500">Enter image URL or upload image below</p>
                            </div>
                        )}
                        <input
                            type="text"
                            value={block.url || ''}
                            onChange={(e) => updateBlockData({ url: e.target.value })}
                            placeholder="Image URL (https://... or Cloudinary link)"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-200"
                        />
                        <input
                            type="text"
                            value={block.alt || ''}
                            onChange={(e) => updateBlockData({ alt: e.target.value, caption: e.target.value })}
                            placeholder="Caption / Alt text (e.g. Natura Bliss Cold-Pressed Rosemary Oil)"
                            className="w-full px-2.5 py-1 text-xs text-gray-600 bg-white border border-gray-200"
                        />
                    </div>
                )}

                {/* 15. DIVIDER */}
                {block.type === 'divider' && (
                    <div className="py-2">
                        <hr className="border-t border-gray-200" />
                    </div>
                )}
            </div>

            {/* In-Between Inserter Button */}
            <div className="absolute -bottom-3 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onInsertAfter(index); }}
                    title="Insert block here"
                    className="w-6 h-6 rounded-full bg-[#587a3b] text-white hover:bg-[#3b5327] flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
