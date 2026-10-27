/**
 * Natura Bliss Blog Article Parser & Renderer
 * Comprehensive parser for rich articles with interactive blocks, table of contents, and SEO schema.
 */

export const ICONS = {
    check: `<svg class="w-4 h-4 text-[#587a3b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>`,
    sparkles: `<svg class="w-4 h-4 text-[#c5a880] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>`,
    lightbulb: `<svg class="w-4 h-4 text-[#587a3b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>`,
    alert: `<svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    shield: `<svg class="w-4 h-4 text-[#587a3b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`,
    help: `<svg class="w-4 h-4 text-[#c5a880] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    chevronDown: `<svg class="w-4 h-4 text-[#587a3b] shrink-0 transform group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`,
    arrowRight: `<svg class="w-4 h-4 text-[#587a3b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>`
};

export const BLOG_SNIPPETS = [
    {
        id: 'takeaways',
        label: 'Key Takeaways Box',
        template: ':::takeaways KEY TAKEAWAYS\nEssential highlights and holistic summary at a glance:\n- 100% pure cold-pressed botanical oil without mineral additives\n- Best applied to damp skin or scalp for maximum absorption\n- Regular use helps maintain protective skin lipid barrier\n:::'
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
        id: 'table',
        label: 'Comparison Table',
        template: '| Oil Variety | Key Benefit | Skin / Hair Type | Extraction Method |\n| :--- | :--- | :--- | :--- |\n| Rosemary Essential | Scalp Stimulation | Thinning Hair | Steam Distilled |\n| Cold-Pressed Castor | Deep Nourishment | Dry & Brittle | Virgin Cold-Pressed |\n| Golden Jojoba | Sebum Balancing | All Skin Types | Pure Cold-Pressed |'
    },
    {
        id: 'schritte',
        label: 'Step-by-Step Guide',
        template: ':::schritte\n1. Prep & Cleanse | Cleanse gently with warm water and organic herbal soap to remove impurities.\n2. Warm & Activate | Dispense 3-4 drops and warm between palms to activate active botanicals.\n3. Massage & Seal | Massage gently into skin or scalp, allowing natural lipids to lock in moisture.\n:::'
    },
    {
        id: 'faq',
        label: 'FAQ Accordion',
        template: ':::faq\nF: How often should I apply natural hair oil?\nA: For optimal scalp health, applying 2 to 3 times weekly before washing provides deep nourishment without buildup.\n\nF: Are Natura Bliss products 100% natural and cruelty-free?\nA: Yes, all products are crafted with organic, cold-pressed ingredients free from parabens, sulfates, and artificial fragrances.\n:::'
    },
    {
        id: 'cta',
        label: 'Product Banner CTA',
        template: ':::cta\nNATURA BLISS RITUALS | Explore Pure Cold-Pressed Oils | Handcrafted organic skincare and hair remedies formulated for radiant results. | /collection | Shop Pure Remedies\n:::'
    },
    {
        id: 'quellen',
        label: 'Scientific Sources',
        template: ':::quellen\n- International Journal of Dermatology: Botanical lipids and epidermal barrier repair\n- Phytotherapy Research: Rosmarinus officinalis and scalp microcirculation\n- Dermatologic Therapy: Efficacy of cold-pressed carrier oils in holistic skincare\n- Stand: 2026\n:::'
    }
];

export function repairCorruptedLinks(str) {
    if (!str || typeof str !== 'string') return '';
    let fixed = str;

    // Pattern: [label](url)
    fixed = fixed.replace(/([\p{L}\p{N}])(\[(?:[^\]]+)\]\([^)]+\))/gu, '$1 $2');
    fixed = fixed.replace(/(\[[^\]]+\]\([^)]+\))([\p{L}\p{N}])/gu, '$1 $2');
    fixed = fixed.replace(/([\p{L}\p{N}])(<a\b)/giu, '$1 $2');
    fixed = fixed.replace(/(<\/a>)([\p{L}\p{N}])/giu, '$1 $2');

    return fixed;
}

export function stripMarkdown(text) {
    if (!text || typeof text !== 'string') return '';
    let res = repairCorruptedLinks(text);

    res = res.replace(/<[^>]*>/g, '');
    res = res.replace(/(?<!\!)\[([^\]]+)\]\([^)]+\)/g, '$1');
    res = res.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
    res = res.replace(/\[url=[^\]]*\](?:\[u\])?([\s\S]*?)(?:\[\/u\])?\[\/url\]/gi, '$1');
    res = res.replace(/\[\/?(?:b|i|u|s|code|highlight|ml|h\d)[^\]]*\]/gi, '');
    res = res.replace(/\*{3}([^\n]+?)\*{3}/g, '$1');
    res = res.replace(/\*{2}([^\n]+?)\*{2}/g, '$1');
    res = res.replace(/\*([^\n*]+?)\*/g, '$1');
    res = res.replace(/_{3}([^\n]+?)_{3}/g, '$1');
    res = res.replace(/_{2}([^\n]+?)_{2}/g, '$1');
    res = res.replace(/(?<!\w)_([^\n_]+?)_(?!\w)/g, '$1');
    res = res.replace(/~~([^~]+)~~/g, '$1');
    res = res.replace(/`([^`]+)`/g, '$1');
    res = res.replace(/[*_~`#]/g, '');
    res = res.replace(/^\s*\d+[\.\)\-]\s*/, '');

    return res.replace(/\s+/g, ' ').trim();
}

export function formatInlineText(text, options = {}) {
    if (!text) return '';
    let res = repairCorruptedLinks(text);

    // Tokens protection for links and code
    const tokens = [];
    const pushToken = (html) => {
        const id = `%%NBTOKEN${tokens.length}%%`;
        tokens.push({ id, html });
        return id;
    };

    // Markdown Links: [label](url)
    res = res.replace(/(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
        const cleanLabel = (label || '').replace(/\*\*/g, '').replace(/__/g, '').trim();
        const isExternal = /^https?:\/\//i.test(url);
        const targetRel = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return pushToken(`<a href="${url}" class="font-bold text-[#587a3b] hover:text-[#3b5327] underline decoration-[#c5a880]/50 underline-offset-4 transition-colors"${targetRel}>${cleanLabel}</a>`);
    });

    // Inline Code: `code`
    res = res.replace(/`([^`]+)`/g, (match, code) => {
        return pushToken(`<code class="px-1.5 py-0.5 rounded bg-gray-100 text-[#3b5327] text-[13px] font-mono border border-gray-200">${code}</code>`);
    });

    // 1. Bold + Italic: ***text*** or ___text___
    res = res.replace(/\*\*\*([^\n]+?)\*\*\*/g, '<strong class="font-bold text-gray-900"><em class="italic">$1</em></strong>');
    res = res.replace(/___([^\n]+?)___/g, '<strong class="font-bold text-gray-900"><em class="italic">$1</em></strong>');

    // 2. Bold: **text** or __text__
    res = res.replace(/\*\*([^\n]+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
    res = res.replace(/__([^\n]+?)__/g, '<strong class="font-bold text-gray-900">$1</strong>');

    // 3. Italic: *text* or _text_
    res = res.replace(/(?<!\*)\*([^\n*]+?)\*(?!\*)/g, '<em class="italic">$1</em>');
    res = res.replace(/(?<![a-zA-Z0-9_])_([^\n_]+?)_(?![a-zA-Z0-9_])/g, '<em class="italic">$1</em>');

    // Strikethrough: ~~text~~
    res = res.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-400">$1</del>');

    // Restore tokens
    tokens.forEach(({ id, html }) => {
        res = res.replace(id, html);
    });

    return res;
}

/**
 * Generate clean URL-safe heading IDs for Table of Contents scrollspy
 */
export function generateHeadingId(rawText, index = 0) {
    const stripped = stripMarkdown(rawText).toLowerCase().trim();
    const slug = stripped
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    return slug ? `${slug}-${index}` : `section-${index}`;
}

/**
 * Parses markdown into structured HTML with full block support and heading list for TOC
 */
export function parseArticleMarkdown(content) {
    if (!content || typeof content !== 'string') {
        return { html: '', headings: [] };
    }

    const headings = [];
    const extractedFaqs = [];
    let hasQuellenBlock = false;
    const raw = repairCorruptedLinks(content.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));

    // Regex to split on major custom blocks, code blocks, or tables
    const blockRegex = /(```[\s\S]*?```|:::takeaways[\s\S]*?:::|:::tipp(?:\s+[^\n]+)?[\s\S]*?:::|:::warnung(?:\s+[^\n]+)?[\s\S]*?:::|:::steps(?:\s+[^\n]+)?[\s\S]*?:::|:::schritte(?:\s+[^\n]+)?[\s\S]*?:::|:::grid[\s\S]*?:::|:::cta[\s\S]*?:::|:::faq[\s\S]*?:::|:::quellen[\s\S]*?:::|(?:^\|[^\n]+\|\n?)+)/gm;

    const htmlParts = [];
    let lastIndex = 0;
    let match;
    let headingCounter = 0;

    const processTextSegment = (text) => {
        if (!text) return;
        // Normalize headings so they are separated from subsequent paragraphs by double newlines
        const normalized = text.replace(/^(#{1,6}\s+[^\n]+)\n(?!\n)/gm, '$1\n\n');
        const paragraphs = normalized.split(/\n{2,}/);

        for (const p of paragraphs) {
            const trimmed = p.trim();
            if (!trimmed) continue;

            // Image: ![alt](url)
            const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            if (imgMatch) {
                const alt = imgMatch[1] || 'Natura Bliss Journal';
                const url = imgMatch[2];
                htmlParts.push(`
                    <figure class="my-8 rounded-none border border-gray-200 overflow-hidden bg-gray-50 shadow-sm">
                        <img src="${url}" alt="${alt}" class="w-full h-auto object-cover max-h-[520px]" loading="lazy" />
                        ${alt ? `<figcaption class="p-3 text-center text-xs text-gray-500 font-sans border-t border-gray-100 bg-white">${alt}</figcaption>` : ''}
                    </figure>
                `);
                continue;
            }

            // Headings: H2, H3, H4
            if (/^##\s+/.test(trimmed)) {
                const lines = trimmed.split('\n');
                const headingLine = lines[0].replace(/^##\s+/, '').trim();
                const remainingText = lines.slice(1).join('\n').trim();
                headingCounter++;
                const id = generateHeadingId(headingLine, headingCounter);
                headings.push({ id, text: stripMarkdown(headingLine), level: 2 });
                htmlParts.push(`
                    <h2 id="${id}" class="scroll-mt-28 font-display text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">
                        ${formatInlineText(headingLine)}
                    </h2>
                `);
                if (remainingText) {
                    processTextSegment(remainingText);
                }
                continue;
            }

            if (/^###\s+/.test(trimmed)) {
                const lines = trimmed.split('\n');
                const headingLine = lines[0].replace(/^###\s+/, '').trim();
                const remainingText = lines.slice(1).join('\n').trim();
                headingCounter++;
                const id = generateHeadingId(headingLine, headingCounter);
                headings.push({ id, text: stripMarkdown(headingLine), level: 3 });
                htmlParts.push(`
                    <h3 id="${id}" class="scroll-mt-28 font-display text-lg sm:text-xl font-bold text-[#3b5327] mt-8 mb-3">
                        ${formatInlineText(headingLine)}
                    </h3>
                `);
                if (remainingText) {
                    processTextSegment(remainingText);
                }
                continue;
            }

            if (/^####\s+/.test(trimmed)) {
                const lines = trimmed.split('\n');
                const headingLine = lines[0].replace(/^####\s+/, '').trim();
                const remainingText = lines.slice(1).join('\n').trim();
                htmlParts.push(`
                    <h4 class="font-display text-base sm:text-lg font-bold text-gray-800 mt-6 mb-2">
                        ${formatInlineText(headingLine)}
                    </h4>
                `);
                if (remainingText) {
                    processTextSegment(remainingText);
                }
                continue;
            }

            // Blockquote: > ...
            if (trimmed.startsWith('>')) {
                const quoteText = trimmed.replace(/^>\s*/gm, '').trim();
                htmlParts.push(`
                    <blockquote class="my-6 pl-5 py-3 border-l-4 border-[#587a3b] bg-[#f5f8f2] text-gray-800 italic rounded-r-sm text-sm sm:text-base leading-relaxed">
                        ${formatInlineText(quoteText)}
                    </blockquote>
                `);
                continue;
            }

            // Bullet List
            if (trimmed.split('\n').every(l => /^[-*]\s+/.test(l.trim()))) {
                const items = trimmed.split('\n').map(l => l.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
                htmlParts.push(`
                    <ul class="my-5 space-y-2 text-gray-700 text-sm sm:text-base list-disc pl-6 leading-relaxed">
                        ${items.map(i => `<li>${formatInlineText(i)}</li>`).join('')}
                    </ul>
                `);
                continue;
            }

            // Numbered List
            if (trimmed.split('\n').every(l => /^\d+\.\s+/.test(l.trim()))) {
                const items = trimmed.split('\n').map(l => l.replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
                htmlParts.push(`
                    <ol class="my-5 space-y-2 text-gray-700 text-sm sm:text-base list-decimal pl-6 leading-relaxed">
                        ${items.map(i => `<li>${formatInlineText(i)}</li>`).join('')}
                    </ol>
                `);
                continue;
            }

            // Divider: ---
            if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
                htmlParts.push(`<hr class="my-8 border-t border-gray-200" />`);
                continue;
            }

            // Standard Paragraph
            htmlParts.push(`
                <p class="text-gray-700 text-sm sm:text-base leading-relaxed my-4 font-light">
                    ${formatInlineText(trimmed)}
                </p>
            `);
        }
    };

    while ((match = blockRegex.exec(raw)) !== null) {
        const textBefore = raw.substring(lastIndex, match.index);
        processTextSegment(textBefore);

        const blockText = match[0].trim();

        // 1. Takeaways :::takeaways
        if (blockText.startsWith(':::takeaways')) {
            const firstLineEnd = blockText.indexOf('\n');
            let heading = 'KEY TAKEAWAYS';
            let body = '';
            if (firstLineEnd !== -1) {
                const customHead = blockText.substring(12, firstLineEnd).trim();
                if (customHead) heading = customHead;
                body = blockText.substring(firstLineEnd, blockText.length - 3).trim();
            } else {
                body = blockText.replace(/^:::takeaways/i, '').replace(/:::$/i, '').trim();
            }

            const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
            const leadLines = [];
            const items = [];

            lines.forEach(l => {
                if (l.startsWith('- ') || l.startsWith('* ')) {
                    items.push(l.replace(/^[-*]\s+/, '').trim());
                } else {
                    leadLines.push(l);
                }
            });

            htmlParts.push(`
                <div class="my-8 bg-[#f5f8f2] border-2 border-[#587a3b]/30 p-6 sm:p-7 rounded-none shadow-sm space-y-4">
                    <div class="flex items-center gap-2 border-b border-[#587a3b]/20 pb-3">
                        <span class="w-2.5 h-2.5 bg-[#587a3b] inline-block"></span>
                        <h3 class="font-display font-bold text-sm sm:text-base tracking-wider uppercase text-[#3b5327]">
                            ${heading}
                        </h3>
                    </div>
                    ${leadLines.length > 0 ? `<p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">${formatInlineText(leadLines.join(' '))}</p>` : ''}
                    ${items.length > 0 ? `
                        <ul class="space-y-2.5 pt-1">
                            ${items.map(it => `
                                <li class="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed">
                                    <span class="mt-0.5 shrink-0 text-[#587a3b]">${ICONS.check}</span>
                                    <span>${formatInlineText(it)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            `);
        }
        // 2. Tipp :::tipp
        else if (blockText.startsWith(':::tipp')) {
            const firstLineEnd = blockText.indexOf('\n');
            let title = 'Expert Botanical Tip';
            let body = '';
            if (firstLineEnd !== -1) {
                const customTitle = blockText.substring(7, firstLineEnd).trim();
                if (customTitle) title = customTitle;
                body = blockText.substring(firstLineEnd, blockText.length - 3).trim();
            } else {
                body = blockText.replace(/^:::tipp/i, '').replace(/:::$/i, '').trim();
            }

            htmlParts.push(`
                <div class="my-6 bg-[#f5f8f2] border-l-4 border-[#587a3b] p-5 sm:p-6 rounded-none shadow-xs space-y-2">
                    <div class="flex items-center gap-2">
                        ${ICONS.lightbulb}
                        <h4 class="font-display font-bold text-sm sm:text-base text-[#3b5327]">${title}</h4>
                    </div>
                    <div class="text-xs sm:text-sm text-gray-700 leading-relaxed">${formatInlineText(body)}</div>
                </div>
            `);
        }
        // 3. Warnung :::warnung
        else if (blockText.startsWith(':::warnung')) {
            const firstLineEnd = blockText.indexOf('\n');
            let title = 'Important Notice';
            let body = '';
            if (firstLineEnd !== -1) {
                const customTitle = blockText.substring(10, firstLineEnd).trim();
                if (customTitle) title = customTitle;
                body = blockText.substring(firstLineEnd, blockText.length - 3).trim();
            } else {
                body = blockText.replace(/^:::warnung/i, '').replace(/:::$/i, '').trim();
            }

            htmlParts.push(`
                <div class="my-6 bg-amber-50/70 border-l-4 border-amber-500 p-5 sm:p-6 rounded-none shadow-xs space-y-2">
                    <div class="flex items-center gap-2">
                        ${ICONS.alert}
                        <h4 class="font-display font-bold text-sm sm:text-base text-amber-900">${title}</h4>
                    </div>
                    <div class="text-xs sm:text-sm text-amber-900/90 leading-relaxed">${formatInlineText(body)}</div>
                </div>
            `);
        }
        // 4. Steps :::steps or :::schritte
        else if (blockText.startsWith(':::steps') || blockText.startsWith(':::schritte')) {
            const isSteps = blockText.startsWith(':::steps');
            const prefix = isSteps ? ':::steps' : ':::schritte';
            const firstLineEnd = blockText.indexOf('\n');
            let customTitle = '';
            let body = '';

            if (firstLineEnd !== -1) {
                customTitle = blockText.substring(prefix.length, firstLineEnd).trim();
                body = blockText.substring(firstLineEnd, blockText.length - 3).trim();
            } else {
                body = blockText.replace(new RegExp(`^${prefix}`, 'i'), '').replace(/:::$/i, '').trim();
            }

            const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
            const steps = lines.map((line, idx) => {
                let raw = line.trim();
                // 1. Pipe format: 1. Title | Text
                if (raw.includes('|')) {
                    const parts = raw.split('|').map(p => p.trim());
                    const rawTitle = parts[0].replace(/^\d+[\.\)\-]\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
                    return {
                        num: (idx + 1).toString().padStart(2, '0'),
                        title: rawTitle,
                        text: parts.slice(1).join(' | ').trim()
                    };
                }

                // 2. Bold title: 1. **Title**: Text or 1. **Title** - Text
                const boldMatch = raw.match(/^\d+[\.\)\-]\s*\*\*(.+?)\*\*[:\s\-–—]+(.+)$/);
                if (boldMatch) {
                    return {
                        num: (idx + 1).toString().padStart(2, '0'),
                        title: boldMatch[1].trim(),
                        text: boldMatch[2].trim()
                    };
                }

                // 3. Colon format without bold: 1. Title: Text
                const colonMatch = raw.match(/^\d+[\.\)\-]\s*([^:]{3,60}):\s*(.+)$/);
                if (colonMatch) {
                    return {
                        num: (idx + 1).toString().padStart(2, '0'),
                        title: colonMatch[1].trim(),
                        text: colonMatch[2].trim()
                    };
                }

                // 4. Default numbered line
                const cleanText = raw.replace(/^\d+[\.\)\-]\s*/, '').trim();
                return {
                    num: (idx + 1).toString().padStart(2, '0'),
                    title: `Step ${idx + 1}`,
                    text: cleanText
                };
            });

            const headerTitle = customTitle || (isSteps ? 'BIOCHEMICAL MECHANISM & PROTOCOL' : 'APPLICATION RITUAL STEPS');

            htmlParts.push(`
                <div class="my-8 border border-[#587a3b]/30 bg-[#f7faf4] rounded-none shadow-xs">
                    <div class="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#e8efe2] border-b border-[#587a3b]/20">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 bg-[#587a3b] inline-block"></span>
                            <span class="font-display font-bold text-xs uppercase tracking-wider text-[#2f4220]">${headerTitle}</span>
                        </div>
                        <span class="text-[10px] font-mono text-[#587a3b] uppercase tracking-widest font-bold">${steps.length} Steps</span>
                    </div>
                    <div class="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        ${steps.map(step => `
                            <div class="flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-white border border-gray-200 rounded-none shadow-xs hover:border-[#587a3b]/50 transition-colors">
                                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-[#2f4220] text-white flex items-center justify-center font-bold text-xs sm:text-sm font-mono shrink-0 shadow-xs">
                                    ${step.num}
                                </div>
                                <div class="space-y-1 flex-1 min-w-0">
                                    <h4 class="font-display font-bold text-sm sm:text-base text-gray-900 leading-snug">${formatInlineText(step.title)}</h4>
                                    ${step.text ? `<p class="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">${formatInlineText(step.text)}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `);
        }
        // 5. Grid :::grid
        else if (blockText.startsWith(':::grid')) {
            const body = blockText.replace(/^:::grid/i, '').replace(/:::$/i, '').trim();
            const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
            const cards = lines.map(line => {
                const parts = line.split('|').map(p => p.trim());
                return {
                    kicker: parts[0] || 'Ritual',
                    title: parts[1] || 'Guideline',
                    text: parts[2] || ''
                };
            });

            htmlParts.push(`
                <div class="my-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    ${cards.map(c => `
                        <div class="bg-white border border-gray-200 p-4 sm:p-5 rounded-none shadow-xs space-y-2 hover:border-[#587a3b]/40 transition-colors">
                            <span class="text-[10px] uppercase font-bold tracking-wider text-[#587a3b] block">${c.kicker}</span>
                            <h4 class="font-display font-bold text-sm sm:text-base text-gray-900">${formatInlineText(c.title)}</h4>
                            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">${formatInlineText(c.text)}</p>
                        </div>
                    `).join('')}
                </div>
            `);
        }
        // 6. CTA :::cta
        else if (blockText.startsWith(':::cta')) {
            const body = blockText.replace(/^:::cta/i, '').replace(/:::$/i, '').trim();
            const parts = body.split('|').map(p => p.trim());
            const kicker = parts[0] || 'NATURA BLISS RITUALS';
            const title = parts[1] || 'Experience Pure Organic Care';
            const subtitle = parts[2] || 'Handcrafted cold-pressed oils and herbal remedies formulated for visible results.';
            const url = parts[3] || '/collection';
            const btn = parts[4] || 'Explore Products';

            htmlParts.push(`
                <div class="my-8 bg-[#2f4220] text-white p-6 sm:p-8 rounded-none border border-[#587a3b]/40 shadow-md text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div class="space-y-2">
                        <span class="text-[10px] uppercase font-bold tracking-[0.25em] text-[#c5a880] block">${kicker}</span>
                        <h3 class="font-display text-lg sm:text-xl font-bold text-white">${title}</h3>
                        <p class="text-xs sm:text-sm text-gray-200 max-w-xl font-light">${subtitle}</p>
                    </div>
                    <a href="${url}" class="px-6 py-3 bg-[#587a3b] hover:bg-[#486530] text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm">
                        ${btn}
                    </a>
                </div>
            `);
        }
        // 7. FAQ :::faq
        else if (blockText.startsWith(':::faq')) {
            const body = blockText.replace(/^:::faq/i, '').replace(/:::$/i, '').trim();
            const lines = body.split('\n');
            const faqs = [];
            let currQ = '';
            let currA = [];

            const flush = () => {
                if (currQ) {
                    faqs.push({ q: currQ, a: currA.join(' ').trim() });
                    currQ = '';
                    currA = [];
                }
            };

            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;
                if (/^#{1,4}\s+/i.test(trimmed)) return; // Skip subheadings like "### Frequently Asked Questions"

                if (/^(?:[FQ]|Frage|Question)\s*:\s*/i.test(trimmed)) {
                    flush();
                    currQ = trimmed.replace(/^(?:[FQ]|Frage|Question)\s*:\s*/i, '').trim();
                } else if (/^\*\*(.+?)\*\*$/i.test(trimmed)) {
                    flush();
                    currQ = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
                } else if (/^(?:[A]|Antwort|Answer)\s*:\s*/i.test(trimmed)) {
                    currA.push(trimmed.replace(/^(?:[A]|Antwort|Answer)\s*:\s*/i, '').trim());
                } else if (currQ) {
                    currA.push(trimmed);
                }
            });
            flush();

            faqs.forEach(f => extractedFaqs.push(f));

            htmlParts.push(`
                <div id="faq-section" class="my-8 bg-white border border-gray-200 p-6 sm:p-8 rounded-none shadow-xs space-y-4 scroll-mt-28">
                    <div class="flex items-center gap-2 border-b border-gray-100 pb-3">
                        ${ICONS.help}
                        <h3 class="font-display font-bold text-base sm:text-lg text-gray-900">Frequently Asked Questions</h3>
                    </div>
                    <div class="space-y-3 pt-2">
                        ${faqs.map(f => `
                            <details class="group bg-[#f5f8f2]/60 border border-gray-200 p-4 rounded-none transition-all">
                                <summary class="font-display font-bold text-sm sm:text-base text-gray-900 flex items-center justify-between gap-4 cursor-pointer select-none list-none">
                                    <span>${formatInlineText(f.q)}</span>
                                    <span class="shrink-0 text-[#587a3b]">${ICONS.chevronDown}</span>
                                </summary>
                                <div class="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-200/60 pt-3">
                                    ${formatInlineText(f.a)}
                                </div>
                            </details>
                        `).join('')}
                    </div>
                </div>
            `);
        }
        // 8. Quellen / References :::quellen
        else if (blockText.startsWith(':::quellen')) {
            hasQuellenBlock = true;
            const body = blockText.replace(/^:::quellen/i, '').replace(/:::$/i, '').trim();
            const lines = body.split('\n').map(l => l.replace(/^[-*]\s+/, '').trim()).filter(Boolean);

            htmlParts.push(`
                <div id="quellen-section" class="my-8 bg-white border border-gray-200 p-6 sm:p-7 rounded-none shadow-xs space-y-3 scroll-mt-28">
                    <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
                        ${ICONS.shield}
                        <h4 class="font-display font-bold text-sm sm:text-base text-gray-900">Sources & Scientific References</h4>
                    </div>
                    <ol class="space-y-2 text-xs text-gray-600 list-decimal pl-5 leading-relaxed pt-1">
                        ${lines.map(src => `<li>${formatInlineText(src)}</li>`).join('')}
                    </ol>
                </div>
            `);
        }
        // 9. Markdown Table
        else if (blockText.startsWith('|')) {
            const rows = blockText.split('\n').map(l => l.trim()).filter(Boolean);
            if (rows.length >= 2) {
                const parseRow = (r) => r.split('|').slice(1, -1).map(c => c.trim());
                const rawHeaders = parseRow(rows[0]);
                // Automatically strip any markdown links or HTML <a> tags from table headings
                const headers = rawHeaders.map(h => 
                    h.replace(/(?<!\!)\[([^\]]+)\]\([^)]+\)/g, '$1')
                     .replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1')
                );
                const dataRows = rows.slice(2).map(r => parseRow(r));

                htmlParts.push(`
                    <div class="my-8 overflow-x-auto border border-gray-200 shadow-xs">
                        <table class="w-full text-left text-xs sm:text-sm border-collapse bg-white">
                            <thead>
                                <tr class="bg-[#2f4220] text-white">
                                    ${headers.map(h => `<th class="p-3 sm:p-4 font-bold uppercase tracking-wider text-[11px] border-r border-[#3b5327] last:border-0 text-white">${formatInlineText(h)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${dataRows.map((r, rIdx) => `
                                    <tr class="${rIdx % 2 === 0 ? 'bg-white' : 'bg-[#f5f8f2]/40'} hover:bg-[#e8efe2]/40 transition-colors">
                                        ${r.map(cell => `<td class="p-3 sm:p-4 text-gray-700 border-r border-gray-100 last:border-0 leading-relaxed">${formatInlineText(cell)}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `);
            }
        }
        // 10. Code block / ASCII diagram ``` ... ```
        else if (blockText.startsWith('```')) {
            const lines = blockText.split('\n');
            const firstLine = lines[0].replace(/^```/, '').trim();
            const codeBody = lines.slice(1, -1).join('\n');
            let escaped = codeBody.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Detect if this is an ASCII clinical / biochemical flowchart
            const isDiagram = /\[[^\]]+\]/.test(codeBody) && /(?:──►|─►|──>|-->|-&gt;|--&gt;|→|▼|↓|⬇|│|\|)/.test(codeBody);

            if (isDiagram) {
                const title = firstLine || 'Biochemical Mechanism & Clinical Pathway';
                const rawLines = codeBody.split('\n');
                const extractedSteps = [];

                for (const line of rawLines) {
                    const matches = line.match(/\[([^\]]+)\]/g);
                    if (matches && matches.length > 0) {
                        const stepTitle = matches.map(m => m.slice(1, -1).trim()).join('  +  ');
                        extractedSteps.push({
                            title: stepTitle,
                            text: ''
                        });
                    }
                }

                if (extractedSteps.length > 0) {
                    htmlParts.push(`
                        <div class="my-8 border border-[#587a3b]/30 bg-[#f7faf4] rounded-none shadow-xs">
                            <div class="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#e8efe2] border-b border-[#587a3b]/20">
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 bg-[#587a3b] inline-block"></span>
                                    <span class="font-display font-bold text-xs uppercase tracking-wider text-[#2f4220]">${title}</span>
                                </div>
                                <span class="text-[10px] font-mono text-[#587a3b] uppercase tracking-widest font-bold">${extractedSteps.length} Steps</span>
                            </div>
                            <div class="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                ${extractedSteps.map((step, idx) => `
                                    <div class="flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-white border border-gray-200 rounded-none shadow-xs hover:border-[#587a3b]/50 transition-colors">
                                        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-[#2f4220] text-white flex items-center justify-center font-bold text-xs sm:text-sm font-mono shrink-0 shadow-xs">
                                            ${(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div class="space-y-1 flex-1 min-w-0">
                                            <h4 class="font-display font-bold text-sm sm:text-base text-gray-900 leading-snug">${formatInlineText(step.title)}</h4>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `);
                    lastIndex = match.index + match[0].length;
                    continue;
                }
            } else {
                const title = firstLine || 'PROTOCOL SUMMARY';
                htmlParts.push(`
                    <div class="my-6 max-w-3xl mx-auto border border-gray-200 bg-[#f8faf6] shadow-xs">
                        <div class="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-mono text-gray-700">
                            <span>${title}</span>
                            <span class="text-[10px] text-gray-500 uppercase tracking-wider">Protocol Data</span>
                        </div>
                        <div class="p-4 overflow-x-auto">
                            <pre class="font-mono text-xs leading-relaxed whitespace-pre text-gray-800 font-normal">${escaped}</pre>
                        </div>
                    </div>
                `);
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < raw.length) {
        processTextSegment(raw.substring(lastIndex));
    }

    return {
        html: htmlParts.join('\n'),
        headings,
        faqs: extractedFaqs,
        hasQuellen: hasQuellenBlock
    };
}
