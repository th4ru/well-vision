import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/productModel.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Sample products data
const sampleProducts = [
  {
    name: 'Classic Aviator Eyeglasses',
    category: 'eyeglasses',
    brand: 'ray-ban',
    model: 'RB3025',
    price: 15000,
    cost: 10000,
    stock: 45,
    reorderLevel: 10,
    description: 'Timeless aviator design with premium metal frame',
    frameMaterial: 'Metal',
    frameColor: 'Gold',
    lensType: 'Clear',
    prescription: true
  },
  {
    name: 'Polarized Sunglasses',
    category: 'sunglasses',
    brand: 'oakley',
    model: 'OO9208',
    price: 25000,
    cost: 18000,
    stock: 8,
    reorderLevel: 10,
    description: 'Premium polarized lenses for maximum UV protection',
    frameMaterial: 'Plastic',
    frameColor: 'Black',
    lensType: 'Polarized',
    prescription: false
  },
  {
    name: 'Designer Cat-Eye Frames',
    category: 'eyeglasses',
    brand: 'gucci',
    model: 'GG0420O',
    price: 35000,
    cost: 25000,
    stock: 0,
    reorderLevel: 5,
    description: 'Elegant cat-eye frames with signature Gucci branding',
    frameMaterial: 'Acetate',
    frameColor: 'Tortoise',
    lensType: 'Clear',
    prescription: true
  },
  {
    name: 'Daily Contact Lenses',
    category: 'contact-lenses',
    brand: 'other',
    model: 'DAILY-30',
    price: 3500,
    cost: 2000,
    stock: 120,
    reorderLevel: 30,
    description: '30-day supply of comfortable daily disposable lenses',
    frameMaterial: 'N/A',
    frameColor: 'N/A',
    lensType: 'Soft Contact',
    prescription: true
  },
  {
    name: 'Blue Light Blocking Lenses',
    category: 'lens',
    brand: 'other',
    model: 'BLB-001',
    price: 8000,
    cost: 5000,
    stock: 35,
    reorderLevel: 15,
    description: 'Premium blue light filtering lenses for digital eye strain',
    frameMaterial: 'N/A',
    frameColor: 'N/A',
    lensType: 'Blue Light Filter',
    prescription: true
  },
  {
    name: 'Leather Eyeglass Case',
    category: 'accessories',
    brand: 'other',
    model: 'CASE-LTR',
    price: 2500,
    cost: 1200,
    stock: 65,
    reorderLevel: 20,
    description: 'Premium leather case with soft microfiber interior',
    frameMaterial: 'N/A',
    frameColor: 'Brown',
    lensType: 'N/A',
    prescription: false
  }
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI || '').toString().trim().replace(/^['"]|['"]$/g, '');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if these specific products already exist
    const existingProductNames = await Product.find({}, 'name');
    const existingNames = existingProductNames.map(p => p.name);

    const productsToAdd = sampleProducts.filter(product =>
      !existingNames.includes(product.name)
    );

    if (productsToAdd.length === 0) {
      console.log('📊 All sample products already exist in the database.');
      return;
    }

    console.log(`📊 Found ${existingProductNames.length} existing products. Adding ${productsToAdd.length} new products.`);

    // Insert only new products
    const products = await Product.insertMany(productsToAdd);
    console.log(`✅ Successfully seeded ${products.length} products`);

    // Display seeded products
    console.log('\n📦 Seeded Products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.category}) - Stock: ${product.stock}`);
    });

  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
seedProducts();
