const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createNotification,
    getMyNotifications,
    markRead
} = require('../controllers/notification.controller');

router.use(protect);

router.post('/', createNotification);
router.get('/', getMyNotifications);
router.patch('/:id/read', markRead);

module.exports = router;
