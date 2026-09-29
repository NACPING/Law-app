const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const authMiddleware = require('../middlewares/authMiddleware'); // หรือ ../middleware/authMiddleware ขึ้นอยู่กับชื่อโฟลเดอร์ของคุณ

// 1. สร้างคำขอปรึกษา
router.post('/request', authMiddleware, consultationController.createRequest);

// 2. ดูรายการคำขอของตัวเอง
router.get('/my-requests', authMiddleware, consultationController.getUserRequests);

// 3. ทนายอนุมัติคำขอ
router.put('/request/:id/approve', authMiddleware, consultationController.approveRequest);

// ผู้ใช้จบการปรึกษาและส่งคะแนนรีวิว
router.post('/:id/complete', authMiddleware, consultationController.completeConsultation);
router.post('/:id/review', authMiddleware, consultationController.createConsultationReview);

module.exports = router;