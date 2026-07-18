const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const ClothingItem = require('../models/ClothingItem');
const SwapRequest = require('../models/SwapRequest');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

async function seedDB() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swapstyle';
  
  console.log('Connecting to database...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  // Clear existing databases
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await ClothingItem.deleteMany({});
  await SwapRequest.deleteMany({});
  await Message.deleteMany({});
  await Notification.deleteMany({});
  console.log('Collections cleared.');

  // Encrypt passwords
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('admin123', salt);
  const userPass = await bcrypt.hash('password123', salt);

  console.log('Seeding users...');
  
  const admin = new User({
    name: 'System Admin',
    email: 'admin@swapstyle.com',
    password: adminPass,
    phone: '555-0199',
    location: {
      city: 'New York',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    role: 'admin',
    profilePicture: ''
  });

  const alice = new User({
    name: 'Alice Cooper',
    email: 'alice@swapstyle.com',
    password: userPass,
    phone: '555-0101',
    location: {
      city: 'Manhattan, NY',
      coordinates: { lat: 40.7306, lng: -73.9352 }
    },
    role: 'user',
    profilePicture: ''
  });

  const bob = new User({
    name: 'Bob Marley',
    email: 'bob@swapstyle.com',
    password: userPass,
    phone: '555-0102',
    location: {
      city: 'Brooklyn, NY',
      coordinates: { lat: 40.6782, lng: -73.9442 } // ~6.8km from Manhattan (Alice)
    },
    role: 'user',
    profilePicture: ''
  });

  const charlie = new User({
    name: 'Charlie Chaplin',
    email: 'charlie@swapstyle.com',
    password: userPass,
    phone: '555-0103',
    location: {
      city: 'Boston, MA',
      coordinates: { lat: 42.3601, lng: -71.0589 } // ~300km from NY (Alice/Bob)
    },
    role: 'user',
    profilePicture: ''
  });

  await admin.save();
  await alice.save();
  await bob.save();
  await charlie.save();

  console.log('Seeding listings...');

  // Alice listings
  const item1 = new ClothingItem({
    title: 'Classic Denim Jacket',
    description: 'Vintage blue denim jacket with double pockets. Soft cotton weave that matches everything.',
    category: 'Outerwear',
    brand: 'Zara',
    size: 'M',
    condition: 'Like New',
    gender: 'Unisex',
    color: 'Blue',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 68,
    owner: alice._id,
    location: alice.location,
    status: 'Available'
  });

  const item2 = new ClothingItem({
    title: 'Vintage Silk Floral Blouse',
    description: '100% authentic silk blouse with vibrant floral patterns. Elegant and smooth tailoring.',
    category: 'Tops',
    brand: 'Gucci',
    size: 'S',
    condition: 'Good',
    gender: 'Women',
    color: 'Floral',
    images: [
      'https://images.unsplash.com/photo-1584273143981-44c23392c6ae?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607345366928-199e5760f05e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 56,
    owner: alice._id,
    location: alice.location,
    status: 'Available'
  });

  const item6 = new ClothingItem({
    title: 'Summer Cotton Maxi Dress',
    description: 'Flowy yellow cotton dress with tiered skirt. Breathable fabric ideal for summer handoffs.',
    category: 'Other',
    brand: 'H&M',
    size: 'M',
    condition: 'New',
    gender: 'Women',
    color: 'Yellow',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 40,
    owner: alice._id,
    location: alice.location,
    status: 'Available'
  });

  const item7 = new ClothingItem({
    title: 'Designer Leather Handbag',
    description: 'Tan genuine pebble leather handbag with gold-tone hardware. Spacious compartments.',
    category: 'Accessories',
    brand: 'Coach',
    size: 'One Size',
    condition: 'Like New',
    gender: 'Women',
    color: 'Tan',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566150905458-1bf1fc15a6a0?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 75,
    owner: alice._id,
    location: alice.location,
    status: 'Available'
  });

  // Bob listings
  const item3 = new ClothingItem({
    title: 'Air Force 1 Low \'07',
    description: 'Fresh white Nike Air Force 1 sneakers. Standard sizing and classic swoosh detailing.',
    category: 'Shoes',
    brand: 'Nike',
    size: '10',
    condition: 'New',
    gender: 'Unisex',
    color: 'White',
    images: [
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 70,
    owner: bob._id,
    location: bob.location,
    status: 'Available'
  });

  const item4 = new ClothingItem({
    title: 'Slightly Faded 511 Slim Jeans',
    description: 'Classic dark blue denim Levi jeans. Broken-in fabric for comfort.',
    category: 'Bottoms',
    brand: 'Levi\'s',
    size: '32',
    condition: 'Good',
    gender: 'Men',
    color: 'Dark Blue',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 45,
    owner: bob._id,
    location: bob.location,
    status: 'Available'
  });

  const item8 = new ClothingItem({
    title: 'Minimalist Chronograph Watch',
    description: 'Silver-tone stainless steel wrist watch with black watchface dial. Water-resistant.',
    category: 'Accessories',
    brand: 'Fossil',
    size: 'One Size',
    condition: 'Good',
    gender: 'Unisex',
    color: 'Silver',
    images: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 50,
    owner: bob._id,
    location: bob.location,
    status: 'Available'
  });

  // Charlie listings
  const item5 = new ClothingItem({
    title: 'Thermoball Winter Parka',
    description: 'Warm synthetic down padded winter parka jacket. Water-repellent nylon shell.',
    category: 'Outerwear',
    brand: 'The North Face',
    size: 'L',
    condition: 'Like New',
    gender: 'Men',
    color: 'Black',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 68,
    owner: charlie._id,
    location: charlie.location,
    status: 'Available'
  });

  const item9 = new ClothingItem({
    title: 'Banarasi Silk Saree',
    description: 'Traditional red silk saree with rich golden zari borders and intricate weave.',
    category: 'Other',
    brand: 'Fabindia',
    size: 'Free Size',
    condition: 'New',
    gender: 'Women',
    color: 'Red',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 85,
    owner: charlie._id,
    location: charlie.location,
    status: 'Available'
  });

  const item10 = new ClothingItem({
    title: 'Embroidered Cotton Kurta',
    description: 'Pure cotton white kurta with intricate hand-embroidered neck detailing.',
    category: 'Tops',
    brand: 'Manyavar',
    size: 'L',
    condition: 'Like New',
    gender: 'Men',
    color: 'White',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80'
    ],
    estimatedSwapValue: 48,
    owner: charlie._id,
    location: charlie.location,
    status: 'Available'
  });

  await Promise.all([
    item1.save(),
    item2.save(),
    item3.save(),
    item4.save(),
    item5.save(),
    item6.save(),
    item7.save(),
    item8.save(),
    item9.save(),
    item10.save()
  ]);

  console.log('Seeding completed successfully!');
  mongoose.connection.close();
}

seedDB().catch(err => {
  console.error('Seeding error:', err);
  mongoose.connection.close();
});
