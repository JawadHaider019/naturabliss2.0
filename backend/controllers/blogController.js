import { Blog } from '../models/blogModel.js';
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';
import { notifyNewBlog } from '../controllers/newsletterController.js'; // ADDED IMPORT
import mongoose from 'mongoose';

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 🟢 Blog Controllers

export const getAllBlogs = async (req, res) => {
  try {
    let { search = '', status = '', category = '', tags = '', contentType = '', page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (status) filter.status = status;
    if (category) filter.category = { $in: category.split(',').map(c => c.trim()) };
    if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim()) };

    if (contentType === 'image') {
      filter.imageUrl = { $ne: '' };
      filter.videoUrl = '';
    } else if (contentType === 'video') {
      filter.videoUrl = { $ne: '' };
    } else if (contentType === 'text-only') {
      filter.imageUrl = '';
      filter.videoUrl = '';
    } else if (contentType === 'media') {
      filter.$or = [{ imageUrl: { $ne: '' } }, { videoUrl: { $ne: '' } }];
    }

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Blog.countDocuments(filter);
    res.json({ success: true, data: blogs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blogs', error: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    let blog;

    // 1. Try finding by ID if it looks like one
    if (id && id.length === 24) {
      try {
        blog = await Blog.findById(id);
      } catch (err) {
        // Not a valid ID, move to slug
      }
    }

    // 2. If not found by ID, try finding by slug
    if (!blog) {
      blog = await Blog.findOne({ slug: id });
    }

    // 3. Fallback: Check slug alias mapping for alternate SEO URL structures
    if (!blog) {
      const SLUG_ALIASES = {
        'organic-neem-soap-cystic-acne-pakistan-skin-healing': 'neem-soap-benefits-cystic-acne-pakistan-monsoon',
        'rice-water-soap-glass-skin-korean-glow-pakistan': 'rice-soap-benefits-skin-whitening-pakistan-glass-skin',
        'hard-water-hair-damage-pakistan-chlorine-remedies': 'hard-water-hair-fall-solution-pakistan-karachi-lahore',
        'clinical-rosemary-oil-hair-growth-pakistan-guide': 'rosemary-oil-hair-growth-pakistan-guide',
        'pumpkin-seed-oil-dht-blocker-alopecia-pakistan': 'pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker',
        'cold-pressed-sweet-almond-oil-dark-circles-under-eye-pakistan': 'almond-oil-dark-circles-pakistan-under-eye-treatment',
        'castor-oil-eyebrow-eyelash-growth-pakistan-density': 'castor-oil-eyelashes-eyebrows-hairline-pakistan',
        'pcos-hormonal-hair-thinning-pakistan-natural-regrowth': 'pcos-hormonal-hair-thinning-pakistan-natural-dht-blocker',
        'cracked-heels-dry-hands-winter-body-care-pakistan': 'dark-knuckles-hands-feet-whitening-pakistan-safe-routine',
        'keratin-hair-damage-reversal-natural-oils-pakistan': 'fixing-rebonded-bleached-frizzy-hair-pakistan-keratin-biotin'
      };
      const aliasTarget = SLUG_ALIASES[id];
      if (aliasTarget) {
        blog = await Blog.findOne({ slug: aliasTarget });
      }
    }

    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    blog.views += 1;
    await blog.save();

    // Fetch up to 3 related published blogs
    let relatedBlogs = [];
    try {
      const relatedQuery = {
        _id: { $ne: blog._id },
        status: 'published'
      };
      if (blog.category && blog.category.length > 0) {
        relatedQuery.category = { $in: blog.category };
      }
      relatedBlogs = await Blog.find(relatedQuery)
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title slug excerpt imageUrl category readTime createdAt author');
      
      // If fewer than 3, fill with other published blogs
      if (relatedBlogs.length < 3) {
        const moreBlogs = await Blog.find({
          _id: { $nin: [blog._id, ...relatedBlogs.map(r => r._id)] },
          status: 'published'
        })
          .sort({ createdAt: -1 })
          .limit(3 - relatedBlogs.length)
          .select('title slug excerpt imageUrl category readTime createdAt author');
        relatedBlogs = [...relatedBlogs, ...moreBlogs];
      }
    } catch (e) {
      console.error('Error fetching related blogs:', e);
    }

    res.json({ success: true, data: blog, relatedBlogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blog', error: error.message });
  }
};

// ✅ Upload inline blog image
export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'blogs',
      resource_type: 'image'
    });

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      imageUrl: result.secure_url,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create blog with Cloudinary upload
export const createBlog = async (req, res) => {
  try {
    const blogData = { ...req.body };

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'blogs',
        resource_type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
      });
      if (req.file.mimetype.startsWith('image')) blogData.imageUrl = result.secure_url;
      else blogData.videoUrl = result.secure_url;

      fs.unlinkSync(req.file.path); // Remove local temp file
    }

    if (typeof blogData.category === 'string') {
      try { blogData.category = JSON.parse(blogData.category); } catch(e) { blogData.category = blogData.category.split(',').map(c => c.trim()).filter(Boolean); }
    }
    if (typeof blogData.tags === 'string') {
      try { blogData.tags = JSON.parse(blogData.tags); } catch(e) { blogData.tags = blogData.tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
    if (typeof blogData.images === 'string') {
      try { blogData.images = JSON.parse(blogData.images); } catch(e) { blogData.images = blogData.images ? [blogData.images] : []; }
    }

    if (blogData.category && !Array.isArray(blogData.category)) blogData.category = [blogData.category];
    if (blogData.tags && !Array.isArray(blogData.tags)) blogData.tags = [blogData.tags];

    if (!blogData.title || !blogData.title.trim()) {
      const blogCount = await Blog.countDocuments();
      blogData.title = `Blog Post ${blogCount + 1}`;
    }

    // Generate unique slug from custom slug or title
    const baseSlug = (blogData.slug && blogData.slug.trim())
      ? generateSlug(blogData.slug)
      : generateSlug(blogData.title);
    
    let finalSlug = baseSlug || `post-${Date.now().toString(36)}`;
    let counter = 1;
    while (await Blog.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }
    blogData.slug = finalSlug;

    if (blogData.status === 'published' && !blogData.publishDate) {
      blogData.publishDate = new Date();
    }

    const blog = new Blog(blogData);
    await blog.save();

    // ✅ Send newsletter notification if blog is published
    if (blogData.status === 'published') {
      try {
        await notifyNewBlog(blog);
        console.log('📢 New blog notification sent to subscribers');
      } catch (notificationError) {
        console.error('❌ Failed to send blog notification:', notificationError);
      }
    }

    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating blog', error: error.message });
  }
};

// ✅ Update blog with Cloudinary upload
export const updateBlog = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'blogs',
        resource_type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
      });
      if (req.file.mimetype.startsWith('image')) updateData.imageUrl = result.secure_url;
      else updateData.videoUrl = result.secure_url;

      fs.unlinkSync(req.file.path);
    }

    if (typeof updateData.category === 'string') {
      try { updateData.category = JSON.parse(updateData.category); } catch(e) { updateData.category = updateData.category.split(',').map(c => c.trim()).filter(Boolean); }
    }
    if (typeof updateData.tags === 'string') {
      try { updateData.tags = JSON.parse(updateData.tags); } catch(e) { updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
    if (typeof updateData.images === 'string') {
      try { updateData.images = JSON.parse(updateData.images); } catch(e) { updateData.images = updateData.images ? [updateData.images] : []; }
    }

    if (updateData.category && !Array.isArray(updateData.category)) updateData.category = [updateData.category];
    if (updateData.tags && !Array.isArray(updateData.tags)) updateData.tags = [updateData.tags];

    const existingBlog = await Blog.findById(req.params.id);
    if (!existingBlog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const wasPublished = existingBlog.status === 'published';

    // Update slug if requested or if title changed and slug wasn't provided
    if (updateData.slug && updateData.slug.trim()) {
      const baseSlug = generateSlug(updateData.slug);
      let finalSlug = baseSlug;
      let counter = 1;
      while (await Blog.findOne({ slug: finalSlug, _id: { $ne: req.params.id } })) {
        finalSlug = `${baseSlug}-${counter++}`;
      }
      updateData.slug = finalSlug;
    } else if (updateData.title && updateData.title !== existingBlog.title) {
      const baseSlug = generateSlug(updateData.title);
      let finalSlug = baseSlug;
      let counter = 1;
      while (await Blog.findOne({ slug: finalSlug, _id: { $ne: req.params.id } })) {
        finalSlug = `${baseSlug}-${counter++}`;
      }
      updateData.slug = finalSlug;
    }

    updateData.reviewedDate = new Date();

    const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    // ✅ Send newsletter notification if status changed to published
    if (updateData.status === 'published' && !wasPublished) {
      try {
        await notifyNewBlog(blog);
        console.log('📢 New blog notification sent to subscribers');
      } catch (notificationError) {
        console.error('❌ Failed to send blog notification:', notificationError);
      }
    }

    res.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating blog', error: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting blog', error: error.message });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    blog.featured = !blog.featured;
    await blog.save();
    res.json({ success: true, message: `Blog ${blog.featured ? 'featured' : 'unfeatured'} successfully`, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating blog', error: error.message });
  }
};

export const togglePublishStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const wasPublished = blog.status === 'published';
    blog.status = blog.status === 'published' ? 'draft' : 'published';

    if (blog.status === 'published' && !blog.publishDate) {
      blog.publishDate = new Date();
    }

    await blog.save();

    // ✅ ADDED: Send newsletter notification when blog is published (only if it wasn't already published)
    if (blog.status === 'published' && !wasPublished) {
      try {
        await notifyNewBlog(blog);
        console.log('📢 New blog notification sent to subscribers');
      } catch (notificationError) {
        console.error('❌ Failed to send blog notification:', notificationError);
        // Don't fail the whole request if notification fails
      }
    }

    res.json({
      success: true,
      message: `Blog ${blog.status === 'published' ? 'published' : 'unpublished'} successfully`,
      data: blog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating blog status', error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    // Get distinct categories from all blogs with counts
    const categories = await Blog.aggregate([
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category",
          blogCount: { $sum: 1 },
          lastUsed: { $max: "$updatedAt" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedCategories = categories.map(cat => ({
      name: cat._id,
      blogCount: cat.blogCount,
      lastUsed: cat.lastUsed
    }));

    res.json({ success: true, data: formattedCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const categoryName = name.trim();

    // Check if category already exists in any blog
    const existingCategory = await Blog.findOne({
      category: { $regex: new RegExp(`^${categoryName}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    // ACTUALLY CREATE A BLOG WITH THIS CATEGORY TO SAVE IT
    const newBlog = new Blog({
      title: `Category Setup - ${categoryName}`,
      content: `This blog was created to establish the "${categoryName}" category in the system.`,
      category: [categoryName],
      excerpt: `Category setup for ${categoryName}`,
      tags: ['system', 'category-setup'],
      status: 'draft', // Keep it as draft so it doesn't show publicly
      author: 'System'
    });

    await newBlog.save();

    res.json({
      success: true,
      message: 'Category created successfully',
      data: {
        name: categoryName,
        blogCount: 1,
        lastUsed: new Date()
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating category', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { newName } = req.body;
    const oldName = req.params.id;

    if (!newName || newName.trim() === '') {
      return res.status(400).json({ success: false, message: 'New category name is required' });
    }

    // Check if new category name already exists
    const existingCategory = await Blog.findOne({
      category: { $regex: new RegExp(`^${newName.trim()}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'New category name already exists' });
    }

    // Update all blogs that have this category
    const result = await Blog.updateMany(
      { category: oldName },
      { $set: { "category.$": newName.trim() } }
    );

    // Update any system category setup blogs
    await Blog.updateMany(
      { title: `Category Setup - ${oldName}`, author: 'System' },
      {
        $set: {
          title: `Category Setup - ${newName.trim()}`,
          category: [newName.trim()],
          excerpt: `Category setup for ${newName.trim()}`
        }
      }
    );

    res.json({
      success: true,
      message: `Category updated in ${result.modifiedCount} blog(s)`,
      data: { oldName, newName: newName.trim() }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating category', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const categoryName = req.params.id;

    // Remove this category from all blogs
    const result = await Blog.updateMany(
      { category: categoryName },
      { $pull: { category: categoryName } }
    );

    // Also delete any system-created category setup blogs
    await Blog.deleteMany({
      title: { $regex: `Category Setup - ${categoryName}` },
      author: 'System'
    });

    res.json({
      success: true,
      message: `Category removed from ${result.modifiedCount} blog(s)`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting category', error: error.message });
  }
};