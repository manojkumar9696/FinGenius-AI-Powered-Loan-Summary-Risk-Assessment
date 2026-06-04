/**
 * Chat Routing Configuration
 * Maps conversation endpoints to chat controller logic, shielded by authentication.
 */
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Shield chatbot interactions with JWT verification
router.use(authMiddleware.protect);

// Route: POST /api/chat
router.post('/', chatController.sendMessage);

module.exports = router;
