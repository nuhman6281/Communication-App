import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { ConnectionHandler } from './handlers/connection.handler';
import { WebRTCHandler } from './handlers/webrtc.handler';
import { ChatHandler } from './handlers/chat.handler';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Socket.IO setup with Redis adapter for horizontal scaling
const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Async initialization function
async function initializeServer() {
  // Redis adapter for multi-instance support
  logger.info(`Redis configuration: ENABLED=${config.REDIS_ENABLED}, HOST=${config.REDIS_HOST}, PORT=${config.REDIS_PORT}`);

  if (config.REDIS_ENABLED) {
    try {
      logger.info('Attempting to connect to Redis...');
      const pubClient = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        lazyConnect: true, // Don't connect immediately
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries, disabling Redis adapter');
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        },
      });

      const subClient = pubClient.duplicate();

      // Handle connection errors gracefully
      pubClient.on('error', (err) => {
        logger.error('Redis pub client error:', err.message);
      });

      subClient.on('error', (err) => {
        logger.error('Redis sub client error:', err.message);
      });

      // Try to connect
      await pubClient.connect();
      await subClient.connect();

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('✅ Redis adapter enabled for Socket.IO');
    } catch (error: any) {
      logger.error('❌ Failed to connect to Redis:', error.message);
      logger.info('⚠️  Continuing without Redis adapter (single instance mode)');
    }
  } else {
    logger.info('ℹ️  Redis disabled - running in single instance mode');
  }
}

// Authentication middleware
io.use(authMiddleware);

// Initialize handlers
const connectionHandler = new ConnectionHandler(io);
const webrtcHandler = new WebRTCHandler(io);
const chatHandler = new ChatHandler(io);

// Socket connection handling
io.on('connection', (socket: Socket) => {
  logger.info(`Client connected: ${socket.id} (User: ${socket.data.userId})`);

  // Connection events
  connectionHandler.handleConnection(socket);

  // WebRTC signaling events for calls
  socket.on('call:initiate', (data) => webrtcHandler.handleCallInitiate(socket, data));
  socket.on('call:accept', (data) => webrtcHandler.handleCallAccept(socket, data));
  socket.on('call:reject', (data) => webrtcHandler.handleCallReject(socket, data));
  socket.on('call:end', (data) => webrtcHandler.handleCallEnd(socket, data));

  // WebRTC signaling
  socket.on('webrtc:offer', (data) => webrtcHandler.handleOffer(socket, data));
  socket.on('webrtc:answer', (data) => webrtcHandler.handleAnswer(socket, data));
  socket.on('webrtc:ice-candidate', (data) => webrtcHandler.handleIceCandidate(socket, data));

  // Media control events
  socket.on('media:toggle-audio', (data) => webrtcHandler.handleToggleAudio(socket, data));
  socket.on('media:toggle-video', (data) => webrtcHandler.handleToggleVideo(socket, data));
  socket.on('screen:share-start', (data) => webrtcHandler.handleScreenShareStart(socket, data));
  socket.on('screen:share-stop', (data) => webrtcHandler.handleScreenShareStop(socket, data));

  // Chat messaging events (enhanced real-time)
  socket.on('message:send', (data) => chatHandler.handleMessage(socket, data));
  socket.on('message:typing', (data) => chatHandler.handleTyping(socket, data));
  socket.on('message:read', (data) => chatHandler.handleRead(socket, data));

  // Room events
  socket.on('room:join', (data) => connectionHandler.handleJoinRoom(socket, data));
  socket.on('room:leave', (data) => connectionHandler.handleLeaveRoom(socket, data));

  // Presence events
  socket.on('presence:update', (data) => connectionHandler.handlePresenceUpdate(socket, data));

  // Disconnection
  socket.on('disconnect', () => connectionHandler.handleDisconnect(socket));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: io.engine.clientsCount,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    connections: {
      total: io.engine.clientsCount,
      authenticated: connectionHandler.getAuthenticatedUsersCount(),
    },
    calls: {
      active: webrtcHandler.getActiveCallsCount(),
      total: webrtcHandler.getTotalCallsCount(),
    },
    rooms: connectionHandler.getRoomsCount(),
    uptime: process.uptime(),
  });
});

const PORT = config.PORT || 4000;

// Initialize server with Redis (if enabled) and start listening
initializeServer().then(() => {
  httpServer.listen(PORT, () => {
    logger.info(`🚀 WebRTC Signaling Server running on port ${PORT}`);
    logger.info(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}).catch((error) => {
  logger.error('Failed to initialize server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});