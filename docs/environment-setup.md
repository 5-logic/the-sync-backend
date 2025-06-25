# Environment Setup Guide

This document provides guidance on setting up the required environment variables for TheSync Backend.

## 📋 Environment Variables Reference

Create a `.env` file in the root directory of the project and configure the following variables:

| #   | Variable Name              | Description                                                               | Example                                                                   |
| --- | -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | `NODE_ENV`                 | Environment mode, determines if running in development or production      | `development` or `production`                                             |
| 2   | `DATABASE_URL`             | Connection string used for database operations through connection pooling | `postgresql://postgres:postgres@localhost:5432/thesync_db?pgbouncer=true` |
| 3   | `DIRECT_URL`               | Direct connection to the database, primarily used for Prisma migrations   | `postgresql://postgres:postgres@localhost:5432/thesync_db`                |
| 4   | `JWT_ACCESS_TOKEN_SECRET`  | Your JWT access token secret                                              | `your_jwt_access_secret`                                                  |
| 5   | `JWT_REFRESH_TOKEN_SECRET` | Your JWT refresh token secret                                             | `your_jwt_refresh_secret`                                                 |
| 6   | `ALLOWED_ORIGINS`          | The allowed origins for CORS (separated by commas )                       | `http://localhost:3000,http://localhost:3001`                             |
| 7   | `REDIS_URL`                | Redis connection string for queue management and caching                  | `redis://localhost:6379`                                                  |
| 8   | `BULLMQ_USERNAME`          | Username for BullMQ dashboard authentication                              | `admin`                                                                   |
| 9   | `BULLMQ_PASSWORD`          | Password for BullMQ dashboard authentication                              | `your_secure_password`                                                    |

### Required Variables

All variables in the table above are **required** for the application to function properly.

### Redis & Queue Management

The application uses Redis for queue management and BullMQ for job processing:

- **REDIS_URL**: Redis connection string. If not provided, defaults to `redis://localhost:6379`
- **BULLMQ_USERNAME**: Username for accessing the BullMQ dashboard (only available in development mode)
- **BULLMQ_PASSWORD**: Password for BullMQ dashboard authentication (required when using BullMQ dashboard)

### BullMQ Dashboard

The BullMQ dashboard is available at `/bull-board` in development mode only. It provides:

- Real-time monitoring of job queues
- Job retry and failure management
- Queue statistics and metrics
- Job logs and debugging information

### Example .env File

```env
# Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/thesync_db?pgbouncer=true
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/thesync_db

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=your_jwt_access_secret_here
JWT_REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Redis & Queue
REDIS_URL=redis://localhost:6379
BULLMQ_USERNAME=admin
BULLMQ_PASSWORD=your_secure_bullmq_password
```
