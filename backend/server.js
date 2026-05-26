import './load-env.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import labourRoutes from './routes/labourRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import educationRoutes from './routes/educationRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
import { setupSocket } from './sockets/chatSocket.js';

// Create HTTP server for Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allows frontend to connect
    methods: ['GET', 'POST']
  }
});
app.set('socketio', io); // Expose io to our API controllers

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads (chat files, images etc.)
import { fileURLToPath } from 'url';
import pathLib from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathLib.dirname(__filename);
app.use('/uploads', express.static(pathLib.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route (Moved above error handler so it doesn't get intercepted as 404)
app.get('/', (req, res) => {
  res.send('GramMitra AI Engine is running...');
});

// 1. Catch 404s
app.use(notFound);
// 2. Global Error Handler
app.use(errorHandler);

// Initialize WebSockets
setupSocket(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
