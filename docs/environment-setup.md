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

### Required Variables

All variables in the table above are **required** for the application to function properly.
