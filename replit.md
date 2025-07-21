# I Love Making PDF - Professional PDF Utility Web App

## Overview

This is a professional-grade, full-stack PDF utility web application built with modern React frontend and Express.js backend. Following the comprehensive specification requirements, it offers all major PDF manipulation tools including merge, split, compress, format conversion (Word/Excel/JPG/HTML), OCR scanning, page management, watermarking, and security features. The system features Supabase authentication, automatic file cleanup after 1 hour, responsive dark/light mode interface, and professional design using Poppins/Montserrat typography with Royal Blue/Mint Green color scheme.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 2025)
- **BREAKTHROUGH: Complete Deployment Configuration**: Fixed all deployment issues for successful Replit deployment
  - **Build System**: npm run build generates dist/index.js (76KB) and dist/public/ with all assets
  - **Production Server**: Enhanced server startup logging with clear "🚀 Server running on port 5000" message
  - **Static File Serving**: Proper configuration for serving built React app in production mode
  - **Database Integration**: PostgreSQL working correctly with automatic table creation
  - **Environment Configuration**: NODE_ENV=production properly configured for deployment
  - **Port Configuration**: Server binds to 0.0.0.0:5000 for external access
  - **Build Validation**: All 2753 modules transformed successfully with proper chunking

## Previous Changes (January 2025)
- **BREAKTHROUGH: Smart Back Navigation System**: Implemented intelligent navigation that remembers the tools page users came from
  - **Navigation Utility**: Created `navigation.ts` with `saveToolsPageUrl()` and `navigateBackToTools()` functions
  - **LocalStorage Memory**: System remembers which tools page (dashboard) user came from and returns them there
  - **Universal Updates**: All 19+ PDF tool pages now use smart back navigation instead of hardcoded routes
  - **Improved UX**: "Back to Tools" buttons return users to their previous location, not just the landing page
  - **Fallback System**: Graceful fallback to dashboard if localStorage unavailable or URL not saved
  - **Minimal Code**: Low-resource implementation using simple localStorage with error handling
- **BREAKTHROUGH: Consistent Static Page Navigation**: Added uniform "← Back" buttons to all static pages
  - **Static Page Updates**: Added back buttons to About Us, Careers, Privacy Policy, Terms of Service, and Cookie Policy pages
  - **Consistent Design**: Matching button styles with same hover effects and focus states as tool pages
  - **Landing Page Navigation**: All static page back buttons return users to the landing page ("/")
  - **Responsive Design**: Proper spacing and positioning that works across all screen sizes
  - **Accessibility**: Focus rings and keyboard navigation support for better usability
- **BREAKTHROUGH: Clean Static Page Experience**: Removed unnecessary "Get Started" buttons from static pages
  - **Header Cleanup**: Removed "Get Started Free" buttons from About Us, Careers, Privacy Policy, Terms of Service, and Cookie Policy page headers
  - **Content Focus**: Static pages now focus purely on their informational content without distracting call-to-action buttons
  - **Streamlined Navigation**: Only relevant navigation links (Home, About, Careers, Contact) and back buttons remain
  - **Preserved Main CTA**: Landing page and tool pages maintain their "Get Started" buttons for conversion
- **BREAKTHROUGH: Unified Navigation System**: Added consistent navigation header to dashboard tools page
  - **Dashboard Header**: Replaced custom header with same navigation bar used on About Us, Careers, and other static pages
  - **Consistent Design**: Logo, navigation links (Home, About, Careers, Contact), and mobile menu match across all pages
  - **Responsive Layout**: Mobile hamburger menu and desktop navigation work seamlessly
  - **Theme Integration**: Dark/light mode toggle preserved within unified navigation structure
  - **Sticky Header**: Navigation stays visible at top when scrolling through PDF tools
- **BREAKTHROUGH: Complete Supabase Removal & Simplified Access**: Eliminated all Supabase dependencies for cleaner architecture
  - **Database Migration**: Successfully migrated from Neon/Supabase to local PostgreSQL database
  - **Authentication Removal**: Removed all Supabase authentication, OAuth components, and related dependencies  
  - **Direct Dashboard Access**: Users can access PDF tools immediately without authentication barriers
  - **Clean Architecture**: Removed AuthGuard, OAuth callbacks, auth-modal, and all Supabase imports
  - **Simplified Navigation**: Landing page → Dashboard → PDF Tools with optional demo login forms
  - **Professional UI**: Maintained elegant design with direct access to all 13+ PDF tools
  - **Working Application**: Fixed all import errors and TypeScript issues, app now runs successfully
- **BREAKTHROUGH: Complete Authentication Flow & Session Management**: Full implementation of secure authentication with proper page redirection
  - **Landing Page Flow**: Home page ("/") → Sign In/Sign Up → Protected Dashboard ("/dashboard") 
  - **AuthGuard Component**: Protects dashboard routes, redirects unauthorized users to sign-in
  - **Session Management**: Comprehensive cleanup of localStorage, cookies, and sessionStorage on logout
  - **Backend Integration**: Enhanced `/api/auth/logout` endpoint with server-side session cleanup
  - **Dual Authentication**: Both Supabase Auth and JWT-based systems working seamlessly
  - **Proper Redirects**: Login success → dashboard, logout → landing page, unauthorized access → sign-in
  - **Session Persistence**: Authentication state persists across browser refreshes and navigation
  - **Replit Optimized**: Session management designed for Replit hosting environment
- **BREAKTHROUGH: Complete PDF Page Management Suite**: Full implementation of rotate, remove, and add pages functionality
  - **Unified Python Backend**: `pdf_page_manager.py` handling all three operations with PyMuPDF integration
  - **Rotation Functionality**: 90°, 180°, 270° angles with flexible page selection (e.g., "1,3,5-7,10")
  - **Page Removal**: Remove specific pages with intelligent page indexing and validation
  - **Page Addition**: Merge PDFs with insertion at start, end, or specific page positions
  - **Professional APIs**: `/api/convert/rotate-pdf`, `/api/convert/remove-pages`, `/api/convert/add-pages`
  - **Tabbed Frontend**: Clean three-tab interface for all page management operations
  - **File Validation**: Comprehensive PDF validation with 20MB size limits and error handling
  - **Quality Output**: Maintains PDF structure and formatting across all operations
- **BREAKTHROUGH: Professional PDF Watermark & Page Numbers Tool**: Complete implementation of watermarking and page numbering functionality
  - **PyMuPDF Integration**: `pdf_watermark_manager.py` handling both watermark and page numbering with PyMuPDF
  - **Watermark Features**: Customizable text, font size (10-50), color picker, position control, opacity slider
  - **Page Number Features**: Flexible positioning, font size options, custom starting numbers
  - **Position Options**: Watermarks (center, corners, diagonal), Page numbers (all corners, center-bottom)
  - **Professional APIs**: `/api/convert/add-watermark`, `/api/convert/add-page-numbers` with 200 status verification
  - **Two-Tab Interface**: Clean separation of watermark and page numbering tools
  - **Color Customization**: Hex color picker and manual input for watermark text
  - **Quality Processing**: Maintains PDF structure while adding overlays without content disruption
- **BREAKTHROUGH: Professional PDF Editor Tool**: Complete implementation of comprehensive PDF editing functionality
  - **PyMuPDF Integration**: `pdf_editor.py` handling all edit operations with advanced rendering capabilities
  - **Text Editing**: Add custom text with font size, color, and positioning controls
  - **Shape Tools**: Rectangle, circle, and line drawing with customizable colors and stroke widths
  - **Annotation Features**: Highlights, freehand drawing, and eraser (white box) functionality
  - **Image Integration**: Upload and place images anywhere on PDF pages with size controls
  - **Multi-Page Support**: Edit operations across all pages with page navigation
  - **Professional API**: `/api/convert/edit-pdf` with JSON operation parsing and comprehensive error handling
  - **Interactive Frontend**: Canvas-based editing interface with tool selection and real-time preview
  - **Operation Management**: Track, clear, and apply multiple edit operations with visual feedback
- **BREAKTHROUGH: Professional PDF to Word Converter**: Complete redesign using pdf2docx library for iLovePDF-quality conversion
  - **pdf2docx Integration**: Industry-standard library for professional structure preservation
  - **Layout Recognition**: Advanced table detection, header/footer preservation, multi-page support
  - **Perfect Structure Matching**: Replicates exact formatting, spacing, fonts, and alignment from original PDF
  - **Enhanced Fallback System**: Custom pdfplumber-based converter with intelligent content classification
  - **Professional Typography**: Maintains font sizes, bold/italic styling, and paragraph formatting
  - **Advanced Table Support**: Preserves complex table structures with proper row/column alignment
  - **Multi-Processing**: Utilizes all CPU cores for fast conversion of large documents
- **BREAKTHROUGH: Professional PDF to HTML Converter with OCR**: Advanced HTML conversion supporting both text and scanned PDFs
  - **PyMuPDF Integration**: High-quality text extraction with positioning data for layout preservation
  - **Tesseract OCR Support**: Automatic detection and processing of scanned/image-based PDFs
  - **Image Preprocessing**: OpenCV-based enhancement for better OCR accuracy
  - **Layout Preservation**: Maintains fonts, spacing, images, and visual hierarchy in HTML output
  - **Multi-Page Support**: Professional pagination with page-specific styling
  - **Smart Fallback**: Client-side processing when server unavailable with quality notifications
  - **Professional Styling**: Royal Blue theme with responsive design and print support
- **BREAKTHROUGH: Professional Word to PDF Converter**: Enterprise-grade DOCX to PDF conversion with full formatting preservation
  - **ReportLab Integration**: Industrial-strength PDF generation with precise layout control
  - **python-docx Processing**: Complete Word document structure analysis and extraction
  - **Formatting Preservation**: Maintains fonts, styles, headings, tables, and document structure
  - **Cross-Platform Compatibility**: Linux-optimized for Replit environment (no Windows dependencies)
  - **Smart Style Detection**: Automatic recognition of titles, headings, and content hierarchy
  - **Table Support**: Professional table rendering with proper styling and borders
  - **Fallback System**: Mammoth.js client-side conversion when server unavailable
  - **Error Handling**: Comprehensive validation and graceful degradation
- **BREAKTHROUGH: Professional Office Suite Conversion Tools**: Complete Excel and PowerPoint PDF conversion system
  - **Excel to PDF**: openpyxl + ReportLab integration for professional spreadsheet conversion with table formatting
  - **PowerPoint to PDF**: python-pptx processing with landscape layout and slide structure preservation
  - **PDF to PowerPoint**: PyMuPDF-based conversion creating editable .pptx with slide-by-slide structure
  - **Professional Quality**: Server-side Python processing ensuring commercial-grade output quality
  - **Multiple Format Support**: .xlsx, .xls, .pptx, .ppt file types with comprehensive validation
  - **Advanced Features**: Multi-sheet Excel support, slide content extraction, image handling
  - **Error Recovery**: Robust error handling with detailed user feedback and file validation
- **PDF to Word Backend Implementation**: Fixed broken PDF to Word conversion with Node.js/Express backend
  - Server-side PDF processing using `pdf-parse` for text extraction and `docx` for Word document creation
  - `/api/pdf-to-word` endpoint with 20MB file validation and proper error handling
  - Automatic file cleanup after processing to prevent storage bloat
  - Enhanced frontend with drag-and-drop upload, real-time feedback, and proper error messages
  - Specific error handling for image-only PDFs: "This PDF contains only images and cannot be converted to Word"
- **Enhanced PDF Utilities System**: Complete rewrite of PDF processing (pdf-utils-v2.ts) with version compatibility fixes
  - Fixed PDF.js worker version mismatch errors by using compatible versions
  - Added `ignoreEncryption: true` for handling protected PDFs
  - Enhanced text extraction with better positioning detection for accurate formatting
  - Real DOCX, XLSX, and HTML output formats (not just plain text)
- **Complete PDF Tool Suite**: All 13+ tools now working with proper error handling
  - PDF ↔ Word, Excel, JPG/PNG, HTML conversions
  - Merge, Split, Compress, Password Protection/Unlock tools
  - 100% client-side processing using open-source libraries (pdf-lib, pdfjs-dist, mammoth, xlsx, jszip)
- **Authentication System**: Supabase Auth integration with protected routes and session management
- **Professional Design**: Royal Blue (#3B82F6) and Mint Green (#10B981) color scheme with Poppins/Montserrat typography

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