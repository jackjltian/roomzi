# Docker Setup for Driven Devs Application

This directory contains Docker configuration files for containerizing the Driven Devs housing platform application.

## Overview

The application consists of two main services:
- **Frontend**: React application built with Vite, served by Nginx
- **Backend**: Node.js Express API with Prisma ORM

## Files Structure

```
CICD/
├── Dockerfile.backend      # Backend container configuration
├── Dockerfile.frontend     # Frontend container configuration
├── docker-compose.yml      # Multi-service orchestration
├── nginx.conf             # Nginx configuration for frontend
├── .dockerignore          # Files to exclude from Docker builds
└── README.md              # This file
```

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of available RAM

## Quick Start

1. **Clone the repository and navigate to the CICD directory:**
   ```bash
   cd CICD
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with your configuration:
   ```env
   DATABASE_URL=your_database_connection_string
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   FRONTEND_URL=http://localhost:80
   ```

3. **Build and run the containers:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3001

## Individual Service Commands

### Build Backend Only
```bash
docker build -f CICD/Dockerfile.backend -t driven-devs-backend .
```

### Build Frontend Only
```bash
docker build -f CICD/Dockerfile.frontend -t driven-devs-frontend .
```

### Run Backend Container
```bash
docker run -p 3001:3001 --env-file .env driven-devs-backend
```

### Run Frontend Container
```bash
docker run -p 80:80 driven-devs-frontend
```

## Development Setup

For development, you can use the following commands:

### Development with Volume Mounting
```bash
# Backend with hot reload
docker run -p 3001:3001 -v $(pwd)/backend:/app -v /app/node_modules driven-devs-backend npm run dev

# Frontend with hot reload
docker run -p 8080:8080 -v $(pwd)/frontend:/app -v /app/node_modules driven-devs-frontend npm run dev
```

## Production Deployment

### Using Docker Compose
```bash
# Build and run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Docker Swarm
```bash
# Initialize swarm (if not already done)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml driven-devs
```

## Environment Variables

### Backend Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `FRONTEND_URL`: Frontend application URL
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode (production/development)

### Frontend Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_API_URL`: Backend API URL

## Database Setup

The backend uses Prisma ORM. Before running the containers:

1. **Generate Prisma client:**
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Ensure ports 80 and 3001 are available
   - Modify ports in `docker-compose.yml` if needed

2. **Database connection issues:**
   - Verify `DATABASE_URL` is correct
   - Ensure database is accessible from container

3. **Build failures:**
   - Clear Docker cache: `docker system prune -a`
   - Check for syntax errors in Dockerfiles

4. **Permission issues:**
   - Ensure proper file permissions
   - Check Docker user permissions

### Logs and Debugging

```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

## Performance Optimization

### Multi-stage Builds
The Dockerfiles use multi-stage builds to:
- Reduce final image size
- Separate build dependencies from runtime
- Improve build caching

### Nginx Configuration
The frontend uses Nginx with:
- Gzip compression
- Static asset caching
- Security headers
- React Router support

### Volume Management
- Uploads are persisted using Docker volumes
- Database data should be stored in external volumes for production

## Security Considerations

1. **Environment Variables:** Never commit sensitive data to version control
2. **User Permissions:** Containers run as non-root users
3. **Network Isolation:** Services communicate through Docker networks
4. **Security Headers:** Nginx includes security headers
5. **Dependency Scanning:** Regularly update dependencies

## Monitoring and Health Checks

### Health Check Endpoints
- Backend: `GET /api/health`
- Frontend: `GET /`

### Monitoring Commands
```bash
# Check container status
docker-compose ps

# Monitor resource usage
docker stats

# Check container health
docker inspect --format='{{.State.Health.Status}}' container_name
```

## Backup and Recovery

### Database Backups
```bash
# Create backup
docker-compose exec backend npx prisma db pull

# Restore from backup
docker-compose exec backend npx prisma db push
```

### Volume Backups
```bash
# Backup uploads volume
docker run --rm -v driven-devs_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore uploads volume
docker run --rm -v driven-devs_backend_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Contributing

When making changes to the Docker configuration:

1. Test locally with `docker-compose up --build`
2. Update this README if configuration changes
3. Ensure all environment variables are documented
4. Test both development and production builds

## License

This Docker configuration is part of the Driven Devs project. 