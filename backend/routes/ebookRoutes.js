const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ebookController = require('../controllers/ebookController');
const authMiddleware = require('../middlewares/authMiddleware');

// ตั้งค่าที่เก็บไฟล์สำหรับ Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/ebooks';
    if (file.fieldname === 'cover') dir = 'uploads/ebooks/covers';
    if (file.fieldname === 'pdf') dir = 'uploads/ebooks/pdfs';
    
    // สร้างโฟลเดอร์ให้อัตโนมัติถ้ายังไม่มี
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes ทั่วไป
router.get('/', ebookController.getAllEbooks);
router.get('/categories', ebookController.getCategories);
router.get('/favorites', authMiddleware, ebookController.getFavorites);

// 🟢 เพิ่ม Route รับ POST / สำหรับสร้างหนังสือพร้อมอัปโหลดไฟล์ cover และ pdf
router.post(
  '/',
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]),
  ebookController.createEbook
);

// Routes ที่มี Parameter (วางไว้ด้านล่างสุด)
router.get('/:id', ebookController.getEbookById);
router.post('/:ebookId/favorite', authMiddleware, ebookController.toggleFavorite);

module.exports = router;