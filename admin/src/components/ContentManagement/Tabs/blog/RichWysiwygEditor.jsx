import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bold,
    Italic,
    Link as LinkIcon,
    Code as CodeIcon,
    List,
    ListOrdered,
    Quote,
    Eye,
    Sparkles,
    Plus,
    X,
    Check
} from 'lucide-react';

const BLOG_SNIPPETS = [
    {
        id: 'takeaways',
        label: 'Key Takeaways Box',
        template: ':::takeaways KEY TAKEAWAYS\nEssential highlights and holistic summary at a glance:\n- 100% pure cold-pressed botanical oil without mineral additives\n- Best applied to damp skin or scalp for maximum absorption\n:::'
    },
    {
        id: 'tipp',
        label: 'Expert Ritual Tip',
        template: ':::tipp Holistic Ritual Tip\nWarm a few drops between your palms before massaging gently in upward circular motions for 2-3 minutes.\n:::'
    },
    {
        id: 'warnung',
        label: 'Caution / Notice Box',
        template: ':::warnung Important Patch Test Notice\nAlways conduct a 24-hour patch test on your inner forearm before introducing any active botanical oil to your daily routine.\n:::'
    },
    {
        id: 'schritte',
        label: 'Step-by-Step Guide',
        template: ':::schritte\n1. Prep & Cleanse | Cleanse gently with warm water to remove impurities.\n2. Warm & Activate | Dispense 3-4 drops and warm between palms.\n3. Massage & Seal | Massage gently into skin or scalp.\n:::'
    },
    {
        id: 'faq',
        label: 'FAQ Accordion',
        template: ':::faq\nF: How often should I apply natural hair oil?\nA: 2 to 3 times weekly before washing provides deep nourishment without buildup.\n:::'
    },
    {
        id: 'cta',
        label: 'Product Banner CTA',
        template: ':::cta\nNATURA BLISS RITUALS | Explore Pure Cold-Pressed Oils | Handcrafted organic skincare and hair remedies formulated for radiant results. | /collection | Shop Pure Remedies\n:::'
    }
];

const RichWysiwygEditor = forwardRef(function RichWysiwygEditor({
    value = '',
    onChange,
    placeholder = 'Start writing your holistic article or paste content...',
    minHeight = '200px',
    hideSnippets = false
}, ref) {
    const [mode, setMode] = useState('visual'); // 'visual' | 'code'
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkLabel, setLinkLabel] = useState('');
    const [isSnippetDropdownOpen, setIsSnippetDropdownOpen] = useState(false);

    const textareaRef = useRef(null);
    const visualRef = useRef(null);
    const savedSelectionRef = useRef(null);

    useImperativeHandle(ref, () => ({
        insertText: (text) => insertTextAtCursor(text)
    }));

    // Sync visual DOM from value
    useEffect(() => {
        if (visualRef.current && mode === 'visual') {
            if (visualRef.current.innerText !== value && visualRef.current.innerHTML !== value) {
                // Render simple markdown to HTML preview inside visual div
                visualRef.current.innerHTML = formatMarkdownToVisualHtml(value);
            }
        }
    }, [value, mode]);

    const formatMarkdownToVisualHtml = (md) => {
        if (!md) return '';
        let html = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Italic
        html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#587a3b] underline font-bold" target="_blank">$1</a>');
        // Code
        html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 text-xs text-[#3b5327]">$1</code>');
        // Line breaks
        html = html.replace(/\n/g, '<br/>');

        return html;
    };

    const visualHtmlToMarkdown = (domNode) => {
        if (!domNode) return '';
        let text = domNode.innerHTML;
        text = text.replace(/<div><br\/?><\/div>/gi, '\n');
        text = text.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '');
        text = text.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
        text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
        text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
        text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');
        text = text.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
        text = text.replace(/<code\b[^>]*>(.*?)<\/code>/gi, '`$1`');
        text = text.replace(/<[^>]+>/g, '');
        return text;
    };

    const handleVisualInput = () => {
        if (!visualRef.current) return;
        const md = visualHtmlToMarkdown(visualRef.current);
        onChange?.(md);
    };

    const handleVisualPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        handleVisualInput();
    };

    const insertTextAtCursor = (insertion) => {
        if (mode === 'code' && textareaRef.current) {
            const ta = textareaRef.current;
            const start = ta.selectionStart || 0;
            const end = ta.selectionEnd || 0;
            const val = ta.value || '';
            const nextVal = val.substring(0, start) + insertion + val.substring(end);
            onChange?.(nextVal);
            setTimeout(() => {
                ta.focus();
                ta.setSelectionRange(start + insertion.length, start + insertion.length);
            }, 0);
        } else {
            // Visual mode
            document.execCommand('insertText', false, insertion);
            handleVisualInput();
        }
    };

    const applyFormatting = (prefix, suffix = prefix) => {
        if (mode === 'code' && textareaRef.current) {
            const ta = textareaRef.current;
            const start = ta.selectionStart || 0;
            const end = ta.selectionEnd || 0;
            const val = ta.value || '';
            const selected = val.substring(start, end);
            const next = val.substring(0, start) + prefix + selected + suffix + val.substring(end);
            onChange?.(next);
            setTimeout(() => {
                ta.focus();
                ta.setSelectionRange(start + prefix.length, end + prefix.length);
            }, 0);
        } else {
            if (prefix === '**') document.execCommand('bold', false, null);
            else if (prefix === '*') document.execCommand('italic', false, null);
            handleVisualInput();
        }
    };

    const handleInsertLink = () => {
        if (!linkUrl.trim()) return;
        const label = linkLabel.trim() || linkUrl.trim();
        const mdLink = `[${label}](${linkUrl.trim()})`;

        if (mode === 'code') {
            insertTextAtCursor(mdLink);
        } else {
            document.execCommand('createLink', false, linkUrl.trim());
            handleVisualInput();
        }

        setIsLinkPopoverOpen(false);
        setLinkUrl('');
        setLinkLabel('');
    };

    return (
        <div className="border border-gray-200 bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#f5f8f2] border-b border-gray-200">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => applyFormatting('**')}
                        title="Bold (Ctrl+B)"
                        className="p-1.5 text-gray-700 hover:text-[#587a3b] hover:bg-white rounded transition-colors"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyFormatting('*')}
                        title="Italic (Ctrl+I)"
                        className="p-1.5 text-gray-700 hover:text-[#587a3b] hover:bg-white rounded transition-colors"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLinkPopoverOpen(!isLinkPopoverOpen)}
                        title="Insert Link"
                        className="p-1.5 text-gray-700 hover:text-[#587a3b] hover:bg-white rounded transition-colors"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyFormatting('`')}
                        title="Code snippet"
                        className="p-1.5 text-gray-700 hover:text-[#587a3b] hover:bg-white rounded transition-colors"
                    >
                        <CodeIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyFormatting('> ', '\n')}
                        title="Quote"
                        className="p-1.5 text-gray-700 hover:text-[#587a3b] hover:bg-white rounded transition-colors"
                    >
                        <Quote className="w-4 h-4" />
                    </button>

                    {!hideSnippets && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsSnippetDropdownOpen(!isSnippetDropdownOpen)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#3b5327] bg-white border border-[#587a3b]/30 rounded hover:bg-[#e8efe2] transition-colors ml-2"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#587a3b]" />
                                <span>Add Block Snippet</span>
                            </button>

                            {isSnippetDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-gray-200 shadow-xl z-50 p-2 space-y-1">
                                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                        Natura Bliss Signature Blocks
                                    </div>
                                    {BLOG_SNIPPETS.map(snip => (
                                        <button
                                            key={snip.id}
                                            type="button"
                                            onClick={() => {
                                                insertTextAtCursor(`\n\n${snip.template}\n\n`);
                                                setIsSnippetDropdownOpen(false);
                                            }}
                                            className="w-full text-left p-2 hover:bg-[#f5f8f2] text-xs font-bold text-gray-800 flex items-center justify-between"
                                        >
                                            <span>{snip.label}</span>
                                            <Plus className="w-3.5 h-3.5 text-[#587a3b]" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-1 bg-white p-0.5 border border-gray-200">
                    <button
                        type="button"
                        onClick={() => setMode('visual')}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold transition-colors ${
                            mode === 'visual' ? 'bg-[#587a3b] text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Eye className="w-3 h-3" />
                        <span>Visual</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('code')}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold transition-colors ${
                            mode === 'code' ? 'bg-[#587a3b] text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <CodeIcon className="w-3 h-3" />
                        <span>Markdown</span>
                    </button>
                </div>
            </div>

            {/* Link Popover */}
            {isLinkPopoverOpen && (
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2">
                    <input
                        type="text"
                        value={linkLabel}
                        onChange={(e) => setLinkLabel(e.target.value)}
                        placeholder="Link text (optional)..."
                        className="px-2.5 py-1 text-xs border border-gray-300 bg-white focus:outline-none focus:border-[#587a3b]"
                    />
                    <input
                        type="text"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="URL (https://... or /product/...)"
                        className="px-2.5 py-1 text-xs border border-gray-300 bg-white focus:outline-none focus:border-[#587a3b] flex-1 min-w-[200px]"
                    />
                    <button
                        type="button"
                        onClick={handleInsertLink}
                        className="px-3 py-1 bg-[#587a3b] text-white text-xs font-bold hover:bg-[#486530]"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLinkPopoverOpen(false)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="p-4">
                {mode === 'visual' ? (
                    <div
                        ref={visualRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleVisualInput}
                        onPaste={handleVisualPaste}
                        style={{ minHeight }}
                        className="focus:outline-none text-gray-800 text-sm leading-relaxed"
                    />
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange?.(e.target.value)}
                        style={{ minHeight }}
                        placeholder={placeholder}
                        className="w-full text-xs font-mono text-gray-800 bg-transparent focus:outline-none resize-none leading-relaxed"
                    />
                )}
            </div>
        </div>
    );
});

export default RichWysiwygEditor;
