# Environment Setup Guide

This document provides guidance on setting up the required environment variables for TheSync Backend.

## 📋 Environment Variables Reference

Create a `.env` file in the root directory of the project and configure the following variables:

| #   | Variable Name              | Description                                                               | Example                                                        |
| --- | -------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | `NODE_ENV`                 | Environment mode, determines if running in development or production      | `development` or `production`                                  |
| 2   | `ALLOWED_ORIGINS`          | The allowed origins for CORS (separated by commas )                       | `http://localhost:3000,https://app.company.com`                |
| 3   | `DATABASE_URL`             | Connection string used for database operations through connection pooling | `postgresql://dbuser:secure_db_pass@localhost:5432/thesync_db` |
| 4   | `DIRECT_URL`               | Direct connection to the database, primarily used for Prisma migrations   | `postgresql://dbuser:secure_db_pass@localhost:5432/thesync_db` |
| 5   | `JWT_ACCESS_TOKEN_SECRET`  | Your JWT access token secret                                              | `jwt_access_secret_key_2024_secure`                            |
| 6   | `JWT_REFRESH_TOKEN_SECRET` | Your JWT refresh token secret                                             | `jwt_refresh_secret_key_2024_secure`                           |
| 7   | `FRONTEND_URL`             | Frontend application URL for redirect purposes                            | `https://app.company.com`                                      |
| 8   | `REDIS_URL`                | Redis connection string for queue management and caching                  | `redis://localhost:6379`                                       |
| 9   | `BULLMQ_USERNAME`          | Username for BullMQ dashboard authentication                              | `admin_user`                                                   |
| 10  | `BULLMQ_PASSWORD`          | Password for BullMQ dashboard authentication                              | `bullmq_admin_pass_2024`                                       |
| 11  | `SMTP_HOST`                | SMTP server host for email sending                                        | `smtp.gmail.com`                                               |
| 12  | `SMTP_PORT`                | SMTP server port for email sending                                        | `587`                                                          |
| 13  | `SMTP_USER`                | SMTP username for email sending                                           | `notification@company.com`                                     |
| 14  | `SMTP_PASS`                | SMTP password for email sending                                           | `smtp_secure_pass_2024`                                        |
| 15  | `PINECONE_API_KEY`         | Pinecone API key for vector database operations                           | `pcsk_7xBq8K_RT2qjiAMUzssMvAYi3KS2n7nQ8SCCkg9skYZDNTpYSWn`     |
| 16  | `PINECONE_INDEX_NAME`      | Pinecone index name for storing vector embeddings                         | `thesis-embeddings`                                            |

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

### Pinecone AI Configuration

The application uses Pinecone for vector database operations and AI-powered features:

- **PINECONE_API_KEY**: API key for authenticating with Pinecone services.
- **PINECONE_INDEX_NAME**: Name of the Pinecone index used for storing and querying vector embeddings.

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

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://app.company.com

# Database
DATABASE_URL=postgresql://dbuser:secure_db_pass@localhost:5432/thesync_db
DIRECT_URL=postgresql://dbuser:secure_db_pass@localhost:5432/thesync_db

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=jwt_access_secret_key_2024_secure
JWT_REFRESH_TOKEN_SECRET=jwt_refresh_secret_key_2024_secure

# Frontend Configuration
FRONTEND_URL=https://app.company.com

# Redis & Queue
REDIS_URL=redis://localhost:6379
BULLMQ_USERNAME=admin_user
BULLMQ_PASSWORD=bullmq_admin_pass_2024

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notification@company.com
SMTP_PASS=smtp_secure_pass_2024

# Pinecone AI Configuration
PINECONE_API_KEY=pcsk_7xBq8K_RT2qjiAMUzssMvAYi3KS2n7nQ8SCCkg9skYZDNTpYSWn
PINECONE_INDEX_NAME=thesis-embeddings
```
