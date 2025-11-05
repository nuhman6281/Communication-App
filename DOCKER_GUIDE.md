# Docker Setup Guide

Complete guide for running the Communication App with Docker.

## Quick Start

```bash
# Start all services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

## Architecture

The unified `docker-compose.yml` runs all services in a single stack:

### Services

| Service | Container Name | Port(s) | Description |
|---------|---------------|---------|-------------|
| **postgres** | chatapp-postgres | 5432 | PostgreSQL database |
| **redis** | chatapp-redis | 6379 | Main Redis (caching, queues, Socket.IO) |
| **redis-realtime** | chatapp-redis-realtime | 6380 | WebRTC signaling Redis adapter |
| **minio** | chatapp-minio | 9000, 9001 | S3-compatible storage |
| **backend** | chatapp-backend | 3001 | NestJS API |
| **realtime-service** | chatapp-realtime-service | 4000 | WebRTC signaling server |
| **coturn** | chatapp-coturn | 3478, 5349, 49152-49200 | TURN/STUN NAT traversal |
| **nginx** | chatapp-nginx | 8080 | Reverse proxy (sticky sessions) |

### Network

- **Network**: `chatapp-network` (bridge, subnet: 172.25.0.0/16)
- All services communicate internally via Docker networking

### Volumes

```bash
# Persistent data volumes
postgres_data          # Database files
redis_data             # Main Redis data
redis_realtime_data    # Realtime Redis data
minio_data             # S3 storage
backend_logs           # Backend application logs
realtime_logs          # Realtime service logs
```

## Configuration

### Environment Variables

All configuration is managed through the root `.env` file. Key sections:

```bash
# Ports (customize if conflicts)
POSTGRES_PORT=5432
REDIS_PORT=6379
REDIS_REALTIME_PORT=6380
MINIO_PORT=9000
BACKEND_PORT=3001
REALTIME_PORT=4000

# Database
POSTGRES_DB=chatapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# JWT (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# ... (see .env for complete configuration)
```

## Common Operations

### View Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f realtime-service
docker compose logs -f postgres

# Last 50 lines
docker compose logs --tail=50 backend
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart realtime-service
```

### Rebuild Services

```bash
# Rebuild and restart all
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend
```

### Database Operations

```bash
# Access PostgreSQL
docker exec -it chatapp-postgres psql -U postgres -d chatapp

# Backup database
docker exec chatapp-postgres pg_dump -U postgres chatapp > backup.sql

# Restore database
docker exec -i chatapp-postgres psql -U postgres chatapp < backup.sql

# Reset database (WARNING: deletes all data!)
docker compose down
docker volume rm communicationapp_postgres_data
docker compose up -d
```

### Redis Operations

```bash
# Access main Redis CLI
docker exec -it chatapp-redis redis-cli

# Access realtime Redis CLI (with password)
docker exec -it chatapp-redis-realtime redis-cli -a redis-password

# Flush all Redis data (WARNING!)
docker exec chatapp-redis redis-cli FLUSHALL
```

### MinIO Operations

```bash
# Access MinIO console
# Open: http://localhost:9001
# Login: minioadmin / minioadmin123

# View MinIO logs
docker compose logs -f minio
```

### Health Checks

```bash
# Check all service health
docker compose ps

# Backend health
curl http://localhost:3001/health

# Realtime service health
curl http://localhost:4000/health

# MinIO health
curl http://localhost:9000/minio/health/live

# PostgreSQL health
docker exec chatapp-postgres pg_isready -U postgres

# Redis health
docker exec chatapp-redis redis-cli ping
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs for errors
docker compose logs

# Check disk space
docker system df

# Clean up unused resources
docker system prune -a --volumes -f

# Restart Docker Desktop
```

### Port Conflicts

If ports are already in use, update `.env`:

```bash
# Example: Change backend port
BACKEND_PORT=3002

# Restart stack
docker compose down
docker compose up -d
```

### Database Connection Issues

```bash
# Verify PostgreSQL is healthy
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Recreate database container
docker compose down
docker volume rm communicationapp_postgres_data
docker compose up -d postgres
```

### Redis Connection Issues

```bash
# Check Redis health
docker exec chatapp-redis redis-cli ping

# Check connection from backend
docker exec chatapp-backend nc -zv redis 6379
```

### Out of Disk Space

```bash
# Check disk usage
docker system df

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove unused build cache
docker builder prune -a -f

# Nuclear option: clean everything
docker system prune -a --volumes -f
```

### Backend Won't Start

```bash
# Check logs
docker compose logs backend

# Rebuild backend
docker compose up -d --build --force-recreate backend

# Access backend shell
docker exec -it chatapp-backend sh
cd /app
npm run build
```

### WebRTC Calls Not Working

```bash
# Check realtime service
docker compose logs realtime-service

# Check coturn TURN server
docker compose logs coturn

# Verify realtime service health
curl http://localhost:4000/health

# Check Redis connection
docker compose logs redis-realtime
```

## Development Workflow

### Local Development with Docker

```bash
# 1. Start infrastructure only (no backend/realtime)
docker compose up -d postgres redis redis-realtime minio coturn

# 2. Run backend locally
cd chat-backend
npm install
npm run start:dev

# 3. Run realtime service locally
cd realtime-service
npm install
npm run dev

# 4. Run frontend locally
cd chat-web-client
npm install
npm run dev
```

### Hot Reload in Docker

The backend and realtime services use volume mounts for hot reload:

```bash
# Backend: /app directory is mounted
# Changes to code will trigger reload automatically

# View backend build logs
docker compose logs -f backend
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Use proper `EXTERNAL_IP` for TURN server
- [ ] Enable SSL/TLS for all services
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure logging and monitoring

### Recommended Changes

```bash
# .env for production
NODE_ENV=production
DATABASE_SYNC=false  # Disable auto-migrations
DATABASE_LOGGING=false
LOG_LEVEL=warn

# Use strong passwords
POSTGRES_PASSWORD=<generate-strong-password>
REDIS_REALTIME_PASSWORD=<generate-strong-password>
MINIO_ROOT_PASSWORD=<generate-strong-password>

# Configure TURN server
EXTERNAL_IP=<your-server-public-ip>
TURN_REALM=yourdomain.com
```

### SSL/TLS Setup

```bash
# 1. Obtain SSL certificates (Let's Encrypt recommended)
# 2. Update nginx-realtime.conf with SSL configuration
# 3. Add SSL ports to docker-compose.yml
# 4. Update CORS_ORIGIN with https URLs
```

## Migration from Old Setup

If you were using the old split docker-compose setup:

```bash
# 1. Stop old stacks
cd chat-backend
docker compose down

cd ..
docker compose -f docker-compose.realtime.yml down

# 2. Remove old volumes (optional, only if fresh start needed)
docker volume prune -f

# 3. Start unified stack
docker compose up -d

# 4. Old files have been renamed to .old for backup
# docker-compose.realtime.yml -> docker-compose.realtime.yml.old
# chat-backend/docker-compose.yml -> chat-backend/docker-compose.yml.old
```

## Useful Commands

### Monitoring

```bash
# Real-time resource usage
docker stats

# Service health check loop
watch -n 5 'docker compose ps'

# Follow all logs with timestamps
docker compose logs -f --timestamps
```

### Cleanup

```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f

# Complete cleanup
docker system prune -a --volumes -f
```

### Backup & Restore

```bash
# Backup all volumes
docker run --rm -v communicationapp_postgres_data:/source -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /source .
docker run --rm -v communicationapp_redis_data:/source -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz -C /source .
docker run --rm -v communicationapp_minio_data:/source -v $(pwd):/backup alpine tar czf /backup/minio_backup.tar.gz -C /source .

# Restore volumes
docker run --rm -v communicationapp_postgres_data:/target -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /target
```

## Support

For issues:
1. Check logs: `docker compose logs`
2. Verify health: `docker compose ps`
3. Review this guide
4. Check PROJECT_DOCUMENTATION.md for service details
