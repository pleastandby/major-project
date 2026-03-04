const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Make sure we load the right env file

const Profile = require('../models/Profile');

async function runMigration() {
    try {
        console.log('Connecting to MongoDB...');
        // Fallback to local if no env var
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/elevare';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        console.log('Finding profiles without a department...');

        // Find profiles where data.department doesn't exist or is empty
        const profilesToUpdate = await Profile.find({
            $or: [
                { "data.department": { $exists: false } },
                { "data.department": "" },
                { "data.department": null }
            ]
        });

        console.log(`Found ${profilesToUpdate.length} profiles to update.`);

        let updatedCount = 0;
        for (const profile of profilesToUpdate) {
            // Ensure data object exists just in case
            if (!profile.data) {
                profile.data = {};
            }
            // Set a default department. 
            // In a real scenario, this might be 'Undeclared' or they are forced to pick one on next login
            profile.data.department = "Computer Engineering";

            // Mark the mixed field as modified
            profile.markModified('data');
            await profile.save();
            updatedCount++;
        }

        console.log(`Migration complete. Updated ${updatedCount} profiles with default department.`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

runMigration();
