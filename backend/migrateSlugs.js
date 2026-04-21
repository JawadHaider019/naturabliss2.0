import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productModel from './models/productModel.js';

dotenv.config();

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const migrate = async () => {
    try {
        const mongoUri = `${process.env.MONGODB_URI}/e-commerce`;
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        const products = await productModel.find({ slug: { $exists: false } });
        console.log(`Found ${products.length} products without slugs`);

        for (let product of products) {
            const slug = generateSlug(product.name);

            // Check for duplicate slugs and append counter if needed
            let uniqueSlug = slug;
            let counter = 1;
            while (await productModel.findOne({ slug: uniqueSlug })) {
                uniqueSlug = `${slug}-${counter}`;
                counter++;
            }

            product.slug = uniqueSlug;
            await product.save();
            console.log(`Updated: ${product.name} -> ${product.slug}`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
