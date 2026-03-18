const mongoose = require('mongoose');

// ============================================
// INSTRUCTIONS:
// 1. Leave LOCAL_URI as is (your current local DB)
// 2. Replace ATLAS_URI with your MongoDB Atlas connection string
// ============================================
const LOCAL_URI = 'mongodb://localhost:27017/elevare';
const ATLAS_URI = 'mongodb+srv://elevare_admin:g5iY5RBASBTmT0PW@elevarecluster.jhiydzm.mongodb.net/elevare_db?appName=ElevareCluster';

async function migrate() {
    console.log('--- Elevare Database Migration ---');

    // Connect to local DB
    console.log('\n1. Connecting to local database...');
    const localDb = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('   âœ“ Connected to local database.');

    // Connect to Atlas DB
    console.log('\n2. Connecting to MongoDB Atlas...');
    const atlasDb = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('   âœ“ Connected to Atlas database.');

    // Get all collections from local DB
    const collections = await localDb.db.listCollections().toArray();

    if (collections.length === 0) {
        console.log('\nNo collections found in local database.');
        process.exit(0);
    }

    console.log(`\n3. Found ${collections.length} collections. Starting migration...`);

    for (let collection of collections) {
        const collectionName = collection.name;
        console.log(`\n--- Migrating collection: [${collectionName}] ---`);

        const localCollection = localDb.collection(collectionName);
        const atlasCollection = atlasDb.collection(collectionName);

        // Fetch all documents from local collection
        const documents = await localCollection.find({}).toArray();
        console.log(`   Fetched ${documents.length} documents from local.`);

        if (documents.length > 0) {
            // Drop existing Atlas collection (prevents duplicate key errors if run multiple times)
            try {
                await atlasCollection.drop();
                console.log(`   Dropped existing collection in Atlas.`);
            } catch (e) {
                // Ignore drop error (it just means the collection doesn't exist yet)
            }

            // Insert documents into Atlas collection
            await atlasCollection.insertMany(documents);
            console.log(`   âœ“ Successfully inserted ${documents.length} documents into Atlas.`);
        } else {
            console.log(`   Skipped (empty collection).`);
        }
    }

    console.log('\n--- Migration Complete! âœ¨ ---');
    console.log('You can now use your MongoDB Atlas URI in the server/.env file.');

    // Close connections
    await localDb.close();
    await atlasDb.close();
    process.exit(0);
}

migrate().catch((err) => {
    console.error('\nâŒ Migration Failed:', err);
    process.exit(1);
});
