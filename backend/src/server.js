const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const companyRoutes = require('./routes/companies');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const skillRoutes = require('./routes/skills');
const searchRoutes = require('./routes/search');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const recommendationRoutes = require('./routes/recommendations');
const aiRoutes = require('./routes/ai');
const chatbotRoutes = require('./routes/chatbot');
const pool = require('./config/database');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.use(notFound);
app.use(errorHandler);

const connectedUsers = new Map();
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(userId);
    socket.userId = userId;
  });

  socket.on('sendMessage', async ({ to, message }) => {
    const fromId = socket.userId;
    if (!fromId) return;

    try {
      const result = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING id, created_at',
        [fromId, to, message]
      );

      const recipientSocket = connectedUsers.get(to);
      if (recipientSocket) {
        io.to(recipientSocket).emit('newMessage', {
          id: result.rows[0].id,
          from: fromId,
          message,
          timestamp: result.rows[0].created_at,
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, sockId] of connectedUsers) {
      if (sockId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };