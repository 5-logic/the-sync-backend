# Environment Setup Guide

This document provides guidance on setting up the required environment variables for TheSync Backend.

## 📋 Environment Variables Reference

Create a `.env` file in the root directory of the project and configure the following variables:

| #   | Variable Name              | Description                                                               | Example                                                        |
| --- | -------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | `NODE_ENV`                 | Environment mode, determines if running in development or production      | `development` or `production`                                  |
| 2   | `ALLOWED_ORIGINS`          | The allowed origins for CORS (separated by commas )                       | `http://localhost:3000,http://localhost:3001`                  |
| 3   | `DATABASE_URL`             | Connection string used for database operations through connection pooling | `postgresql://postgres:randompassword@localhost:5432/randomdb` |
| 4   | `DIRECT_URL`               | Direct connection to the database, primarily used for Prisma migrations   | `postgresql://postgres:randompassword@localhost:5432/randomdb` |
| 5   | `JWT_ACCESS_TOKEN_SECRET`  | Your JWT access token secret                                              | `randomaccesstoken123`                                         |
| 6   | `JWT_REFRESH_TOKEN_SECRET` | Your JWT refresh token secret                                             | `randomrefreshtoken456`                                        |
| 7   | `FRONTEND_URL`             | Frontend application URL for redirect purposes                            | `https://example.com`                                          |
| 8   | `REDIS_URL`                | Redis connection string for queue management and caching                  | `redis://localhost:6379`                                       |
| 9   | `BULLMQ_USERNAME`          | Username for BullMQ dashboard authentication                              | `randomuser`                                                   |
| 10  | `BULLMQ_PASSWORD`          | Password for BullMQ dashboard authentication                              | `randompassword789`                                            |
| 11  | `SMTP_HOST`                | SMTP server host for email sending                                        | `smtp.example.com`                                             |
| 12  | `SMTP_PORT`                | SMTP server port for email sending                                        | `465`                                                          |
| 13  | `SMTP_USER`                | SMTP username for email sending                                           | `randomemail@example.com`                                      |
| 14  | `SMTP_PASS`                | SMTP password for email sending                                           | `randomsmtppassword`                                           |

### Required Variables

All variables in the table above are **required** for the application to function properly.

### Frontend Configuration

- **FRONTEND_URL**: The URL of the frontend application. This is used for redirect purposes in authentication flows.

### Redis & Queue Management

The application uses Redis for queue management and BullMQ for job processing:

- **REDIS_URL**: Redis connection string. Defaults to `redis://localhost:6379` if not provided.
- **BULLMQ_USERNAME**: Username for accessing the BullMQ dashboard (only available in development mode).
- **BULLMQ_PASSWORD**: Password for BullMQ dashboard authentication (required when using BullMQ dashboard).

### SMTP Configuration

The application uses SMTP for email sending:

- **SMTP_HOST**: Hostname of the SMTP server.
- **SMTP_PORT**: Port number for the SMTP server.
- **SMTP_USER**: Username for SMTP authentication.
- **SMTP_PASS**: Password for SMTP authentication.

### BullMQ Dashboard

The BullMQ dashboard is available at `/bull-board` in development mode only. It provides:

- Real-time monitoring of job queues.
- Job retry and failure management.
- Queue statistics and metrics.
- Job logs and debugging information.

### Example .env File

```env
# Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:randompassword@localhost:5432/randomdb
DIRECT_URL=postgresql://postgres:randompassword@localhost:5432/randomdb

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=randomaccesstoken123
JWT_REFRESH_TOKEN_SECRET=randomrefreshtoken456

# Frontend Configuration
FRONTEND_URL=https://example.com

# Redis & Queue
REDIS_URL=redis://localhost:6379
BULLMQ_USERNAME=randomuser
BULLMQ_PASSWORD=randompassword789

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=randomemail@example.com
SMTP_PASS=randomsmtppassword
```
