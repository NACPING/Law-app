const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');

// ไม่ต้องล็อกอินก็ดูได้
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// ต้องล็อกอินถึงจะตั้งกระทู้และคอมเมนต์ได้
router.post('/', authMiddleware, postController.createPost);
router.post('/:id/comments', authMiddleware, postController.createComment);

module.exports = router;