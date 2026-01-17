console.log('Starting debug...');
try {
    console.log('Requiring middleware...');
    require('./middleware/authMiddleware');
    console.log('Middleware OK');

    console.log('Requiring User model...');
    require('./models/User');
    console.log('User model OK');

    console.log('Requiring Profile model...');
    require('./models/Profile');
    console.log('Profile model OK');

    console.log('Requiring User Controller...');
    require('./controllers/user.controller');
    console.log('User Controller OK');

    console.log('Requiring User Routes...');
    require('./routes/user.routes');
    console.log('User Routes OK');

} catch (e) {
    console.error('ERROR:', e.message);
    console.error('CODE:', e.code);
}
