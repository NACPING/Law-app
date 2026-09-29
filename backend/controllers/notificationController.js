const prisma = require('../config/db');

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(notifications);
  } catch (error) {
    console.error('Get user notifications error:', error);
    return res.status(500).json({ message: 'ไม่สามารถดึงประวัติการแจ้งเตือนได้' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.userId,
      },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'ไม่พบการแจ้งเตือนนี้' });
    }

    return res.json({ message: 'ทำเครื่องหมายว่าอ่านแล้ว', isRead: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ message: 'ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้' });
  }
};
