require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const app = express();
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const communityRoutes = require('./routes/communityRoutes');
const ebookRoutes = require('./routes/ebookRoutes');
const chatRoutes = require('./routes/chatRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const setupChatSocket = require('./socket/chatHandler');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Legal App API is running' });
});

app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// สร้าง HTTP Server ครอบ Express
const server = http.createServer(app);

// ตั้งค่า Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_lawapp_2026');
    if (typeof payload !== 'object' || typeof payload.userId !== 'string') {
      next(new Error('Invalid authentication token'));
      return;
    }
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid or expired authentication token'));
  }
});
app.set('io', io);

// เรียกใช้ Socket Handler
setupChatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running with Socket.io on http://0.0.0.0:${PORT}`);
});