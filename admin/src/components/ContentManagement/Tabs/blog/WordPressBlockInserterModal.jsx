import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    X,
    Sparkles,
    Type,
    Heading2,
    Heading3,
    Heading4,
    List,
    ListOrdered,
    Quote,
    Table,
    Image as ImageIcon,
    Minus,
    Lightbulb,
    AlertTriangle,
    Layers,
    Compass,
    HelpCircle,
    ShieldCheck
} from 'lucide-react';

export const AVAILABLE_BLOCKS = [
    // Standard / Text
    {
        type: 'paragraph',
        category: 'text',
        title: 'Paragraph',
        desc: 'Standard body text for explanations, natural ingredient insights, and descriptions.',
        icon: Type,
        badge: 'Text',
        defaultData: {
            content: 'Natura Bliss formulations harness cold-pressed pure botanicals to restore balance...'
        }
    },
    {
        type: 'heading',
        level: 2,
        category: 'text',
        title: 'Section Heading (H2)',
        desc: 'Primary topic heading for the Table of Contents and main sections.',
        icon: Heading2,
        badge: 'H2',
        defaultData: {
            level: 2,
            content: 'Natural Benefits & Botanical Properties'
        }
    },
    {
        type: 'heading',
        level: 3,
        category: 'text',
        title: 'Subheading (H3)',
        desc: 'Sub-section heading for specific details under an H2 section.',
        icon: Heading3,
        badge: 'H3',
        defaultData: {
            level: 3,
            content: 'Cold-Pressed Extraction vs Heat Processing'
        }
    },
    {
        type: 'heading',
        level: 4,
        category: 'text',
        title: 'Detail Heading (H4)',
        desc: 'Compact heading for ingredient specifications or quick tips.',
        icon: Heading4,
        badge: 'H4',
        defaultData: {
            level: 4,
            content: 'Active Phytochemicals'
        }
    },
    {
        type: 'list',
        style: 'bullet',
        category: 'text',
        title: 'Bullet List',
        desc: 'List of key attributes with botanical checkmarks.',
        icon: List,
        badge: 'List',
        defaultData: {
            style: 'bullet',
            items: ['100% pure cold-pressed extraction', 'Free from parabens, sulfates, and mineral oil', 'Safe for sensitive skin and all hair textures']
        }
    },
    {
        type: 'list',
        style: 'numbered',
        category: 'text',
        title: 'Numbered List',
        desc: 'Sequential steps for application routine or recipe.',
        icon: ListOrdered,
        badge: 'Numbered',
        defaultData: {
            style: 'numbered',
            items: ['Cleanse face with gentle organic cleanser', 'Apply 3-4 drops of golden elixir', 'Massage upwards for 2 minutes to boost absorption']
        }
    },
    {
        type: 'quote',
        category: 'text',
        title: 'Quote / Highlight',
        desc: 'Stylized holistic quote with elegant border accent.',
        icon: Quote,
        badge: 'Quote',
        defaultData: {
            content: 'True beauty is a reflection of wellness, rooted in the purity of living botanicals.'
        }
    },
    {
        type: 'divider',
        category: 'layout',
        title: 'Divider',
        desc: 'Subtle separator line between article topics.',
        icon: Minus,
        badge: 'Layout',
        defaultData: {}
    },

    // Natura Bliss Signature Elements
    {
        type: 'takeaways',
        category: 'signature',
        title: 'Key Takeaways (At a Glance)',
        desc: 'Botanical green summary box with checkmark highlights.',
        icon: Sparkles,
        badge: 'Signature',
        highlight: true,
        defaultData: {
            heading: 'KEY TAKEAWAYS',
            lead: 'Essential points and holistic insights at a glance:',
            items: [
                '100% virgin cold-pressed extraction preserves vital antioxidants.',
                'Best applied to damp skin or scalp for maximum nutrient penetration.',
                'Regular usage supports cellular skin repair and moisture barrier retention.'
            ]
        }
    },
    {
        type: 'tipp',
        category: 'signature',
        title: 'Expert Ritual Tip (Info Box)',
        desc: 'Soft sage callout box with lightbulb icon for application advice.',
        icon: Lightbulb,
        badge: 'Tip',
        highlight: true,
        defaultData: {
            title: 'Expert Scalp Massage Ritual',
            body: 'Warm 3 to 4 drops between clean palms before gently working into scalp using rhythmic circular motions for 3-5 minutes.'
        }
    },
    {
        type: 'warnung',
        category: 'signature',
        title: 'Caution Box (Patch Test)',
        desc: 'Amber notice box for skin sensitivity, patch tests, and usage guidelines.',
        icon: AlertTriangle,
        badge: 'Caution',
        highlight: true,
        defaultData: {
            title: 'Always Perform a Patch Test',
            body: 'Before using any pure essential or carrier oil, test 1-2 drops on your inner forearm and observe for 24 hours.'
        }
    },
    {
        type: 'schritte',
        category: 'signature',
        title: 'Step-by-Step Ritual Cards',
        desc: 'Numbered step cards for daily and weekly beauty rituals.',
        icon: ListOrdered,
        badge: 'Ritual Steps',
        defaultData: {
            steps: [
                { num: 1, title: 'Cleanse & Prepare', text: 'Cleanse gently with lukewarm water to open pores.' },
                { num: 2, title: 'Warm & Activate', text: 'Dispense 3-4 drops into palms to warm the botanical actives.' },
                { num: 3, title: 'Press & Seal', text: 'Press gently into skin and let absorb naturally.' }
            ]
        }
    },
    {
        type: 'grid',
        category: 'signature',
        title: '3-Column Info Cards',
        desc: 'Side-by-side cards for product comparisons, oil types, or hair regimens.',
        icon: Layers,
        badge: 'Cards',
        defaultData: {
            cards: [
                { kicker: 'Dry Scalp', title: 'Castor & Jojoba', text: 'Intensive moisture and strengthening for brittle roots.' },
                { kicker: 'Slow Growth', title: 'Rosemary Oil', text: 'Clinically shown to boost cellular microcirculation.' },
                { kicker: 'All Skin Types', title: 'Golden Jojoba', text: 'Mimics natural sebum for balanced hydration.' }
            ]
        }
    },
    {
        type: 'cta',
        category: 'signature',
        title: 'Product Banner CTA',
        desc: 'High-conversion banner linking directly to shop remedies or collections.',
        icon: Compass,
        badge: 'CTA Banner',
        defaultData: {
            kicker: 'NATURA BLISS RITUALS',
            title: 'Explore Cold-Pressed Botanical Oils',
            subtitle: 'Pure, organic, unrefined elixirs handcrafted for radiant skin and hair.',
            url: '/collection',
            label: 'Shop Pure Remedies'
        }
    },
    {
        type: 'faq',
        category: 'signature',
        title: 'FAQ Accordion (Interactive)',
        desc: 'Expandable Q&A accordion cards with rich answers.',
        icon: HelpCircle,
        badge: 'FAQ',
        highlight: true,
        defaultData: {
            faqs: [
                {
                    q: 'How often should I use cold-pressed hair oil?',
                    a: 'For best results, apply 2 to 3 times weekly before washing, leaving it on for at least 1-2 hours or overnight.'
                },
                {
                    q: 'Can natural oils clog pores on oily skin?',
                    a: 'Non-comedogenic oils like Pure Jojoba actually balance natural sebum without clogging pores.'
                }
            ]
        }
    },
    {
        type: 'quellen',
        category: 'signature',
        title: 'Scientific Sources & References',
        desc: 'Authoritative citations, clinical studies, and dermatological sources.',
        icon: ShieldCheck,
        badge: 'Sources',
        defaultData: {
            sources: [
                'International Journal of Dermatology: Botanical oils and stratum corneum barrier repair',
                'Phytotherapy Research: Rosmarinus officinalis comparative clinical efficacy in hair growth',
                'Journal of Cosmetic Science: Fatty acid composition of unrefined cold-pressed seed oils'
            ]
        }
    },

    // Media & Table
    {
        type: 'table',
        category: 'media',
        title: 'Comparison Table',
        desc: 'Interactive table with headers and customizable rows.',
        icon: Table,
        badge: 'Table',
        defaultData: {
            headers: ['Product / Ingredient', 'Primary Benefit', 'Best For', 'Application Frequency'],
            rows: [
                ['Rosemary Scalp Oil', 'Follicle stimulation', 'Thinning Hair', '2-3x weekly'],
                ['Cold-Pressed Castor Oil', 'Strand strengthening', 'Dry Ends & Lashes', 'Overnight treatment'],
                ['Golden Jojoba Oil', 'Sebum balancing', 'Face & Body', 'Daily elixir']
            ]
        }
    },
    {
        type: 'image',
        category: 'media',
        title: 'High-Resolution Image',
        desc: 'Responsive image with caption and alt text.',
        icon: ImageIcon,
        badge: 'Image',
        defaultData: {
            url: 'https://images.unsplash.com/photo-1608248597359-58348259e86c?auto=format&fit=crop&w=1200&q=80',
            alt: 'Cold-Pressed Botanical Elixir in Glass Dropper',
            caption: 'Natura Bliss Pure Botanical Elixirs'
        }
    }
];

export default function WordPressBlockInserterModal({
    isOpen,
    onClose,
    onSelectBlock,
    insertIndex = null
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All Elements' },
        { id: 'signature', label: 'Natura Bliss Signature' },
        { id: 'text', label: 'Text & Headings' },
        { id: 'media', label: 'Media & Tables' },
        { id: 'layout', label: 'Layout' }
    ];

    const filteredBlocks = useMemo(() => {
        return AVAILABLE_BLOCKS.filter(block => {
            const matchesCat = selectedCategory === 'all' || block.category === selectedCategory;
            const matchesQuery = !searchQuery.trim() ||
                block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                block.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                block.badge.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesQuery;
        });
    }, [selectedCategory, searchQuery]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-3xl bg-white border border-gray-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#2f4220] text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#587a3b] flex items-center justify-center text-white">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base text-white">
                                    Insert Block
                                </h3>
                                <p className="text-xs text-gray-300">
                                    {insertIndex !== null ? `Insert at position ${insertIndex + 1}` : 'Append to article'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-gray-300 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search & Categories */}
                    <div className="p-4 bg-[#f5f8f2] border-b border-gray-200 space-y-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search blocks (e.g. Table, Tip, FAQ, Takeaways)..."
                                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#587a3b]"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                                        selectedCategory === cat.id
                                            ? 'bg-[#587a3b] text-white shadow-xs'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid of Blocks */}
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredBlocks.map(block => {
                            const Icon = block.icon;
                            return (
                                <button
                                    key={block.title}
                                    type="button"
                                    onClick={() => {
                                        onSelectBlock(block, insertIndex);
                                        onClose();
                                    }}
                                    className={`text-left p-3.5 border transition-all flex items-start gap-3 group hover:border-[#587a3b] ${
                                        block.highlight
                                            ? 'bg-[#f5f8f2] border-[#587a3b]/40 hover:bg-white'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="w-9 h-9 bg-[#587a3b]/10 text-[#587a3b] group-hover:bg-[#587a3b] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#587a3b] transition-colors truncate">
                                                {block.title}
                                            </h4>
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 text-gray-600">
                                                {block.badge}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                            {block.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-[#587a3b]" />
                            <span>Blocks can be moved up/down, duplicated, or deleted anytime.</span>
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="font-bold text-gray-700 hover:text-black underline"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
