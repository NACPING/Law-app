const prisma = require('../config/db');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('⚡ Client connected:', socket.id);

    // 1. เข้าห้องแชตตาม roomId (รองรับทั้ง { roomId } และ "roomId")
    const joinRoom = (data) => {
      const roomId = typeof data === 'object' && data !== null ? data.roomId ?? data.consultationId : data;
      if (typeof roomId !== 'string' || !roomId) return;
      socket.join(roomId);
      console.log(`👤 Socket ${socket.id} joined room: ${roomId}`);
    };
    socket.on('join_room', joinRoom);
    socket.on('joinRoom', joinRoom);

    // 2. รับข้อความ บันทึกลง Database แล้วกระจายหาคนในห้อง
    const sendMessage = async (data) => {
      console.log('📩 Received message payload:', data);
      try {
        const consultationId = data?.consultationId;
        const roomId = consultationId ?? data?.roomId;
        const { senderId } = data || {};
        const content = data?.content ?? data?.text;
        const text = typeof content === 'string' ? content.trim() : '';
        if (
          typeof roomId !== 'string' ||
          !roomId ||
          typeof senderId !== 'string' ||
          !senderId ||
          !text
        ) {
          socket.emit('error_message', { message: 'ข้อมูลข้อความไม่ถูกต้อง' });
          return;
        }

        const newMessage = await prisma.message.create({
          data: {
            ...(consultationId ? { consultationId } : { requestId: roomId }),
            senderId,
            text,
          },
        });

        // ส่งข้อความกระจายให้ทุกคนในห้องแชต
        const message = {
          ...newMessage,
          content: newMessage.text,
        };
        io.to(roomId).emit('receive_message', message);
        io.to(roomId).emit('receiveMessage', message);
      } catch (error) {
        console.error('Socket send_message error:', error);
        socket.emit('error_message', { message: 'ไม่สามารถส่งข้อความได้' });
      }
    };
    socket.on('send_message', sendMessage);
    socket.on('sendMessage', sendMessage);

    // 3. แจ้งสถานะกำลังพิมพ์ (Typing Indicator)
    socket.on('typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('user_typing', { userName });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing');
    });

    // 4. ออกจากห้อง / ตัดการเชื่อมต่อ
    socket.on('disconnect', () => {
      console.log('🔥 User disconnected:', socket.id);
    });
  });
};