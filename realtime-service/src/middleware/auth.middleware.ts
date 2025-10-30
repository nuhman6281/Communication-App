import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // Try to get token from multiple sources
    let token = socket.handshake.auth?.token;

    if (!token) {
      token = socket.handshake.query?.token as string;
    }

    if (!token) {
      const authHeader = socket.handshake.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.warn(`Connection attempt without token from ${socket.handshake.address}`);
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    // Attach user data to socket
    socket.data.userId = decoded.sub;
    socket.data.email = decoded.email;
    socket.data.username = decoded.username;
    socket.data.authenticatedAt = new Date();

    logger.info(`User authenticated: ${decoded.username} (${decoded.sub})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.error(`JWT verification failed: ${error.message}`);
      return next(new Error('Invalid authentication token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.error('JWT token expired');
      return next(new Error('Authentication token expired'));
    }
    logger.error(`Authentication failed: ${error}`);
    next(new Error('Authentication failed'));
  }
};