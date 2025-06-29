# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.3] - 2025-06-29

### Changed

- **CORS Configuration Enhancement**:
  - Streamlined CORS configuration logic by moving environment check inside the origin function
  - Simplified CORS setup in main.ts by removing conditional configuration
  - Enhanced type safety by using Promise-based return type instead of callback pattern
  - Improved development mode handling - now automatically allows all origins in non-production environments

### Fixed

- **Code Quality Improvements**:
  - Removed unnecessary type casting in basic auth middleware for BullMQ dashboard
  - Cleaned up unused imports in main.ts (removed PRODUCTION constant import)
  - Enhanced code readability and maintainability across configuration files

### Pull Requests

- [#120](https://github.com/5-logic/the-sync-backend/pull/120) - Hotfix for CORS configuration and basic auth middleware improvements (closes #119)

## [0.5.2] - 2025-06-29

### Added

- **Enhanced Student Management APIs**:
  - `PUT /students/:id` - New admin endpoint for updating student information by administrators (requires `UpdateStudentDto` with `email`, `fullName`, `gender`, `phoneNumber`, `studentId`, `majorId`)
  - `SelfUpdateStudentDto` - New DTO for student self-updates (excludes `email`, `studentId`, `majorId`, `semesterId`)
- **Enhanced Lecturer Management APIs**:
  - `PUT /lecturers/:id` - New admin endpoint for updating lecturer information by administrators (requires `UpdateLecturerDto` with `email`, `fullName`, `gender`, `phoneNumber`)
  - `UpdateLecturerDto` - New DTO for admin lecturer updates

### Changed

- **API Role Segregation**:
  - **Student APIs**:
    - `PUT /students` (self-update) now uses `SelfUpdateStudentDto` instead of `UpdateStudentDto` for enhanced security
    - Students can only update their basic profile information (excluding critical fields like `email`, `studentId`, `majorId`, `semesterId`)
  - **Lecturer APIs**:
    - Added role-based update separation between self-updates and admin-managed updates
- **DTO Structure Improvements**:
  - `UpdateStudentDto` simplified to only omit `semesterId` (now used for admin updates)
  - Enhanced import consolidation across all modules for better maintainability
- **Code Organization**:
  - Consolidated import statements using barrel exports (`index.ts`) across auth, DTO, and domain modules
  - Improved readability by grouping related imports from authentication guards and decorators
  - Standardized import patterns for DTOs across all controllers and services

### Fixed

- **Import Structure**: Streamlined import statements across all controllers and services for better maintainability
- **Type Safety**: Enhanced TypeScript support with consolidated module exports

### Security

- **Enhanced Access Control**:
  - Students can no longer modify critical fields (`email`, `studentId`, `majorId`, `semesterId`) through self-update
  - Only administrators can update all student and lecturer fields through dedicated admin endpoints
  - Improved separation of concerns between self-managed and admin-managed updates

### Code Quality

- **Import Optimization**: Reduced code complexity by consolidating imports and using barrel exports
- **Consistency**: Standardized import patterns across all modules for better maintainability
- **Readability**: Improved code organization with cleaner import statements

### Pull Requests

- [#118](https://github.com/5-logic/the-sync-backend/pull/118) - Merge dev branch for v0.5.2 release
- [#117](https://github.com/5-logic/the-sync-backend/pull/117) - Enhanced student and lecturer management with role-based updates (closes #116)

## [0.5.1] - 2025-06-28

### Fixed

- **Dockerfile Optimization**:
  - Moved group and user creation commands to the same RUN command for better layer caching.
  - Used `--no-install-recommends` for OpenSSL installation to reduce image size.
  - Renamed pre-production stage to `library` and adjusted dependencies.

### Pull Requests

- [#112](https://github.com/5-logic/the-sync-backend/pull/112) - Hotfix for Dockerfile improvements and task optimization.

## [0.5.0] - 2025-06-27

### Added

- **Framework Migration to Fastify**:
  - Migrated from Express to Fastify for improved performance and better TypeScript support
  - Added `@nestjs/platform-fastify` as the new platform adapter
  - Implemented Fastify-specific body size limits (50MB) for large import operations
  - Added custom `FastifyRequest` interface for enhanced type safety
- **Email System with Queue Management**:
  - Implemented comprehensive email notification system using `nodemailer`
  - Added email templates with Pug templating engine for lecturer and student account notifications
  - Created email queue system with BullMQ for reliable email processing
  - Added `EmailJobDto` for structured email job data transfer
  - Added email job types: `SEND_STUDENT_ACCOUNT`, `SEND_LECTURER_ACCOUNT`, `SEND_OTP`, `SEND_NOTIFICATION`
- **Redis Integration & BullMQ Dashboard**:
  - Added Redis configuration for queue management and caching
  - Integrated BullMQ for job processing with dashboard monitoring at `/bull-board`
  - Added basic authentication middleware for BullMQ dashboard security
  - Implemented Redis connection pooling and configuration management
- **Enhanced Configuration Management**:
  - Created centralized configuration system with `CONFIG_TOKENS`, `CONFIG_MOUNTS`, and `CONFIG_QUEUES`
  - Added email configuration with SMTP settings
  - Added Redis configuration for queue management
  - Implemented environment-based configuration loading
- **Password Management Improvements**:
  - Simplified password validation regex for better usability
  - Removed mandatory password field from `CreateUserDto` (auto-generated)
  - Enhanced password generation settings for better security
- **Database & Service Enhancements**:
  - Added `PrismaModule` and `PrismaService` for improved database connection management
  - Enhanced student and lecturer creation with automatic email notifications
  - Implemented unified user creation and email notification flow
- **Logging & Monitoring**:
  - Added `LoggingInterceptor` for comprehensive request/response logging
  - Enhanced bootstrap logging with detailed service URLs
  - Added logging for BullMQ dashboard availability

### Changed

- **Dependencies Migration**:
  - **Removed**: `express`, `@types/express`, `morgan`, `@types/morgan`, `@nestjs/platform-express`
  - **Added**: `fastify`, `@nestjs/platform-fastify`, `bullmq`, `@nestjs/bullmq`, `nodemailer`, `@types/nodemailer`, `pug`
  - **Added BullMQ Dashboard**: `@bull-board/api`, `@bull-board/fastify`, `@bull-board/nestjs`
  - **Added Fastify Extensions**: `@fastify/basic-auth`, `@fastify/static`
  - **Updated**: `@nestjs/common`, `@nestjs/core`, `@prisma/client`, `eslint`, `typescript-eslint`
- **DTO Standardization**:
  - Removed `password` field from `CreateUserDto` (now auto-generated)
  - Simplified `UpdateUserDto` to only omit `email` field instead of both `email` and `password`
  - Enhanced validation and type safety across all DTOs
- **API Response & Error Handling**:
  - Improved global exception handling with Fastify integration
  - Enhanced response transformation with additional logging
  - Better error messages and status codes for API operations
- **Build & Development Configuration**:
  - Updated build script to use standard `nest build` instead of webpack
  - Enhanced Dockerfile to use `node:slim` instead of `alpine` for better compatibility
  - Added `nest-cli.json` to Docker build context
  - Updated user creation in Dockerfile for Ubuntu-based images
- **Module Organization**:
  - Created index files for filters and interceptors to streamline imports
  - Enhanced module imports and dependency injection
  - Improved code organization with centralized configuration

### Fixed

- **Docker Configuration**:
  - Fixed Dockerfile to use `node:slim` base image for better dependency compatibility
  - Added missing `nest-cli.json` file to Docker build context
  - Updated user creation commands for Ubuntu-based Docker images
  - Added `package.json` to production Docker stage
- **Type Safety & Code Quality**:
  - Enhanced TypeScript configuration with proper Fastify types
  - Fixed import paths and module resolution
  - Improved code formatting with consistent styling
- **Configuration & Environment**:
  - Enhanced environment variable validation and defaults
  - Fixed Redis configuration loading and validation
  - Improved CORS configuration with better type safety

### Removed

- **Express Dependencies**:
  - Removed Express framework and all related dependencies
  - Removed Morgan middleware (replaced with LoggingInterceptor)
  - Removed Express-specific type definitions
- **Unused Dependencies**:
  - Removed `@types/pug` (not needed with current implementation)
  - Cleaned up unused imports and configurations

### Security

- **BullMQ Dashboard Protection**:
  - Added basic authentication for BullMQ dashboard access
  - Implemented username/password protection for queue monitoring
- **Enhanced Password Security**:
  - Improved password generation with better entropy
  - Simplified but secure password validation patterns
- **Request Size Limits**:
  - Maintained 50MB body size limit for secure file uploads
  - Enhanced request validation and sanitization

### Performance

- **Framework Performance**:
  - Fastify provides significant performance improvements over Express
  - Better JSON parsing and serialization
  - Improved request/response handling efficiency
- **Queue System Optimization**:
  - Asynchronous email processing prevents blocking operations
  - Redis-based queue management for reliable job processing
  - Background job processing for better user experience

### Documentation

- **Environment Setup Guide**:
  - Added comprehensive Redis and BullMQ configuration documentation
  - Enhanced SMTP configuration examples and descriptions
  - Added BullMQ dashboard access and usage information
  - Provided complete `.env` file example with all required variables

### Pull Requests

- [#110](https://github.com/5-logic/the-sync-backend/pull/110) - Merge dev branch for v0.5.0 release
- [#109](https://github.com/5-logic/the-sync-backend/pull/109) - Fastify migration and middleware enhancements (closes #108)
- [#107](https://github.com/5-logic/the-sync-backend/pull/107) - Docker configuration improvements (closes #106)
- [#105](https://github.com/5-logic/the-sync-backend/pull/105) - Email system implementation with queue management (closes #69)
- [#104](https://github.com/5-logic/the-sync-backend/pull/104) - Redis integration and BullMQ dashboard setup (closes #102)

## [0.4.3] - 2025-06-25

### Changed

- **Transaction Management Enhancement**:
  - **Lecturer Service**: Added explicit timeout configuration (10 minutes) to batch lecturer creation transactions in `POST /lecturers/import` endpoint to prevent timeout issues during large import operations
  - **Student Service**: Standardized timeout constant definition for consistent transaction management across both student and lecturer batch operations

### Performance

- Improved reliability of batch import operations by implementing consistent transaction timeout handling
- Enhanced error handling for long-running database transactions during bulk data operations

### Pull Requests

- [#103](https://github.com/5-logic/the-sync-backend/pull/103) - Merge dev branch for v0.4.3 release
- [#101](https://github.com/5-logic/the-sync-backend/pull/101) - Add TIMEOUT constant to LecturerService and StudentService for transaction management (closes #100)

## [0.4.2] - 2025-06-25

### Fixed

- **Student API Enhancement**:
  - `GET /students/semester/:semesterId` - Fixed semester validation logic to only check semester existence instead of requiring specific semester status (Preparing/Picking). This allows fetching students from any semester regardless of its current status.
- **Service Method Improvement**: Simplified semester validation in `findAllBySemester` method by removing unnecessary status check that was preventing valid queries from semesters in different phases.

### Pull Requests

- [#99](https://github.com/5-logic/the-sync-backend/pull/99) - Merge dev branch for v0.4.2 release
- [#98](https://github.com/5-logic/the-sync-backend/pull/98) - Bug fix for message in get all students by semester

## [0.4.1] - 2025-06-25

### Added

- **Student Management APIs**:
  - `GET /students/semester/:semesterId` - Fetch students by semester with validation (requires valid UUID for `semesterId`)
  - `POST /students/import` - Batch student creation and enrollment endpoint (requires `ImportStudentDto` with `semesterId`, `majorId`, and `students` array)
- **Enhanced Body Size Limit**: Increased request body size limit to 50MB for large import operations
- **Student Enrollment Validation**:
  - Semester status validation (only allows enrollment in `Preparing` and `Picking` semesters)
  - Major existence validation before enrollment
  - Enhanced error messages for enrollment conflicts

### Changed

- **API Parameter Updates**:
  - **Student APIs**: `CreateStudentDto` now uses `@IsUUID()` validation for `majorId` and `semesterId` (previously `@IsString()`)
  - **Lecturer APIs**:
    - `POST /lecturers` now uses `CreateUserDto` instead of `CreateLecturerDto`
    - `PUT /lecturers` now uses `UpdateUserDto` instead of `UpdateLecturerDto`
    - `POST /lecturers/import` now accepts `CreateUserDto[]` instead of `CreateLecturerDto[]`
- **Batch Import Improvements**:
  - `POST /students/import` now uses `ImportStudentDto` (with `semesterId`, `majorId`, and `students` array) instead of `CreateStudentDto[]`
  - Added transaction timeout (10 minutes) for large batch operations
  - Pre-validation of semester and major before processing students
- **Service Method Standardization**: Parameter naming standardized to `dto` across student and user service methods
- **Code Formatting**: Added missing line breaks in lecturer and student controllers for improved readability

### Fixed

- Enhanced error handling for semester enrollment with clearer conflict messages
- Improved validation flow for batch student operations
- Better logging for student creation and enrollment processes

### Removed

- **Deprecated DTOs**:
  - `CreateLecturerDto` (replaced with `CreateUserDto`)
  - `UpdateLecturerDto` (replaced with `UpdateUserDto`)
- **Removed Fields**: `isModerator` field from lecturer creation (now handled through separate endpoints)

### Security

- Enhanced UUID validation for semester and major IDs in student operations
- Improved validation for semester status before allowing student enrollment

### Pull Requests

- [#96](https://github.com/5-logic/the-sync-backend/pull/96) - Merge dev branch for v0.4.1 release
- [#95](https://github.com/5-logic/the-sync-backend/pull/95) - Standardize parameter naming and DTO usage
- [#94](https://github.com/5-logic/the-sync-backend/pull/94) - Add endpoint to fetch students by semester
- [#93](https://github.com/5-logic/the-sync-backend/pull/93) - Implement batch student creation with enhanced validation

## [0.4.0] - 2025-06-23

### Added

- **Thesis Management APIs**:
  - `POST /theses/:id/submit` - Submit thesis for review (requires `ThesisStatus` enum)
  - `POST /theses/:id/review` - Review thesis with approval/rejection (requires `ReviewThesisDto` with `status` field)
  - `DELETE /theses/:id` - Remove thesis functionality
- **Student Management APIs**:
  - `POST /students/:id/toggle-status` - Toggle student active status (requires `ToggleStudentStatusDto` with optional `isActive` boolean)
- **Lecturer Management APIs**:
  - `POST /lecturers/:id/toggle-status` - Toggle lecturer status and moderator privileges (requires `ToggleLecturerStatusDto` with optional `isActive` and `isModerator` booleans)
- **Group Management Enhancements**:
  - Role-based access control for group creation and updates
  - User context injection for group operations
- Milestone management with role-based access control and validation
- Enhanced thesis creation with supporting document and versioning support
- Student enrollment logic improvements with password reset functionality
- Semester validation for ongoing phases with enhanced logging

### Changed

- **API Authentication**: Consolidated guard usage across all controllers for better readability
- **Parameter Naming**: Standardized DTO parameter naming from full names to `dto` across all controllers
- **Database Schema**:
  - Removed `created_at` and `updated_at` timestamps from Student and Lecturer models
  - Updated foreign key constraints for enrollments to enable cascading deletes
  - Enhanced thesis versioning with ordered results by version number
- **Group APIs**: Updated group creation and update endpoints to require user authentication and validate semester status
- **Semester Management**: Enhanced validation methods with nullish coalescing operators
- **User Management**: Simplified update methods and removed `isActive` field from update DTOs

### Fixed

- Thesis version ordering in `findAll` and `findOne` methods
- Initial version setting when creating new thesis versions
- User existence checks and password generation logic improvements
- Semester update validations for ongoing phase transitions
- API documentation tags correction from 'Majors' to 'Major'
- Docker workflow improvements with platform specification

### Removed

- Unused remove functionality from LecturerController and StudentController (replaced with toggle status)
- Unnecessary ESLint disable comments in semester update validations
- Unused properties and imports from DTOs
- `isActive` field from UpdateStudentDto, UpdateLecturerDto, and UpdateUserDto

### Security

- Enhanced role-based access control across milestone, thesis, student, and lecturer endpoints
- Improved validation for user permissions in group management

### Pull Requests

- [#89](https://github.com/5-logic/the-sync-backend/pull/89) - Merge dev branch for v0.4.0 release
- [#88](https://github.com/5-logic/the-sync-backend/pull/88) - Group management enhancements with validation
- [#86](https://github.com/5-logic/the-sync-backend/pull/86) - Thesis review and removal functionality
- [#85](https://github.com/5-logic/the-sync-backend/pull/85) - Role-based access control consolidation
- [#84](https://github.com/5-logic/the-sync-backend/pull/84) - Thesis management improvements
- [#82](https://github.com/5-logic/the-sync-backend/pull/82) - Student status management
- [#81](https://github.com/5-logic/the-sync-backend/pull/81) - DTO improvements and cleanup
- [#80](https://github.com/5-logic/the-sync-backend/pull/80) - Semester validation enhancements
- [#79](https://github.com/5-logic/the-sync-backend/pull/79) - Lecturer management improvements

## [0.3.0] - 2025-06-21

### Added

- Major module, controller, and service with path mapping in tsconfig.json

### Fixed

- Correct error logging message in findOne method of MajorService

### Pull Requests

- [#78](https://github.com/5-logic/the-sync-backend/pull/78) - Merge dev branch
- [#77](https://github.com/5-logic/the-sync-backend/pull/77) - Add Major module functionality

## [0.2.0] - 2025-06-20

### Added

- Role-based guards to admin, lecturer, semester, and student controllers
- JWT access strategy and role-based guards
- Bearer authentication to Swagger setup
- Group management endpoints (create, read, update)
- DTOs for group creation and update
- Milestone management functionality
- Milestone DTOs
- Thesis domain with create and update methods
- Data transfer objects (DTOs) for creating and updating thesis entities

### Changed

- Updated DTOs to omit additional fields and adjust update methods to use user ID from request
- Removed unnecessary roles from findAll and findOne methods
- Updated thesis service to include lecturerId in create and update methods
- Simplified group retrieval
- Simplified admin, semester, and user service responses by omitting password fields
- Simplified thesis fetching by removing unnecessary includes
- Set default status for thesis and drop default for updated_at in admins

### Fixed

- Installed @nestjs/passport and passport-jwt dependencies
- Removed default value for updated_at column in admins table
- Updated CreateThesisDto and CreateUserDto

### Pull Requests

- [#66](https://github.com/5-logic/the-sync-backend/pull/66) - Merge dev branch
- [#65](https://github.com/5-logic/the-sync-backend/pull/65) - Auth and role-based guards implementation
- [#64](https://github.com/5-logic/the-sync-backend/pull/64) - Auth implementation (part 2)
- [#63](https://github.com/5-logic/the-sync-backend/pull/63) - Milestone management functionality
- [#62](https://github.com/5-logic/the-sync-backend/pull/62) - Milestone implementation (part 2)
- [#61](https://github.com/5-logic/the-sync-backend/pull/61) - Group management endpoints
- [#60](https://github.com/5-logic/the-sync-backend/pull/60) - Group implementation (part 2)
- [#59](https://github.com/5-logic/the-sync-backend/pull/59) - JWT access strategy and guards
- [#58](https://github.com/5-logic/the-sync-backend/pull/58) - JWT implementation (part 2)
- [#54](https://github.com/5-logic/the-sync-backend/pull/54) - Group management implementation
- [#53](https://github.com/5-logic/the-sync-backend/pull/53) - Thesis domain implementation

## [0.1.5] - 2025-06-18

### Changed

- Updated DTOs to omit password field and streamline user update logic
- Simplified updateAdmin logic and clean up UpdateAdminDto properties

### Fixed

- Ensured user is active during login validation
- Updated gender property validation to use IsEnum and ApiProperty with enum

### Pull Requests

- [#56](https://github.com/5-logic/the-sync-backend/pull/56) - User validation and DTO improvements

## [0.1.4] - 2025-06-17

### Added

- Created_at and updated_at fields to multiple models in Prisma schema
- Prisma reset script to package.json

### Pull Requests

- [#52](https://github.com/5-logic/the-sync-backend/pull/52) - Merge dev branch
- [#51](https://github.com/5-logic/the-sync-backend/pull/51) - Add timestamps to models

## [0.1.3] - 2025-06-16

### Fixed

- Allowed optional status in CreateSemesterDto
- Set default semester status to NotYet

### Pull Requests

- [#48](https://github.com/5-logic/the-sync-backend/pull/48) - Fix semester status validation
- [#47](https://github.com/5-logic/the-sync-backend/pull/47) - Semester status improvements

## [0.1.2] - 2025-06-16

### Fixed

- Updated studentId assignment in enrollment creation
- Updated foreign key reference in Enrollment model and added migration for relationship fix
- Added description for ALLOWED_ORIGINS variable in environment setup guide
- Simplified publish job name and removed platform matrix

### Pull Requests

- [#44](https://github.com/5-logic/the-sync-backend/pull/44) - Fix enrollment relationships and documentation

## [0.1.1] - 2025-06-15

### Added

- CORS configuration and enabled CORS in main application

### Fixed

- Used nullish coalescing operator for allowedOrigins assignment in CORS config
- Updated publish job name and added platform matrix for Docker build

### Pull Requests

- [#42](https://github.com/5-logic/the-sync-backend/pull/42) - CORS configuration and Docker improvements

## [0.1.0] - 2025-06-15

### Added

- Initial project setup with NestJS framework
- Comprehensive project documentation and setup instructions
- GitHub Actions workflows for build, lint, release, PR validation, and commit message validation
- Prisma integration with PostgreSQL database
- Authentication system with JWT tokens
- User management system with roles (Admin, Lecturer, Student)
- Domain modules for managing academic entities:
  - Students with CRUD operations
  - Lecturers with CRUD operations
  - Admins with CRUD operations
  - Semesters with CRUD operations
  - Groups with CRUD operations
  - Theses with CRUD operations
- Database models and relationships:
  - User, Student, Lecturer, Admin models
  - Group, Thesis, Semester models
  - TrackingDetail and Feedback models
  - Enrollment and StudentGroupParticipation models
- Utility functions for password hashing and generation
- Global error handling with HttpExceptionFilter
- Response transformation with TransformInterceptor
- Morgan middleware for HTTP request logging
- Docker containerization setup
- Comprehensive seeding system for initial data
- Swagger API documentation
- Comprehensive validation and transformation using DTOs

### Changed

- Restructured Prisma schema for better organization
- Updated database relationships and constraints
- Enhanced error handling and logging throughout the application
- Improved controller routes with consistent naming
- Refactored module structure and imports

### Fixed

- Password verification and validation logic
- Database migration issues
- Import paths and module configurations
- Dockerfile configuration
- Release workflow configurations

### Pull Requests

- [#40](https://github.com/5-logic/the-sync-backend/pull/40) - Merge dev branch for v0.1.0 release
- [#39](https://github.com/5-logic/the-sync-backend/pull/39) - Error handling improvements
- [#37](https://github.com/5-logic/the-sync-backend/pull/37) - Merge dev branch
- [#36](https://github.com/5-logic/the-sync-backend/pull/36) - Semester and validation improvements
- [#35](https://github.com/5-logic/the-sync-backend/pull/35) - Semester implementation
- [#34](https://github.com/5-logic/the-sync-backend/pull/34) - Merge dev branch
- [#33](https://github.com/5-logic/the-sync-backend/pull/33) - Seeding system implementation
- [#31](https://github.com/5-logic/the-sync-backend/pull/31) - Authentication system
- [#30](https://github.com/5-logic/the-sync-backend/pull/30) - Auth implementation (part 2)
- [#25](https://github.com/5-logic/the-sync-backend/pull/25) - User management system
- [#21](https://github.com/5-logic/the-sync-backend/pull/21) - Merge dev branch
- [#20](https://github.com/5-logic/the-sync-backend/pull/20) - Database models and relationships
- [#19](https://github.com/5-logic/the-sync-backend/pull/19) - Database implementation (part 2)
- [#16](https://github.com/5-logic/the-sync-backend/pull/16) - Student and admin modules
- [#15](https://github.com/5-logic/the-sync-backend/pull/15) - Development workflow improvements
- [#14](https://github.com/5-logic/the-sync-backend/pull/14) - Student implementation (part 2)
- [#11](https://github.com/5-logic/the-sync-backend/pull/11) - Group management
- [#10](https://github.com/5-logic/the-sync-backend/pull/10) - Group implementation (part 2)
- [#9](https://github.com/5-logic/the-sync-backend/pull/9) - Major and thesis modules
- [#8](https://github.com/5-logic/the-sync-backend/pull/8) - Major and thesis implementation (part 2)
- [#7](https://github.com/5-logic/the-sync-backend/pull/7) - Initial domain setup
- [#6](https://github.com/5-logic/the-sync-backend/pull/6) - Database schema implementation
- [#5](https://github.com/5-logic/the-sync-backend/pull/5) - Database models and relationships

---

## Legend

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
- **Pull Requests** for related GitHub pull requests that contributed to the release
