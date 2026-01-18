const mongoose = require('mongoose');
const Submission = require('./server/models/Submission');
require('dotenv').config({ path: './server/.env' });

const checkSubmissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const submissions = await Submission.find().sort({ createdAt: -1 });
        console.log(`Found ${submissions.length} total submissions.`);

        submissions.forEach((sub, i) => {
            console.log(`[${i}] ID: ${sub._id} | Status: ${sub.status} | Grade: ${sub.grade} | Mode: ${sub.gradingMode}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

checkSubmissions();
