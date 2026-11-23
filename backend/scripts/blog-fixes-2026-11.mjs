/**
 * Blog content fixes, November 2026 (SEO / AEO / GEO / E-E-A-T audit).
 *
 * Pure transform: fixBlog(blog, pubmed) -> { changes, log }. No DB access here, so it can be
 * dry-run against a JSON export. See run-blog-fixes.mjs for the DB runner.
 *
 * What it does, per post:
 *  - Replaces citations that pointed at unrelated PubMed/PMC records with the correct record
 *    (built from PubMed metadata), and removes citations that could not be verified.
 *  - Removes "sources" that only link to an agency homepage (PSQCA, DRAP, PCRWR, …): the cited
 *    documents could not be found.
 *  - Rewrites unsourced statistics, overstated claims, unsafe advice, and evidence that was
 *    applied to the wrong population (men-only trials presented as evidence for women).
 *  - Replaces "protocol" wording, fixes the "Stand:" leftover, honest author byline.
 *  - New H1 / meta title (<=60) / meta description (<=155), a "Quick answer" paragraph at the
 *    top for answer engines, and a "Related guides" block linking posts within a topic cluster.
 */

import { FAQ_EDITS } from './blog-faq-fixes-2026-11.mjs';

const TODAY = '23 November 2026';

// ---------------------------------------------------------------------------------------------
// Citations: old identifier found in a source line -> correct PubMed ID (line rebuilt from
// PubMed metadata). `null` removes the line.
// ---------------------------------------------------------------------------------------------
export const CITATION_FIXES = {
  '16806841': '16887338',   // Proksch, eczema barrier
  '19168000': '19167997',   // Viola, olive oil
  '18492160': '18492181',   // Villarama, glutathione
  '23749111': '23749111',   // D'Orazio: right paper, embellished title
  '30538416': '30607038',   // Kumar, premature graying
  '16382666': '16382662',   // Ro & Dawson
  '25056708': '25442918',   // Mahmoudvand, Nigella sativa antifungal
  '19127734': '19090349',   // Kiran & Asad, sesame wound healing
  '23834311': '24455742',   // Piérard-Franchimont
  '23682614': '23682615',   // Gizlenti
  '22440838': '22440736',   // Garza PGD2
  '20664655': '20664556',   // Vierkötter
  '27720464': '27720464',   // Krutmann: right paper, embellished title
  '27150742': '18080873',   // "Castor oil in dermatology" does not exist -> CIR castor oil safety assessment
  'PMC3920210': ['24574692', '27654734'], // Srinivasan 2013 + Luqman 2016 (Pakistan)
  '25424562': '17147559',   // vitamin K dark circles -> Mitsuishi 2004
  '23205543': '22235888',   // Manosroi rice bran
  '1398218': '1398220',     // Graf ferulic acid
  'PMC4387693': '25878443', // Gavazzoni Dias: right paper, embellished title
  'PMC2921758': '20725554', // Davis & Callender PIH
  'PMC6041537': null,       // PCOS prevalence paper: not found
};
export const ALL_PMIDS = [...new Set(Object.values(CITATION_FIXES).flat().filter(Boolean))];

export function citationLine(r) {
  const authors = (r.authors || []).map(a => a.name);
  const first = authors[0] || r.sortfirstauthor || '';
  const who = authors.length > 2 ? `${first} et al.` : authors.join(' & ');
  const year = (r.pubdate || '').slice(0, 4);
  const title = (r.title || '').replace(/\.$/, '');
  const vol = r.volume ? `, ${r.volume}${r.issue ? `(${r.issue})` : ''}` : '';
  const pages = r.pages ? `, ${r.pages}` : '';
  return `- ${who} (${year}): *${title}*. ${r.fulljournalname || r.source}${vol}${pages}. [PubMed: ${r.uid}](https://pubmed.ncbi.nlm.nih.gov/${r.uid}/)`;
}

// Source lines whose only link is a homepage (document could not be located) are removed.
const HOMEPAGE_SOURCE = /\]\(https?:\/\/(www\.)?(psqca\.com\.pk|dra\.gov\.pk|pcrwr\.gov\.pk|pmd\.gov\.pk|nih\.org\.pk|environment\.gov\.pk|jpad\.com\.pk|scholarsresearchlibrary\.com|pubmed\.ncbi\.nlm\.nih\.gov|academic\.oup\.com\/bjd|who\.int)\/?\)/;

// ---------------------------------------------------------------------------------------------
// Per-post metadata, quick answers and cluster links
// ---------------------------------------------------------------------------------------------
export const POSTS = {
  'rosemary-oil-hair-growth-pakistan-guide': {
    title: 'Rosemary Oil for Hair Growth in Pakistan: What the Evidence Really Says',
    metaTitle: 'Rosemary Oil for Hair Growth: Evidence & Use | Natura Bliss',
    metaDescription: 'Does rosemary oil regrow hair? What the 2015 minoxidil trial found, who it was tested on, how to use rosemary oil safely and how long results take.',
    quick: 'Rosemary oil may help mild hair thinning, but the evidence is limited. The best-known study (2015) compared rosemary essential oil with 2% minoxidil in 100 men and found similar hair counts after 6 months, with less scalp itching. It hasn’t been properly tested in women. Use a diluted oil 2–3 times a week and give it 3–6 months.',
    related: ['pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker', 'male-baldness-receding-hairline-patchy-beard-blackseed-rosemary-pakistan', 'postpartum-hair-fall-delivery-telogen-effluvium-pakistan-804-serum', 'hard-water-hair-fall-solution-pakistan-karachi-lahore'],
  },
  'pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker': {
    title: 'PCOS Hair Thinning in Pakistani Women: Causes, Treatments and Natural Scalp Care',
    metaTitle: 'PCOS Hair Thinning: Causes & What Helps | Natura Bliss',
    metaDescription: 'Why PCOS causes hair thinning, which treatments have evidence, what natural oils can and can’t do, and when to see a doctor in Pakistan.',
    quick: 'PCOS hair thinning is driven by higher androgen levels, so the treatments that work best act on hormones and are prescribed by a doctor or gynaecologist. Scalp oils such as rosemary or pumpkin seed oil can support scalp care, but the trials behind them were done in men. Get your hormones, iron and thyroid checked first.',
    related: ['rosemary-oil-hair-growth-pakistan-guide', 'postpartum-hair-fall-delivery-telogen-effluvium-pakistan-804-serum', 'hard-water-hair-fall-solution-pakistan-karachi-lahore'],
  },
  'male-baldness-receding-hairline-patchy-beard-blackseed-rosemary-pakistan': {
    title: 'Male Hair Thinning and Patchy Beard in Pakistan: A Kalonji and Rosemary Oil Guide',
    metaTitle: 'Male Hair Thinning & Patchy Beard: What Helps | Natura Bliss',
    metaDescription: 'Receding hairline or patchy beard? What rosemary and kalonji oil can realistically do for Pakistani men, how to use them and when to see a dermatologist.',
    quick: 'For male-pattern hair loss, rosemary oil has the best natural evidence: in a 2015 trial of 100 men it matched 2% minoxidil after 6 months. Evidence for kalonji (blackseed) oil is weaker. Oils won’t regrow fully bald areas, and a patchy beard is mostly genetic. If hair loss is fast or patchy, see a dermatologist.',
    related: ['rosemary-oil-hair-growth-pakistan-guide', 'severe-dandruff-rusi-scalp-folliculitis-pakistan-neem-blackseed', 'premature-grey-hair-sufaid-baal-pakistan-kalonji-sesame-oil-guide'],
  },
  'postpartum-hair-fall-delivery-telogen-effluvium-pakistan-804-serum': {
    title: 'Postpartum Hair Fall in Pakistan: Why It Happens After Delivery and What Helps',
    metaTitle: 'Postpartum Hair Fall: Causes & What Helps | Natura Bliss',
    metaDescription: 'Hair falling out 2–4 months after delivery? Why postpartum shedding happens, how long it lasts, gentle care for new mothers and when to see a doctor.',
    quick: 'Postpartum hair fall (telogen effluvium) is common and usually temporary. Hair held in the growth phase during pregnancy sheds together about 2–4 months after delivery, and most women see normal thickness return within 6–12 months. Gentle washing, light oiling and checking for anaemia help. See a doctor if heavy shedding lasts beyond a year.',
    related: ['rosemary-oil-hair-growth-pakistan-guide', 'pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker', 'hard-water-hair-fall-solution-pakistan-karachi-lahore'],
  },
  'hard-water-hair-fall-solution-pakistan-karachi-lahore': {
    title: 'Hard Water Hair Fall in Karachi, Lahore and Islamabad: What Actually Helps',
    metaTitle: 'Hard Water Hair Fall in Pakistan: What Helps | Natura Bliss',
    metaDescription: 'Does hard water cause hair fall? What studies show, how to test your tap water’s TDS at home, and simple routines to protect hair in Pakistani cities.',
    quick: 'Hard water doesn’t usually make hair fall from the root, but it can leave hair rough, dull and more likely to break. A 2016 study from Pakistan found hair washed in hard water lost strength. Test your water with a TDS meter, use a gentle shampoo, oil before washing and consider a shower filter.',
    related: ['rosemary-oil-hair-growth-pakistan-guide', 'split-ends-heat-damage-straightener-pakistan-coconut-kre-bio-guide', 'fixing-rebonded-bleached-frizzy-hair-pakistan-keratin-biotin', 'severe-dandruff-rusi-scalp-folliculitis-pakistan-neem-blackseed'],
  },
  'severe-dandruff-rusi-scalp-folliculitis-pakistan-neem-blackseed': {
    title: 'Severe Dandruff (Rusi) and Itchy Scalp in Pakistan: A Neem and Kalonji Guide',
    metaTitle: 'Severe Dandruff (Rusi): Causes & Natural Care | Natura Bliss',
    metaDescription: 'What causes stubborn dandruff (rusi/khushki), how neem and kalonji fit into a scalp routine, and when you need a medicated antifungal shampoo instead.',
    quick: 'Most stubborn dandruff is linked to Malassezia, a yeast that feeds on scalp oil. Medicated shampoos with ketoconazole or zinc pyrithione are the proven treatment. Neem and kalonji show antifungal activity in lab studies and can support a gentle routine. See a doctor for painful bumps, hair loss or scaling beyond the hairline.',
    related: ['hard-water-hair-fall-solution-pakistan-karachi-lahore', 'neem-soap-benefits-cystic-acne-pakistan-monsoon', 'male-baldness-receding-hairline-patchy-beard-blackseed-rosemary-pakistan'],
  },
  'premature-grey-hair-sufaid-baal-pakistan-kalonji-sesame-oil-guide': {
    title: 'Premature Grey Hair (Sufaid Baal) in Pakistan: Causes and What You Can Do',
    metaTitle: 'Premature Grey Hair (Sufaid Baal) Causes | Natura Bliss',
    metaDescription: 'Why hair turns grey early, which causes can be checked (B12, thyroid, iron), and what kalonji and sesame oil can and can’t do for sufaid baal.',
    quick: 'Premature greying is mostly genetic, but low vitamin B12, thyroid problems, low iron and smoking can contribute. Grey hairs generally don’t turn black again, and no oil is proven to reverse greying. Get B12 and thyroid levels checked, avoid smoking, and use gentle oils such as sesame or kalonji for scalp care.',
    related: ['hard-water-hair-fall-solution-pakistan-karachi-lahore', 'rosemary-oil-hair-growth-pakistan-guide', 'male-baldness-receding-hairline-patchy-beard-blackseed-rosemary-pakistan'],
  },
  'split-ends-heat-damage-straightener-pakistan-coconut-kre-bio-guide': {
    title: 'Split Ends (Do-Munhe Baal) and Straightener Damage: A Coconut Oil and Kre-Bio Guide',
    metaTitle: 'Split Ends (Do-Munhe Baal) & Heat Damage Care | Natura Bliss',
    metaDescription: 'Can split ends be repaired? Why straighteners damage hair, how coconut oil helps prevent breakage, and a simple routine for Pakistani heat and humidity.',
    quick: 'Split ends can’t be permanently repaired: once a hair splits, trimming is the only fix. You can stop new ones forming. Coconut oil is one of the few oils shown to soak into hair and reduce protein loss when used before washing. Use a heat protectant, keep straighteners below 180°C and condition after every wash.',
    related: ['fixing-rebonded-bleached-frizzy-hair-pakistan-keratin-biotin', 'hard-water-hair-fall-solution-pakistan-karachi-lahore', 'castor-oil-eyelashes-eyebrows-hairline-pakistan'],
  },
  'fixing-rebonded-bleached-frizzy-hair-pakistan-keratin-biotin': {
    title: 'Fixing Rebonded, Bleached and Frizzy Hair in Pakistan: A Realistic Repair Routine',
    metaTitle: 'Fix Rebonded & Bleached Hair: Repair Routine | Natura Bliss',
    metaDescription: 'Hair damaged by rebonding or bleach? What can and can’t be repaired, a weekly care routine, and how to avoid more breakage in Pakistan’s humidity.',
    quick: 'Rebonding and bleach permanently break some of the bonds inside hair, so damaged lengths can’t be fully restored. Conditioners, oils and protein treatments make them smoother and less likely to snap while healthy hair grows out. Avoid further chemical treatments for a few months, detangle gently and trim damaged ends regularly.',
    related: ['split-ends-heat-damage-straightener-pakistan-coconut-kre-bio-guide', 'hard-water-hair-fall-solution-pakistan-karachi-lahore', 'rosemary-oil-hair-growth-pakistan-guide'],
  },
  'castor-oil-eyelashes-eyebrows-hairline-pakistan': {
    title: 'Castor Oil for Eyelashes, Eyebrows and Hairline: Does It Really Work?',
    metaTitle: 'Castor Oil for Lashes & Brows: Does It Work? | Natura Bliss',
    metaDescription: 'Does castor oil grow eyelashes and eyebrows? What the evidence shows, how to apply it safely near the eyes and what results to realistically expect.',
    quick: 'There’s no good clinical evidence that castor oil makes eyelashes or eyebrows grow. It does coat and condition hairs, which can make them look fuller and break less. Apply a tiny amount with a clean spoolie at night, keep it out of your eyes and patch-test first. Expect softer, healthier-looking hairs, not new ones.',
    related: ['rosemary-oil-hair-growth-pakistan-guide', 'almond-oil-dark-circles-pakistan-under-eye-treatment', 'split-ends-heat-damage-straightener-pakistan-coconut-kre-bio-guide'],
  },
  'melasma-chhaiyan-treatment-pakistan-without-steroids': {
    title: 'Melasma (Chhaiyan) in Pakistan: How to Fade Dark Patches Without Steroid Creams',
    metaTitle: 'Melasma (Chhaiyan) Without Steroids | Natura Bliss',
    metaDescription: 'What causes melasma (chhaiyan), why steroid ‘formula’ creams make it worse, and a sun-protection routine that helps fade patches safely over months.',
    quick: 'Melasma can’t be cured, but it can be faded and kept under control. Daily broad-spectrum sunscreen (SPF 30+, reapplied) is the most important step, because sun and heat trigger it. Avoid steroid or mercury ‘formula’ creams, which cause lasting damage. For stubborn patches, a dermatologist can prescribe proven treatments.',
    related: ['sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap', 'acne-scars-pih-bridal-glow-routine-pakistan-glutathione-guide', 'rice-soap-benefits-skin-whitening-pakistan-glass-skin'],
  },
  'sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap': {
    title: 'Sun Tan and Two-Tone Skin in Pakistan: A Safe Routine to Even It Out',
    metaTitle: 'Sun Tan Removal in Pakistan: A Safe Routine | Natura Bliss',
    metaDescription: 'How to fade a sun tan and two-tone skin safely in Pakistan’s heat: daily sunscreen, gentle cleansing and brightening care without bleach or steroids.',
    quick: 'A sun tan fades on its own over weeks to a few months as skin renews, as long as you stop further tanning. The key is daily sunscreen (SPF 30+) on face, neck and hands, and covering up when commuting. Gentle exfoliation and brightening products can help it fade evenly. Avoid bleach and steroid creams.',
    related: ['melasma-chhaiyan-treatment-pakistan-without-steroids', 'rice-soap-benefits-skin-whitening-pakistan-glass-skin', 'dark-knuckles-hands-feet-whitening-pakistan-safe-routine'],
  },
  'rice-soap-benefits-skin-whitening-pakistan-glass-skin': {
    title: 'Rice Soap for Glowing Skin and Sun Tan: What It Can and Can’t Do',
    metaTitle: 'Rice Soap Benefits for Skin & Sun Tan | Natura Bliss',
    metaDescription: 'What a handmade rice soap can do for dull, tanned skin, what it can’t, and how to use it in a simple routine for Pakistani weather.',
    quick: 'Rice soap is a gentle cleanser that can leave skin soft and looking brighter, and rice bran contains antioxidants such as ferulic acid. But soap is rinsed off within a minute, so on its own it won’t remove a tan or dark spots. Pair it with daily sunscreen for visible results over several weeks.',
    related: ['sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap', 'acne-scars-pih-bridal-glow-routine-pakistan-glutathione-guide', 'neem-soap-benefits-cystic-acne-pakistan-monsoon'],
  },
  'acne-scars-pih-bridal-glow-routine-pakistan-glutathione-guide': {
    title: 'Acne Marks (PIH) and Bridal Glow in Pakistan: A Safe Routine Without Mercury Creams',
    metaTitle: 'Acne Marks & Bridal Glow: Safe Routine | Natura Bliss',
    metaDescription: 'How to fade post-acne marks (PIH) before a wedding without steroid or mercury creams: a realistic 8-week routine, sunscreen rules and when to see a doctor.',
    quick: 'Dark marks left after acne (post-inflammatory hyperpigmentation) usually fade over 3–12 months, and daily sunscreen speeds this up. Start 8–12 weeks before the wedding: gentle cleanser, sunscreen every day and brightening ingredients like niacinamide or vitamin C. Never use ‘formula’ creams, which often contain steroids or mercury. Pitted scars need a dermatologist.',
    related: ['neem-soap-benefits-cystic-acne-pakistan-monsoon', 'melasma-chhaiyan-treatment-pakistan-without-steroids', 'rice-soap-benefits-skin-whitening-pakistan-glass-skin'],
  },
  'dark-knuckles-hands-feet-whitening-pakistan-safe-routine': {
    title: 'Dark Knuckles, Hands and Feet: A Safe, Bleach-Free Routine for Pakistani Skin',
    metaTitle: 'Dark Knuckles, Hands & Feet: Bleach-Free Care | Natura Bliss',
    metaDescription: 'Why knuckles, elbows and feet get darker than your face, and a gentle bleach-free routine with moisturising, exfoliation and sunscreen to even them out.',
    quick: 'Dark knuckles and feet are usually caused by friction, dryness and sun, and sometimes by insulin resistance. Moisturise twice a day, exfoliate gently once or twice a week and use sunscreen on the backs of your hands. Expect results in 6–8 weeks. Avoid bleach creams, and have velvety dark patches on the neck checked by a doctor.',
    related: ['cracked-heels-phatee-aeryan-winter-dry-hands-sesame-oil-pakistan', 'sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap', 'compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil'],
  },
  'almond-oil-dark-circles-pakistan-under-eye-treatment': {
    title: 'Almond Oil for Dark Circles: What It Can and Can’t Do',
    metaTitle: 'Almond Oil for Dark Circles: Does It Work? | Natura Bliss',
    metaDescription: 'Can almond oil remove dark circles? What causes under-eye darkness, what almond oil can realistically do, and an easy night routine for tired eyes.',
    quick: 'Almond oil won’t remove dark circles, but it can soften and moisturise thin under-eye skin so it looks less dull. Dark circles are mostly caused by genetics, thin skin, pigmentation, allergies and lack of sleep, so sleep, sunscreen and treating allergies matter more. Pat one drop of oil in gently at night.',
    related: ['castor-oil-eyelashes-eyebrows-hairline-pakistan', 'compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil', 'melasma-chhaiyan-treatment-pakistan-without-steroids'],
  },
  'neem-soap-benefits-cystic-acne-pakistan-monsoon': {
    title: 'Neem Soap for Acne in Pakistan’s Monsoon: Benefits and How to Use It',
    metaTitle: 'Neem Soap for Acne: Benefits & How to Use | Natura Bliss',
    metaDescription: 'Is neem soap good for acne? What neem’s antibacterial action can do for oily skin in humid weather, how to use it and when acne needs a dermatologist.',
    quick: 'Neem soap can help oily, breakout-prone skin. Lab studies show neem has antibacterial and anti-inflammatory effects, and a gentle cold-process soap cleans without stripping. It suits mild acne and body breakouts best. Deep, painful cystic acne needs a dermatologist: no soap can treat it on its own.',
    related: ['acne-scars-pih-bridal-glow-routine-pakistan-glutathione-guide', 'lahore-smog-skin-damage-charcoal-detox-blackheads-pakistan', 'severe-dandruff-rusi-scalp-folliculitis-pakistan-neem-blackseed'],
  },
  'lahore-smog-skin-damage-charcoal-detox-blackheads-pakistan': {
    title: 'Lahore Smog and Your Skin: Charcoal Soap and Almond Oil for Clogged Pores',
    metaTitle: 'Lahore Smog Skin Care: Clogged Pores | Natura Bliss',
    metaDescription: 'How smog season affects your skin, and a simple routine with a gentle cleanser, charcoal soap, moisturiser and sunscreen to keep pores clear in Lahore.',
    quick: 'Air pollution is linked to faster skin ageing and dark spots, and in smog season it leaves a grimy film that can clog pores. Cleanse properly every evening, use charcoal soap a few times a week if your skin is oily, moisturise to protect your skin barrier and wear sunscreen every day.',
    related: ['neem-soap-benefits-cystic-acne-pakistan-monsoon', 'compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil', 'sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap'],
  },
  'compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil': {
    title: 'Damaged Skin Barrier in Winter: How to Calm Stinging, Flaky Skin',
    metaTitle: 'Damaged Skin Barrier in Winter: Repair It | Natura Bliss',
    metaDescription: 'Skin stinging, tight and flaking in winter? Signs of a damaged skin barrier, what to stop using, and a simple repair routine with gentle oils and creams.',
    quick: 'If your skin stings even with plain moisturiser, feels tight and flakes, your skin barrier is probably damaged, often by harsh exfoliants, bleach creams or dry winter air. Stop actives and scrubs for 2–4 weeks, wash with lukewarm water, and use a simple moisturiser sealed with a thin layer of oil. Most barriers recover within weeks.',
    related: ['cracked-heels-phatee-aeryan-winter-dry-hands-sesame-oil-pakistan', 'lahore-smog-skin-damage-charcoal-detox-blackheads-pakistan', 'almond-oil-dark-circles-pakistan-under-eye-treatment'],
  },
  'cracked-heels-phatee-aeryan-winter-dry-hands-sesame-oil-pakistan': {
    title: 'Cracked Heels (Phatee Aeryan) and Dry Winter Hands: Sesame Oil and Desi Ghee Care',
    metaTitle: 'Cracked Heels (Phatee Aeryan) Winter Care | Natura Bliss',
    metaDescription: 'How to heal cracked heels and dry winter hands: an overnight routine with sesame oil and desi ghee, gloves for chores, and when cracks need a doctor.',
    quick: 'Cracked heels heal when thick, dry skin is softened and kept moisturised. Soak your feet for 10 minutes, file gently, then apply a rich oil or balm such as sesame oil or desi ghee and wear cotton socks overnight. Most cracks improve within 1–2 weeks. If you have diabetes, or cracks bleed or look infected, see a doctor.',
    related: ['compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil', 'dark-knuckles-hands-feet-whitening-pakistan-safe-routine'],
  },
};

// Product CTA banners: honest wording, and no prices (they went stale; the product page is the
// source of truth). Format: LABEL | Heading | Text | URL | Button
export const CTAS = {
  'compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil': 'WINTER BARRIER CARE | Calm Tight, Flaky Winter Skin | A simple night routine with No Frac Night Cream, sealed with a few drops of cold-pressed Olive Oil on very dry patches. | /product/no-frac-night-cream | View No Frac Night Cream',
  'split-ends-heat-damage-straightener-pakistan-coconut-kre-bio-guide': 'HEAT CARE DUO | Protect Hair From Straightener Damage | Pre-wash Virgin Cold-Pressed Coconut Oil plus Kre-Bio Shampoo & Conditioner to reduce breakage and new split ends. | /product/coconut-oil | View Virgin Coconut Oil',
  'sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap': 'EVEN-TONE ROUTINE | Help a Sun Tan Fade Evenly | Gentle cleansing with Rice Soap and brightening Gluta Shine Cream, used alongside daily sunscreen. No bleach, no steroids. | /product/gluta-shine-cream | View Gluta Shine Cream',
  'premature-grey-hair-sufaid-baal-pakistan-kalonji-sesame-oil-guide': 'SCALP CARE OILS | Nourish Your Scalp and Hair | Cold-pressed Blackseed (Kalonji) Oil and Sesame Oil for a regular oiling routine. A gentle alternative to harsh dyes; not a cure for greying. | /product/blackseed-oil | View Blackseed Oil',
  'severe-dandruff-rusi-scalp-folliculitis-pakistan-neem-blackseed': 'SCALP CARE | Gentle Care for a Flaky, Itchy Scalp | Handcrafted Neem Soap and cold-pressed Blackseed (Kalonji) Oil to support a regular scalp routine alongside a medicated shampoo if you need one. | /product/neem-soap | View Neem Soap',
  'cracked-heels-phatee-aeryan-winter-dry-hands-sesame-oil-pakistan': 'WINTER FOOT CARE | Soften Cracked Heels and Dry Hands | Traditional cold-pressed Sesame Oil (til ka tail) for an overnight soak-file-oil-socks routine. | /product/sesame-oil | View Sesame Oil',
  'postpartum-hair-fall-delivery-telogen-effluvium-pakistan-804-serum': 'GENTLE SCALP CARE | Light Care for New Mothers | A lightweight, non-greasy hair oil and serum for gentle scalp massage while postpartum shedding settles. | /product/804-hairoil-serum | View 804 Hairoil & Serum',
  'acne-scars-pih-bridal-glow-routine-pakistan-glutathione-guide': 'PRE-WEDDING SKIN CARE | A Calm, Even Glow Before Your Big Day | Gluta Fair Night Cream for your evening routine, used with daily sunscreen. No mercury, steroids or bleaching agents. | /product/gluta-fair-night-cream | View Gluta Fair Night Cream',
  'male-baldness-receding-hairline-patchy-beard-blackseed-rosemary-pakistan': 'MEN’S SCALP & BEARD OILS | Support a Healthier Scalp and Beard | Cold-pressed Blackseed (Kalonji) Oil and Rosemary Oil for regular scalp and beard massage. | /product/blackseed-oil | View Blackseed Oil',
  'lahore-smog-skin-damage-charcoal-detox-blackheads-pakistan': 'SMOG SEASON CLEANSE | Clear Away Grime and Excess Oil | Handcrafted Activated Charcoal Soap for oily skin, followed by a light moisturiser such as cold-pressed Sweet Almond Oil. | /product/charcoal-soap | View Charcoal Soap',
  'fixing-rebonded-bleached-frizzy-hair-pakistan-keratin-biotin': 'DAMAGED HAIR CARE | Softer, Smoother Treated Hair | Kre-Bio Keratin + Biotin Shampoo & Conditioner to reduce frizz and breakage while healthy hair grows out. Formaldehyde-free. | /product/kre-bio-shampoo-conditioner | View Kre-Bio Shampoo & Conditioner',
  'pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker': 'SUPPORTIVE SCALP CARE | Gentle Care for a Thinning Parting | Cold-pressed Pumpkin Seed Oil for scalp massage, alongside the treatment plan from your doctor. | /product/pumpkin-seed-oil | View Pumpkin Seed Oil',
  'castor-oil-eyelashes-eyebrows-hairline-pakistan': 'LASH & BROW CARE | Condition Lashes and Brows | 100% pure, unrefined, hexane-free Cold-Pressed Castor Oil. Apply a tiny amount with a clean spoolie at night, away from the eyes. | /product/castor-oil | View Castor Oil',
  'neem-soap-benefits-cystic-acne-pakistan-monsoon': 'MONSOON CLEANSE | Gentle Daily Cleansing for Oily Skin | Handcrafted with cold-pressed neem seed oil, neem leaf and natural glycerin. Suits mild breakouts and body acne. | /product/neem-soap | View Neem Soap',
  'hard-water-hair-fall-solution-pakistan-karachi-lahore': 'HARD WATER HAIR CARE | Gentler Washing for Hard-Water Homes | Sulfate-free Herbal Shampoo and pre-wash Onion Hair Oil to reduce roughness and breakage. | /product/herbal-shampoo | View Herbal Shampoo',
  'almond-oil-dark-circles-pakistan-under-eye-treatment': 'UNDER-EYE CARE | Soften & Moisturise Tired Under-Eyes | 100% pure, unrefined cold-pressed Sweet Almond Oil, rich in natural vitamin E. Pat one drop in at night. | /product/almond-oil | View Sweet Almond Oil',
  'dark-knuckles-hands-feet-whitening-pakistan-safe-routine': 'HANDS & FEET CARE | Softer Hands, Smoother Knuckles | Gluta Shine Cream with glutathione and kojic dipalmitate, used with gentle exfoliation and sunscreen. No bleach. | /product/gluta-shine-cream | View Gluta Shine Cream',
  'rice-soap-benefits-skin-whitening-pakistan-glass-skin': 'GENTLE GLOW CLEANSE | Soft, Fresh-Looking Skin | Handcrafted cold-process soap with rice milk and plant oils. Pair with daily sunscreen for an even tone. | /product/rice-soap | View Rice Soap',
  'melasma-chhaiyan-treatment-pakistan-without-steroids': 'STEROID-FREE NIGHT CARE | Gentle Brightening Without Steroids | Gluta Fair Night Cream with glutathione and kojic dipalmitate, used alongside strict daily sunscreen. | /product/gluta-fair-night-cream | View Gluta Fair Night Cream',
  'rosemary-oil-hair-growth-pakistan-guide': 'ROSEMARY SCALP OIL | Ready-to-Use Rosemary Scalp Oil | Cold-pressed coconut and sesame oils infused with rosemary. No dilution needed: massage into the scalp 2–3 times a week. | /product/rosemary-oil | View Rosemary Oil',
};

// Key-takeaways boxes, rewritten in full: plain language, no unsourced figures, evidence
// described accurately. Replaces the whole :::takeaways block.
export const TAKEAWAYS = {
  'rosemary-oil-hair-growth-pakistan-guide': [
    '**What the main study found**: In a 2015 trial of 100 **men** with male-pattern hair loss, rosemary essential oil gave similar hair-count gains to 2% minoxidil after 6 months, with less scalp itching. There is no equivalent trial in women yet.',
    '**How it might work**: Lab studies suggest rosemary compounds such as carnosic acid improve scalp circulation and calm inflammation, but this hasn’t been confirmed in people.',
    '**Always dilute**: Never apply pure essential oil to the scalp. [Natura Bliss Rosemary Oil](/product/rosemary-oil) is a ready-to-use infusion of rosemary in cold-pressed coconut and sesame oils.',
    '**Be patient**: In the trial, results only showed after 6 months. Use it 2–3 times a week for at least 3–6 months before judging.',
    '**See a doctor if**: hair falls out suddenly, in patches, or with other symptoms such as irregular periods or fatigue.',
  ],
  'pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker': [
    '**Why PCOS thins hair**: Higher androgen (male hormone) activity shrinks scalp follicles, typically widening the parting, while sometimes increasing facial hair.',
    '**Treat the cause first**: The most effective options act on hormones and are prescribed by a doctor or gynaecologist. Ask about hormone, thyroid and iron tests.',
    '**About pumpkin seed oil**: A 2014 trial gave pumpkin seed oil **capsules by mouth** to **men** and found about 40% more hair after 24 weeks. It hasn’t been tested in women or as a scalp oil.',
    '**About minoxidil**: It is well studied for female hair thinning but only works while you use it, and can cause unwanted facial hair in some women.',
    '**Supportive scalp care**: Oils such as [Pumpkin Seed Oil](/product/pumpkin-seed-oil) or [Rosemary Oil](/product/rosemary-oil) can be part of a gentle routine, alongside medical treatment, not instead of it.',
  ],
  'male-baldness-receding-hairline-patchy-beard-blackseed-rosemary-pakistan': [
    '**Male-pattern hair loss is mostly genetic**: DHT, a hormone made from testosterone, slowly shrinks follicles at the temples and crown.',
    '**Best natural evidence**: Rosemary oil matched 2% minoxidil in a 2015 trial of 100 men after 6 months.',
    '**Kalonji (blackseed) oil**: Its main compound, thymoquinone, is anti-inflammatory in lab studies, but there are no large human trials for baldness.',
    '**Patchy beard**: Beard density is mostly genetic. Oils can soften beard hair and calm the skin underneath, but they won’t create new follicles.',
    '**See a dermatologist if**: hair loss is fast, patchy or itchy, or if you want proven medical options.',
  ],
  'postpartum-hair-fall-delivery-telogen-effluvium-pakistan-804-serum': [
    '**It’s common and temporary**: Shedding usually starts 2–4 months after delivery and settles within 6–12 months.',
    '**Why it happens**: Pregnancy hormones keep more hairs growing; after delivery they rest and shed together.',
    '**Check for anaemia**: Low iron is common in Pakistani women and can make shedding worse. Ask your doctor for haemoglobin and ferritin tests.',
    '**Be gentle**: Mild shampoo, loose hairstyles and light oiling such as [804 Hairoil & Serum](/product/804-hairoil-serum) reduce breakage while hair recovers.',
    '**See a doctor if**: shedding lasts more than a year, comes in patches, or you feel unusually tired.',
  ],
  'hard-water-hair-fall-solution-pakistan-karachi-lahore': [
    '**What hard water does**: Calcium and magnesium salts leave a film that makes hair rough, dull and more likely to break.',
    '**Pakistani evidence**: A 2016 study in *J Pak Med Assoc* found hair treated with hard water lost strength compared with deionised water.',
    '**Test your water**: An inexpensive TDS meter shows your water’s hardness in seconds.',
    '**What helps**: Oil before washing, a gentle sulfate-free shampoo such as [Herbal Shampoo](/product/herbal-shampoo), conditioner every wash and, if you can, a shower filter.',
    '**Hair fall from the root** (rather than broken pieces) usually has another cause, such as hormones, iron or stress, so get it checked.',
  ],
  'severe-dandruff-rusi-scalp-folliculitis-pakistan-neem-blackseed': [
    '**The main cause**: Stubborn dandruff is linked to *Malassezia*, a yeast that feeds on scalp oil. Heat, sweat and tight caps or hijabs can make it worse.',
    '**Proven treatment**: Medicated shampoos with ketoconazole, zinc pyrithione or selenium sulfide, used 2–3 times a week.',
    '**Where neem and kalonji fit**: Both show antifungal activity in lab studies. [Neem Soap](/product/neem-soap) and [Blackseed Oil](/product/blackseed-oil) can support a gentle routine.',
    '**Let the scalp breathe**: Wash after sweating, and dry hair fully before covering it.',
    '**See a doctor if**: you have painful bumps or pus, hair loss, or flaking beyond the hairline.',
  ],
  'premature-grey-hair-sufaid-baal-pakistan-kalonji-sesame-oil-guide': [
    '**Mostly genetic**: Early greying often runs in families.',
    '**Causes worth checking**: Low vitamin B12, iron or copper, thyroid problems and smoking are linked to early greying. A simple blood test can rule them out.',
    '**What oils can do**: [Blackseed (Kalonji) Oil](/product/blackseed-oil) and [Sesame Oil](/product/sesame-oil) nourish the scalp, but no oil is proven to turn grey hair dark again.',
    '**If you colour your hair**: Patch-test dyes 48 hours before, since PPD in many dyes can cause allergic reactions.',
  ],
  'split-ends-heat-damage-straightener-pakistan-coconut-kre-bio-guide': [
    '**Split ends can’t be glued back**: Trimming is the only fix for existing splits; good care stops new ones.',
    '**Coconut oil helps**: Research shows it soaks into the hair shaft and reduces protein loss when used before washing.',
    '**Heat rules**: Use a heat protectant, keep straighteners at or below 180°C, and never straighten wet hair.',
    '**Condition every wash**: A conditioner such as [Kre-Bio Shampoo & Conditioner](/product/kre-bio-shampoo-conditioner) smooths the cuticle and reduces breakage.',
  ],
  'fixing-rebonded-bleached-frizzy-hair-pakistan-keratin-biotin': [
    '**Damage is partly permanent**: Rebonding and bleach break bonds inside hair that products can’t fully rebuild.',
    '**What products can do**: Protein (keratin) conditioners and oils make damaged hair smoother and less likely to snap while new hair grows.',
    '**Humidity frizz**: Damaged hair absorbs moisture easily, so seal lengths with a little oil or leave-in after washing.',
    '**Give it a break**: Avoid more chemical treatments for a few months, and trim damaged ends regularly.',
    '**Gentle routine**: [Kre-Bio Shampoo & Conditioner](/product/kre-bio-shampoo-conditioner) plus a wide-tooth comb on damp, not soaking-wet, hair.',
  ],
  'castor-oil-eyelashes-eyebrows-hairline-pakistan': [
    '**Evidence is limited**: There are no good clinical trials showing castor oil grows lashes or brows.',
    '**What it does do**: Castor oil is about 90% ricinoleic acid. It coats and conditions hairs, which can make them look fuller and break less.',
    '**Over-plucked brows**: Brows often regrow by themselves if you stop threading for a few months; castor oil can keep them soft meanwhile.',
    '**Apply safely**: Use a tiny amount of [Castor Oil](/product/castor-oil) on a clean spoolie at night and keep it out of your eyes. Stop if you get redness or itching.',
  ],
  'melasma-chhaiyan-treatment-pakistan-without-steroids': [
    '**Melasma can be controlled, not cured**: It tends to come back with sun and heat, so care has to be ongoing.',
    '**Main triggers**: Sun, heat (including cooking over a stove), and hormonal changes such as pregnancy or the pill.',
    '**Sunscreen is the treatment**: Broad-spectrum SPF 30+ every day, reapplied, plus a hat or dupatta outdoors.',
    '**Avoid ‘formula’ creams**: Many contain steroids or mercury, which thin the skin and make melasma worse.',
    '**Expect months, not weeks**: Gentle brightening care such as [Gluta Fair Night Cream](/product/gluta-fair-night-cream) can help over time. A dermatologist can prescribe stronger proven treatments.',
  ],
  'sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap': [
    '**Tans fade on their own**: Over weeks to a few months, as long as you stop further tanning.',
    '**Sunscreen first**: SPF 30+ on face, neck and the backs of your hands every day, and cover up on bikes and rickshaws.',
    '**Gentle care helps**: Mild exfoliation, [Rice Soap](/product/rice-soap) and brightening creams such as [Gluta Shine Cream](/product/gluta-shine-cream) can help the tan fade evenly.',
    '**Avoid bleach and ‘formula’ creams**: They irritate skin and can cause darker patches.',
  ],
  'rice-soap-benefits-skin-whitening-pakistan-glass-skin': [
    '**A gentle cleanser**: Cold-process [Rice Soap](/product/rice-soap) keeps its natural glycerin and leaves skin soft.',
    '**Rice ingredients**: Rice bran contains antioxidants such as ferulic acid, but a soap stays on skin for under a minute.',
    '**Realistic results**: Fresher-looking, softer skin. To fade a tan or dark spots, pair it with daily sunscreen.',
    '**Patch-test first** if you have sensitive skin, and moisturise after washing.',
  ],
  'acne-scars-pih-bridal-glow-routine-pakistan-glutathione-guide': [
    '**Marks vs scars**: Flat dark marks (PIH) fade with time and sunscreen; pitted scars need a dermatologist.',
    '**Start early**: Begin 8–12 weeks before the wedding. Marks usually take 3–12 months to fade fully.',
    '**What helps**: Daily sunscreen, a gentle cleanser and brightening ingredients such as niacinamide or vitamin C. [Gluta Fair Night Cream](/product/gluta-fair-night-cream) can be part of your night routine.',
    '**Avoid ‘formula’ creams**: Many contain steroids or mercury and cause lasting damage.',
    '**Don’t squeeze pimples**: It often leaves darker, longer-lasting marks.',
  ],
  'dark-knuckles-hands-feet-whitening-pakistan-safe-routine': [
    '**Common causes**: Friction, dryness and sun. Sometimes insulin resistance, especially with velvety dark patches on the neck, so get that checked.',
    '**Routine**: Moisturise twice daily, exfoliate gently once or twice a week, and use sunscreen on the backs of your hands.',
    '**Overnight cotton gloves and socks** keep cream such as [Gluta Shine Cream](/product/gluta-shine-cream) on your skin instead of your bedding.',
    '**Expect 6–8 weeks** for visible change. Avoid bleach and strong peels, which can make skin darker.',
  ],
  'almond-oil-dark-circles-pakistan-under-eye-treatment': [
    '**Causes**: Genetics, thin skin, pigmentation, allergies, rubbing your eyes and too little sleep.',
    '**What almond oil can do**: Soften and moisturise under-eye skin so it looks less dull and crepey. It won’t remove pigment or visible veins.',
    '**What helps more**: Sleep, sunscreen around the eyes, treating allergies and not rubbing.',
    '**How to use**: Pat one drop of [Sweet Almond Oil](/product/almond-oil) in gently at night, keeping it out of your eyes.',
  ],
  'neem-soap-benefits-cystic-acne-pakistan-monsoon': [
    '**Humidity and acne**: Heat and sweat in the monsoon increase oil and clogged pores.',
    '**What neem offers**: Antibacterial and anti-inflammatory effects in lab studies. A gentle cold-process [Neem Soap](/product/neem-soap) cleans without stripping.',
    '**Best for**: Mild acne, oily skin and body breakouts on the back and chest.',
    '**Wash twice a day, not more**: Over-washing can make skin oilier.',
    '**Cystic acne needs a dermatologist**: Deep, painful cysts are usually hormonal and need prescription treatment.',
  ],
  'lahore-smog-skin-damage-charcoal-detox-blackheads-pakistan': [
    '**Pollution and skin**: Studies link air pollution to dark spots and faster skin ageing.',
    '**Cleanse every evening**: Remove the day’s grime and sunscreen properly.',
    '**Charcoal soap**: [Charcoal Soap](/product/charcoal-soap) a few times a week suits oily skin; dry skin needs a milder cleanser.',
    '**Protect your barrier**: Moisturise after cleansing and wear sunscreen every day, even on hazy days.',
  ],
  'compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil': [
    '**Signs of a damaged barrier**: Stinging with plain moisturiser, tightness, redness and flaking.',
    '**Common causes**: Harsh exfoliants and acids, bleach creams, very hot water and dry winter air.',
    '**Repair routine**: Stop actives for 2–4 weeks, wash with lukewarm water and use a simple cream such as [No Frac Night Cream](/product/no-frac-night-cream).',
    '**Seal very dry patches**: A few drops of [Olive Oil](/product/olive-oil) over your moisturiser at night.',
    '**See a doctor if**: skin cracks, weeps or doesn’t improve in a few weeks.',
  ],
  'cracked-heels-phatee-aeryan-winter-dry-hands-sesame-oil-pakistan': [
    '**Why heels crack**: Dry winter air, bare cold floors and thick, dry skin that splits under pressure.',
    '**Night routine**: Soak 10 minutes, file gently, apply a rich oil such as [Sesame Oil](/product/sesame-oil) or desi ghee, and wear cotton socks.',
    '**Most cracks improve in 1–2 weeks** with nightly care.',
    '**Protect your hands**: Wear rubber gloves for laundry and dishes, and moisturise after washing.',
    '**See a doctor if**: you have diabetes, or cracks bleed, become painful or look infected.',
  ],
};

export const AUTHOR = {
  authorRole: 'Natura Bliss editorial team',
  authorBio: 'Written by the team at Natura Bliss in Talagang, Punjab, who make our cold-pressed oils and handmade soaps. This guide is general information, not medical advice. For persistent hair loss, acne, pigmentation or any skin condition that worries you, please see a doctor or dermatologist.',
};

// ---------------------------------------------------------------------------------------------
// Text edits: [find, replace]. `find` must occur exactly once in the post (else error).
// Use LINE(substr) to replace the whole line containing substr; null replacement deletes it.
// ---------------------------------------------------------------------------------------------
const LINE = (s) => ({ line: s });

export const EDITS = {
  'rosemary-oil-hair-growth-pakistan-guide': [
    [LINE('**Clinical Equivalence to Minoxidil**'), '- **What the Main Study Found**: A 2015 randomized trial published in [Skinmed](https://pubmed.ncbi.nlm.nih.gov/25842469/) compared rosemary essential oil with 2% minoxidil in 100 **men** with male-pattern hair loss. After 6 months both groups had similar increases in hair count, and the rosemary group had less scalp itching. No equivalent trial has been done in women yet.'],
    [LINE('**Strict Dilution Requirement**'), '- **Always Dilute**: Pure rosemary essential oil must never be applied undiluted to the scalp. [Natura Bliss Rosemary Oil](/product/rosemary-oil) is a ready-to-use blend: cold-pressed coconut and sesame oils infused with rosemary. Note that it is an infused oil, not the essential-oil preparation used in the 2015 trial.'],
    ['Dermatological clinics in major urban centers report that over 65% of female patients between the ages of 18 and 45 present with complaints of', 'Many women between 18 and 45 now visit clinics with'],
    ['Over 70% of households in Karachi (DHA, Clifton, Gulshan) and Lahore (DHA, Johar Town, Cantt) rely on', 'Many households in Karachi and Lahore rely on'],
    ['with Total Dissolved Solids (TDS) exceeding 1,200 to 2,800 ppm', 'with high Total Dissolved Solids (TDS)'],
    [LINE('Rosemary Oil + 0.5 mm Derma Roller'), null],
    [LINE('roll a sanitized 0.5 mm titanium derma roller'), null],
    [LINE('Pure steam-distilled Rosemary Essential Oil is extremely concentrated'), 'No. Pure rosemary essential oil is very concentrated and can cause irritation, burning or flaking if applied neat. Natura Bliss Rosemary Oil is already a gentle blend (cold-pressed coconut and sesame oils infused with rosemary), so you can massage it straight into the scalp. Patch-test on your inner arm first.'],
    [LINE('Peer-reviewed clinical trials (e.g. Panahi et al., 2015)'), 'In the main trial (Panahi et al., 2015, in men), hair counts only increased significantly after 6 months of daily use; at 3 months there was no clear change. Plan on at least 3 to 6 months of regular use before judging results, and see a doctor if shedding is sudden or patchy.'],
  ],
  'pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker': [
    [LINE('**+40% Documented Hair Regrowth**'), '- **What the Pumpkin Seed Oil Study Did (and Didn’t) Show**: A 2014 trial published in [Evid Based Complement Alternat Med](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4017725/) gave **men** with male-pattern hair loss 400 mg pumpkin seed oil **capsules by mouth** for 24 weeks; hair count rose about 40% versus 10% with placebo. It has not been tested in women with PCOS, or as an oil applied to the scalp.'],
    ['That dogma was completely overturned by a landmark clinical study published in the peer-reviewed medical journal *Evidence-Based Complementary and Alternative Medicine* (Cho et al., 2014).', 'A small study published in *Evidence-Based Complementary and Alternative Medicine* (Cho et al., 2014) suggested a plant oil might have a similar, milder effect.'],
    [LINE('researchers administered cold-pressed **Pumpkin Seed Oil'), 'In this randomized, double-blind, placebo-controlled trial, 76 **men** with male-pattern hair loss took 400 mg of pumpkin seed oil in **capsules by mouth** every day. After 24 weeks, hair count rose by about 40% on average, compared with 10% in the placebo group. The study was small, included no women, and did not test oil applied to the scalp, so it can’t tell us how well pumpkin seed oil works for PCOS.'],
    [LINE('| **Documented Hair Density Increase** |'), '| **Evidence for Hair Density** | Clinically proven; can cause unwanted facial hair in women | Modest benefit in trials | **One small trial in men (oral capsules); not tested in women** |'],
    [LINE('Minoxidil does not cure the underlying hormonal imbalance'), '   - Minoxidil doesn’t treat the underlying hormonal cause, and it only works while you keep using it: if you stop, the extra hair it maintained usually sheds again over a few months. Discuss the pros and cons with your doctor before starting or stopping it.'],
    [LINE('By blocking DHT topically on the scalp with carnosic acid'), 'Often, yes, as long as the follicles are still alive. The most effective approach is treating the hormonal cause with your doctor (for example with medicines that lower androgen activity) and managing blood sugar and weight where relevant. Scalp care such as [Natura Bliss Rosemary Oil](/product/rosemary-oil) can be a supportive addition, but it isn’t a substitute for medical treatment.'],
    [LINE('Synthetic minoxidil often causes a terrifying initial shedding phase'), 'Minoxidil is one of the best-studied treatments for female hair thinning. Its downsides are a temporary shedding phase in the first weeks, the need for continued use, and, in some women, unwanted facial hair (more likely with the 5% strength), which matters if you already have PCOS hirsutism. Natural oils have fewer side effects but much weaker evidence, so talk to your doctor about what suits you.'],
    ['(clinically documented natural 5-alpha reductase inhibitor)', '(studied as oral capsules in men; evidence in women is lacking)'],
  ],
  'male-baldness-receding-hairline-patchy-beard-blackseed-rosemary-pakistan': [
    ['### 3. Natural Phytosterol DHT Blocker Defense', '### 3. Plant Sterols and DHT: What We Know So Far'],
    [LINE('Peer-reviewed clinical studies have proven that cold-pressed *Nigella sativa*'), 'The evidence is limited. Lab studies show thymoquinone, the main active compound in *Nigella sativa* (kalonji/blackseed), has antioxidant and anti-inflammatory effects, and small studies of kalonji lotions have reported less shedding in temporary hair loss. There are no large trials in male-pattern baldness, so treat kalonji oil as supportive scalp care rather than a proven regrowth treatment.'],
  ],
  'postpartum-hair-fall-delivery-telogen-effluvium-pakistan-804-serum': [
    [LINE('**The Acute Estrogen Collapse**'), '- **Why It Happens**: High oestrogen during pregnancy keeps more hairs in the growth (anagen) phase than usual. After delivery, hormone levels fall and many of those hairs enter the resting (telogen) phase together, so they shed together about 2 to 4 months later.'],
    [LINE('**Pakistan’s High Maternal Anemia Co-Factor**'), '- **Anaemia Makes It Worse**: Anaemia is common among Pakistani women (the National Nutrition Survey 2018 found it in roughly 4 in 10 women of reproductive age), and low iron is linked to heavier hair shedding. Ask your doctor to check your haemoglobin and ferritin after delivery.'],
    ['This sudden hormonal plunge causes approximately 30% to 50% of your hair follicles to enter the resting (telogen) phase simultaneously', 'This drop pushes many hair follicles into the resting (telogen) phase at the same time'],
  ],
  'acne-scars-pih-bridal-glow-routine-pakistan-glutathione-guide': [
    [LINE('**The Toxic Mercury & Betamethasone Epidemic**'), '- **The Hidden Danger in ‘Formula’ Creams**: Tests of unregulated whitening creams sold in Pakistan have repeatedly found mercury and strong prescription steroids (such as clobetasol and betamethasone). These can cause permanent skin thinning, visible blood vessels and severe rebound darkening, so avoid any cream that doesn’t list its ingredients.'],
    ['**100% Non-Toxic, Zero Steroids, Zero Mercury (DRAP Compliant)**', '**No steroids, mercury or hydroquinone**'],
    [LINE('All Natura Bliss formulations are rigorously tested and adhere strictly'), 'Natura Bliss products contain no mercury, hydroquinone, clobetasol, betamethasone or other bleaching agents, and every product lists its ingredients. As with any new skincare, patch-test first.'],
  ],
  'sun-tan-removal-two-tone-skin-pakistan-gluta-shine-rice-soap': [
    ['**100% Non-Toxic, DRAP & PSQCA Compliant**', '**No mercury, steroids or bleach**'],
    ['exposes your skin to over 50% of scattered indirect radiation', 'exposes your skin to a large share of reflected, indirect UV'],
  ],
  'melasma-chhaiyan-treatment-pakistan-without-steroids': [
    [LINE('Laboratory testing conducted by the [Drug Regulatory Authority of Pakistan (DRAP)]'), 'Tests of unregulated whitening creams sold in Pakistan have repeatedly found **mercury far above safe limits** and strong **prescription steroids**, most often **clobetasol propionate** and **betamethasone valerate**. They may lighten skin quickly, but they make melasma worse in the long run.'],
    ['Melasma cannot be cured overnight because', 'Melasma cannot be cured permanently, because'],
    ['Over 30% of Pakistani women suffer from hormonal imbalances, particularly Polycystic Ovary Syndrome (PCOS) or postpartum hormonal shifts (historically termed *Chloasma* or the "mask of pregnancy").', 'Hormonal changes are a major trigger, particularly pregnancy (melasma in pregnancy is called *chloasma*, or the "mask of pregnancy"), birth-control pills and, in some women, PCOS.'],
  ],
  'neem-soap-benefits-cystic-acne-pakistan-monsoon': [
    ['that disrupt bacterial cell walls and resolve inflamed cystic redness within 24 to 48 hours without pharmaceutical drug resistance', 'that show antibacterial and anti-inflammatory effects in laboratory studies'],
    ['rapidly suppressing vascular swelling and calming angry red bumps within 24 to 48 hours', 'which may help calm red, swollen bumps'],
    ['while eradicating fungal *Malassezia* yeast across congested pores.', 'and may help keep *Malassezia* yeast in check on oily skin.'],
    ['this physical trauma guarantees a dark', 'this physical trauma often leaves a dark'],
    ['**Can neem soap cure deep hormonal cystic acne along the jawline and chin?**', '**Can neem soap clear deep hormonal cystic acne along the jawline and chin?**'],
    [LINE('Neem’s active triterpenoids (azadirachtin and nimbidin) provide unmatched'), 'Not on its own. Neem soap can help keep skin clean and may calm mild inflammation, but deep, painful cysts along the jaw are usually hormonal and need a dermatologist, who can prescribe proven treatments. Use neem soap as a gentle daily cleanser alongside that treatment.'],
    [LINE('Neem contains high concentrations of natural vitamin C, bioflavonoids'), 'It can help a little. Keeping skin clean and calm reduces new marks, but existing marks fade mainly with time and daily sunscreen (usually over 3 to 12 months). Brightening ingredients such as niacinamide or vitamin C serums work better than any soap for fading marks.'],
  ],
  'split-ends-heat-damage-straightener-pakistan-coconut-kre-bio-guide': [
    [LINE('confirms that Coconut Oil is the only common botanical oil'), 'Research published in the *Journal of Cosmetic Science* found that coconut oil, unlike mineral oil and sunflower oil, penetrates the hair shaft and reduces protein loss when used as a pre-wash or post-wash treatment. That makes it one of the best oils for protecting hair from washing and styling damage.'],
  ],
  'almond-oil-dark-circles-pakistan-under-eye-treatment': [
    [LINE('**Phytochemical Power of Sweet Almond Oil**'), '- **What Almond Oil Can Do**: Cold-pressed sweet almond oil (*Prunus amygdalus dulcis*) is rich in vitamin E and fatty acids that soften and moisturise thin under-eye skin. It won’t remove pigmentation or visible blood vessels, but well-moisturised skin looks less dull and crepey.'],
    ['### 1. Vitamin K (Phylloquinone): Capillary Microcirculation', '### 1. Vitamin K: What the Research Shows'],
    [LINE('Vitamin K plays a critical role in vascular biology.'), 'Vitamin K is sometimes added to under-eye creams. One small 2004 study found that a gel combining vitamin K with retinol and vitamins C and E slightly reduced dark circles in some people. Almond oil itself contains very little vitamin K, so don’t expect the same effect from the oil alone.'],
    ['**Rich Natural Vitamin E, Vitamin K & Squalene**', '**Natural vitamin E & fatty acids**'],
    ['Fade Dark Circles & Under-Eye Bags Naturally', 'Soften & Moisturise Tired Under-Eyes'],
    ['Rich in natural Vitamin E, Vitamin K, and squalene for delicate periorbital skin.', 'Rich in natural vitamin E to soften delicate under-eye skin.'],
  ],
  'dark-knuckles-hands-feet-whitening-pakistan-safe-routine': [
    [' accelerates active absorption by over 400%.', ' helps the cream stay on the skin all night.'],
    [' and boosts botanical active absorption by over 400% without rubbing off onto bedsheets.', ' and keeps the cream on your skin instead of your bedsheets.'],
    [LINE('| **Rebound Darkening Rate** |'), '| **Rebound Darkening Risk** | **High in South Asian skin** | High (skin turns greyish-dark within 7 days) | **Low (no bleaching agents)** |'],
  ],
  'rice-soap-benefits-skin-whitening-pakistan-glass-skin': [
    ['Over 90% of bar soaps sold in Pakistani supermarkets are not true soaps at all; they are', 'Many bar soaps sold in Pakistani supermarkets are not true soaps but'],
  ],
  'hard-water-hair-fall-solution-pakistan-karachi-lahore': [
    [LINE('**TDS Levels Exceeding 1,500 to 2,800 ppm**'), '- **Very Hard Water in Many Neighbourhoods**: Groundwater and tanker water in parts of Karachi and Lahore is often very hard, with high levels of calcium and magnesium salts. You can check your own tap water in a minute with an inexpensive TDS meter.'],
    [LINE('clinical evaluations show that over 70% of female hair fall in urban Pakistan'), 'Many people blame hair fall on diet or stress alone, but in hard-water areas the water itself often leaves hair rough and prone to breakage, which looks like hair fall in the shower. A 2016 study from Pakistan (Luqman et al., *J Pak Med Assoc*) found that hair treated with hard water lost strength compared with hair treated with deionised water.'],
    [LINE('Data compiled from water quality surveys conducted by the'), 'Water hardness varies a lot by neighbourhood and source. The table below gives a rough picture based on the type of supply. It is not official data, so test your own tap water with a TDS meter:'],
    [LINE('According to water quality surveys by the Pakistan Council of Research in Water Resources'), 'There’s no official “hair-safe” TDS level, but water under about 300 ppm is generally considered soft to moderate, and many bore and tanker supplies in Karachi and Lahore read much higher. A cheap TDS meter from any hardware shop or online store tells you where your water stands in a few seconds.'],
  ],
  'severe-dandruff-rusi-scalp-folliculitis-pakistan-neem-blackseed': [
    ['## The 3-Phase Botanical Dandruff Eradication Routine', '## A 3-Step Routine for Stubborn Dandruff'],
    ['Over 64% of urban Pakistanis suffer from chronic seborrheic dermatitis or dry dandruff (*rusi / khushki*), caused by the lipophilic yeast *Malassezia globosa*.', 'Chronic dandruff (*rusi / khushki*) and seborrheic dermatitis are very common, and are linked to the yeast *Malassezia globosa*.'],
  ],
  'premature-grey-hair-sufaid-baal-pakistan-kalonji-sesame-oil-guide': [
    [LINE('**Epidemic of Youth Canities Across Pakistan**'), '- **Early Greying Is Common**: Many Pakistani students and young professionals notice grey hairs in their twenties. Genetics is the main cause, but stress, low vitamin B12, iron or copper, thyroid problems, smoking and air pollution can contribute.'],
  ],
  'cracked-heels-phatee-aeryan-winter-dry-hands-sesame-oil-pakistan': [
    ['Over 85% of urban and semi-urban Pakistani homes have', 'Most Pakistani homes have'],
    ['strips 100% of the hands’ natural intercellular lip', 'strips the hands’ natural intercellular lip'],
    ['Preventing detergent contact stops 90% of hand eczema at the source.', 'Avoiding detergent contact removes one of the most common triggers of hand eczema.'],
    ['strip away 100% of the natural ceramide lipids', 'strip away the natural ceramide lipids'],
  ],
  'compromised-skin-barrier-winter-dryness-pakistan-no-frac-olive-oil': [
    ['Over 70% of barrier damage cases in Pakistani women stem from', 'Much of the barrier damage we see comes from'],
  ],
  'fixing-rebonded-bleached-frizzy-hair-pakistan-keratin-biotin': [
    ['patching missing protein voids and restoring up to 85% of hair’s original tensile elasticity', 'temporarily filling gaps in damaged hair so it feels stronger and smoother'],
    ['Rebonding chemicals shatter up to 40% of the internal', 'Rebonding chemicals break many of the internal'],
    ['Up to 40% of the disulfide links remain permanently broken', 'Some of the disulfide links remain permanently broken'],
    ['**Restores up to 85% of natural elasticity & softness**', '**Improves softness and reduces breakage**'],
    ['Chemically processed hair loses up to 70% of its tensile strength when wet.', 'Chemically processed hair is much weaker when wet.'],
  ],
};

// ---------------------------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------------------------
function applyEdit(content, find, replace, slug) {
  if (typeof find === 'object' && find.line) {
    const lines = content.split('\n');
    const idx = lines.map((l, i) => (l.includes(find.line) ? i : -1)).filter(i => i >= 0);
    if (idx.length !== 1) throw new Error(`[${slug}] LINE "${find.line.slice(0, 50)}" matched ${idx.length} lines`);
    if (replace === null) lines.splice(idx[0], 1);
    else {
      // keep the original indentation / list marker style when the replacement doesn't set one
      lines[idx[0]] = replace;
    }
    return lines.join('\n');
  }
  const n = content.split(find).length - 1;
  if (n !== 1) throw new Error(`[${slug}] "${find.slice(0, 60)}" matched ${n} times`);
  return content.replace(find, () => replace);
}

export function fixBlog(blog, pubmed, titlesBySlug) {
  const slug = blog.slug;
  const meta = POSTS[slug];
  if (!meta) throw new Error(`no fix plan for ${slug}`);
  const log = [];
  let c = blog.content.replace(/\r\n/g, '\n');
  // Normalise curly apostrophes in finds against content (content uses ’ in places)
  const norm = (s) => s;

  // 1. Per-post text edits
  for (const [find, replace] of [...(EDITS[slug] || []), ...(FAQ_EDITS[slug] || [])]) {
    try {
      c = applyEdit(c, find, replace, slug);
    } catch (e) {
      // retry with straight apostrophes in the find string
      if (typeof find === 'string' && find.includes('’')) c = applyEdit(c, find.replace(/’/g, "'"), replace, slug);
      else if (find.line && find.line.includes('’')) c = applyEdit(c, { line: find.line.replace(/’/g, "'") }, replace, slug);
      else throw e;
    }
    log.push(`edit: ${(find.line || find).slice(0, 70)}`);
  }

  // 2. Citations: fix wrong IDs, drop homepage-only sources, fix "Stand:"
  const out = [];
  let inSources = false;
  for (const line of c.split('\n')) {
    if (line.startsWith(':::quellen')) inSources = true;
    else if (inSources && line.trim() === ':::') inSources = false;

    if (inSources && line.startsWith('- ')) {
      if (/^- Stand:/.test(line)) { out.push(`- Last reviewed: ${TODAY}`); continue; }
      const key = Object.keys(CITATION_FIXES).find(k => new RegExp(`(pubmed\\.ncbi\\.nlm\\.nih\\.gov/|articles/)${k}/`).test(line));
      if (key) {
        const target = CITATION_FIXES[key];
        if (target === null) { log.push(`cite removed: ${line.slice(2, 80)}`); continue; }
        for (const id of [].concat(target)) {
          const r = pubmed[id];
          if (!r) throw new Error(`[${slug}] PubMed ${id} missing from metadata`);
          out.push(citationLine(r));
        }
        log.push(`cite fixed: ${key} -> ${[].concat(target).join('+')}`);
        continue;
      }
      if (HOMEPAGE_SOURCE.test(line)) { log.push(`source removed: ${line.slice(2, 80)}`); continue; }
    }
    out.push(line);
  }
  c = out.join('\n');

  // 3. "protocol" wording (outside the sources block and URLs)
  const [body, ...rest] = c.split(':::quellen');
  const reworded = body
    .replace(/\bProtocols\b/g, 'Routines').replace(/\bProtocol\b/g, 'Routine')
    .replace(/\bprotocols\b/g, 'routines').replace(/\bprotocol\b/g, 'routine');
  c = [reworded, ...rest].join(':::quellen');

  // 3a. Key-takeaways box, replaced in full
  if (TAKEAWAYS[slug]) {
    const n = (c.match(/:::takeaways[\s\S]*?\n:::/g) || []).length;
    if (n !== 1) throw new Error(`[${slug}] expected 1 takeaways block, found ${n}`);
    const block = `:::takeaways\nKey takeaways:\n${TAKEAWAYS[slug].map(t => `- ${t}`).join('\n')}\n:::`;
    c = c.replace(/:::takeaways[\s\S]*?\n:::/, () => block);
    log.push('edit: takeaways');
  }

  // 3b. CTA banner (one per post)
  if (CTAS[slug]) {
    const n = (c.match(/:::cta\n[^\n]*\n:::/g) || []).length;
    if (n !== 1) throw new Error(`[${slug}] expected 1 CTA block, found ${n}`);
    c = c.replace(/:::cta\n[^\n]*\n:::/, () => `:::cta\n${CTAS[slug]}\n:::`);
    log.push('edit: cta');
  }

  // 4. Hard-water table: replace unverifiable ppm figures with qualitative bands
  if (slug.startsWith('hard-water')) {
    c = c.replace(/\*\*([\d,]+) – ([\d,]+) ppm\*\*/g, (_, lo) => (parseInt(lo.replace(/,/g, ''), 10) >= 1000 ? '**Very high**' : '**High**'));
  }

  // 5. Quick answer at the very top, related guides before the sources block
  if (!c.startsWith('**Quick answer:**')) c = `**Quick answer:** ${meta.quick}\n\n${c}`;
  if (!c.includes('## Related guides')) {
    const links = meta.related.map(s => `- [${titlesBySlug[s]}](/blog/${s})`).join('\n');
    const block = `## Related guides\n\n${links}\n\n`;
    c = c.includes(':::quellen') ? c.replace(':::quellen', () => `${block}:::quellen`) : `${c}\n\n${block}`;
  }

  // Sanity: nothing we meant to remove survives
  const leftovers = [/psqca\.com\.pk/, /dra\.gov\.pk\)/, /Stand: /, /\bprotocol/i, /dermatologist-reviewed/i, /Derma Roller/];
  for (const re of leftovers) if (re.test(c)) log.push(`WARN leftover ${re}`);

  for (const [k, max] of [['metaTitle', 60], ['metaDescription', 155]]) {
    if (meta[k].length > max) throw new Error(`[${slug}] ${k} is ${meta[k].length} chars (max ${max})`);
  }
  if (meta.quick.split(/\s+/).length > 65) throw new Error(`[${slug}] quick answer too long`);

  return {
    changes: {
      content: c,
      title: meta.title,
      metaTitle: meta.metaTitle,
      metaDescription: meta.metaDescription,
      excerpt: meta.metaDescription,
      authorRole: AUTHOR.authorRole,
      authorBio: AUTHOR.authorBio,
      reviewedDate: new Date(),
    },
    log,
  };
}
