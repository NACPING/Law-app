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
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(requests.map((request) => ({
      ...request,
      consultation: request.consultationId ? { id: request.consultationId } : null,
    })));
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

    res.status(200).json(result);
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอนุมัติคำขอ' });
  }
};