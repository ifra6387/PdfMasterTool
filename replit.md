# I Love Making PDF - Professional PDF Utility Web App

## Overview

This is a professional-grade, full-stack PDF utility web application built with modern React frontend and Express.js backend. Following the comprehensive specification requirements, it offers all major PDF manipulation tools including merge, split, compress, format conversion (Word/Excel/JPG/HTML), OCR scanning, page management, watermarking, and security features. The system features Supabase authentication, automatic file cleanup after 1 hour, responsive dark/light mode interface, and professional design using Poppins/Montserrat typography with Royal Blue/Mint Green color scheme.

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
Comprehensive PDF processing service supporting all professional-grade features:
- **Core Operations**: Merge multiple PDFs, Split pages, Compress file size
- **Format Conversion**: PDF ↔ Word, PDF ↔ Excel, PDF ↔ JPG, PDF ↔ HTML
- **Advanced Features**: OCR/Scan to PDF using tesseract.js, Add/Remove/Rotate Pages
- **Professional Tools**: Watermark & Page Numbers, Password Protection, Unlock PDFs, Redact sensitive information
- **File Limits**: 20MB max upload size with clear error handling
- **Auto-cleanup**: Files deleted after 1 hour using node-cron
- **100% Open Source**: No external API keys required

## Data Flow

### PDF App Authentication
1. **User Registration/Login**: Frontend sends credentials → Backend validates → JWT token returned
2. **File Upload**: User selects files → Frontend validates → Multipart upload to backend → File saved with metadata
3. **Processing**: Backend queues file processing → PDF manipulation operations → Output file generated with download token
4. **Download**: Frontend polls processing status → Redirects to download page → Secure file download using token
5. **Cleanup**: Cron job runs every 30 minutes → Removes expired files from filesystem and database

### Supabase Authentication Flow
1. **Session Check**: AuthGuard checks Supabase session on page load → Shows loading state
2. **Registration**: User signs up → Supabase creates user → Auto-redirect to tools page
3. **Login**: User logs in → Session established → Auto-redirect to tools page
4. **Protected Access**: User accesses /tools → AuthGuard verifies session → Allow/deny access
5. **Logout**: User logs out via `logout()` function → Session cleared → Redirect to landing page

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives (@radix-ui/*)
- **Styling**: TailwindCSS with custom professional color scheme (Royal Blue #3B82F6, Mint Green #10B981, Gunmetal #1F2937)
- **Typography**: Poppins (headings), Montserrat (body text)
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form, Zod validation
- **Routing**: Wouter with protected routes
- **Icons**: Lucide React

### Backend Dependencies
- **Web Framework**: Express.js
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Authentication**: Supabase Auth (frontend-only)
- **File Processing**: pdf-lib (PDF manipulation), sharp (image processing), tesseract.js (OCR), puppeteer (HTML conversion)
- **File Upload**: multer with 20MB limit
- **Scheduling**: node-cron for automatic file cleanup
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