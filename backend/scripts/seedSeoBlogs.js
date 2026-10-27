import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { blog1 } from './data/blog1_rosemary.js';
import { blog2 } from './data/blog2_melasma.js';
import { blog3 } from './data/blog3_rice_soap.js';
import { blog4 } from './data/blog4_dark_knuckles.js';
import { blog5 } from './data/blog5_almond_oil.js';
import { blog6 } from './data/blog6_hard_water.js';
import { blog7 } from './data/blog7_neem_soap.js';
import { blog8 } from './data/blog8_castor_oil.js';
import { blog9 } from './data/blog9_pcos_hair.js';
import { blog10 } from './data/blog10_keratin_repair.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI ? `${process.env.MONGODB_URI}/e-commerce` : null;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
}

// Blog Schema Definition
const blogSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: '' },
    category: [{ type: String, trim: true, default: 'General' }],
    subcategory: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    author: { type: String, default: 'Natura Bliss' },
    authorAvatar: { type: String, default: '' },
    authorRole: { type: String, default: 'Botanical Research & Formulation Team' },
    authorBio: { type: String, default: '' },
    readTime: { type: Number, default: 12 },
    featured: { type: Boolean, default: false },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    images: [{ type: String }],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    publishDate: { type: Date, default: Date.now },
    reviewedDate: { type: Date, default: Date.now },
    views: { type: Number, default: 120 },
    notificationSent: { type: Boolean, default: false },
    slug: { type: String, required: true, unique: true, index: true }
}, { timestamps: true });

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export const SEO_BLOGS = [
    blog1,
    blog2,
    blog3,
    blog4,
    blog5,
    blog6,
    blog7,
    blog8,
    blog9,
    blog10
];

async function seedBlogs() {
    try {
        console.log('🔄 Connecting to MongoDB e-commerce database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully.');

        console.log(`🚀 Seeding ${SEO_BLOGS.length} Comprehensive, Long-Form Pakistan SEO/AEO/GEO Blogs for Natura Bliss...`);

        for (const blogData of SEO_BLOGS) {
            const updated = await Blog.findOneAndUpdate(
                { slug: blogData.slug },
                { $set: blogData },
                { upsert: true, new: true, runValidators: true }
            );
            const wordCount = updated.content.split(/\s+/).length;
            console.log(`  ✓ Synced: "${updated.title.substring(0, 48)}..." [${updated.slug}] (${wordCount} words)`);
        }

        const totalBlogs = await Blog.countDocuments();
        console.log(`\n🎉 All 10 Long-Form SEO/AEO/GEO blogs successfully updated in database! Total blogs in database: ${totalBlogs}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding blogs:', err);
        process.exit(1);
    }
}

seedBlogs();
