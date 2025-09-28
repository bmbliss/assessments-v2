# Docker Setup for Patient Assessment POC

This guide walks you through setting up the Patient Assessment POC using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed on your machine
- Docker Compose (included with Docker Desktop)

## Environment Setup

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Configure Clerk Authentication:**
   - Sign up at [clerk.com](https://clerk.com) and create a new application
   - Get your publishable key and secret key from the Clerk dashboard
   - Update your `.env` file with the Clerk keys:
     ```env
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
     CLERK_SECRET_KEY=sk_test_your_key_here
     ```

## Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Initialize the database (in a new terminal):**
   ```bash
   # Push the schema to create tables
   docker-compose exec nextjs npx prisma db push
   
   # Generate Prisma client
   docker-compose exec nextjs npx prisma generate
   
   # Seed the database with sample data
   docker-compose exec nextjs npm run db:seed
   ```

3. **Access the application:**
   - **Main App**: http://localhost:3232
   - **Prisma Studio** (optional): http://localhost:5555 (run with profile)

## Development Workflow

### Starting Services
```bash
# Start all services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start only specific services
docker-compose up postgres nextjs
```

### Database Management
```bash
# View database in Prisma Studio
docker-compose --profile tools up prisma-studio

# Reset database and reseed
docker-compose exec nextjs npx prisma db push --force-reset
docker-compose exec nextjs npm run db:seed

# Run migrations (for production)
docker-compose exec nextjs npx prisma migrate dev
```

### Development Commands
```bash
# View logs
docker-compose logs -f nextjs

# Execute commands in the Next.js container
docker-compose exec nextjs npm run lint
docker-compose exec nextjs npm run build

# Access container shell
docker-compose exec nextjs sh
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## Service Details

### PostgreSQL Database
- **Port**: 5433
- **Database**: assessments_poc
- **Username**: postgres
- **Password**: password123
- **Volume**: `postgres_data` (persistent storage)

### Next.js Application
- **Port**: 3232
- **Hot reload**: Enabled via volume mounts
- **Environment**: Development mode

### Prisma Studio (Optional)
- **Port**: 5555
- **Usage**: Database GUI for development
- **Start**: `docker-compose --profile tools up prisma-studio`

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using port 3232/5433
   lsof -i :3232
   lsof -i :5433
   ```

2. **Database connection issues:**
   ```bash
   # Restart postgres service
   docker-compose restart postgres
   
   # Check postgres logs
   docker-compose logs postgres
   ```

3. **Node modules issues:**
   ```bash
   # Rebuild containers
   docker-compose build --no-cache
   ```

4. **Permission issues (Linux/Mac):**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Clean Restart
```bash
# Complete cleanup and restart
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## File Structure

```
├── docker-compose.yml        # Multi-service orchestration
├── Dockerfile                # Next.js app container
├── .dockerignore             # Docker ignore rules
├── env.example               # Environment template
├── src/                      # Next.js application
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Sample data
└── DOCKER_SETUP.md           # This file
```

## Next Steps

After getting the application running:

1. **Configure Clerk**: Update `.env` with your Clerk credentials
2. **Test Authentication**: Try signing up/in at http://localhost:3232
3. **Explore Database**: Use Prisma Studio to view seeded data
4. **Start Development**: Begin implementing the assessment features

## Production Considerations

For production deployment:
- Use environment-specific `.env` files
- Set up proper secrets management
- Configure database backups
- Use production-ready PostgreSQL instance
- Set up monitoring and logging
- Configure HTTPS and security headers
