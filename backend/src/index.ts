import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import purchaseRoutes from './routes/purchases';
import drawRoutes from './routes/draws';
import adminRoutes from './routes/admin';

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS matching frontend
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Serve payment proofs statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/admin', adminRoutes);

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Socket connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room for real-time tickers
  socket.join('live-ticker');

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Periodically simulate live tickets and purchases to create an active environment (jackpot ticking)
setInterval(() => {
  const luckyNumbers = ['149230', '568794', '204938', '993410', '481230', '823491'];
  const mockNames = ['Aayush S.', 'Bibek K.', 'Sandip T.', 'Priyanka D.', 'Niranjan R.'];
  
  const mockActivity = {
    user: mockNames[Math.floor(Math.random() * mockNames.length)],
    number: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
    type: Math.random() > 0.4 ? 'token' : 'coin',
    timestamp: new Date(),
  };
  
  io.to('live-ticker').emit('new-purchase-activity', mockActivity);
}, 12000); // Send mock real-time events every 12 seconds

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Mero Luck Express Server running on port ${PORT}`);
});
