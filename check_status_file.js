const mongoose = require('mongoose');
const Submission = require('./server/models/Submission');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const checkSubmissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const submissions = await Submission.find().sort({ createdAt: -1 });
        const data = submissions.map(sub => ({
            id: sub._id,
            status: sub.status,
            grade: sub.grade,
            userId: sub.studentId
        }));

        fs.writeFileSync('submission_debug.json', JSON.stringify(data, null, 2));
        console.log('Written to submission_debug.json');

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

checkSubmissions();
