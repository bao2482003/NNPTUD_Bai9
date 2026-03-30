const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
  getConversationWithUser,
  sendMessage,
  getLastMessagePerUser,
  deleteMyMessages
} = require('../controllers/messageController');

router.use(auth);
router.get('/', getLastMessagePerUser);
router.post('/', upload.single('file'), sendMessage);
router.delete('/', deleteMyMessages);
router.get('/:userId', getConversationWithUser);
module.exports = router;