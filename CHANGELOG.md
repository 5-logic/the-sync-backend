# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.11] - 2025-07-30

### Added

- **AI Statistics Tracking System**:
  - New `StatisticAI` model and `AIAPIType` enum to track AI API usage across the platform
  - New endpoint: `GET /semesters/:id/statistics-ai` for admins and moderators to retrieve AI usage statistics by semester
  - Automatic logging of AI API calls for `SuggestParticipants`, `CheckDuplicateThesis`, and `SuggestThesis` operations

- **Enhanced Group Submission Management**:
  - New dedicated controllers for group submissions:
    - `GroupSubmissionPublicController` - Public endpoint for retrieving group submissions
    - `GroupSubmissionStudentController` - Student-specific submission management
  - New endpoint: `GET /group-submissions/:groupId/submissions` to retrieve submissions by group ID

- **Modular Architecture Improvements**:
  - **Request Management Restructuring**: Split request functionality into role-based controllers and services
    - `RequestStudentController` and `RequestStudentService` for student-specific request operations
  - **Review System Refactoring**: Enhanced review module with specialized controllers
    - `ReviewLecturerController`, `ReviewModeratorController`, and `ReviewPublicController`
    - Dedicated services: `ReviewLecturerService`, `ReviewModeratorService`, and `ReviewPublicService`
  - **Supervision Management**: New supervision module structure
    - `SupervisionModeratorController` and `SupervisionPublicController`
    - Corresponding services for modular supervision management
  - **Submission Architecture**: Restructured submission module
    - `SubmissionPublicController` and `SubmissionPublicService` for public submission operations

### Changed

- **Enhanced Data Validation**:
  - Added `@IsNotEmpty()` validation to critical fields in DTOs:
    - `CreateUserDto`: email, fullName, gender, phoneNumber fields now require non-empty values
    - `CreateStudentDto`: studentCode, majorId, semesterId fields now require non-empty values
  - Enhanced conflict validation in `StudentAdminService`:
    - Email uniqueness validation during student creation and updates
    - Student code uniqueness validation during student updates

- **Semester Management Improvements**:
  - Enhanced validation for thesis limits per lecturer:
    - `defaultThesesPerLecturer` must be less than or equal to `maxThesesPerLecturer` in both create and update operations
  - Updated semester status validation: `ensureNoActiveSemesterOrScopeLocked()` method for better semester lifecycle management

- **AI Integration Enhancements**:
  - AI controllers now automatically log API usage with `AIStatisticsService`
  - Enhanced AI student and thesis controllers with role-based access and comprehensive logging
  - Removed console debugging logs from `AIStudentService` for cleaner production logs

- **Review Assignment Improvements**:
  - Enhanced review data retrieval to include student group participations for better context
  - Improved validation and error handling in review assignment operations

### Fixed

- **Module Dependencies**: Fixed import paths and dependency injection across refactored modules
- **Service Integration**: Enhanced service integration between newly separated modules
- **Validation Logic**: Improved validation error messages and conflict detection

### Database Migration

- **Migration 20250730081653**: Added `statistics_ai` table for tracking AI API usage
  - New table with fields: `id`, `user_id`, `semester_id`, `type`, `timestamp`
  - New `AIAPIType` enum with values: `check_duplicate_thesis`, `suggest_thesis`, `suggest_participants`

### Enhanced

- **Code Organization**: Significantly improved module structure with better separation of concerns
- **API Documentation**: Enhanced Swagger documentation across all new controllers and endpoints
- **Performance**: Optimized data retrieval patterns in refactored services
- **Maintainability**: Better code organization with dedicated index files and proper module exports

### Technical Improvements

- **Architecture**: Enhanced domain module architecture with role-based separation
- **Service Layer**: Improved service architecture with specialized functionality
- **Module Structure**: Better dependency management and module organization
- **Error Handling**: Enhanced error handling patterns across all refactored modules

### Pull Requests

- [#251](https://github.com/5-logic/the-sync-backend/pull/251) - AI statistics system and feature implementation (task-250)
- [#249](https://github.com/5-logic/the-sync-backend/pull/249) - Architecture refactoring hotfix (issue-239)
- [#248](https://github.com/5-logic/the-sync-backend/pull/248) - Module restructuring hotfix (issue-239)
- [#247](https://github.com/5-logic/the-sync-backend/pull/247) - Submission management refactoring (issue-239)
- [#246](https://github.com/5-logic/the-sync-backend/pull/246) - Review system enhancement (issue-239)
- [#245](https://github.com/5-logic/the-sync-backend/pull/245) - Request management restructuring (issue-239)

---

## [0.7.10] - 2025-07-28

### Changed

- **Group Module Refactor & API Restructuring**:
  - Major refactor of group management architecture. Consolidated and split group logic into dedicated controllers and services for each role:
    - Added: `GroupLecturerController`, `GroupModeratorController`, `GroupPublicController`, `GroupStudentController` (see new files in `src/domains/groups/controllers/`)
    - Added: `GroupLecturerService`, `GroupModeratorService`, `GroupPublicService`, `GroupStudentService`, and refactored `GroupService` (see new files in `src/domains/groups/services/`)
    - Removed: legacy `group.controller.ts`, `group.service.ts`, mappers, and response models (see deleted files)
    - Created index files for streamlined exports and documentation
  - **API Changes**:
    - Endpoints for group management are now split by role:
      - Lecturer: `/groups/lecturer/*` (supervised groups retrieval)
      - Moderator: `/groups/moderator/*` (student assignment to groups)
      - Public: `/groups/public/*` (public group access and info)
      - Student: `/groups/student/*` (student group management)
    - Request/response models for group endpoints have been updated for consistency and maintainability
    - Email notification logic in `GroupService` streamlined for better reliability
  - **DTO/Docs**:
    - Updated documentation files for each controller/service
    - No breaking changes to request payloads, but response structures may differ for group endpoints

### Technical Improvements

- Improved code organization and maintainability by splitting logic into role-based files
- Removed unused mappers and response models for groups
- Enhanced notification and export logic for group documentation

### Pull Requests

- [#244](https://github.com/5-logic/the-sync-backend/pull/244) - Hotfix: Group module refactor, role-based controllers/services, notification improvements

## [0.7.9] - 2025-07-28

### Added

- **Checklist Items Management System**:
  - New **Lecturer API**:
    - `GET /checklist-items` - View all checklist items (lecturers and moderators)
    - `GET /checklist-items/:id` - View specific checklist item details
  - New **Moderator API**:
    - `POST /checklist-items/create-list` - Create multiple checklist items (requires `CreateManyChecklistItemsDto` with `checklistId` and `checklistItems` array)
    - `PUT /checklist-items/checklist/:checklistId/update-list` - Update multiple checklist items (requires `UpdateManyChecklistItemsDto`)
    - `DELETE /checklist-items/:id` - Delete checklist item
  - New DTOs:
    - `CreateChecklistItemDto` - Single item creation with `name`, optional `description`, and `isRequired` fields
    - `CreateManyChecklistItemsDto` - Bulk creation with `checklistId` and array of checklist items
    - `UpdateChecklistItemDto` - Item updates based on creation DTO
    - `UpdateManyChecklistItemsDto` - Bulk updates with item modifications

- **Enhanced Group Suggestion Response**:
  - Added leader information to AI group suggestions response
  - New response fields:
    - `leader` object with `id` and `name` of group leader (or null if no leader)
    - `isLeader` boolean flag for each member in the members array

### Changed

- **Checklist Architecture Restructuring**:
  - **Module Separation**: Split checklist items into dedicated `ChecklistItemModule` with separate controllers and services
  - **Role-Based Controllers**: Created `ChecklistItemLecturerController` and `ChecklistItemModeratorController` for proper access control
  - **Service Architecture**: Added `ChecklistItemLecturerService` and `ChecklistItemModeratorService` for specialized functionality

- **AI Group Suggestions Enhancement**:
  - Enhanced `POST /ai/students/suggest-groups-for-student` response to include comprehensive leader information
  - Improved group member data structure with leadership indicators for better group analysis

- **Submission Service Optimization**:
  - **Supervisor Data Extraction**: Streamlined supervisor information retrieval using `supervisions` relationship instead of direct `lecturer` field
  - **Improved Data Mapping**: Enhanced supervisor data mapping for better performance and consistency
  - **Simplified Response Structure**: Consolidated supervisor information extraction logic

### Fixed

- **Checklist Module Organization**: Improved import paths and module structure for better maintainability
- **Response Data Consistency**: Enhanced data consistency in submission service supervisor information
- **Service Integration**: Better integration between checklist and checklist items modules

### Enhanced

- **API Documentation**: Comprehensive Swagger documentation for all new checklist item endpoints
- **Type Safety**: Enhanced TypeScript validation with proper DTO structures for checklist item operations
- **Code Organization**: Better separation of concerns with dedicated checklist item controllers and services
- **Module Architecture**: Improved module structure with clear separation between checklist and checklist item functionality

### Technical Improvements

- **Service Layer**: Enhanced service architecture with specialized checklist item operations
- **Module Structure**: Improved domain module organization with dedicated checklist item functionality
- **Validation**: Enhanced input validation for checklist item creation and updates
- **Code Quality**: Better code organization with proper index files and module exports

### Pull Requests

- [#243](https://github.com/5-logic/the-sync-backend/pull/243) - Hotfix: Checklist items management system and AI group suggestions enhancement

---

## [0.7.8] - 2025-07-28

### Added

- **AI Student API Enhancement**:
  - New endpoint: `POST /ai/students/suggest-groups-for-student` to get AI-powered group suggestions for a specific student with semester filtering (replaces previous GET endpoint)
  - New `SuggestGroupsForStudentDto` with `studentId` and `semesterId` fields for request body validation
  - Enhanced algorithm to only suggest groups with less than 5 members for better group management

- **Checklist Management System**:
  - New **Lecturer API**:
    - `GET /checklists` - View all checklists (lecturers and moderators)
    - `GET /checklists/:id` - View specific checklist details
    - `GET /checklists/milestone/:milestoneId` - View checklists by milestone
  - New **Moderator API**:
    - `POST /checklists` - Create new checklist (requires `CreateChecklistDto` with `name`, optional `description`, and optional `milestoneId`)
    - `PUT /checklists/:id` - Update existing checklist (requires `UpdateChecklistDto`)
    - `DELETE /checklists/:id` - Delete checklist

- **Enhanced Group Data Retrieval**:
  - Group endpoints now include comprehensive thesis required skills information
  - Enhanced group details with skills and responsibilities for better matching algorithms

### Changed

- **AI API Architecture Refactoring**:
  - **Breaking Change**: `GET /ai/students/suggest-groups-for-student/:studentId` changed to `POST /ai/students/suggest-groups-for-student`
  - Request data moved from URL parameters to request body with structured DTO validation
  - Enhanced API documentation with detailed semester filtering and member count restrictions

- **Checklist Module Restructuring**:
  - Split checklist functionality into role-based controllers: `ChecklistLecturerController` and `ChecklistModeratorController`
  - Enhanced service architecture with dedicated `ChecklistLecturerService` and `ChecklistModeratorService`
  - Improved module organization with proper role-based access control

- **Milestone Management Enhancement**:
  - `CreateMilestoneDto` now includes optional `note` and `documents` fields for comprehensive milestone configuration
  - Enhanced milestone creation workflow with better documentation support

### Removed

- **Deprecated AI Endpoints**:
  - Removed `GET /ai/students/compatibility/:studentId/:groupId` endpoint for simplified API surface
  - Cleaned up unused compatibility analysis functionality from `AIStudentService`

### Enhanced

- **API Documentation**: Comprehensive Swagger documentation updates for all new checklist and AI endpoints
- **Type Safety**: Enhanced TypeScript validation with proper DTO structures across all new endpoints
- **Code Organization**: Better separation of concerns with role-based controller and service architecture

### Technical Improvements

- **Service Layer**: Enhanced group service to include detailed thesis skills in retrieval operations
- **Module Architecture**: Improved checklist module structure with proper dependency injection and exports
- **Validation**: Enhanced input validation for all new DTOs with comprehensive field validation

### Pull Requests

- [#242](https://github.com/5-logic/the-sync-backend/pull/242) - Hotfix: AI student endpoint enhancements and checklist management system

---

## [0.7.7] - 2025-07-28

### Added

- **AI Student API**:
  - New endpoint: `GET /ai/students/suggest-for-group/:groupId` to get AI-powered student suggestions for a specific group.
    - Controller: `AIStudentController` (`suggestStudentsForGroup` method)
    - Service: `AIStudentService.suggestStudentsForGroup`
    - Uses vector similarity search to find compatible students based on skills, responsibilities, and thesis content
    - Returns top 10 student suggestions with compatibility scores (40% skill matching, 30% responsibility matching, 30% base compatibility)
    - Excludes students already in the group
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)
  - New endpoint: `GET /ai/students/suggest-groups-for-student/:studentId` to get AI-powered group suggestions for a specific student.
    - Controller: `AIStudentController` (`suggestGroupsForStudent` method)
    - Service: `AIStudentService.suggestGroupsForStudent`
    - Analyzes student skills, responsibilities, and interests to find suitable groups
    - Returns top 10 group suggestions with compatibility scores
    - Only includes groups with available member slots
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)
  - New endpoint: `GET /ai/students/compatibility/:studentId/:groupId` to analyze detailed compatibility between a student and group.
    - Controller: `AIStudentController` (`getStudentGroupCompatibility` method)
    - Service: `AIStudentService.getStudentGroupCompatibility`
    - Provides comprehensive compatibility scoring (0-100) with detailed breakdown
    - Includes skill match analysis, responsibility alignment, and thesis content relevance
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

- **AI Thesis API**:
  - New endpoint: `GET /ai/thesis/check-duplicate/:thesisId` for moderators and lecturers to check potential thesis duplicates using AI.
    - Controller: `AIThesisController` (`checkDuplicate` method)
    - Service: `AIThesisService.checkDuplicate`
    - Requires `MODERATOR` or `LECTURER` role
    - Uses AI algorithms to compare thesis content, titles, and abstracts
    - Returns similarity scores and confidence levels for potential matches
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)
  - New endpoint: `GET /ai/thesis/suggest-for-group/:groupId` to get AI-powered thesis suggestions for a specific group.
    - Controller: `AIThesisController` (`suggestThesesForGroup` method)
    - Service: `AIThesisService.suggestThesesForGroup`
    - Analyzes group skills, responsibilities, and project direction to suggest suitable theses
    - Only suggests available theses (not selected by other groups)
    - Returns top 10 thesis suggestions with relevance scores
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

- **Pinecone Vector Database Integration**:
  - New background job processing system for automatic vector synchronization:
    - `PineconeStudentService` and `PineconeStudentProcessor` for student data sync
    - `PineconeGroupService` and `PineconeGroupProcessor` for group data sync
    - `PineconeThesisService` and `PineconeThesisProcessor` for thesis data sync
    - Automatic embedding generation and upsert to Pinecone on data changes
    - Exponential backoff retry mechanism with 3 attempts for failed jobs
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

- **Enhanced Group Response Models**:
  - New `GroupDetailResponse` with comprehensive group information including thesis details and formatted timestamps
  - New `GroupResponse` model for consistent group data representation
  - Updated group mappers for improved data transformation and response structure
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

### Changed

- **Group Architecture Refactor**:
  - Consolidated group functionality: removed separate `GroupModeratorController`, `GroupPublicController`, and `GroupStudentController`
  - Merged all group operations into main `GroupService` for better maintainability
  - Simplified service layer by removing `GroupModeratorService`, `GroupPublicService`, and `GroupStudentService`
  - Improved group data fetching with enhanced response mapping and error handling
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

- **Student and Group Services Integration**:
  - Updated `StudentAdminService` and `StudentSelfService` to automatically sync data with Pinecone on student creation, update, and deletion
  - Enhanced `GroupService` and `RequestService` to trigger Pinecone sync for group operations
  - Improved error handling and logging for vector database operations
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

### Technical Improvements

- **AI Service Enhancement**:
  - Improved vector search algorithms with better namespace handling and query text building
  - Enhanced type handling in AI services for more accurate similarity calculations
  - Optimized embedding generation process by removing manual embedding steps
  - Better documentation and service method organization
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

- **Data Processing Improvements**:
  - Enhanced thesis processor to include additional fields in processing payload
  - Better null value handling for domain and groupId in thesis record creation
  - Improved thesis record structure to store formatted content directly
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/240)

### Documentation

- Added comprehensive Swagger documentation for all new AI endpoints
- Enhanced API documentation with detailed parameter descriptions and use cases
- Added response model documentation for new data structures
- Improved internal documentation for Pinecone integration and job processing

---

## [0.7.6] - 2025-07-27

### Added

- **Semester API**:
  - New endpoint: `GET /semesters/:id/statistics` for admins and moderators to retrieve dashboard statistics for a semester.
    - Controller: `SemesterController` (`getStatistics` method)
    - Service: `SemesterService.getStatistics`
    - Requires `ADMIN` or `MODERATOR` role.
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/237)
  - New endpoint: `GET /semesters/:id/groups` to retrieve all groups in a semester with full member, major, enrollment, and thesis (with supervisors) details.
    - Controller: `SemesterController` (`findGroups` method)
    - Service: `SemesterService.findGroups`
    - Returns all groups in the semester, each with nested member, major, enrollment, and thesis (with supervisors) information.
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/237)

- **Supervision API**:
  - New endpoint: `GET /supervisions/lecturer/:lecturerId/groups` to retrieve all groups supervised by a specific lecturer (only theses with group pick).
    - Controller: `SupervisionController` (`getSupervisionsGroupByLecturer` method)
    - Service: `SupervisionService.getSupervisionsGroupByLecturer`
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/237)

- **Semester Enrollment Service**:
  - New method: `findGroups(semesterId)` to retrieve all groups in a semester with detailed member and thesis information.
    - Used for internal logic and documentation.
    - [See implementation](https://github.com/5-logic/the-sync-backend/pull/237)

### Changed

- **Semester Enrollment Update Logic**:
  - Now only allows updating enrollments if semester status is `Ongoing` **and** phase is `ScopeLocked`.
  - Improved logging and error handling in `SemesterEnrollmentService`.
  - The `update` method now returns the update result (number of enrollments updated).
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/237)

- **Supervision Assignment Validation**:
  - Improved error messages for bulk reviewer assignment: now lists thesis names instead of IDs when validation fails.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/237)

### Documentation

- Added Swagger and internal documentation for new endpoints and service methods:
  - `getStatistics` (Semester statistics)
  - `getSupervisionsGroupByLecturer` (Supervision groups by lecturer)
  - `findGroups` (Semester group details)

### Technical Improvements

- Enhanced logging and error handling in semester and supervision services.
- Improved validation and response structure for group and supervision APIs.
- [#237](https://github.com/5-logic/the-sync-backend/pull/237) - Hotfix: API and service improvements, new endpoints

---

## [0.7.5] - 2025-07-26

### Changed

- **Review API**:
  - Refactored bulk reviewer assignment: now requires exactly two reviewers per submission, with a new `reviewerAssignments` structure specifying both `lecturerId` and `isMainReviewer` (boolean).
  - Main reviewer is now restricted from submitting detailed review items; only the secondary reviewer can submit them.
  - Both main and secondary reviewers can update feedback and review items.
  - Reviewer assignment now validates that the semester is in `Ongoing` status before allowing assignment.
  - See [PR #236](https://github.com/5-logic/the-sync-backend/pull/236)

- **DTO Changes**:
  - `AssignBulkLecturerReviewerDto` and related DTOs updated: replaced `lecturerIds` array with `reviewerAssignments` array, each containing `lecturerId` and `isMainReviewer`.
  - Enforced validation for exactly two reviewers per submission in bulk assignment.
  - See [PR #236](https://github.com/5-logic/the-sync-backend/pull/236)

- **Group API**:
  - Added endpoint: `GET /groups/supervise/semester/:semesterId` for moderators and lecturers to retrieve all groups they supervise in a specific semester.
  - Updated `PUT /groups/:id/unpick-thesis`: now allows both moderators and students to unpick a thesis, with enhanced validation.
  - Improved validation for group picking/unpicking during ongoing semester phases.
  - See [PR #236](https://github.com/5-logic/the-sync-backend/pull/236)

- **Semester API**:
  - Enhanced transition validation from `Preparing` to `Picking`: now checks that all groups have at least 4 members and all students are in groups.
  - Added validation for updating `maxGroup` and `maxThesesPerLecturer`: cannot set these values below the current number of groups/theses.
  - Added validation for ongoing phase transition from `ScopeAdjustable` to `ScopeLocked`: all groups must have picked a thesis.
  - Improved error messages and logging for all validation steps.
  - See [PR #236](https://github.com/5-logic/the-sync-backend/pull/236)

- **Milestone API**:
  - Ensured `note` property is included in `MilestoneResponse` and mapped correctly.
  - See [PR #236](https://github.com/5-logic/the-sync-backend/pull/236)

### Technical Improvements

- Refactored reviewer assignment and validation logic for clarity and robustness.
- Optimized dependency checks for lecturer deletion using count queries.
- Improved data retrieval in `ReviewService` by using direct inclusion for related entities.
- Enhanced validation and error handling across group, review, and semester modules.
- See [PR #236](https://github.com/5-logic/the-sync-backend/pull/236)

---

## [0.7.4] - 2025-07-25

### Added

- **Milestone API**:
  - Added optional `note` field to `CreateMilestoneDto` and database (`note` column in `milestones` table).
  - Migration: `20250725024909_add_note_into_model_milestone`.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/235)

- **Lecturer & Student Validation**:
  - Added validation to prevent duplicate emails during lecturer creation and import.
  - Added validation to prevent duplicate student codes and emails during student creation and import.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/235)

### Changed

- **Thesis API**:
  - Enhanced update logic: now unpublishes and sets status to `Pending` for theses that are published or reviewed when updated.
  - Refactored update logic to separate permission checks into `getUpdatePermissions` method.
  - Enhanced permission checks and status handling in `ThesisLecturerService`.
  - Enhanced thesis publishing logic: added semester validation and unpublish checks.
  - When assigning supervisors, existing supervisors are now removed before assigning new ones.
  - Added semester status validation for thesis assignment: only allows assignment in `Preparing` or `Picking` semesters.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/235)

- **Group API**:
  - Group deletion logic updated: now allows moderators to delete groups and includes enhanced validation checks.
  - Group details retrieval now includes thesis information.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/235)

- **Student & Enrollment Logic**:
  - Student removal is now restricted to semesters with `Preparing` status only.
  - Added validation to limit ungrouped students in a semester during group assignment.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/235)

- **Review API**:
  - Simplified submission reviews retrieval by removing the `groupId` parameter.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/235)

### Technical Improvements

- Refactored and improved error handling, logging, and permission validation across multiple services and controllers.
- Improved transaction reliability and validation logic for group, thesis, and student operations.
- [#235](https://github.com/5-logic/the-sync-backend/pull/235) - Hotfix round 2

## [0.7.3] - 2025-07-24

### Changed

- **Thesis Publishing API**:
  - Changed the publish endpoint in `ThesisModeratorController` from `PUT /theses/publish` to `POST /theses/publish` for better RESTful compliance.
  - Enhanced validation logic for publishing/unpublishing theses: now requires exactly 2 supervisors for publishing, and prevents unpublishing if theses are assigned to groups.
  - DTO affected: `PublishThesisDto` (ensure `isPublish` and `thesisIds` are required).
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/234)

- **Thesis Assignment Logic**:
  - Removed unpublished thesis assignment check in `assignThesis` method.
  - Updated permission validation for thesis updates to use `userId` instead of `lecturerId`.
  - Improved error handling and permission checks in thesis update endpoints.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/234)

- **Semester Management**:
  - Added `maxGroup` property to Summer 2025 semester for better group management.
  - Enhanced validation for semester status transitions to check max group and approved public thesis count.
  - Service affected: `SemesterService`, `SemesterStatusService`.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/234)

- **Request Handling**:
  - Added logic to automatically cancel opposite request type when a join or invite request is approved.
  - Improved transaction reliability and error handling for request approval/cancellation.
  - Service affected: `RequestService`.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/234)

- **Caching Logic**:
  - Temporarily commented out caching logic in review, submission, supervision, milestone, lecturer, thesis, student, and semester services to address performance and consistency issues.
  - [See implementation](https://github.com/5-logic/the-sync-backend/pull/234)

### Technical Improvements

- Refactored multiple services and controllers for improved permission validation and error handling.
- Enhanced logging for publish, assign, and update operations in thesis and semester modules.

### Pull Requests

- [#234](https://github.com/5-logic/the-sync-backend/pull/234) - Hotfix: refactor publish endpoint, permission validation, and caching logic

## [0.7.2] - 2025-07-23

### Fixed

- **Semester Status Update Logic**:
  - Fixed the `ensureUpdatableStatus` method in `SemesterStatusService` to correctly prevent updates to semesters that have already ended.
  - Improved error handling and logging for semester status transitions.
  - File changed: `src/domains/semesters/services/semester-status.service.ts`

### Technical Improvements

- Enhanced code reliability for semester status management.

### Pull Requests

- Direct commit: [87bffdb](https://github.com/5-logic/the-sync-backend/commit/87bffdb539912c2bd112feec7e46abe47db265b0) - fix: update ensureUpdatableStatus logic to correctly handle ended semesters

## [0.7.1] - 2025-07-22

### Added

- **Google Gemini AI Integration**:
  - `GeminiProviderModule` - New provider module for Google Gemini AI integration
  - `GeminiProviderService` - Service for managing Gemini AI client and model configuration
  - Enhanced AI-powered document processing capabilities with Gemini integration

- **Enhanced Environment Configuration**:
  - Added `GEMINI_API_KEY` environment variable for Google Gemini authentication
  - Added `GEMINI_MODEL_NAME` environment variable for Gemini model selection (e.g., `gemini-2.5-flash`)
  - Updated environment setup documentation with comprehensive Gemini configuration guide

- **Milestone Management System Refactoring**:
  - `MilestoneAdminController` - New dedicated controller for admin milestone operations (`POST /milestones`, `PUT /milestones/:id`, `DELETE /milestones/:id`)
  - `MilestonePublicController` - New controller for public milestone operations (`GET /milestones`, `GET /milestones/semester/:semesterId`, `GET /milestones/:id`)
  - `MilestoneAdminService` - Specialized service for milestone admin operations
  - `MilestonePublicService` - Dedicated service for public milestone operations
  - `MilestoneService` - Core service for milestone validation and submission creation
  - `MilestoneResponse` - Structured response class for milestone data
  - Enhanced milestone mapping functions for consistent API responses

### Changed

- **AI-Powered Thesis Duplicate Detection Enhancement**:
  - **API Endpoint Update**: Renamed `GET /admins/thesis/check-duplicates/:thesisId` to `GET /ai/check-duplicate/:thesisId`
  - **Enhanced Access Control**: Extended access from `MODERATOR` only to both `MODERATOR` and `LECTURER` roles
  - **Service Method Refactoring**: Renamed `checkDuplicates` to `checkDuplicate` for consistency
  - **Enhanced Response Data**: Added `description` field to `DuplicateThesisResponse` for more detailed duplicate information

- **Milestone Architecture Improvements**:
  - **Module Restructuring**: Split milestone functionality into separate admin and public controllers and services
  - **Enhanced API Documentation**: Improved Swagger documentation with dedicated docs for admin and public operations
  - **Response Standardization**: All milestone endpoints now return structured `MilestoneResponse` objects with proper HTTP status codes
  - **Database Schema Update**: Updated relationship between milestone and checklist models for better flexibility

- **Application Configuration Optimization**:
  - **Configuration Consolidation**: Streamlined Redis and Pinecone configurations by integrating directly into app module
  - **Environment Validation**: Added comprehensive environment variable checks for email, JWT, and Redis configurations
  - **Removed Unused Utilities**: Cleaned up unused configuration utilities for better maintainability

- **Pinecone Integration Enhancement**:
  - **Document Processing**: Enhanced `PineconeThesisProcessor` with Gemini integration for improved document formatting
  - **Content Extraction**: Improved error handling and content extraction in document processing methods

### Fixed

- **Milestone Service Improvements**:
  - Enhanced milestone creation to include automatic submission creation in a transaction
  - Streamlined submission creation logic with better error handling
  - Improved caching for milestone retrieval and management

- **Dependency Management**:
  - Added `@google/genai` dependency for Google Gemini AI integration
  - Added `minimatch` override to resolve dependency conflicts
  - Updated `brace-expansion` dependency with proper overrides

- **Code Organization**:
  - Consolidated milestone exports with comprehensive index files
  - Improved import path consistency across milestone modules
  - Enhanced TypeScript configuration with proper path mappings

### Enhanced

- **Developer Experience**:
  - Updated environment setup documentation with complete Google Gemini configuration examples
  - Improved code organization with modular milestone architecture
  - Enhanced logging and return types in milestone services

- **API Documentation**:
  - Comprehensive Swagger documentation for all milestone endpoints
  - Enhanced API operation descriptions for admin and public milestone operations
  - Improved response schema documentation with structured response classes

- **Performance Optimization**:
  - Implemented caching for milestone retrieval operations
  - Enhanced transaction management for milestone and submission creation
  - Improved background processing with Gemini integration

### Database Migration

- **Migration 20250722093712**: Update relationship between milestone and checklist
  - Enhanced database schema for better milestone-checklist relationship management
  - Improved data integrity with updated foreign key constraints

### Technical Improvements

- **Module Architecture**: Enhanced domain module structure with separated admin and public operations
- **Service Layer**: Improved service architecture with dedicated functionality separation
- **Configuration Management**: Streamlined configuration with integrated environment validation
- **Error Handling**: Enhanced error handling patterns across AI and milestone operations
- **Code Quality**: Improved TypeScript configuration and import organization

### Pull Requests

- [#232](https://github.com/5-logic/the-sync-backend/pull/232) - Merge dev branch for v0.7.1 release
- [#231](https://github.com/5-logic/the-sync-backend/pull/231) - AI-powered thesis duplicate detection enhancements
- [#230](https://github.com/5-logic/the-sync-backend/pull/230) - Application refactoring and configuration optimization
- [#229](https://github.com/5-logic/the-sync-backend/pull/229) - Milestone management system refactoring

## [0.7.0] - 2025-07-21

### Added

- **AI-Powered Thesis Duplicate Detection System**:
  - `GET /admins/thesis/check-duplicates/:thesisId` - New moderator endpoint for AI-powered thesis duplicate detection (requires `thesisId` as path parameter)
  - `DuplicateThesisResponse` - New response class with thesis details and duplicate percentage
  - `AIThesisService` - New service implementing duplicate detection using vector similarity analysis

- **Pinecone Vector Database Integration**:
  - **PineconeProviderModule** - New provider module for Pinecone database connection and configuration
  - **PineconeThesisProcessor** - Background job processor for thesis vector operations (create, update, delete)
  - **PineconeThesisService** - Queue service for managing thesis vector processing jobs
  - Enhanced thesis lifecycle with automatic vector database synchronization

- **Enhanced Environment Configuration**:
  - Added `PINECONE_API_KEY` environment variable for Pinecone authentication
  - Added `PINECONE_INDEX_NAME` environment variable for vector index configuration
  - Updated environment setup documentation with Pinecone configuration guide

- **New Dependencies and Libraries**:
  - `@pinecone-database/pinecone@6.1.1` - Pinecone vector database client
  - `axios@1.10.0` - HTTP client for external API communications
  - `mammoth@1.9.1` - Document processing library for content extraction

### Changed

- **Thesis Management Enhancement**:
  - Enhanced `ThesisLecturerService` with automatic Pinecone vector operations
  - Thesis creation, updates, and deletions now automatically sync with vector database
  - Improved thesis processing workflow with background job queue integration

- **AI Module Architecture**:
  - Introduced comprehensive AI domain module with controllers, services, and DTOs
  - Added proper error handling and logging for AI operations
  - Implemented role-based access control for AI features (MODERATOR only)

- **Queue System Expansion**:
  - Enhanced queue module to support Pinecone processing operations
  - Added new job types: `CREATE_OR_UPDATE`, `DELETE` for thesis vector operations
  - Improved background processing with configurable delays and error handling

- **API Documentation Enhancement**:
  - Added comprehensive Swagger documentation for AI endpoints
  - Enhanced API operation descriptions with detailed use cases and parameters
  - Improved response schema documentation for duplicate detection features

### Fixed

- **Vector Database Error Handling**:
  - Added safe access using optional chaining for thesis records in duplicate checks
  - Enhanced error logging and exception handling in AI operations
  - Improved robustness of vector similarity calculations

### Enhanced

- **Developer Experience**:
  - Updated environment setup documentation with complete Pinecone configuration examples
  - Enhanced TypeScript configuration with AI module path mappings
  - Improved code organization with dedicated AI domain structure

- **Performance Optimization**:
  - Implemented background processing for vector operations to prevent API blocking
  - Added configurable processing delays for optimal resource utilization
  - Enhanced caching strategies for AI-powered features

- **Academic Integrity Features**:
  - AI-powered duplicate detection with 70% similarity threshold
  - Automated thesis content analysis and comparison
  - Real-time plagiarism detection capabilities for thesis review process

### Technical Improvements

- **Module Structure**: Enhanced domain module architecture with AI integration
- **Service Architecture**: Improved service layer with vector database operations
- **Background Processing**: Enhanced queue system with Pinecone-specific processors
- **Configuration Management**: Streamlined configuration with Pinecone utilities
- **Error Handling**: Comprehensive error handling for AI and vector operations

### Pull Requests

- [#225](https://github.com/5-logic/the-sync-backend/pull/225) - Merge dev branch for v0.7.0 release
- [#224](https://github.com/5-logic/the-sync-backend/pull/224) - AI-powered thesis duplicate detection system implementation

## [0.6.12] - 2025-07-21

### Changed

- **Submission API Access Control**:
  - **Enhanced Role Permissions**: Updated `GET /submissions` endpoint to include `MODERATOR` role access alongside existing `ADMIN` and `LECTURER` roles
  - **Improved API Documentation**: Enhanced role-based access documentation for submission endpoints

### Fixed

- **Group Membership Validation**:
  - **Relaxed Validation Rules**: Temporarily commented out group membership validation in submission retrieval methods (`findByGroupId` and `findByGroupIdAndMilestoneId`) to resolve API forbidden errors
  - **Access Control Improvements**: Fixed 403 Forbidden errors for legitimate submission access requests
  - **Service Layer Optimization**: Improved submission service error handling and access control logic

### Technical Improvements

- **Code Quality**: Added ESLint disable directive for unused variables in submission service
- **API Accessibility**: Enhanced API accessibility for moderators and lecturers accessing submission data
- **Error Handling**: Improved error handling patterns in submission operations

### Pull Requests

- [#223](https://github.com/5-logic/the-sync-backend/pull/223) - Hotfix API Forbidden 403

## [0.6.11] - 2025-07-20

### Added

- **Thesis Management System Refactoring**:
  - Introduced specialized thesis controllers for improved role-based access and modularity:
    - `ThesisLecturerController` - Handles lecturer-specific thesis operations (create, update, submit, delete)
    - `ThesisModeratorController` - Handles moderator-specific operations (publish, review, assign)
    - `ThesisPublishController` - Handles public thesis viewing operations
  - Added comprehensive response mapping system with detailed thesis information
  - Implemented caching for improved performance and response times

- **Enhanced DTOs and Validation**:
  - `CreateThesisDto` - Enhanced with `semesterId` and optional `skillIds` array for thesis creation
  - `UpdateThesisDto` - Partial update DTO based on `CreateThesisDto`
  - `AssignThesisDto` - New DTO for thesis assignment with `groupId` validation
  - `ReviewThesisDto` - New DTO for thesis review with `ThesisStatus` enum validation
  - `PublishThesisDto` - Enhanced DTO for bulk thesis publishing with `thesisIds` array and `isPublish` boolean

- **Structured Response Classes**:
  - `ThesisResponse` - Base response class with core thesis information
  - `ThesisDetailResponse` - Extended response class including:
    - Thesis versions with version numbers and supporting documents
    - Required skills with skill details
    - Lecturer information with full name and email

- **Response Mapping System**:
  - `mapThesis()` - Maps basic thesis data to `ThesisResponse`
  - `mapThesisDetail()` - Maps comprehensive thesis data to `ThesisDetailResponse` including related entities

### Changed

- **API Architecture Restructuring**:
  - **Replaced Single Controller**: Migrated from monolithic `ThesisController` to three specialized controllers for better separation of concerns
  - **Enhanced API Documentation**: Replaced `@SwaggerDoc` decorators with detailed `@ApiOperation` annotations
  - **Improved Response Handling**: All endpoints now return structured response objects with proper HTTP status codes

- **Service Layer Improvements**:
  - Split thesis service into specialized services:
    - `ThesisLecturerService` - Handles lecturer operations with user context validation
    - `ThesisModeratorService` - Handles administrative operations
    - `ThesisPublishService` - Handles public viewing operations with caching
  - Integrated caching mechanisms for improved performance
  - Enhanced error handling and validation across all services

- **Enhanced API Endpoints**:
  - All thesis endpoints now return detailed response objects instead of raw Prisma entities
  - Improved role-based access control with specific role requirements per endpoint
  - Enhanced HTTP status code usage (201 for creation, 200 for updates/retrieval)

### Fixed

- **Performance Optimization**: Implemented caching strategies to reduce database load and improve response times
- **Type Safety**: Enhanced TypeScript support with comprehensive response type definitions
- **Code Organization**: Better separation of concerns with modular controller and service architecture

### Enhanced

- **Developer Experience**: Improved API documentation with detailed operation descriptions and response schemas
- **Maintainability**: Cleaner code organization with dedicated controllers, services, and response mappers
- **Scalability**: Modular architecture allows for easier future enhancements and maintenance

### Technical Improvements

- **Response Mapping**: Consistent data transformation across all thesis endpoints
- **Caching Integration**: Strategic caching implementation for frequently accessed data
- **Role-Based Access**: Granular permission control based on user roles (LECTURER, MODERATOR)
- **Enhanced Validation**: Comprehensive input validation with detailed error messages

### Pull Requests

- [#222](https://github.com/5-logic/the-sync-backend/pull/222) - Merge dev branch for v0.6.11 release
- [#221](https://github.com/5-logic/the-sync-backend/pull/221) - Thesis management system refactoring and performance improvements

## [0.6.10] - 2025-07-20

### Added

- **Skill Set API**:
  - Introduced `SkillSetController` and `SkillSetService` with full CRUD and caching support. Added API documentation and response classes for skill sets and skills.
  - New endpoints for managing skill sets and skills, with improved Swagger documentation.

- **Lecturer API**:
  - Added `LecturerManagementController` and `LecturerManagementService` for batch and single lecturer registration, status toggling, and improved data mapping.
  - Enhanced caching for lecturer management and service methods.
  - Added new response classes and constants for API integration.

- **Student API**:
  - Major refactor: split student logic into `student-admin`, `student-public`, and `student-self` controllers and services.
  - Added batch student creation with validation, password hashing, and bulk email notifications.
  - Added endpoints for student self-management, including self-update, skill and responsibility management, and status toggling.
  - Introduced detailed student response classes and improved error handling and logging.
  - Integrated caching for student services.

- **Group API**:
  - Added group management endpoints for moderators and students, including group creation, update, leader change, and thesis picking.
  - Added new DTOs and improved validation (e.g., UUID checks).
  - Enhanced API documentation and HTTP status code usage.

- **Semester API**:
  - Added `SemesterEnrollmentController` and refactored semester services for better modularity.
  - Implemented caching for semester creation, retrieval, update, and deletion.
  - Improved status transition validation and error handling in `SemesterStatusService`.
  - Enhanced enrollment update logic and validation for ongoing semester status.

- **General**:
  - Added and reorganized DTOs, mappers, constants, and response classes across domains for better structure and maintainability.
  - Introduced `CacheHelperModule` and `CacheHelperService` for centralized caching logic.
  - Improved logging and error handling across services.

### Changed

- **DTOs and Imports**:
  - Reorganized DTOs into `dtos/` folders, updated import paths for consistency, and improved validation logic.
  - Updated response mapping and error handling in multiple services.

- **Milestone API**:
  - Enhanced milestone deletion validation and documentation, including checklist validation and error handling.
  - Added `documents` field to milestone update.

- **Checklist API**:
  - Enforced single checklist per milestone in creation and update endpoints. Updated documentation accordingly.

- **Review API**:
  - Improved reviewer assignment logic: now limits to two reviewers per submission, excludes supervisors, and adds milestone end validation.
  - Enhanced eligible reviewers endpoint and documentation.
  - Refactored and removed unused endpoints and methods.

- **Submission API**:
  - Added `findDetail` endpoint to retrieve detailed submission information by ID.
  - Enhanced review assignment structure and included moderator status in responses.

- **Admin, Major, Responsibility, and User APIs**:
  - Improved mapping, logging, and caching logic.
  - Updated response classes and documentation.

### Fixed

- Fixed various validation, mapping, and error handling issues across services and controllers.
- Improved type safety and logging in multiple modules.

### Pull Requests

- [#219](https://github.com/5-logic/the-sync-backend/pull/219) - dev: release api v0.6.10
- [#220](https://github.com/5-logic/the-sync-backend/pull/220) - feature/refactor
- [#218](https://github.com/5-logic/the-sync-backend/pull/218) - feature/issue-211
- [#217](https://github.com/5-logic/the-sync-backend/pull/217) - feature/issue-212
- [#216](https://github.com/5-logic/the-sync-backend/pull/216) - feature/issue-213
- [#215](https://github.com/5-logic/the-sync-backend/pull/215) - feature/task-214

## [0.6.9] - 2025-07-18

### Added

- **Milestone API**:
  - Added `documents` field (array of strings) to `CreateMilestoneDto` and milestone creation. Now, when creating a milestone, you can provide a list of required document names. [See migration](https://github.com/5-logic/the-sync-backend/commit/2412cd6)
  - Database schema updated: `documents` field added to `milestones` table. [Migration 20250718052219, 20250718052949]

- **Semester API**:
  - `CreateSemesterDto` now supports `defaultThesesPerLecturer` and `maxThesesPerLecturer` as optional properties for more flexible semester configuration. [See implementation](https://github.com/5-logic/the-sync-backend/commit/b29e996)

### Changed

- **Submission API**:
  - Enhanced submission retrieval endpoints:
    - Now includes detailed milestone, thesis, and lecturer review information in responses.
    - Improved mapping and structure for reviewer and lecturer details in submission responses.
    - Refined Swagger documentation for all submission endpoints for clarity and accuracy.
    - SubmissionService refactored for better reviewer mapping and simplified logic. [See implementation](https://github.com/5-logic/the-sync-backend/commit/49cf0dc)
  - Prevent deletion of milestones that have submissions with status `SUBMITTED`. [See implementation](https://github.com/5-logic/the-sync-backend/commit/bb83c49)
  - Improved error messages and documentation for milestone deletion requirements. [See implementation](https://github.com/5-logic/the-sync-backend/commit/9bf153a)

### Fixed

- Removed unused or redundant fields from submission details selection for cleaner API responses.
- Improved logging and error handling in milestone and submission services.

### Pull Requests / Commits

- [49cf0dc](https://github.com/5-logic/the-sync-backend/commit/49cf0dc) - Refactor supervisor mapping in getSubmissionsForReview
- [f9b17d9](https://github.com/5-logic/the-sync-backend/commit/f9b17d9) - Simplify lecturer review mapping in SubmissionService
- [f5e7661](https://github.com/5-logic/the-sync-backend/commit/f5e7661) - Add documents field handling in CreateMilestoneDto and MilestoneService
- [499674a](https://github.com/5-logic/the-sync-backend/commit/499674a) - Remove default value for documents field in Milestone model and migration
- [2412cd6](https://github.com/5-logic/the-sync-backend/commit/2412cd6) - Add documents field to Milestone model and migration script
- [9bf153a](https://github.com/5-logic/the-sync-backend/commit/9bf153a) - Enhance delete milestone documentation with submission status requirements
- [bb83c49](https://github.com/5-logic/the-sync-backend/commit/bb83c49) - Prevent deletion of milestones with submitted submissions
- [f559791](https://github.com/5-logic/the-sync-backend/commit/f559791) - Remove acceptance field from submission details selection
- [4b690a7](https://github.com/5-logic/the-sync-backend/commit/4b690a7) - Refine Swagger documentation for submission retrieval endpoints
- [e04b6bd](https://github.com/5-logic/the-sync-backend/commit/e04b6bd) - Refine submission retrieval summaries and descriptions
- [60424ae](https://github.com/5-logic/the-sync-backend/commit/60424ae) - Enhance submission retrieval with thesis and review lecturer details
- [b29e996](https://github.com/5-logic/the-sync-backend/commit/b29e996) - Extend CreateSemesterDto with optional thesis properties in SemesterService

## [0.6.8] - 2025-07-17

### Added

- **Milestone API**:
  - New endpoint: `GET /milestones/semester/:semesterId` to retrieve all milestones for a specific semester. Requires authenticated user and a valid semester ID. Returns an array of milestones ordered by start date. [See implementation](https://github.com/5-logic/the-sync-backend/pull/205)

- **Review API**:
  - New endpoint: `GET /reviews/groups/:groupId` to retrieve all reviewers assigned to a specific group. No authentication required. Returns lecturer details for each reviewer. [See implementation](https://github.com/5-logic/the-sync-backend/pull/205)

### Changed

- **Review API Refactor**:
  - Refactored review assignment update logic:
    - Replaced `PUT /reviews/:id/assign-reviewer` (bulk update) with `PUT /reviews/:id/change-reviewer` (change a single reviewer for a submission).
    - `UpdateReviewerAssignmentDto` changed: now requires `currentReviewerId` and `newReviewerId` (both UUIDs), instead of an array of lecturer IDs.
    - Enhanced validation: prevents assigning a supervisor as a reviewer and ensures the new reviewer is not the same as the current reviewer.
    - Improved error handling and logging for reviewer assignment changes.
  - Renamed and clarified controller routes for consistency:
    - `POST /reviews/assign-reviewer` (bulk assign)
    - `PUT /reviews/:id/change-reviewer` (change one reviewer)
    - `GET /reviews/assigned` (get assigned reviews for lecturer)
    - `GET /reviews/:submissionId/form` (get review form)
    - `POST /reviews/:submissionId` (submit review)
    - `PUT /reviews/:id` (update review)
  - Updated API documentation for all affected endpoints and business logic. [See implementation](https://github.com/5-logic/the-sync-backend/pull/204)

### Fixed

- Improved reviewer validation logic to prevent supervisors from being assigned as reviewers.
- Enhanced error messages and logging for reviewer assignment and milestone queries.

### Pull Requests

- [#204](https://github.com/5-logic/the-sync-backend/pull/204) - Update Logic Reviewer Assignment Validation & Update
- [#205](https://github.com/5-logic/the-sync-backend/pull/205) - Implement API: Get Reviewer by Group ID & Get Milestones by Semester ID
- [#206](https://github.com/5-logic/the-sync-backend/pull/206) - dev: release api v0.6.8

## [0.6.7] - 2025-07-16

### Added

- **Modular Authentication System**:
  - **Admin Authentication**: New `POST /auth/admin/login`, `POST /auth/admin/refresh`, and `POST /auth/admin/logout` endpoints for admin-specific authentication flow
  - **User Authentication**: New `POST /auth/user/login`, `POST /auth/user/refresh`, and `POST /auth/user/logout` endpoints for student/lecturer authentication
  - **Password Management**: New `PUT /auth/change-password` endpoint for authenticated users to change passwords (requires `ChangePasswordDto` with `currentPassword` and `newPassword`)
  - **Password Reset System**: Enhanced password reset with `POST /auth/password-reset/request` (requires `RequestPasswordResetDto` with `email`) and `POST /auth/password-reset/verify` (requires `VerifyOtpAndResetPasswordDto` with `email`, `otp`, and `newPassword`)

- **Structured API Response System**:
  - **Response Classes**: Added `BaseResponse<T>`, `ArrayResponse<T>`, and `EmptyResponse` classes for consistent API responses
  - **Response Decorators**: New `@ApiBaseResponse()`, `@ApiArrayResponse()`, and `@ApiEmptyResponse()` decorators for enhanced Swagger documentation
  - **Type-Safe Responses**: All authentication endpoints now return structured responses with `success`, `statusCode`, and `data` fields

- **Enhanced Business Validation**:
  - **Thesis Creation Limits**: Added validation for maximum theses per lecturer per semester based on `semester.maxThesesPerLecturer` configuration
  - **Supervisor Requirements**: Enhanced thesis publishing validation to ensure exactly 2 supervisors are assigned before publication
  - **Approval Validation**: Added validation in bulk supervisor assignment to ensure only approved theses can have supervisors assigned

### Changed

- **Authentication Architecture Refactoring**:
  - **Service Separation**: Split authentication into specialized services: `AdminAuthService`, `UserAuthService`, `BaseAuthService`, `ChangePasswordService`, `PasswordResetService`, and `TokenAuthService`
  - **Controller Reorganization**: Replaced single `AuthController` with dedicated controllers: `AdminAuthController`, `UserAuthController`, `ChangePasswordController`, and `PasswordResetController`
  - **Consolidated Endpoints**: Moved password change functionality from individual domain controllers to centralized auth controller

- **Module Structure Improvements**:
  - **Domain Reorganization**: Restructured `AdminModule`, `MajorModule`, `ResponsibilityModule`, and `UserModule` with organized subfolder structure (controllers/, services/, docs/, responses/, constants/)
  - **Enhanced Documentation**: Added comprehensive API documentation with operation descriptions and response schemas
  - **Barrel Exports**: Implemented index.ts files across modules for cleaner imports and better code organization

- **Service Layer Enhancements**:
  - **Error Handling**: Improved error message formatting in supervision service for unapproved thesis validation
  - **Group Management**: Enhanced student removal from groups with proper thesis assignment validation and conflict handling
  - **Validation Logic**: Streamlined skill and responsibility deletion logic in GroupService with better error handling

### Fixed

- **Import Path Optimization**: Updated import statements across modules to use barrel exports and relative paths for better maintainability
- **Type Safety**: Enhanced TypeScript configuration with proper response type definitions
- **Service Dependencies**: Fixed service injection and dependency management across refactored modules
- **Validation Messages**: Improved error message formatting for thesis approval validation with clearer descriptions

### Enhanced

- **Code Organization**: Better separation of concerns with dedicated folders for controllers, services, docs, and responses
- **API Documentation**: Comprehensive Swagger documentation with detailed operation descriptions and response schemas
- **Authentication Flow**: More secure and maintainable authentication system with role-based access control
- **Business Logic**: Enhanced validation rules for thesis management and supervision assignment

### Pull Requests

- [#199](https://github.com/5-logic/the-sync-backend/pull/199) - Merge dev branch for v0.6.7 release
- [#200](https://github.com/5-logic/the-sync-backend/pull/200) - Authentication system refactoring and structured responses (feature/issue-196)
- [#197](https://github.com/5-logic/the-sync-backend/pull/197) - Enhanced business validation and error handling (feature/issue-193)
- [#194](https://github.com/5-logic/the-sync-backend/pull/194) - Module restructuring and code organization improvements (feature/refactor)

---

## [0.6.6] - 2025-07-15

### Changed

- **Service Architecture Refactoring**:
  - **Removed BaseCacheService**: Eliminated the `BaseCacheService` abstract class and all caching logic from domain services to simplify architecture and improve maintainability.
  - **Direct Service Implementation**: All domain services (GroupService, LecturerService, MajorService, MilestoneService, RequestService, ResponsibilityService, ReviewService, SemesterService, SkillSetService, StudentService, SubmissionService, SupervisionService, ThesisService) now extend directly from base classes without caching dependencies.
  - **Simplified Dependencies**: Removed `@Inject(CACHE_MANAGER)` and Cache dependencies from all service constructors.

- **Cache Utilities Refactoring**:
  - **New Utility Functions**: Added `createCacheStores()` and Redis configuration utilities in `src/utils/cache.util.ts` and `src/utils/redis.util.ts`.
  - **Centralized Configuration**: Extracted Redis and BullMQ configuration logic into reusable utility functions (`getRedisConfigOrThrow`, `getBullBoardAuthOrThrow`).
  - **App Module Simplification**: Simplified `AppModule` configuration by using utility functions for cache store creation and configuration validation.

- **Email Job Type Organization**:
  - **Restructured Email Enums**: Reorganized `EmailJobType` enum with logical grouping by categories (Authentication, Accounts, Semesters, Groups, Theses, Enrollment, Invitations/Requests, Supervisions, Reviews).
  - **Removed Unused Types**: Eliminated `SEND_NOTIFICATION` job type for cleaner email system.
  - **Better Documentation**: Added comments to categorize email job types for improved readability.

- **Email Template Improvements**:
  - **Enhanced Thesis Assignment**: Updated thesis assignment notification templates with improved clarity and language.
  - **Fixed Group Size Calculation**: Corrected current group size calculation in thesis assignment notifications.
  - **Better Formatting**: Enhanced group membership notification formatting for improved clarity.

### Removed

- **BaseCacheService Class**: Completely removed the abstract base cache service class and all its methods (`getCachedData`, `setCachedData`, `clearCache`, `clearMultipleCache`, `getWithCacheAside`, `invalidateEntityCache`, `setCachedDataWithTags`).
- **Cache Logic**: Removed all caching logic from domain services including cache key management, TTL handling, and cache invalidation patterns.
- **Cache Dependencies**: Eliminated cache manager dependencies from service constructors across all domain modules.
- **Redundant Configuration**: Removed duplicate Redis configuration code from AppModule.

### Fixed

- **Configuration Validation**: Enhanced error handling for missing Redis and BullMQ configurations with more descriptive error messages.
- **Import Organization**: Cleaned up imports across all service files by removing cache-related dependencies.
- **Code Simplification**: Streamlined service implementations by removing cache-aside patterns and related complexity.

### Performance

- **Reduced Complexity**: Simplified service architecture reduces memory overhead and improves application startup time.
- **Direct Database Access**: Services now directly access database without cache layer, ensuring real-time data consistency.
- **Cleaner Architecture**: Eliminated cache-related abstractions for more straightforward service implementations.

### Pull Requests

- [#192](https://github.com/5-logic/the-sync-backend/pull/192) - Merge dev branch for v0.6.6 release

---

## [0.6.5] - 2025-07-13

### Added

- **Review Management System**:
  - Introduced `ReviewModule` with full CRUD and assignment APIs for submission reviews.
  - New endpoints:
    - `GET /:id/eligible-reviewers` (MODERATOR): List eligible reviewers for a submission.
    - `POST /assign-reviewer` (MODERATOR): Bulk assign reviewers to submissions (`AssignBulkLecturerReviewerDto`).
    - `PUT /:id/assign-reviewer` (MODERATOR): Update reviewer assignment for a submission (`UpdateReviewerAssignmentDto`).
    - `GET /reviews/assigned` (LECTURER, MODERATOR): List reviews assigned to the current user.
    - `GET /reviews/:submissionId/form` (LECTURER, MODERATOR): Get review form for a submission.
    - `POST /reviews/:submissionId` (LECTURER): Submit a review for a submission (`CreateReviewDto`).
    - `PUT /reviews/:id` (LECTURER): Update a review (`UpdateReviewDto`).
    - `GET /groups/:groupId/submissions/:submissionId/reviews` (STUDENT, LECTURER, MODERATOR): List all reviews for a group submission.
  - Added DTOs: `AssignBulkLecturerReviewerDto`, `CreateReviewDto`, `UpdateReviewDto`, `UpdateReviewerAssignmentDto`, `CreateReviewItemDto`, `UpdateReviewItemDto`.

- **Submission Management System**:
  - Introduced `SubmissionModule` with endpoints for group and milestone submissions.
  - New endpoints:
    - `GET /submissions` (ADMIN, LECTURER): List all submissions for the user.
    - `GET /submissions/semester/:semesterId` (MODERATOR): List submissions for a semester.
    - `GET /submissions/milestone/:milestoneId` (MODERATOR): List submissions for a milestone.
    - `GET /submissions/semester/:semesterId/milestone/:milestoneId` (MODERATOR): List submissions for a semester and milestone.
    - `GET /groups/:groupId/submissions` (all roles): List all submissions for a group.
    - `GET /groups/:groupId/milestones/:milestoneId` (all roles): Get a submission for a group and milestone.
    - `POST /groups/:groupId/milestones/:milestoneId` (STUDENT): Create a submission for a group and milestone (`CreateSubmissionDto`).
    - `PUT /groups/:groupId/milestones/:milestoneId` (STUDENT): Update a submission for a group and milestone (`UpdateSubmissionDto`).
  - Added DTOs: `CreateSubmissionDto`, `UpdateSubmissionDto`, `SubmissionServiceDto`.

- **Bulk Supervision Assignment**:
  - Replaced single supervision assignment with bulk assignment endpoint:
    - `POST /supervisions/assign-supervisors` (MODERATOR): Bulk assign supervisors to theses (`AssignBulkSupervisionDto`).
  - Added DTO: `AssignBulkSupervisionDto` (removes `AssignSupervisionDto`).

- **Semester Enrollment Update**:
  - New endpoint:
    - `PUT /semesters/:id/enrollments` (ADMIN): Bulk update student enrollments in a semester (`UpdateEnrollmentsDto`).
  - Added DTO: `UpdateEnrollmentsDto`.

- **Email Notification Enhancements**:
  - Added new email templates and job types for reviewer assignment, review completion, and enrollment result notifications.

### Changed

- **API Documentation**:
  - Enhanced and unified Swagger documentation for new and existing endpoints.
  - Improved DTO documentation with examples and property descriptions.

- **Service Refactoring**:
  - Refactored review, submission, and supervision services for bulk operations and improved error handling.
  - Improved caching for review submissions and eligible reviewers.

### Fixed

- Minor bug fixes and optimizations in group, milestone, and student services.

### Database

- Added new migrations for submission attributes, submission status enum, and review item acceptance.

### Pull Requests

- [#191](https://github.com/5-logic/the-sync-backend/pull/191) - Merge dev branch for v0.6.5 release
- [#190](https://github.com/5-logic/the-sync-backend/pull/190) - Bulk reviewer assignment and review management (task-187, task-188)
- [#189](https://github.com/5-logic/the-sync-backend/pull/189) - Submission management system (task-144)
- [#186](https://github.com/5-logic/the-sync-backend/pull/186) - Bulk supervision assignment (task-150)

---

## [0.6.4] - 2025-07-08

### Added

- **Checklist Items Management System**:
  - `POST /checklist-items/create-list` - New endpoint for moderators to create multiple checklist items (requires `CreateManyChecklistItemsDto` with `checklistId` and array of `checklistItems`)
  - `GET /checklist-items` - New endpoint for lecturers and moderators to view all checklist items with optional `checklistId` query parameter
  - `GET /checklist-items/:id` - New endpoint for lecturers and moderators to view specific checklist item details
  - `DELETE /checklist-items/:id` - New endpoint for moderators to remove checklist items
  - `GET /checklist-items/checklist/:checklistId` - New endpoint for lecturers and moderators to view all items for a specific checklist
  - `PUT /checklist-items/checklist/:checklistId/update-list` - New endpoint for moderators to bulk update checklist items (requires `UpdateManyChecklistItemsDto`)
  - `CreateChecklistItemDto` - New DTO for individual checklist item creation with `name`, optional `description`, and optional `isRequired` boolean
  - `CreateManyChecklistItemsDto` - New DTO for bulk checklist item creation with `checklistId` and array of checklist items
  - `UpdateManyChecklistItemsDto` - New DTO for bulk checklist item updates

- **Checklist Management API Restructuring**:
  - Restructured checklist endpoints from `/checklists` to maintain same paths but with enhanced role-based access
  - `GET /checklists/milestone/:milestoneId` - Enhanced endpoint for lecturers and moderators to view checklists by milestone

### Changed

- **Architecture Refactoring**:
  - **Module Separation**: Split checklist functionality into separate `ChecklistModule` and `ChecklistItemModule` for better organization
  - **Controller Restructuring**: Renamed `ChecklistsController` to `ChecklistController` and separated checklist item operations into dedicated `ChecklistItemController`
  - **Service Architecture**: Renamed `ChecklistsService` to `ChecklistService` and created dedicated `ChecklistItemService` for item-specific operations

- **Role Permission Updates**:
  - **Checklist Operations**: Updated checklist creation and management permissions from `LECTURER` to `MODERATOR` only
  - **Checklist Item Operations**: All checklist item creation, updates, and deletion operations restricted to `MODERATOR` role
  - **View Permissions**: Lecturers and moderators can view checklists and checklist items, students no longer have direct access

- **Cache Management Optimization**:
  - **Streamlined Cache Clearing**: Removed generic cache pattern clearing methods (`clearCacheWithPattern`) across all services
  - **Targeted Cache Management**: Implemented more efficient cache clearing strategies that only invalidate specific affected cache entries
  - **Performance Enhancement**: Optimized cache management in `GroupService`, `LecturerService`, `MilestoneService`, `RequestService`, `SemesterService`, `StudentService`, `SupervisionService`, and `ThesisService`
  - **Real-time Data Accuracy**: Enhanced cache invalidation to ensure more accurate real-time data retrieval

- **API Documentation Enhancement**:
  - **Comprehensive Documentation**: Enhanced Swagger documentation across all endpoints with detailed access requirements
  - **Role-based Documentation**: Added clear documentation about which roles can access specific endpoints
  - **Enhanced Descriptions**: Improved API operation descriptions for better developer experience across admin, auth, checklist, group, lecturer, major, milestone, request, responsibility, semester, skill-set, student, supervision, and thesis operations

- **DTO Simplification**:
  - **CreateChecklistDto**: Simplified API property documentation by removing verbose descriptions while maintaining validation
  - **Cleaner Documentation**: Streamlined DTO documentation for better readability

### Fixed

- **Import Path Standardization**: Corrected import paths for checklist documentation and export names
- **SwaggerDoc Tag Consistency**: Standardized SwaggerDoc tags for checklist endpoints to ensure consistent API documentation
- **Module Integration**: Fixed import name for checklist module in domain module configuration

### Enhanced

- **TypeScript Configuration**: Added path mapping for checklist items (`@/checklists/checklist-items/*`) in `tsconfig.json` for improved module resolution
- **Domain Module Structure**: Enhanced `DomainModule` to include both `ChecklistModule` and `ChecklistItemModule` for comprehensive checklist management
- **Service Error Handling**: Improved error handling and validation in checklist item operations with enhanced logging
- **Bulk Operations**: Added support for efficient bulk creation and updating of checklist items with proper validation

### Technical Improvements

- **Code Organization**: Better separation of concerns between checklist and checklist item management
- **Validation Enhancement**: Improved validation for checklist item operations with proper UUID and nested object validation
- **Service Architecture**: Enhanced service structure with dedicated functionality for checklist items separate from general checklist operations
- **Performance Optimization**: Reduced unnecessary cache operations for better application performance

### Pull Requests

- [#185](https://github.com/5-logic/the-sync-backend/pull/185) - Merge dev branch for v0.6.4 release
- [#184](https://github.com/5-logic/the-sync-backend/pull/184) - Checklist items management system and architecture refactoring (task-146)

## [0.6.3] - 2025-07-07

### Added

- **Checklist Management System**:
  - `POST /checklists` - New endpoint for lecturers to create checklists (requires `CreateChecklistDto` with `name`, optional `description`, and optional `milestoneId`)
  - `GET /checklists` - New endpoint for students and lecturers to view all checklists
  - `GET /checklists/:id` - New endpoint for students and lecturers to view specific checklist details
  - `PUT /checklists/:id` - New endpoint for lecturers to update checklists (requires `UpdateChecklistDto`)
  - `DELETE /checklists/:id` - New endpoint for lecturers to remove checklists
  - `CreateChecklistDto` - New DTO for checklist creation with name, optional description, and optional milestone association
  - `UpdateChecklistDto` - New DTO for checklist updates based on CreateChecklistDto

- **Enhanced Student Profile Management**:
  - `PUT /students` - Enhanced self-update endpoint now supports managing student skills and responsibilities
  - `StudentSkillDto` - New DTO for managing student skills with skillId and skill level validation
  - `StudentExpectedResponsibilityDto` - New DTO for managing student expected responsibilities with responsibilityId validation
  - Enhanced `SelfUpdateStudentDto` with optional `studentSkills` and `studentExpectedResponsibilities` arrays for comprehensive profile management

- **Request Status Enhancement**:
  - Added `cancelled` status to RequestStatus enum for better request lifecycle management
  - Enhanced request cancellation capabilities for join and invite requests with proper permission validation

- **Comprehensive API Documentation System**:
  - `SwaggerDoc` decorator - New centralized decorator for consistent API documentation across all endpoints
  - Created comprehensive documentation modules for all API endpoints: `AdminDocs`, `AuthDocs`, `ChecklistsDocs`, `GroupDocs`, `LecturerDocs`, `MajorDocs`, `MilestoneDocs`, `RequestDocs`, `ResponsibilityDocs`, `SemesterDocs`, `SkillSetDocs`, `StudentDocs`, `SupervisionDocs`, `ThesisDocs`
  - Centralized documentation mapping system with `DOCS_MAP` for consistent API operation descriptions
  - Enhanced Swagger documentation consistency across all controllers

### Changed

- **Database Schema Improvements**:
  - **Checklist-Milestone Relationship**: Reversed relationship from milestone having one checklist to checklist optionally belonging to a milestone
  - Made `milestone_id` optional in checklists table to allow standalone checklists
  - Removed `checklist_id` foreign key constraint from milestones table for better flexibility

- **API Documentation Standardization**:
  - Replaced individual `@ApiOperation` decorators with unified `SwaggerDoc` decorator across all controllers
  - Standardized API operation descriptions and documentation structure
  - Enhanced consistency in API documentation with centralized documentation management

- **Cache Management Optimization**:
  - Implemented cache-aside pattern in `LecturerService` for improved performance
  - Enhanced cache invalidation strategies for better data consistency
  - Optimized cache management methods in `BaseCacheService` for efficient caching operations

- **Request Permission Validation**:
  - Streamlined cancellation permission checks for join and invite requests
  - Implemented dedicated permission validation methods for request status updates
  - Enhanced request management workflow with better validation logic

- **Student Service Enhancements**:
  - Added support for managing student skills and expected responsibilities in profile updates
  - Enhanced student data handling with proper validation and relationship management
  - Improved student profile update workflow with comprehensive skill and responsibility management

### Fixed

- **Code Organization**: Consolidated DTO imports across supervision service and controller for cleaner code structure
- **Import Path Management**: Updated import paths in DTO index files for better module organization
- **Validation Logic**: Enhanced checklist service with proper validation and error handling for milestone operations
- **API Documentation**: Corrected casing and export consistency in documentation modules

### Enhanced

- **TypeScript Configuration**: Added checklist module path mapping in `tsconfig.json` for improved module resolution
- **Module Structure**: Enhanced `DomainModule` to include `ChecklistsModule` for comprehensive domain management
- **Service Architecture**: Improved service structure with better validation, error handling, and logging across checklist and student management

### Database Migration

- **Migration 20250707131611**: Update checklist item acceptance
  - Removed `checklist_id` column from `milestones` table
  - Made `milestone_id` optional in `checklists` table
  - Updated foreign key relationships for better flexibility

- **Migration 20250707134933**: Add cancelled status to request status enum
  - Added `cancelled` value to `request_statuses` enum for enhanced request lifecycle management

### Pull Requests

- [#183](https://github.com/5-logic/the-sync-backend/pull/183) - Merge dev branch for v0.6.3 release
- [#182](https://github.com/5-logic/the-sync-backend/pull/182) - Checklist management system, enhanced student profiles, and comprehensive API documentation improvements (task-146)

## [0.6.2] - 2025-07-07

### Added

- **Advanced Group Management Features**:
  - `PUT /groups/:id/leave` - New endpoint for students to leave their groups during PREPARING status (requires group leadership transfer if leaving member is leader)
  - `PUT /groups/:id/pick-thesis` - New endpoint for group leaders to select thesis during PICKING status (requires `PickThesisDto` with `thesisId`)
  - `PUT /groups/:id/unpick-thesis` - New endpoint for group leaders to remove assigned thesis during PICKING status
  - `DELETE /groups/:id` - New endpoint for group leaders to permanently delete groups during PREPARING status
  - `PickThesisDto` - New DTO for thesis selection with UUID validation for `thesisId` field

- **Enhanced Email Notification System**:
  - `SEND_GROUP_DELETION_NOTIFICATION` - New email type for notifying members when group is deleted
  - `SEND_THESIS_ASSIGNMENT_NOTIFICATION` - New email type for thesis assignment/removal notifications
  - Email template `send-group-deletion-notification.pug` for group deletion notifications
  - Email template `send-thesis-assignment-notification.pug` for thesis pick/unpick notifications
  - Enhanced `send-group-member-change-notification.pug` template to include leaving member details

- **Improved Student Data Retrieval**:
  - Enhanced student service to include major information and filtered enrollments for better group management
  - Advanced student filtering capabilities for group assignment operations

### Changed

- **Thesis Assignment Workflow**:
  - Updated thesis assignment endpoint description to clarify group-based assignments instead of individual student assignments
  - Enhanced thesis assignment process to support group assignments with proper validation
  - Improved type safety in thesis assignment notifications using `ThesisAssignmentActionType` enum

- **Group Management Improvements**:
  - Enhanced group code generation using sequential numbering based on last created group
  - Improved group deletion workflow with comprehensive validation for thesis assignments and milestone submissions
  - Streamlined cache clearing logic with helper methods for better maintainability
  - Enhanced email notification process with consolidated helper methods

- **Service Layer Enhancements**:
  - Integrated `GroupService` into `ThesisModule` and `ThesisService` for cross-module email notifications
  - Enhanced `GroupService` export from `GroupModule` for better dependency injection
  - Improved email subject assignment logic with better null handling for student codes
  - Added timeout configuration for invite request transactions to enhance reliability

### Fixed

- **Code Quality Improvements**:
  - Removed redundant student group validation methods for cleaner codebase
  - Streamlined thesis assignment notification process with improved error handling
  - Enhanced type safety by replacing string literals with proper enum types
  - Improved transaction reliability with timeout configurations

### Enhanced Validations

- **Group Operations Security**:
  - Groups can only be deleted during PREPARING semester status
  - Groups with assigned thesis, submitted work, or milestone submissions cannot be deleted
  - Group leaders must transfer leadership before leaving groups
  - Cannot leave group if student is the only member (must delete group instead)
  - Thesis picking restricted to PICKING semester status with published and approved theses only

- **Email Notification Improvements**:
  - Comprehensive email notifications for all group membership changes
  - Automated notifications for thesis assignments and removals
  - Enhanced notification content with detailed member and thesis information

### Pull Requests

- [#181](https://github.com/5-logic/the-sync-backend/pull/181) - Merge dev branch for v0.6.2 release
- [#179](https://github.com/5-logic/the-sync-backend/pull/179) - Advanced group management and thesis selection features (task-178)

## [0.6.1] - 2025-07-06

### Fixed

- **Dependency Injection Improvements**:
  - Fixed incorrect dependency injection order and missing `@Inject` decorators across multiple services
  - Updated constructor dependency injection patterns for `GroupService`, `LecturerService`, `MajorService`, `MilestoneService`, `RequestService`, `ResponsibilityService`, `SemesterService`, `SkillSetService`, `StudentService`, `SupervisionService`, and `ThesisService`
  - Added proper `@Inject` decorators for `PrismaService` and `EmailQueueService` dependencies
  - Enhanced `GroupModule` to properly import `EmailModule` for email queue functionality

- **Caching System Optimization**:
  - Streamlined caching logic in `MajorService` by extending `BaseCacheService` usage
  - Improved cache key management with consistent naming patterns (`cache:major:all`, `cache:major:${id}`)
  - Enhanced error handling and logging for cached data operations
  - Migrated from direct cache manager usage to standardized `BaseCacheService` methods

### Technical Improvements

- **Service Architecture**:
  - Standardized constructor dependency injection patterns across all domain services
  - Improved service initialization with proper dependency ordering
  - Enhanced email service integration in `LecturerService` with correct injection patterns
  - Added validation checks and proper dependency injection in `GroupService`

**Related PR**: [#174](https://github.com/5-logic/the-sync-backend/pull/174)

**Note**: This is a hotfix release addressing dependency injection issues that could cause runtime errors in service initialization. No API changes or breaking changes were introduced.

## [0.6.0] - 2025-07-06

### Added

- **Group Management Enhancements**:
  - `PUT /groups/:id/assign-student` - New moderator endpoint for assigning students to groups (requires `AssignStudentDto` with `studentId`)
  - `PUT /groups/:id/remove-student` - New endpoint for group leaders to remove members from groups (requires `RemoveStudentDto` with `studentId`)
  - `AssignStudentDto` - New DTO for student assignment with UUID validation
  - `RemoveStudentDto` - New DTO for student removal with UUID validation
  - Enhanced group member management with proper validation and email notifications
  - Email template `send-group-member-change-notification.pug` for group membership change notifications

- **Thesis Management System**:
  - `GET /theses/semester/:semesterId` - New endpoint to retrieve all theses by semester ID
  - `POST /theses/:id/assign` - New moderator endpoint for assigning theses to groups (requires `AssignThesisDto` with `groupId`)
  - `AssignThesisDto` - New DTO for thesis assignment with UUID validation
  - Enhanced thesis-group assignment workflow for academic management

- **Student Management Improvements**:
  - `GET /students/semester/:semesterId/without-group` - New endpoint to retrieve students without group assignment in a specific semester
  - Enhanced student filtering capabilities for group assignment operations

- **Email Notification System**:
  - `SEND_GROUP_MEMBER_CHANGE_NOTIFICATION` - New email job type for group membership changes
  - `SEND_SEMESTER_ONGOING_NOTIFICATION` - New email job type for semester status transitions
  - Email template `send-semester-ongoing-notification.pug` for semester ongoing notifications
  - Automated email notifications for enrollment status updates during semester transitions

- **Base Caching Infrastructure**:
  - `BaseCacheService` - New base service class with standardized caching methods (`get`, `set`, `clear`)
  - Unified caching pattern implementation across all domain services
  - Enhanced cache key management with consistent structure and TTL handling

- **Comprehensive API Documentation**:
  - Added `@ApiOperation` decorators to all controller endpoints across the application
  - Detailed endpoint descriptions with usage guidelines and parameter requirements
  - Enhanced Swagger documentation for improved developer experience
  - Comprehensive API documentation for authentication, admin, group, thesis, student, and all domain operations

### Changed

- **Enhanced Request Management**:
  - Updated `CreateInviteRequestDto` to accept array of student IDs instead of single ID
  - Added validation for 1-4 students per invite request with proper error messages
  - Enhanced invite request handling for batch student invitations
  - Improved request validation with UUID array validation

- **Caching Architecture Improvements**:
  - Refactored all domain services to extend `BaseCacheService` for consistent caching behavior
  - Standardized cache key structures across all services with constants
  - Enhanced cache management with improved logging and error handling
  - Optimized cache TTL handling with nullish coalescing operator for better performance

- **Service Layer Enhancements**:
  - Enhanced `GroupService` with detailed group retrieval methods (`findDetailedByStudentId`)
  - Improved `StudentService` with semester-specific filtering capabilities
  - Enhanced `ThesisService` with semester-based thesis retrieval and assignment logic
  - Added comprehensive logging throughout all service operations

- **Semester Status Management**:
  - Implemented automatic enrollment status updates when semester transitions to Ongoing
  - Enhanced semester workflow with proper status transition handling
  - Improved validation for semester-dependent operations

### Fixed

- **Group Assignment Logic**: Improved null checks for moderator and group leader validation in student assignment operations
- **Cache Management**: Enhanced cache handling with proper nullish coalescing for TTL values
- **Request Validation**: Updated semester status checks from "Picking" to "Preparing" for consistent terminology
- **Enrollment Restrictions**: Restricted student enrollment to only "Preparing" semester status for data consistency

### Enhanced

- **TypeScript Configuration**: Added path mapping for bases domain in `tsconfig.json` for improved module resolution
- **Performance Optimization**: Implemented comprehensive caching across all domain services for better response times
- **Error Handling**: Enhanced error handling and validation throughout the application
- **Code Quality**: Improved code consistency with standardized patterns and better logging

### Pull Requests

- [#171](https://github.com/5-logic/the-sync-backend/pull/171) - Merge dev branch for v0.6.0 release
- [#172](https://github.com/5-logic/the-sync-backend/pull/172) - Refactor services to extend BaseCacheService and enhance API documentation (task-166)
- [#170](https://github.com/5-logic/the-sync-backend/pull/170) - Implement thesis assignment functionality (task-165)
- [#169](https://github.com/5-logic/the-sync-backend/pull/169) - Group member management and email notifications (task-145)
- [#168](https://github.com/5-logic/the-sync-backend/pull/168) - Enhanced caching and student filtering (task-164)
- [#167](https://github.com/5-logic/the-sync-backend/pull/167) - Request management improvements and semester status fixes (task-163)

## [0.5.9] - 2025-07-05

### Added

- **Group Management Enhancements**:
  - `GET /groups/student` - New endpoint for students to view their own groups
  - `GET /groups/student/:studentId` - New endpoint to view groups by specific student ID
  - `PUT /groups/:id/change-leader` - New endpoint for students to change group leader (requires `ChangeLeaderDto` with `newLeaderId`)
  - `GET /groups/:id/members` - New endpoint to view group members
  - `GET /groups/:id/skills-responsibilities` - New endpoint to view group skills and responsibilities
  - `ChangeLeaderDto` - New DTO for changing group leaders with validation for new leader ID
  - Email notifications for group leader changes using new template `send-group-leader-change-notification.pug`

- **Responsibility Management System**:
  - `GET /responsibilities` - New endpoint to view all responsibilities
  - `GET /responsibilities/:id` - New endpoint to view specific responsibility details
  - Complete `ResponsibilityController` and `ResponsibilityService` implementation
  - New `ResponsibilityModule` with proper dependency injection

- **Thesis-Semester Integration**:
  - Added `semesterId` field to `CreateThesisDto` for linking theses with semesters
  - Enhanced thesis creation process to include semester association
  - New database relationship between `Thesis` and `Semester` models
  - Added `defaultThesesPerLecturer` and `maxThesesPerLecturer` fields to `Semester` model with defaults (4 and 6 respectively)
  - Updated `UpdateSemesterDto` to support thesis limit configuration

### Changed

- **Module Architecture Improvements**:
  - Renamed `RequestsModule` to `RequestModule` and `requests.controller.ts` to `request.controller.ts` for consistency
  - Renamed `SkillSetsModule` to `SkillSetModule` and related files for consistency
  - Renamed `SupervisionsModule` to `SupervisionModule` and related files for consistency
  - Updated import paths to use absolute paths for better maintainability
  - Enhanced `DomainModule` to include the new `ResponsibilityModule`

- **Group Service Enhancements**:
  - Implemented comprehensive caching for group service methods to improve performance
  - Enhanced validation logic in group operations
  - Added support for finding groups by student ID with proper filtering
  - Improved group member and skills/responsibilities retrieval methods

- **Email System Updates**:
  - Added new email job type: `SEND_GROUP_LEADER_CHANGE_NOTIFICATION`
  - Reordered email job types alphabetically for better organization
  - Enhanced email notification flow for group leader changes

### Fixed

- **Group Leader Management**: Fixed null handling in group leader change operations using nullish coalescing operator
- **Cache Management**: Improved cache handling for group operations with proper fallback mechanisms
- **Import Path Resolution**: Fixed module import paths to use absolute paths preventing resolution issues

### Database

- **Migration 20250705071441**: Link thesis with semester
  - Added `semester_id` field to `theses` table with foreign key constraint
  - Added `default_theses_per_lecturer` (default: 4) and `max_theses_per_lecturer` (default: 6) to `semesters` table

### Pull Requests

- [#162](https://github.com/5-logic/the-sync-backend/pull/162) - Merge dev branch for v0.5.9 release
- [#161](https://github.com/5-logic/the-sync-backend/pull/161) - Module refactoring and Responsibility system implementation (close #160)
- [#159](https://github.com/5-logic/the-sync-backend/pull/159) - Group leader change functionality and email notifications (task-157)
- [#158](https://github.com/5-logic/the-sync-backend/pull/158) - Group service enhancements and caching improvements (task-157_chuong)

## [0.5.8] - 2025-07-03

### Added

- **Password Reset System**:
  - `POST /auth/password-reset/request` - New endpoint for requesting password reset via OTP sent to email (requires `RequestPasswordResetDto` with `email` field)
  - `POST /auth/password-reset/verify` - New endpoint for verifying OTP and receiving new password via email (requires `VerifyOtpAndResetPasswordDto` with `email` and `otpCode` fields)
  - `RequestPasswordResetDto` - DTO for password reset requests with email validation
  - `VerifyOtpAndResetPasswordDto` - DTO for OTP verification with email and 8-digit OTP code validation
  - OTP cache system with 10-minute TTL for secure password reset process
  - Email templates: `send-otp.pug` for OTP delivery and `send-reset-password.pug` for new password notifications

- **Requests Management System**:
  - `POST /requests/join` - New endpoint for students to create join requests to groups (requires `CreateJoinRequestDto` with `groupId`)
  - `POST /requests/invite/:groupId` - New endpoint for students to create invite requests for other students (requires `CreateInviteRequestDto` with `studentId`)
  - `GET /requests/student` - New endpoint for students to view their own requests
  - `GET /requests/group/:groupId` - New endpoint for students to view requests for their group
  - `PUT /requests/:requestId/status` - New endpoint for updating request status (requires `UpdateRequestStatusDto` with `status` enum)
  - `DELETE /requests/:requestId` - New endpoint for canceling requests
  - `GET /requests/:requestId` - New endpoint for viewing specific request details
  - Email notifications for join requests, invite requests, and status updates

- **Supervision Management System**:
  - `POST /supervisions/assign/:thesisId` - New moderator endpoint for assigning supervisors to thesis (requires `AssignSupervisionDto` with lecturer assignments)
  - `PUT /supervisions/change/:thesisId` - New moderator endpoint for changing thesis supervisors (requires `ChangeSupervisionDto`)
  - `DELETE /supervisions/remove/:thesisId/:lecturerId` - New moderator endpoint for removing supervisors from thesis
  - `GET /supervisions/thesis/:thesisId` - New endpoint for viewing thesis supervisions
  - `GET /supervisions/lecturer/:lecturerId` - New endpoint for viewing lecturer supervisions
  - Email notifications for supervision assignments and changes

- **Enhanced Caching System**:
  - Redis integration with `@nestjs/cache-manager` and `@keyv/redis` for improved performance
  - Caching implemented in `MajorService`, `SkillSetsService`, and authentication services
  - JWT token caching with separate identifiers for access and refresh tokens
  - Enhanced security with cache-based token validation

### Changed

- **Password Management Consolidation**:
  - Moved `change-password` endpoint from `/students/change-password` and `/lecturers/change-password` to `/auth/change-password`
  - Unified password change functionality for all user roles (STUDENT, LECTURER, MODERATOR) under auth module
  - `ChangePasswordDto` - New DTO in auth module with enhanced password validation (minimum 12 characters, uppercase, digits, special characters)
  - Enhanced security with consistent password validation across all endpoints

- **Group Management Enhancements**:
  - Enhanced group creation with skill and responsibility validation
  - Added maximum group limit validation during group creation
  - Improved group service with better validation and error handling
  - Skills and responsibilities are now properly validated during group operations

- **Authentication Improvements**:
  - Enhanced JWT handling with separate cache identifiers for access and refresh tokens
  - Improved logout functionality for both admin and user with proper cache management
  - Enhanced security validation with cached token verification

- **Email System Enhancements**:
  - Added new email job types: `SEND_OTP`, `SEND_RESET_PASSWORD`, `SEND_JOIN_REQUEST_NOTIFICATION`, `SEND_INVITE_REQUEST_NOTIFICATION`, `SEND_REQUEST_STATUS_UPDATE`, `SEND_SUPERVISION_NOTIFICATION`
  - Enhanced email templates with better styling and user experience
  - Improved email notification flow for various system events

### Fixed

- **User Status Validation**: Fixed user active status checks to properly validate active users only
- **Group Validation**: Enhanced group creation validation with better error messages and user feedback
- **Supervision Logic**: Improved supervision assignment and change logic with proper validation
- **Cache Management**: Fixed cache storage issues with proper identifier usage in authentication services

### Removed

- `PUT /students/change-password` - Consolidated into `/auth/change-password`
- `PUT /lecturers/change-password` - Consolidated into `/auth/change-password`
- Deprecated password generation utilities (consolidated into unified generator utilities)

### Security

- **Enhanced Password Security**: Implemented OTP-based password reset with time-limited codes (10 minutes)
- **Token Security**: Enhanced JWT token management with cache-based validation and separate identifiers
- **Request Validation**: Improved validation for all request operations with proper role-based access control

### Performance

- **Caching Implementation**: Added Redis-based caching for major services to improve response times
- **Database Optimization**: Enhanced query performance with proper caching strategies
- **Email Processing**: Improved email queue processing with better error handling

### Pull Requests

- [#152](https://github.com/5-logic/the-sync-backend/pull/152) - Merge dev branch for v0.5.8 release
- [#156](https://github.com/5-logic/the-sync-backend/pull/156) - Request management system implementation
- [#154](https://github.com/5-logic/the-sync-backend/pull/154) - Request management system enhancements
- [#155](https://github.com/5-logic/the-sync-backend/pull/155) - Password management consolidation and authentication improvements
- [#151](https://github.com/5-logic/the-sync-backend/pull/151) - Password reset system implementation
- [#149](https://github.com/5-logic/the-sync-backend/pull/149) - Supervision management system
- [#148](https://github.com/5-logic/the-sync-backend/pull/148) - Supervision management enhancements
- [#147](https://github.com/5-logic/the-sync-backend/pull/147) - Authentication and caching improvements

## [0.5.7] - 2025-07-02

### Added

- **Thesis Management APIs**:
  - `POST /theses` and `PUT /theses/:id` now support `skillIds` array for associating required skills with a thesis. The backend validates all provided skill IDs.
  - `PUT /theses/:id` now allows updating the list of required skills for a thesis. If `skillIds` is omitted, skills are unchanged; if empty, all skills are removed; if provided, skills are replaced.
  - `PUT /theses/publish` - Bulk publish/unpublish endpoint for theses, accepts `PublishThesisDto` (`thesesIds: string[]`, `isPublish: boolean`).
  - Email notifications for thesis status changes and publication events, using new template and job type.

### Changed

- **DTOs**:
  - `CreateThesisDto` and `UpdateThesisDto` now include optional `skillIds: string[]` property.
  - Added new `PublishThesisDto` for bulk publishing operations.
  - All DTOs are re-exported in the DTO index for easier imports.
- **Thesis Service**:
  - `create` and `update` methods now handle `skillIds` validation and update the `thesisRequiredSkills` relation accordingly.
  - `update` method now fully replaces thesis skills if `skillIds` is provided, or removes all if empty.
  - Email notification logic for thesis status and publication changes.
- **Thesis Controller**:
  - Accepts and passes `skillIds` in create and update endpoints.
  - New endpoint for bulk publishing: `PUT /theses/publish`.
- **Email System**:
  - Added new email job type: `SEND_THESIS_STATUS_CHANGE`.
  - Added new email template: `send-thesis-status-change.pug` for thesis status notifications.
  - Improved email layout for better status and publication notifications.
- **Module**:
  - `EmailModule` is now imported in `ThesisModule` for email notification support.

### Fixed

- Improved validation and error handling for skill IDs in thesis creation and update.
- Fixed and unified logging for thesis skill updates and email notifications.

### Pull Requests

- [#142](https://github.com/5-logic/the-sync-backend/pull/142) - Merge dev branch for v0.5.7 release
- [#141](https://github.com/5-logic/the-sync-backend/pull/141) - Add skillIds handling in thesis update process and validation (close #140)
- [#139](https://github.com/5-logic/the-sync-backend/pull/139) - Thesis publishing and email notification improvements
- [#138](https://github.com/5-logic/the-sync-backend/pull/138) - Email template and layout improvements for thesis status

## [0.5.6] - 2025-07-01

### Added

- **Skill Sets Management APIs**:
  - `GET /skill-sets` - New endpoint for retrieving all skill sets with their associated skills (requires authentication and role-based access)
  - `GET /skill-sets/:id` - New endpoint for retrieving a specific skill set by ID (requires `id` as path parameter)
- **Thesis Management Enhancements**:
  - `GET /theses/lecturer/:lecturerId` - New endpoint for lecturers and moderators to fetch theses by lecturer ID (requires `lecturerId` as path parameter)
  - `PublishThesisDto` - New DTO for bulk thesis publishing operations with `thesesIds` array and `isPublish` boolean
- **Password Management System**:
  - `PUT /students/change-password` - New endpoint for students to change their passwords (requires `UpdateUserPasswordDto` with `currentPassword` and `newPassword`)
  - `PUT /lecturers/change-password` - New endpoint for lecturers to change their passwords (requires `UpdateUserPasswordDto` with `currentPassword` and `newPassword`)
  - `UpdateUserPasswordDto` - New DTO for password change operations with validation for current and new passwords
- **Enhanced Admin Management**:
  - Updated admin update functionality with optional password change support
  - Enhanced admin profile management with email and password updates

### Changed

- **SkillSets Module Integration**:
  - Added `SkillSetsModule` to `DomainModule` imports for centralized module management
  - Implemented comprehensive skill sets service with error handling and logging
  - Added proper ordering for skills (alphabetical by name) in skill sets responses
- **Thesis Service Improvements**:
  - Enhanced thesis service with `findAllByLecturerId` method for role-based thesis retrieval
  - Improved thesis management with lecturer-specific filtering capabilities
- **Admin DTO Enhancements**:
  - `UpdateAdminDto` now uses `ApiPropertyOptional` for all optional fields for better API documentation
  - Enhanced validation with optional email updates and password change functionality
- **User Service Enhancements**:
  - Implemented `changePassword` method with comprehensive validation and error handling
  - Added password verification against current password before allowing updates
  - Enhanced security with proper password hashing for new passwords
- **Module Dependencies**:
  - Added `UserService` to `StudentModule` and `LecturerModule` for password management functionality
  - Enhanced module imports for better service dependency management
- **Database Seeding Improvements**:
  - Enhanced enrollment upsert logic in `seedStudents` function for better data consistency
  - Added timeout configuration to database transactions in seed scripts for reliable operations
  - Improved seeding performance and error handling

### Fixed

- **SkillSets Error Handling**:
  - Enhanced `findOne` method to throw `NotFoundException` when skill set is not found
  - Improved error messages and logging for better debugging
- **Admin Controller Improvements**:
  - Fixed PUT route in `AdminController` to handle empty string values properly
  - Enhanced request validation and error handling
- **Logging Enhancements**:
  - Fixed skill sets detail logging to use `JSON.stringify` for better readability
  - Improved debug logging across skill sets operations
- **Import Consolidation**:
  - Consolidated imports in `update-thesis.dto.ts` for better code organization
  - Reordered path mappings in `tsconfig.json` for consistency
- **Seeding Operations**:
  - Removed timeout configuration from `seedSkills` function to prevent unnecessary delays
  - Enhanced transaction management in seeding operations

### Security

- **Enhanced Password Validation**:
  - Enforced strong password requirements with minimum 12 characters, uppercase, digits, and special characters
  - Added password verification before allowing password changes
  - Implemented secure password hashing for all password update operations
- **Role-Based Access Control**:
  - Enhanced skill sets endpoints with proper authentication and role validation
  - Improved thesis management with lecturer and moderator role restrictions
  - Secured password change endpoints with appropriate role-based access

### Performance

- **Database Query Optimization**:
  - Optimized skill sets queries with proper ordering and efficient includes
  - Enhanced thesis queries with lecturer-specific filtering
  - Improved seeding operations with better transaction management
- **Error Handling Optimization**:
  - Streamlined error handling across skill sets and user management operations
  - Enhanced logging performance with structured debug information

### Code Quality

- **Import Organization**:
  - Consolidated and reordered imports across multiple DTOs and services
  - Enhanced TypeScript path mapping configuration for better consistency
- **DTO Structure Improvements**:
  - Standardized DTO validation patterns across user and admin management
  - Enhanced API documentation with proper optional field annotations
- **Service Method Consistency**:
  - Standardized service method implementations across skill sets and user operations
  - Improved error handling patterns with consistent logging

### Pull Requests

- [#137](https://github.com/5-logic/the-sync-backend/pull/137) - Merge dev branch for v0.5.6 release
- [#136](https://github.com/5-logic/the-sync-backend/pull/136) - Import consolidation and thesis management improvements (closes #128)
- [#135](https://github.com/5-logic/the-sync-backend/pull/135) - Thesis publishing and lecturer thesis retrieval functionality (closes #128)
- [#134](https://github.com/5-logic/the-sync-backend/pull/134) - SkillSets module implementation with API endpoints (closes #132)
- [#133](https://github.com/5-logic/the-sync-backend/pull/133) - SkillSets error handling and logging improvements (closes #132)
- [#130](https://github.com/5-logic/the-sync-backend/pull/130) - Password management system for students and lecturers (closes #126)
- [#129](https://github.com/5-logic/the-sync-backend/pull/129) - Admin management enhancements and seeding improvements (closes #126)

## [0.5.5] - 2025-06-30

### Added

- **Enhanced User Creation Process**:
  - Implemented password hashing for student creation with automatic email notifications
  - Enhanced lecturer creation with email validation and password hashing
  - Added comprehensive user creation logic with proper error handling
- **Database Schema Improvements**:
  - Set default status `NotYet` for enrollments to ensure consistent data state
  - Added migration for enrollment status defaults
- **Enhanced Seeding System**:
  - Added comprehensive seeding logic for semesters and students
  - Enhanced lecturer seeding with proper data relationships
  - Renamed seed functions for better consistency and maintainability

### Changed

- **Framework Migration - Express.js**:
  - **Migrated from Fastify back to Express.js** for better ecosystem compatibility and middleware support
  - Updated from `@nestjs/platform-fastify` to `@nestjs/platform-express`
  - Replaced Fastify-specific body limits with Express `json()` and `urlencoded()` middleware (50MB limit maintained)
  - Simplified application bootstrap and removed Fastify-specific configurations
- **Dependencies Updates**:
  - **Removed**: `fastify`, `@nestjs/platform-fastify`, `@fastify/basic-auth`, `@fastify/static`, `@bull-board/fastify`
  - **Added**: `express`, `@nestjs/platform-express`, `basic-auth-connect`, `@bull-board/express`
  - Updated Bull Board to use `ExpressAdapter` instead of `FastifyAdapter`
- **BullMQ Dashboard Authentication**:
  - Replaced custom Fastify basic auth middleware with `basic-auth-connect` middleware
  - Simplified authentication setup using Express-native middleware approach
  - Enhanced security configuration with streamlined middleware integration
- **Password Validation Enhancement**:
  - **Auth DTOs**: Enhanced password regex validation to require special characters
  - Updated `AdminLoginDto` and `UserLoginDto` to enforce stronger password requirements
  - New pattern: `^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$`
- **Service Layer Improvements**:
  - Simplified user and student creation logic by removing redundant methods
  - Enhanced error handling with consistent formatting
  - Improved lecturer conflict detection with better error messages

### Fixed

- **Error Message Formatting**: Corrected error message formatting for existing lecturer conflicts
- **User Creation Flow**: Streamlined creation process with proper validation and email integration
- **Middleware Configuration**: Fixed Bull Board authentication with proper Express middleware setup

### Removed

- **Fastify Dependencies**: Removed all Fastify-related packages and configurations
- **Custom Basic Auth Middleware**: Removed custom Fastify basic auth implementation
- **Redundant Service Methods**: Cleaned up duplicate user creation methods across services
- **Unused Middleware Files**: Removed custom `bull-board.middleware.ts` and related exports

### Security

- **Enhanced Password Requirements**: Added mandatory special character requirement for all user passwords
- **Improved Authentication Flow**: Better validation and hashing during user creation process
- **Bull Board Security**: Maintained secure authentication for dashboard access with Express middleware

### Performance

- **Framework Optimization**: Express.js provides better middleware ecosystem and potentially improved performance for certain operations
- **Simplified Bootstrap**: Reduced application startup complexity by removing Fastify-specific configurations
- **Memory Usage**: Improved memory efficiency with Express's simpler request/response handling

### Database Migration

- **Enrollment Defaults**: Added migration to set default `NotYet` status for enrollment records
- **Data Consistency**: Ensured all new enrollments have proper default status values

### Pull Requests

- [#127](https://github.com/5-logic/the-sync-backend/pull/127) - Framework migration and user creation enhancements (closes #125)

## [0.5.4] - 2025-06-30

### Added

- **Student Management APIs**:
  - `DELETE /students/:id/semester/:semesterId` - New admin endpoint for deleting students from specific semesters (requires both `id` and `semesterId` as path parameters)
- **Lecturer Management APIs**:
  - `DELETE /lecturers/:id` - New admin endpoint for permanently removing lecturers (requires `id` as path parameter)

### Changed

- **Database Schema Improvements**:
  - **Student Model**: Renamed `studentId` field to `studentCode` for better clarity and consistency
  - **Foreign Key Relationships**: Enhanced student-related relationships with `onDelete: Cascade` for automatic cleanup when students are deleted
  - Updated all student-related models (`StudentSkill`, `StudentExpectedResponsibility`, `StudentGroupParticipation`) to reference `userId` instead of `studentCode`
- **Student DTOs Updates**:
  - `CreateStudentDto`: Changed `studentId` field to `studentCode`
  - `ImportStudentItemDto`: Changed `studentId` field to `studentCode`
  - `SelfUpdateStudentDto`: Updated to exclude `studentCode` instead of `studentId`
- **CORS Configuration Enhancement**:
  - Added explicit HTTP methods configuration (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`) for better CORS support
- **Service Layer Improvements**:
  - Enhanced student deletion logic with semester validation and conflict checks
  - Improved lecturer deletion logic with comprehensive validation before removal
  - Simplified exception messages across all services for better consistency
  - Updated email templates to use `studentCode` instead of `studentId`

### Fixed

- **Student Service**: Updated service methods to use `studentCode` instead of `studentId` for consistency
- **Logging Improvements**: Enhanced log messages with better null handling using nullish coalescing operators
- **Validation Logic**: Streamlined deletion validation methods for both students and lecturers

### Removed

- **Unused Imports**: Cleaned up unused `BadRequestException` imports from lecturer service
- **Deprecated Validation Methods**: Removed unused validation methods that were replaced by streamlined logic

### Security

- **Enhanced Deletion Safety**: Added comprehensive validation checks before allowing student or lecturer deletion
- **Semester Validation**: Students can only be deleted from specific semesters with proper validation
- **Conflict Prevention**: Added checks to prevent deletion when entities have active relationships

### Database Migration

- **Schema Updates**: Added migration to rename `student_id` column to `student_code` and update all related foreign key references
- **Cascade Deletion**: Enhanced database constraints to automatically clean up related records when students are deleted

### Pull Requests

- [#124](https://github.com/5-logic/the-sync-backend/pull/124) - Merge dev branch for v0.5.4 release
- [#122](https://github.com/5-logic/the-sync-backend/pull/122) - Enhanced student and lecturer deletion functionality with validation (closes #113)
- [#121](https://github.com/5-logic/the-sync-backend/pull/121) - Student deletion enhancements with semester parameter support (closes #113)

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
