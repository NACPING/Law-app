const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// สร้างคำขอปรึกษาทนาย
exports.createRequest = async (req, res) => {
  try {
    const { subject, events, message } = req.body;
    const userId = req.user.userId; // ใช้ userId ตามระบบ Auth ของคุณ

    const request = await prisma.lawyerRequest.create({
      data: { userId, subject, events, message }
    });
    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างคำขอ' });
  }
};

// ดึงรายการคำขอสำหรับผู้ใช้หรือทนายความ
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    let where = { userId };
    if (user.role === 'LAWYER') {
      const consultations = await prisma.consultation.findMany({
        where: { lawyerId: userId },
        select: { id: true },
      });

      where = {
        OR: [
          { status: 'AWAITING_REVIEW' },
          {
            status: 'APPROVED',
            consultationId: { in: consultations.map(({ id }) => id) },
          },
        ],
      };
    }

    const requests = await prisma.lawyerRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        consultation: {
          select: {
            id: true,
            review: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
};

// อนุมัติคำขอและสร้างห้องปรึกษา (ใช้ Transaction)
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user.userId; 

    // ใช้ Transaction เพื่อให้อัปเดตสถานะและสร้างห้องแชทไปพร้อมกัน
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.lawyerRequest.findUnique({
        where: { id },
      });
      if (!request) throw new Error('Consultation request not found');

      await tx.lawyerRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      const consultation = await tx.consultation.create({
        data: {
          userId: request.userId,
          lawyerId: lawyerId,
          subject: request.subject || 'ปรึกษาทนายความ',
          status: 'ACTIVE'
        }
      });

      const updatedRequest = await tx.lawyerRequest.update({
        where: { id },
        data: { consultationId: consultation.id },
      });

      return { updatedRequest, consultation };
    });

    const io = req.app.get('io');
    io.to(result.updatedRequest.userId).emit('notification', {
      title: 'คำขออนุมัติแล้ว!',
      message: 'ทนายความได้รับเคสของคุณแล้ว กดเพื่อดูแชท',
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอนุมัติคำขอ' });
  }
};

// จบการปรึกษาและบันทึกรีวิวใน transaction เดียวกัน
exports.completeConsultation = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body || {};

  try {
    const result = await prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.findUnique({
        where: { id },
        select: { id: true, userId: true, lawyerId: true, status: true },
      });

      if (!consultation) {
        const error = new Error('ไม่พบข้อมูลการปรึกษา');
        error.statusCode = 404;
        throw error;
      }
      const isRequester = consultation.userId === req.user.userId;
      const isLawyer = consultation.lawyerId === req.user.userId;
      if (!isRequester && !isLawyer) {
        const error = new Error('ไม่มีสิทธิ์จบการปรึกษานี้');
        error.statusCode = 403;
        throw error;
      }
      if (isRequester && !consultation.lawyerId) {
        const error = new Error('ไม่พบข้อมูลทนายความสำหรับการรีวิว');
        error.statusCode = 400;
        throw error;
      }
      if (isRequester && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
        const error = new Error('คะแนนรีวิวต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 5');
        error.statusCode = 400;
        throw error;
      }
      if (isRequester && typeof comment !== 'string') {
        const error = new Error('กรุณาระบุความคิดเห็น');
        error.statusCode = 400;
        throw error;
      }
      if (consultation.status === 'COMPLETED') {
        const error = new Error('การปรึกษานี้เสร็จสิ้นแล้ว');
        error.statusCode = 409;
        throw error;
      }

      const updatedConsultation = await tx.consultation.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
      await tx.lawyerRequest.updateMany({
        where: { consultationId: id },
        data: { status: 'COMPLETED' },
      });
      const review = isRequester
        ? await tx.review.create({
          data: {
            lawyerId: consultation.lawyerId,
            consultationId: id,
            rating,
            comment: comment.trim(),
          },
        })
        : null;

      return { consultation: updatedConsultation, review };
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Complete consultation error:', error);
    return res.status(500).json({ message: 'ไม่สามารถจบการปรึกษาได้' });
  }
};

exports.createConsultationReview = async (req, res) => {
  const { id: consultationId } = req.params;
  const { rating, comment } = req.body || {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'คะแนนรีวิวต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 5' });
  }
  if (typeof comment !== 'string') {
    return res.status(400).json({ message: 'กรุณาระบุความคิดเห็น' });
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.findUnique({
        where: { id: consultationId },
        select: { id: true, userId: true, lawyerId: true, status: true, review: { select: { id: true } } },
      });

      if (!consultation) {
        const error = new Error('ไม่พบข้อมูลการปรึกษา');
        error.statusCode = 404;
        throw error;
      }
      if (consultation.userId !== req.user.userId) {
        const error = new Error('ไม่มีสิทธิ์รีวิวการปรึกษานี้');
        error.statusCode = 403;
        throw error;
      }
      if (consultation.status !== 'COMPLETED') {
        const error = new Error('สามารถรีวิวได้หลังจากจบการปรึกษาแล้วเท่านั้น');
        error.statusCode = 409;
        throw error;
      }
      if (!consultation.lawyerId) {
        const error = new Error('ไม่พบข้อมูลทนายความสำหรับการรีวิว');
        error.statusCode = 400;
        throw error;
      }
      if (consultation.review) {
        const error = new Error('รีวิวเคสนี้แล้ว');
        error.statusCode = 409;
        throw error;
      }

      return tx.review.create({
        data: {
          lawyerId: consultation.lawyerId,
          consultationId,
          rating,
          comment: comment.trim(),
        },
      });
    });

    return res.status(201).json({ review });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'รีวิวเคสนี้แล้ว' });
    }

    console.error('Create consultation review error:', error);
    return res.status(500).json({ message: 'ไม่สามารถส่งรีวิวได้' });
  }
};