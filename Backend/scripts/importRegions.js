const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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
}, { collection: 'regions' });

const Region = mongoose.model('Region', regionSchema);

async function importRegions() {
    try {
        // Read the JSON file
        const filePath = path.join(__dirname, 'region.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Split by newline to handle each JSON object separately
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        const regions = lines.map(line => JSON.parse(line));
        
        console.log(`Found ${regions.length} regions to import...`);
        
        // Clear existing regions if needed
        // await Region.deleteMany({});
        // console.log('Cleared existing regions');
        
        // Process each region
        for (const region of regions) {
            // Convert string IDs to ObjectId
            const regionData = {
                _id: new mongoose.Types.ObjectId(region._id.$oid),
                name: region.name,
                type: region.type,
                code: region.code,
                status: region.status,
                createdAt: new Date(region.createdAt.$date.$numberLong),
                updatedAt: new Date(region.updatedAt.$date.$numberLong),
                __v: region.__v.$numberInt
            };
            
            // Add parent reference if exists
            if (region.parent && region.parent.$oid) {
                regionData.parent = new mongoose.Types.ObjectId(region.parent.$oid);
            }
            
            // Create or update the region
            await Region.findOneAndUpdate(
                { _id: regionData._id },
                regionData,
                { upsert: true, new: true }
            );
        }
        
        console.log('Successfully imported all regions!');
        process.exit(0);
    } catch (error) {
        console.error('Error importing regions:', error);
        process.exit(1);
    }
}

importRegions();
