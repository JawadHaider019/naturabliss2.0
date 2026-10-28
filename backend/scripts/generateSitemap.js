import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import productModel from '../models/productModel.js';
import { Blog } from '../models/blogModel.js';
import dealModel from '../models/dealModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const outputPath = path.resolve(__dirname, '../../frontend/public/sitemap.xml');
const baseUrl = 'https://naturabliss.pk';

async function generate() {
  try {
    const mongoUri = `${process.env.MONGODB_URI}/e-commerce`;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${baseUrl}/collection`, changefreq: 'daily', priority: '0.9' },
      { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${baseUrl}/blog`, changefreq: 'weekly', priority: '0.8' },
    ];

    const products = await productModel.find({ status: { $ne: 'draft' } }).select('slug date').lean();
    const blogs = await Blog.find({ status: 'published' }).select('slug publishDate updatedAt').lean();
    const deals = await dealModel.find({ status: 'published' }).select('_id date').lean();

    console.log(`Found: ${products.length} products, ${blogs.length} blogs, ${deals.length} deals`);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Products
    for (const prod of products) {
      if (!prod.slug) continue;
      const lastmod = prod.date ? new Date(prod.date).toISOString().split('T')[0] : today;
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/product/${encodeURIComponent(prod.slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Blogs
    for (const blog of blogs) {
      if (!blog.slug) continue;
      const lastmod = blog.updatedAt
        ? new Date(blog.updatedAt).toISOString().split('T')[0]
        : (blog.publishDate ? new Date(blog.publishDate).toISOString().split('T')[0] : today);
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/blog/${encodeURIComponent(blog.slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Deals
    for (const deal of deals) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/deal/${deal._id}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    fs.writeFileSync(outputPath, xml, 'utf8');
    console.log(`Successfully generated sitemap at: ${outputPath}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    process.exit(1);
  }
}

generate();
