/**
 * Migration script to update Cart model indexes
 * Drops old user_1 index and creates new user_1_cartType_1 index
 * 
 * Run this script once: node scripts/migrate-cart-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Cart = require('../models/Cart');

async function migrateCartIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('✗ MONGO_URI environment variable is not set');
      console.log('Please set MONGO_URI in your .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Get current indexes
    const indexes = await Cart.collection.getIndexes();
    console.log('Current indexes:', indexes);

    // Drop old user_1 index if it exists
    if (indexes.user_1) {
      try {
        await Cart.collection.dropIndex('user_1');
        console.log('✓ Dropped old user_1 index');
      } catch (err) {
        if (err.code === 27) {
          console.log('ℹ Old user_1 index does not exist');
        } else {
          throw err;
        }
      }
    } else {
      console.log('ℹ Old user_1 index does not exist');
    }

    // Create new user_1_cartType_1 index
    try {
      await Cart.collection.createIndex(
        { user: 1, cartType: 1 },
        { unique: true, name: 'user_1_cartType_1' }
      );
      console.log('✓ Created new user_1_cartType_1 index');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ Index user_1_cartType_1 already exists');
      } else {
        throw err;
      }
    }

    // Migrate existing carts without cartType to have cartType: 'tuman'
    const cartsWithoutType = await Cart.find({ cartType: { $exists: false } });
    if (cartsWithoutType.length > 0) {
      console.log(`\nFound ${cartsWithoutType.length} carts without cartType, migrating...`);
      for (const cart of cartsWithoutType) {
        cart.cartType = 'tuman';
        await cart.save();
      }
      console.log(`✓ Migrated ${cartsWithoutType.length} carts to cartType: 'tuman'`);
    } else {
      console.log('\nℹ No carts without cartType found');
    }

    // Verify indexes
    const finalIndexes = await Cart.collection.getIndexes();
    console.log('\nFinal indexes:', finalIndexes);

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCartIndexes();
