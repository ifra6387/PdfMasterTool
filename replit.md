# I Love Making PDF - PDF Utility Web App

## Overview

This is a full-featured PDF utility web application built with a modern React frontend and Express.js backend. The application replicates the functionality of iLovePDF.com, offering comprehensive PDF manipulation tools including merge, split, compress, convert, edit, and secure operations. The system features user authentication, automatic file cleanup, and a responsive dark/light mode interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack React Query for server state, React Context for client state
- **Routing**: Wouter for client-side routing with protected routes
- **Authentication**: Supabase Auth (frontend-only) with automatic redirects and session management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Processing**: PDF-lib for PDF manipulation, Sharp for image processing
- **File Upload**: Multer middleware for handling multipart/form-data

## Key Components

### Database Schema
Located in `shared/schema.ts`, defines three main tables:
- **users**: User accounts with email, password, and name
- **files**: Original uploaded files with metadata and expiration timestamps
- **processedFiles**: Generated output files with download tokens and expiration

### Authentication System
- **Dual Authentication**: Both JWT-based (PDF app) and Supabase Auth (demo system)
- **JWT System**: 7-day token expiration with bcrypt password hashing for PDF app
- **Supabase System**: Frontend-only authentication with automatic session management
- **Protected Routes**: AuthGuard component prevents unauthorized access to /dashboard
- **Automatic Redirects**: Login success redirects to /dashboard, logout redirects to /auth-demo
- **Loading States**: "Checking session..." displayed during authentication verification
- **Session Management**: Real-time auth state changes with automatic UI updates

### File Management
- **Upload**: 20MB file size limit with type validation
- **Storage**: Local filesystem storage in uploads/ and outputs/ directories
- **Cleanup**: Automatic file deletion after 1 hour using cron jobs
- **Security**: Download tokens for processed files, user-scoped access

### PDF Processing Engine
Modular PDF processing service supporting:
- Merge multiple PDFs
- Split PDF pages
- Compress file size
- Convert between formats (PDF ↔ Word, PowerPoint, Excel, JPG)
- Rotate pages
- Password protection
- Additional editing tools

## Data Flow

### PDF App Authentication
1. **User Registration/Login**: Frontend sends credentials → Backend validates → JWT token returned
2. **File Upload**: User selects files → Frontend validates → Multipart upload to backend → File saved with metadata
3. **Processing**: Backend queues file processing → PDF manipulation operations → Output file generated with download token
4. **Download**: Frontend polls processing status → Redirects to download page → Secure file download using token
5. **Cleanup**: Cron job runs every 30 minutes → Removes expired files from filesystem and database

### Supabase Authentication Flow
1. **Session Check**: AuthGuard checks Supabase session on page load → Shows loading state
2. **Registration**: User signs up → Supabase creates user → Auto-redirect to dashboard
3. **Login**: User logs in → Session established → Auto-redirect to dashboard
4. **Protected Access**: User accesses /dashboard → AuthGuard verifies session → Allow/deny access
5. **Logout**: User logs out → Session cleared → Redirect to auth page

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives (@radix-ui/*)
- **Styling**: TailwindCSS with PostCSS
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form, Zod validation
- **Routing**: Wouter
- **Icons**: Lucide React

### Backend Dependencies
- **Web Framework**: Express.js
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Authentication**: jsonwebtoken, bcrypt
- **File Processing**: pdf-lib, sharp
- **File Upload**: multer
- **Scheduling**: node-cron
- **Validation**: Zod with drizzle-zod integration

### Database Provider
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- File watchers and auto-restart capabilities
- Replit-specific development plugins

### Production Build
- Frontend: Vite build to `dist/public/`
- Backend: ESBuild bundle to `dist/index.js`
- Static file serving from Express
- Environment-based configuration

### Database Management
- Drizzle migrations in `migrations/` directory
- Schema defined in `shared/schema.ts`
- Connection via DATABASE_URL environment variable
- Push migrations using `drizzle-kit push`

### File Storage
- Local filesystem for uploaded and processed files
- Automatic cleanup prevents storage bloat
- Separate directories for uploads and outputs
- Configurable storage limits and retention policies

### Security Considerations
- JWT token-based authentication
- Password hashing with bcrypt
- File type validation and size limits
- User-scoped file access
- Automatic file expiration
- CORS and security headers via Express middleware