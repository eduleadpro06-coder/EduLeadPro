# LeadEducate - Educational Institution Management System

## Overview

LeadEducate is a comprehensive educational institution management system built with modern web technologies. It's designed to help educational institutions manage leads, track student enrollment, handle staff operations, and provide AI-powered insights for better decision-making.

## System Architecture

The application follows a full-stack architecture with a clear separation between frontend and backend:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **Email Service**: SendGrid for transactional emails
- **AI Integration**: Local Ollama integration with fallback to rule-based AI

## Key Components

### Lead Management System
- Comprehensive lead tracking with status management
- AI-powered admission likelihood prediction
- Automated follow-up scheduling and reminders
- Lead source performance analytics
- Bulk import functionality via CSV

### Student Information System
- Complete student lifecycle management
- Fee structure and payment tracking
- E-mandate integration for automated fee collection
- Academic record management

### Staff Management
- Employee information and role management
- Attendance tracking system
- Payroll management with automated calculations
- Department-wise organization

### AI-Powered Features
- Admission likelihood prediction using local AI models
- Enrollment forecasting based on historical data
- Marketing campaign recommendations
- Lead scoring and prioritization

### Communication Hub
- Multi-channel communication (SMS, Email, WhatsApp)
- Template management for common messages
- Automated notifications and alerts
- Bulk messaging capabilities

### Analytics and Reporting
- Real-time dashboard with key metrics
- Lead conversion tracking
- Revenue analytics and forecasting
- Custom report generation

## Data Flow

The application follows a typical three-tier architecture:

1. **Presentation Layer**: React frontend components handle user interactions
2. **Application Layer**: Express.js API routes process business logic
3. **Data Layer**: Drizzle ORM manages database operations with PostgreSQL

Data flows through TanStack Query for efficient caching and synchronization between client and server state.

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL)
- **Email Service**: SendGrid API
- **AI Processing**: Ollama (local) with fallback mechanisms
- **UI Components**: Radix UI ecosystem
- **Form Validation**: Zod schema validation

### Development Tools
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast production builds
- **Drizzle Kit**: Database migrations and schema management
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

The application is configured for deployment on Replit with:

- **Development Mode**: Hot reload with Vite dev server on port 5000
- **Production Build**: Optimized bundle with ESBuild
- **Database**: Automatic provisioning through Neon Database
- **Environment**: Node.js 20 with ES modules support

Build process:
1. Frontend builds to `dist/public` directory
2. Backend bundles to `dist/index.js`
3. Static assets served from Express in production

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 14, 2025. Initial setup