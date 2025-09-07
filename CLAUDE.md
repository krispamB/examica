# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Examica** is a comprehensive computer-based test application designed for educational institutions. The platform enables secure, AI-enhanced examination processes with advanced monitoring and analytics capabilities.

### Key Features

- **Multi-role System**: Admin, Examiners/Staff, and Students with role-based access control
- **Facial Recognition Authentication**: AWS Rekognition integration for secure student verification
- **AI Question Generation**: Integration with Claude/OpenAI models for dynamic test creation
- **Advanced Analytics**: Detailed performance dashboards for examiners and administrators
- **Secure Examination Environment**: Real-time monitoring and anti-cheating measures

### User Roles

- **Admin**: System administration, user management, platform oversight
- **Examiners/Staff**: Exam creation, student management, performance analysis
- **Students**: Take exams, view results, manage profile

## Technology Stack

### Frontend

- **Next.js** (TypeScript) - React framework with SSR/SSG capabilities
- **Tailwind CSS** - Utility-first CSS framework for styling
- **TypeScript** - Type-safe JavaScript development

### Backend & Infrastructure

- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database with real-time subscriptions
  - Authentication and user management
  - Row Level Security (RLS) for RBAC implementation
  - Edge Functions for serverless compute
  - File storage for exam materials and user data

### External Services

- **AWS Rekognition** - Facial recognition and verification
- **Claude/OpenAI APIs** - AI-powered question generation and content creation

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase CLI (for local development)

### Commands

- **Development server**: `npm run dev`
- **Production build**: `npm run build`
- **Start production**: `npm start`
- **Linting**: `npm run lint`
- **Type checking**: `npm run type-check`
- **Testing**: `npm test`

## Architecture

### High-Level Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   Supabase      │────│  External APIs  │
│   (Frontend)    │    │   (Backend)     │    │  (AWS/AI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Directories

- `/app` - Next.js 13+ App Router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utility functions, database clients, and configurations
- `/types` - TypeScript type definitions
- `/hooks` - Custom React hooks
- `/middleware` - Next.js middleware for authentication and routing
- `/supabase` - Database migrations and functions

### Database Schema (Supabase)

- **users** - User profiles and role assignments
- **exams** - Exam definitions and configurations
- **questions** - Question bank with AI-generated content
- **exam_sessions** - Active and completed exam attempts
- **results** - Student performance data and analytics
- **facial_verifications** - Biometric authentication records

### Authentication Flow

1. User registration/login through Supabase Auth
2. Facial verification via AWS Rekognition (for students)
3. JWT token management and session handling
4. Role-based route protection via middleware

### RBAC Implementation

- Row Level Security (RLS) policies in Supabase
- Role-based component rendering
- API route protection based on user roles
- Dynamic navigation and feature access

## Getting Started

1. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd examica
   npm install
   ```

2. **Environment setup**:
   - Copy `.env.example` to `.env.local`
   - Configure Supabase project credentials
   - Add AWS Rekognition API keys
   - Set up AI service API keys (Claude/OpenAI)

3. **Database setup**:

   ```bash
   npx supabase start
   npx supabase db push
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## Security Considerations

- Implement proper RLS policies for all database tables
- Secure API routes with authentication middleware
- Validate and sanitize all user inputs
- Use HTTPS in production environments
- Regular security audits of dependencies
- Proper handling of biometric data (AWS Rekognition)

## Performance Optimization

- Implement proper caching strategies (Redis/Supabase cache)
- Optimize images and assets
- Use Next.js Image component for automatic optimization
- Implement lazy loading for heavy components
- Database query optimization and indexing

## Coding Style Guide

### ESLint & Prettier Rules

#### Code Formatting (Prettier)

- **No semicolons**: Lines end without semicolons (`;`)
- **Single quotes**: Use `'` instead of `"`
- **Trailing commas**: Use ES5 style trailing commas
- **Tab width**: 2 spaces for indentation (no tabs)
- **Line length**: Maximum 80 characters
- **Arrow functions**: Always use parentheses around parameters `(param) => {}`

#### TypeScript Rules

- **No `any` type**: Always specify proper types instead of `any`
  - Use specific interfaces, union types, or generics
  - For unknown data, use `unknown` instead of `any`
  - For object types, define proper interfaces

#### React Hooks Rules

- **Exhaustive dependencies**: Include all dependencies in useEffect/useCallback/useMemo dependency arrays
- **Missing dependencies**: Either include missing dependencies or remove the dependency array if not needed

#### Next.js Specific Rules

- **Use Next.js Image**: Replace `<img>` tags with `<Image />` from `next/image` for optimization
- **No unused variables**: Remove or prefix with underscore (`_variable`) for intentionally unused variables

#### Common Patterns to Follow

**Type Definitions**

```typescript
// ❌ Avoid
function processData(data: any): any {
  return data.something
}

// ✅ Preferred
interface ProcessedData {
  id: string
  value: number
}

function processData(data: unknown): ProcessedData {
  // Type guard or validation here
  return data as ProcessedData
}
```

**React Hooks**

```typescript
// ❌ Missing dependencies
useEffect(() => {
  loadData()
}, [])

// ✅ Include dependencies or use useCallback
const loadData = useCallback(() => {
  // logic here
}, [dependency1, dependency2])

useEffect(() => {
  loadData()
}, [loadData])
```

**Image Usage**

```typescript
// ❌ Using img tag
<img src="/path/to/image.jpg" alt="Description" />

// ✅ Using Next.js Image
import Image from 'next/image'
<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={200}
  height={200}
/>
```

**Unused Variables**

```typescript
// ❌ Unused variables
const [data, setData] = useState()
const [modal, setModal] = useState(false)

// ✅ Remove unused or prefix with underscore
const [data, setData] = useState()
const [_modal, setModal] = useState(false) // If intentionally unused
```

#### Pre-commit Hooks

- **lint-staged**: Automatically runs prettier and eslint on staged files
- Files are automatically formatted and linted before commit
- Fix lint errors before committing to avoid failed commits

## Notes

- Follow TypeScript strict mode guidelines
- Use consistent naming conventions across the codebase
- Implement comprehensive error handling
- Maintain detailed documentation for complex features
- Regular testing of facial recognition accuracy
- Monitor AI service usage and costs
