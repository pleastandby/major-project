const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database Connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/gemini', require('./routes/gemini.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/submissions', require('./routes/submission.routes'));
app.use('/api/assignments', require('./routes/assignment.routes'));
app.use('/api/faculty', require('./routes/faculty.routes'));

app.get('/', (req, res) => {
  res.send('Elevare LMS API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
