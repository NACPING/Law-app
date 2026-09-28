const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/chatUpload');

// ✅ รองรับทั้ง /messages/:roomId และ /:roomId เพื่อป้องกัน URL ไม่ตรงกัน
router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      console.error('Chat file upload error:', error);
      const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(statusCode).json({ message: error.message });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
  }

  return res.status(201).json({ fileUrl: `/uploads/${req.file.filename}` });
});

router.post('/consult', authMiddleware, chatController.requestConsult);
router.get('/consult/:id', authMiddleware, chatController.getConsultStatus);
router.get('/:requestId/messages', authMiddleware, chatController.getMessages);
router.post('/:requestId/messages', authMiddleware, chatController.sendMessage);

router.get('/consultations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: { consultationId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/consult', authMiddleware, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user.id; // ดึง ID จาก Token

    const consultation = await prisma.consultation.create({
      data: {
        userId: Number(userId),
        subject,
        messages: {
          create: {
            senderId: Number(userId),
            content: message,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    res.status(201).json({ success: true, consultation });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ error: 'ไม่สามารถส่งคำขอปรึกษาได้' });
  }
});

// 2. ดึงรายการแชทปรึกษาทั้งหมดของผู้ใช้
router.get('/consultations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const consultations = await prisma.consultation.findMany({
      where: { userId: Number(userId) },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    res.json({ success: true, consultations });
  } catch (error) {
    res.status(500).json({ error: 'ไม่สามารถดึงรายการปรึกษาได้' });
  }
});

// 3. ดึงประวัติข้อความในห้องแชท
router.get('/consultations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: { consultationId: id },
      orderBy: { createdAt: 'asc' }, // เรียงจากเก่าไปใหม่สำหรับแสดงผลในแชท
    });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: 'ไม่สามารถดึงประวัติข้อความได้' });
  }
});

module.exports = router;