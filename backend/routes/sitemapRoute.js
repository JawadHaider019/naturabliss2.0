import express from 'express';
import productModel from '../models/productModel.js';
import { Blog } from '../models/blogModel.js';
import dealModel from '../models/dealModel.js';

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://naturabliss.pk';
    const today = new Date().toISOString().split('T')[0];

    // Core static pages
    const staticPages = [
      { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
      { loc: `${baseUrl}/collection`, changefreq: 'daily', priority: '0.9', lastmod: today },
      { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.7', lastmod: today },
      { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.7', lastmod: today },
      { loc: `${baseUrl}/blog`, changefreq: 'weekly', priority: '0.8', lastmod: today },
    ];

    // Fetch published products
    const products = await productModel
      .find({ status: { $ne: 'draft' } })
      .select('slug date')
      .lean()
      .catch(() => []);

    // Fetch published blogs
    const blogs = await Blog
      .find({ status: 'published' })
      .select('slug publishDate updatedAt')
      .lean()
      .catch(() => []);

    // Fetch published deals
    const deals = await dealModel
      .find({ status: 'published' })
      .select('_id date')
      .lean()
      .catch(() => []);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${page.loc}</loc>\n`;
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Products
    for (const prod of products) {
      if (!prod.slug) continue;
      const lastmod = prod.date
        ? new Date(prod.date).toISOString().split('T')[0]
        : today;
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/product/${encodeURIComponent(prod.slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Blogs
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

    // Dynamic Deals
    for (const deal of deals) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/deal/${deal._id}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

export default router;
