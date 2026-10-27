/**
 * CMS Section Parser & Composer for Natura Bliss
 * Bridges structured section fields with raw unified Markdown.
 */

export function parseCmsSections(content, excerpt = '') {
    let raw = (content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Takeaways
    let takeawaysHeading = '';
    let takeawaysLead = '';
    const takeawaysItems = [];
    const takeawaysMatch = raw.match(/:::takeaways(?:\s+([^\n]+))?([\s\S]*?):::/i);
    if (takeawaysMatch) {
        if (takeawaysMatch[1] && takeawaysMatch[1].trim()) {
            takeawaysHeading = takeawaysMatch[1].trim();
        }
        const lines = (takeawaysMatch[2] || '').trim().split('\n').map(l => l.trim()).filter(Boolean);
        const leadLines = [];
        lines.forEach(line => {
            if (line.startsWith('- ') || line.startsWith('* ')) {
                takeawaysItems.push(line.replace(/^[-*]\s+/, '').trim());
            } else if (!takeawaysHeading && (line.startsWith('## ') || line.startsWith('# '))) {
                takeawaysHeading = line.replace(/^#+\s*/, '').trim();
            } else {
                leadLines.push(line);
            }
        });
        takeawaysLead = leadLines.join('\n\n');
        raw = raw.replace(takeawaysMatch[0], '').trim();
    }

    // 2. Sources (Quellen)
    const authoritativeResources = [];
    let standDate = '';
    const quellenMatch = raw.match(/:::quellen([\s\S]*?):::/i);
    if (quellenMatch) {
        const lines = quellenMatch[1].trim().split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(line => {
            const item = line.replace(/^[-*]\s+/, '').trim();
            if (/^stand\s*:\s*/i.test(item)) {
                standDate = item.replace(/^stand\s*:\s*/i, '').trim();
            } else if (item) {
                authoritativeResources.push(item);
            }
        });
        raw = raw.replace(quellenMatch[0], '').trim();
    }

    // 3. FAQs
    const faqs = [];
    const faqMatch = raw.match(/:::faq([\s\S]*?):::/i);
    if (faqMatch) {
        const lines = faqMatch[1].trim().split('\n');
        let currentQ = '';
        let currentA = [];

        const pushFaq = () => {
            if (currentQ) {
                faqs.push({ q: currentQ, a: currentA.join(' ').trim() });
                currentQ = '';
                currentA = [];
            }
        };

        lines.forEach(line => {
            const trimmed = line.trim();
            if (/^[FA]\s*:\s*/i.test(trimmed) || /^(Frage|Question)\s*:\s*/i.test(trimmed)) {
                if (trimmed.toUpperCase().startsWith('F:') || /^(Frage|Question)\s*:\s*/i.test(trimmed)) {
                    pushFaq();
                    currentQ = trimmed.replace(/^(?:F|Frage|Question)\s*:\s*/i, '').trim();
                } else {
                    currentA.push(trimmed.replace(/^(?:A|Antwort|Answer)\s*:\s*/i, '').trim());
                }
            } else if (trimmed) {
                if (currentQ && currentA.length === 0 && !trimmed.startsWith('A:')) {
                    currentA.push(trimmed);
                } else if (currentQ) {
                    currentA.push(trimmed);
                }
            }
        });
        pushFaq();
        raw = raw.replace(faqMatch[0], '').trim();
    }

    // 4. CTA
    let bottomCtaHeading = '';
    let bottomCtaParagraph = '';
    let bottomCtaButton = '';
    let bottomCtaUrl = '';
    const ctaMatch = raw.match(/:::cta([\s\S]*?):::/i);
    if (ctaMatch) {
        const parts = ctaMatch[1].trim().split('|').map(p => p.trim());
        if (parts.length >= 5) {
            bottomCtaHeading = parts[1] || '';
            bottomCtaParagraph = parts[2] || '';
            bottomCtaUrl = parts[3] || '/collection';
            bottomCtaButton = parts[4] || 'Explore Products';
        } else if (parts.length >= 3) {
            bottomCtaHeading = parts[0] || '';
            bottomCtaParagraph = parts[1] || '';
            bottomCtaUrl = parts[2] || '/collection';
            bottomCtaButton = parts[3] || 'Explore Products';
        }
        raw = raw.replace(ctaMatch[0], '').trim();
    }

    return {
        summary: excerpt || '',
        keyTakeawaysHeading: takeawaysHeading || 'KEY TAKEAWAYS',
        keyTakeawaysLead: takeawaysLead,
        keyTakeawaysItems: takeawaysItems,
        body: raw.trim(),
        authoritativeResources,
        standDate,
        faqs,
        bottomCtaHeading,
        bottomCtaParagraph,
        bottomCtaButton,
        bottomCtaUrl
    };
}

export function composeCmsSections({
    body = '',
    summary = '',
    keyTakeawaysHeading = '',
    keyTakeawaysLead = '',
    keyTakeawaysItems = [],
    authoritativeResources = [],
    standDate = '',
    faqs = [],
    bottomCtaHeading = '',
    bottomCtaParagraph = '',
    bottomCtaButton = '',
    bottomCtaUrl = ''
}) {
    const parts = [];

    // 1. Key Takeaways
    if ((keyTakeawaysItems && keyTakeawaysItems.length > 0) || keyTakeawaysLead || keyTakeawaysHeading) {
        const itemLines = (keyTakeawaysItems || [])
            .map(i => typeof i === 'string' ? i.trim() : (i?.text || '').trim())
            .filter(Boolean)
            .map(i => `- ${i}`)
            .join('\n');

        const headingPart = keyTakeawaysHeading && keyTakeawaysHeading.trim() ? ` ${keyTakeawaysHeading.trim()}` : '';
        parts.push(`:::takeaways${headingPart}\n${keyTakeawaysLead ? keyTakeawaysLead.trim() + '\n' : ''}${itemLines}\n:::`);
    }

    // 2. Body
    if (body && body.trim()) {
        parts.push(body.trim());
    }

    // 3. Authoritative Resources
    if (authoritativeResources && authoritativeResources.length > 0) {
        const resLines = authoritativeResources
            .map(r => typeof r === 'string' ? r.trim() : (r?.text || '').trim())
            .filter(Boolean)
            .map(r => `- ${r}`)
            .join('\n');

        const stand = standDate ? `\n- Stand: ${standDate.trim()}` : '';
        parts.push(`:::quellen\n${resLines}${stand}\n:::`);
    }

    // 4. CTA
    if (bottomCtaHeading || bottomCtaParagraph) {
        const heading = bottomCtaHeading || 'Explore Natura Bliss Remedies';
        const para = bottomCtaParagraph || '100% natural, cold-pressed botanical oils crafted for visible radiance.';
        const url = bottomCtaUrl || '/collection';
        const btn = bottomCtaButton || 'Shop Remedies';
        parts.push(`:::cta\nNATURA BLISS RITUALS | ${heading} | ${para} | ${url} | ${btn}\n:::`);
    }

    // 5. FAQs
    if (faqs && faqs.length > 0) {
        const faqLines = faqs
            .filter(f => f && (f.q || f.a))
            .map(f => `F: ${(f.q || '').trim()}\nA: ${(f.a || '').trim()}\n`)
            .join('\n')
            .trim();

        if (faqLines) {
            parts.push(`:::faq\n${faqLines}\n:::`);
        }
    }

    return parts.join('\n\n');
}
