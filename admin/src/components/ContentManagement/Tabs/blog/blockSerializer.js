/**
 * Block Serializer for Natura Bliss WordPress-style CMS Blog Editor
 * Bidirectional conversion between raw Markdown and visual Block data models.
 */

// Generate a lightweight unique ID
export const generateBlockId = () => {
    return 'blk_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export function markdownToBlocks(markdownContent) {
    if (!markdownContent || typeof markdownContent !== 'string') {
        return [
            {
                id: generateBlockId(),
                type: 'paragraph',
                content: ''
            }
        ];
    }

    const blocks = [];
    const normalized = markdownContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Regex to match custom block tags and markdown tables
    const blockRegex = /(:::takeaways[\s\S]*?:::|:::tipp(?:\s+[^\n]+)?[\s\S]*?:::|:::warnung(?:\s+[^\n]+)?[\s\S]*?:::|:::steps(?:\s+[^\n]+)?[\s\S]*?:::|:::schritte(?:\s+[^\n]+)?[\s\S]*?:::|:::grid[\s\S]*?:::|:::cta[\s\S]*?:::|:::faq[\s\S]*?:::|:::quellen[\s\S]*?:::|(?:^\|[^\n]+\|\n?)+)/gm;

    let lastIndex = 0;
    let match;

    const processTextSegment = (textSegment) => {
        if (!textSegment) return;
        const paragraphs = textSegment.split(/\n{2,}/);

        for (const p of paragraphs) {
            const trimmed = p.trim();
            if (!trimmed) continue;

            // Image: ![alt](url)
            const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            if (imgMatch) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'image',
                    alt: imgMatch[1] || '',
                    url: imgMatch[2] || '',
                    caption: imgMatch[1] || ''
                });
                continue;
            }

            // Headings
            const h4Match = trimmed.match(/^####\s+(.+)$/m);
            if (h4Match) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'heading',
                    level: 4,
                    content: h4Match[1].trim()
                });
                continue;
            }

            const h3Match = trimmed.match(/^###\s+(.+)$/m);
            if (h3Match) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'heading',
                    level: 3,
                    content: h3Match[1].trim()
                });
                continue;
            }

            const h2Match = trimmed.match(/^##\s+(.+)$/m);
            if (h2Match) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'heading',
                    level: 2,
                    content: h2Match[1].trim()
                });
                continue;
            }

            const h1Match = trimmed.match(/^#\s+(.+)$/m);
            if (h1Match) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'heading',
                    level: 1,
                    content: h1Match[1].trim()
                });
                continue;
            }

            // Blockquote: > ...
            if (trimmed.startsWith('>')) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'quote',
                    content: trimmed.replace(/^>\s*/gm, '').trim()
                });
                continue;
            }

            // Bullet List
            if (trimmed.split('\n').every(line => /^[-*]\s+/.test(line.trim()))) {
                const items = trimmed.split('\n').map(l => l.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
                blocks.push({
                    id: generateBlockId(),
                    type: 'list',
                    style: 'bullet',
                    items: items.length > 0 ? items : ['Key point']
                });
                continue;
            }

            // Numbered List
            if (trimmed.split('\n').every(line => /^\d+\.\s+/.test(line.trim()))) {
                const items = trimmed.split('\n').map(l => l.replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
                blocks.push({
                    id: generateBlockId(),
                    type: 'list',
                    style: 'numbered',
                    items: items.length > 0 ? items : ['First step']
                });
                continue;
            }

            // Divider: ---
            if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'divider'
                });
                continue;
            }

            // Default: Paragraph
            blocks.push({
                id: generateBlockId(),
                type: 'paragraph',
                content: trimmed
            });
        }
    };

    while ((match = blockRegex.exec(normalized)) !== null) {
        const textBefore = normalized.substring(lastIndex, match.index);
        processTextSegment(textBefore);

        const blockText = match[0].trim();

        // 1. Takeaways
        if (blockText.startsWith(':::takeaways')) {
            const firstLineEnd = blockText.indexOf('\n');
            let heading = 'KEY TAKEAWAYS';
            let body = '';
            if (firstLineEnd !== -1) {
                const h = blockText.substring(12, firstLineEnd).trim();
                if (h) heading = h;
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

            blocks.push({
                id: generateBlockId(),
                type: 'takeaways',
                heading,
                lead: leadLines.join('\n\n'),
                items: items.length > 0 ? items : ['Core takeaway point']
            });
        }
        // 2. Tipp
        else if (blockText.startsWith(':::tipp')) {
            const firstLineEnd = blockText.indexOf('\n');
            let title = 'Expert Botanical Tip';
            let body = '';
            if (firstLineEnd !== -1) {
                const t = blockText.substring(7, firstLineEnd).trim();
                if (t) title = t;
                body = blockText.substring(firstLineEnd, blockText.length - 3).trim();
            } else {
                body = blockText.replace(/^:::tipp/i, '').replace(/:::$/i, '').trim();
            }

            blocks.push({
                id: generateBlockId(),
                type: 'tipp',
                title,
                body
            });
        }
        // 3. Warnung
        else if (blockText.startsWith(':::warnung')) {
            const firstLineEnd = blockText.indexOf('\n');
            let title = 'Important Notice';
            let body = '';
            if (firstLineEnd !== -1) {
                const t = blockText.substring(10, firstLineEnd).trim();
                if (t) title = t;
                body = blockText.substring(firstLineEnd, blockText.length - 3).trim();
            } else {
                body = blockText.replace(/^:::warnung/i, '').replace(/:::$/i, '').trim();
            }

            blocks.push({
                id: generateBlockId(),
                type: 'warnung',
                title,
                body
            });
        }
        // 4. Schritte / Steps
        else if (blockText.startsWith(':::steps') || blockText.startsWith(':::schritte')) {
            const isSteps = blockText.startsWith(':::steps');
            const prefix = isSteps ? ':::steps' : ':::schritte';
            const firstLineEnd = blockText.indexOf('\n');
            let body = '';
            if (firstLineEnd !== -1) {
                body = blockText.substring(firstLineEnd, blockText.length - 3).trim();
            } else {
                body = blockText.replace(new RegExp(`^${prefix}`, 'i'), '').replace(/:::$/i, '').trim();
            }

            const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
            const steps = lines.map((l, idx) => {
                if (l.includes('|')) {
                    const parts = l.split('|').map(p => p.trim());
                    return {
                        num: idx + 1,
                        title: parts[0] ? parts[0].replace(/^\d+[\.\)\-]\s*/, '').replace(/^\*\*|\*\*$/g, '').trim() : `Step ${idx + 1}`,
                        text: parts.slice(1).join(' | ').trim()
                    };
                }
                const boldMatch = l.match(/^\d+[\.\)\-]\s*\*\*(.+?)\*\*[:\s\-–—]+(.+)$/);
                if (boldMatch) {
                    return {
                        num: idx + 1,
                        title: boldMatch[1].trim(),
                        text: boldMatch[2].trim()
                    };
                }
                return {
                    num: idx + 1,
                    title: `Step ${idx + 1}`,
                    text: l.replace(/^\d+[\.\)\-]\s*/, '').trim()
                };
            });

            blocks.push({
                id: generateBlockId(),
                type: 'schritte',
                steps: steps.length > 0 ? steps : [{ num: 1, title: 'Step 1', text: 'Step details' }]
            });
        }
        // 5. Grid
        else if (blockText.startsWith(':::grid')) {
            const body = blockText.replace(/^:::grid/i, '').replace(/:::$/i, '').trim();
            const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
            const cards = lines.map(l => {
                const parts = l.split('|').map(p => p.trim());
                return {
                    kicker: parts[0] || 'Ritual',
                    title: parts[1] || 'Guideline',
                    text: parts[2] || ''
                };
            });

            blocks.push({
                id: generateBlockId(),
                type: 'grid',
                cards: cards.length > 0 ? cards : [{ kicker: 'Ritual', title: 'Card Title', text: 'Card text' }]
            });
        }
        // 6. CTA
        else if (blockText.startsWith(':::cta')) {
            const body = blockText.replace(/^:::cta/i, '').replace(/:::$/i, '').trim();
            const parts = body.split('|').map(p => p.trim());
            blocks.push({
                id: generateBlockId(),
                type: 'cta',
                kicker: parts[0] || 'NATURA BLISS RITUALS',
                title: parts[1] || 'Experience Pure Organic Care',
                subtitle: parts[2] || 'Handcrafted cold-pressed remedies.',
                url: parts[3] || '/collection',
                label: parts[4] || 'Explore Products'
            });
        }
        // 7. FAQ
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
                if (/^[FA]\s*:\s*/i.test(trimmed)) {
                    if (trimmed.toUpperCase().startsWith('F:')) {
                        flush();
                        currQ = trimmed.replace(/^F\s*:\s*/i, '').trim();
                    } else {
                        currA.push(trimmed.replace(/^A\s*:\s*/i, '').trim());
                    }
                } else if (trimmed) {
                    currA.push(trimmed);
                }
            });
            flush();

            blocks.push({
                id: generateBlockId(),
                type: 'faq',
                faqs: faqs.length > 0 ? faqs : [{ q: 'Question?', a: 'Answer.' }]
            });
        }
        // 8. Quellen
        else if (blockText.startsWith(':::quellen')) {
            const body = blockText.replace(/^:::quellen/i, '').replace(/:::$/i, '').trim();
            const sources = body.split('\n').map(l => l.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
            blocks.push({
                id: generateBlockId(),
                type: 'quellen',
                sources: sources.length > 0 ? sources : ['Scientific Reference 1']
            });
        }
        // 9. Markdown Table
        else if (blockText.startsWith('|')) {
            const rows = blockText.split('\n').map(l => l.trim()).filter(Boolean);
            if (rows.length >= 2) {
                const parseRow = (r) => r.split('|').slice(1, -1).map(c => c.trim());
                const headers = parseRow(rows[0]);
                const dataRows = rows.slice(2).map(r => parseRow(r));
                blocks.push({
                    id: generateBlockId(),
                    type: 'table',
                    headers,
                    rows: dataRows
                });
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < normalized.length) {
        processTextSegment(normalized.substring(lastIndex));
    }

    return blocks.length > 0 ? blocks : [{ id: generateBlockId(), type: 'paragraph', content: '' }];
}

export function blocksToMarkdown(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '';

    const parts = [];

    blocks.forEach(block => {
        if (!block) return;

        switch (block.type) {
            case 'paragraph':
                if (block.content && block.content.trim()) {
                    parts.push(block.content.trim());
                }
                break;

            case 'heading':
                if (block.content && block.content.trim()) {
                    const prefix = '#'.repeat(Math.min(6, Math.max(1, block.level || 2)));
                    parts.push(`${prefix} ${block.content.trim()}`);
                }
                break;

            case 'quote':
                if (block.content && block.content.trim()) {
                    const quoteLines = block.content.trim().split('\n').map(l => `> ${l}`).join('\n');
                    parts.push(quoteLines);
                }
                break;

            case 'list':
                if (block.items && block.items.length > 0) {
                    const isNum = block.style === 'numbered';
                    const listLines = block.items
                        .filter(Boolean)
                        .map((item, idx) => isNum ? `${idx + 1}. ${item}` : `- ${item}`)
                        .join('\n');
                    if (listLines) parts.push(listLines);
                }
                break;

            case 'image':
                if (block.url) {
                    const alt = block.alt || block.caption || '';
                    parts.push(`![${alt}](${block.url})`);
                }
                break;

            case 'divider':
                parts.push('---');
                break;

            case 'takeaways': {
                const heading = block.heading && block.heading.trim() ? ` ${block.heading.trim()}` : '';
                const lead = block.lead && block.lead.trim() ? `${block.lead.trim()}\n` : '';
                const items = (block.items || []).filter(Boolean).map(i => `- ${i}`).join('\n');
                parts.push(`:::takeaways${heading}\n${lead}${items}\n:::`);
                break;
            }

            case 'tipp': {
                const title = block.title && block.title.trim() ? ` ${block.title.trim()}` : '';
                const body = block.body || '';
                parts.push(`:::tipp${title}\n${body.trim()}\n:::`);
                break;
            }

            case 'warnung': {
                const title = block.title && block.title.trim() ? ` ${block.title.trim()}` : '';
                const body = block.body || '';
                parts.push(`:::warnung${title}\n${body.trim()}\n:::`);
                break;
            }

            case 'schritte': {
                const stepsLines = (block.steps || []).map((s, idx) => `${idx + 1}. ${s.title || `Step ${idx + 1}`} | ${s.text || ''}`).join('\n');
                parts.push(`:::schritte\n${stepsLines}\n:::`);
                break;
            }

            case 'grid': {
                const cardLines = (block.cards || []).map(c => `${c.kicker || 'Ritual'} | ${c.title || 'Guideline'} | ${c.text || ''}`).join('\n');
                parts.push(`:::grid\n${cardLines}\n:::`);
                break;
            }

            case 'cta': {
                const k = block.kicker || 'NATURA BLISS RITUALS';
                const t = block.title || 'Experience Pure Organic Care';
                const st = block.subtitle || 'Handcrafted cold-pressed remedies.';
                const u = block.url || '/collection';
                const l = block.label || 'Explore Products';
                parts.push(`:::cta\n${k} | ${t} | ${st} | ${u} | ${l}\n:::`);
                break;
            }

            case 'faq': {
                const faqLines = (block.faqs || []).map(f => `F: ${f.q || ''}\nA: ${f.a || ''}\n`).join('\n').trim();
                if (faqLines) parts.push(`:::faq\n${faqLines}\n:::`);
                break;
            }

            case 'quellen': {
                const srcLines = (block.sources || []).filter(Boolean).map(s => `- ${s}`).join('\n');
                if (srcLines) parts.push(`:::quellen\n${srcLines}\n:::`);
                break;
            }

            case 'table': {
                const headers = block.headers || ['Column 1', 'Column 2'];
                const rows = block.rows || [];
                const headerLine = `| ${headers.join(' | ')} |`;
                const sepLine = `| ${headers.map(() => ':---').join(' | ')} |`;
                const rowLines = rows.map(r => `| ${(headers.map((_, idx) => r[idx] || '')).join(' | ')} |`);
                parts.push([headerLine, sepLine, ...rowLines].join('\n'));
                break;
            }

            default:
                break;
        }
    });

    return parts.join('\n\n');
}
