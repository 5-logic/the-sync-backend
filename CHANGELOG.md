# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-06-22

### Added

- Major module, controller, and service with path mapping in tsconfig.json

### Fixed

- Correct error logging message in findOne method of MajorService

### Pull Requests

- [#78](https://github.com/5-logic/the-sync-backend/pull/78) - Merge dev branch
- [#77](https://github.com/5-logic/the-sync-backend/pull/77) - Add Major module functionality

## [0.2.0] - 2025-06-22

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

## [0.1.5] - 2025-06-22

### Changed

- Updated DTOs to omit password field and streamline user update logic
- Simplified updateAdmin logic and clean up UpdateAdminDto properties

### Fixed

- Ensured user is active during login validation
- Updated gender property validation to use IsEnum and ApiProperty with enum

### Pull Requests

- [#56](https://github.com/5-logic/the-sync-backend/pull/56) - User validation and DTO improvements

## [0.1.4] - 2025-06-22

### Added

- Created_at and updated_at fields to multiple models in Prisma schema
- Prisma reset script to package.json

### Pull Requests

- [#52](https://github.com/5-logic/the-sync-backend/pull/52) - Merge dev branch
- [#51](https://github.com/5-logic/the-sync-backend/pull/51) - Add timestamps to models

## [0.1.3] - 2025-06-22

### Fixed

- Allowed optional status in CreateSemesterDto
- Set default semester status to NotYet

### Pull Requests

- [#48](https://github.com/5-logic/the-sync-backend/pull/48) - Fix semester status validation
- [#47](https://github.com/5-logic/the-sync-backend/pull/47) - Semester status improvements

## [0.1.2] - 2025-06-22

### Fixed

- Updated studentId assignment in enrollment creation
- Updated foreign key reference in Enrollment model and added migration for relationship fix
- Added description for ALLOWED_ORIGINS variable in environment setup guide
- Simplified publish job name and removed platform matrix

### Pull Requests

- [#44](https://github.com/5-logic/the-sync-backend/pull/44) - Fix enrollment relationships and documentation

## [0.1.1] - 2025-06-22

### Added

- CORS configuration and enabled CORS in main application

### Fixed

- Used nullish coalescing operator for allowedOrigins assignment in CORS config
- Updated publish job name and added platform matrix for Docker build

### Pull Requests

- [#42](https://github.com/5-logic/the-sync-backend/pull/42) - CORS configuration and Docker improvements

## [0.1.0] - 2025-06-22

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
