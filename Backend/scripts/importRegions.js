const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name';
mongoose.connect(mongoUri);

// Define Region schema
const regionSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    type: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', default: null },
    code: String,
    status: String,
    createdAt: Date,
    updatedAt: Date,
    __v: Number
}, { collection: 'regions', timestamps: false });

const Region = mongoose.model('Region', regionSchema);

// Helper function to safely parse date
function parseDate(dateObj) {
    if (!dateObj) return new Date();
    
    try {
        // Check if it's in the format: { "$date": { "$numberLong": "..." } }
        if (dateObj.$date && dateObj.$date.$numberLong) {
            const timestamp = parseInt(dateObj.$date.$numberLong, 10);
            if (!isNaN(timestamp) && timestamp > 0) {
                return new Date(timestamp);
            }
        }
        // Check if it's already a number (timestamp)
        if (typeof dateObj === 'number' && !isNaN(dateObj) && dateObj > 0) {
            return new Date(dateObj);
        }
        // Check if it's a date string
        if (typeof dateObj === 'string') {
            const parsed = new Date(dateObj);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
    } catch (error) {
        // Silent fail, return current date
    }
    
    // Default to current date if parsing fails
    return new Date();
}

async function importRegions() {
    try {
        // Read the JSON file
        const filePath = path.join(__dirname, 'region.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Split by newline to handle each JSON object separately
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        const regions = [];
        
        // Parse JSON with error handling
        for (let i = 0; i < lines.length; i++) {
            try {
                const parsed = JSON.parse(lines[i]);
                regions.push(parsed);
            } catch (parseError) {
                console.warn(`Error parsing line ${i + 1}:`, parseError.message);
            }
        }
        
        console.log(`Found ${regions.length} regions to import...`);
        
        // Clear existing regions if needed
        // await Region.deleteMany({});
        // console.log('Cleared existing regions');
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process each region
        for (let i = 0; i < regions.length; i++) {
            try {
                const region = regions[i];
                
                // Skip if required fields are missing
                if (!region._id || !region._id.$oid || !region.name || !region.type || !region.code) {
                    console.warn(`Skipping region at index ${i + 1}: missing required fields`);
                    errorCount++;
                    continue;
                }
                
            // Convert string IDs to ObjectId
            const regionData = {
                _id: new mongoose.Types.ObjectId(region._id.$oid),
                name: region.name,
                type: region.type,
                code: region.code,
                    status: region.status || 'active',
                    createdAt: parseDate(region.createdAt),
                    updatedAt: parseDate(region.updatedAt),
                    __v: region.__v?.$numberInt || region.__v || 0
            };
            
            // Add parent reference if exists
            if (region.parent && region.parent.$oid) {
                regionData.parent = new mongoose.Types.ObjectId(region.parent.$oid);
                } else {
                    regionData.parent = null;
            }
            
            // Create or update the region
            await Region.findOneAndUpdate(
                { _id: regionData._id },
                regionData,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
            );
                
                successCount++;
                
                // Progress indicator
                if ((i + 1) % 100 === 0) {
                    console.log(`Processed ${i + 1}/${regions.length} regions...`);
                }
            } catch (error) {
                console.error(`Error importing region at index ${i + 1}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('Import completed!');
        console.log(`✅ Successfully imported: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📊 Total: ${regions.length}`);
        console.log('='.repeat(50));
        
        process.exit(0);
    } catch (error) {
        console.error('Error importing regions:', error);
        process.exit(1);
    }
}

// Handle mongoose connection
mongoose.connection.once('connected', () => {
    console.log('✅ MongoDB connected');
    importRegions();
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// If already connected, run import immediately
if (mongoose.connection.readyState === 1) {
importRegions();
}
