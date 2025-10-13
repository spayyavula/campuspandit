# CampusPandit

A comprehensive Progressive Web App (PWA) for educational content delivery, assessment, and gamified learning across multiple educational boards and competitive exams.

![Architecture Diagram](./architecture-diagram.svg)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Tools](#development-tools)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

CampusPandit is a modern educational platform designed to support students across different educational boards (Cambridge, IB, CBSE, ISC) and competitive exams (JEE, NEET). It combines traditional learning with gamification elements to enhance student engagement and learning outcomes.

### Key Highlights

- **Multi-Board Support**: Content aligned with Cambridge, IB, CBSE, ISC curricula
- **Competitive Exam Prep**: Specialized content for JEE and NEET preparation
- **Gamification**: Tournaments, quiz battles, teams, and achievement system
- **Progressive Web App**: Offline-first architecture with service workers
- **Real-time Features**: Live quiz battles and instant progress updates
- **Admin Dashboard**: Comprehensive content and user management system

## Architecture

The application follows a modern client-server architecture with the following layers:

### Frontend Layer
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS with PostCSS
- **State Management**: React Hooks (useState, useEffect, Context)
- **Routing**: React Router v6
- **PWA**: Service Workers with Workbox for offline functionality

### API Layer
- **Client SDK**: Supabase JavaScript Client
- **Authentication**: Session-based auth with auto-refresh
- **API Functions**: Modular API wrappers for questions, collections, and admin operations

### Backend Services
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password and OAuth
- **Storage**: Supabase Storage for file uploads
- **Real-time**: WebSocket subscriptions for live updates
- **Edge Functions**: Database triggers and webhooks

### External Integrations
- **Payment Processing**: Stripe API
- **Content Quality**: OpenAI API for question validation
- **Content Sources**: Open Educational Resources (OER)

For a detailed architecture diagram, see [architecture-diagram.svg](./architecture-diagram.svg).

## Features

### Learning Management
- **Board-Specific Courses**: Curriculum-aligned content for multiple boards
- **Video Lessons**: Integrated video player with progress tracking
- **LaTeX Support**: Mathematical equations rendered with KaTeX
- **Markdown Content**: Rich text content with React Markdown
- **Progress Tracking**: Detailed analytics on lesson completion and performance

### Assessment System
- **Question Types**: MCQ, Structured, Essay, Practical, Data Analysis
- **Mock Tests**: Full-length mock tests for JEE/NEET
- **Smart Analytics**: Question-level analytics with difficulty ratings
- **Instant Feedback**: Immediate results with explanations
- **Time Tracking**: Per-question and session-level time tracking

### Gamification
- **Teams**: Create and join teams to compete together
- **Tournaments**: Subject-specific competitive tournaments
- **Quiz Battles**: Real-time 1v1 quiz competitions
- **Achievements**: Unlock badges and rewards
- **Leaderboards**: Team and individual rankings
- **Bot Players**: AI opponents with different difficulty levels (Einstein, Newton, Curie, Tesla)

### Admin Features
- **User Management**: Role-based access control (Student, Teacher, Admin, Super Admin)
- **Content Management**: CRUD operations for courses, lessons, and questions
- **Question Editor**: Rich text editor with LaTeX support
- **Analytics Dashboard**: System-wide usage statistics
- **Audit Logs**: Track all administrative actions
- **Bulk Import**: CSV/TSV import for questions

### PWA Features
- **Offline Support**: Service worker caching for offline access
- **Install Prompt**: Add to home screen functionality
- **Push Notifications**: Engagement notifications
- **Background Sync**: Sync data when connection is restored

## Tech Stack

### Frontend
- **Core**: React 18.3, TypeScript 5.5
- **Build Tool**: Vite 5.4
- **Styling**: TailwindCSS 3.4, PostCSS
- **Routing**: React Router DOM 6.22
- **Content Rendering**:
  - KaTeX 0.16 (LaTeX math)
  - React Markdown 9.0 (Markdown content)
  - React Player 2.13 (Video playback)
  - React Quill 2.0 (Rich text editing)
- **UI Libraries**:
  - Lucide React (Icons)
  - React Dropzone (File uploads)
  - React Mosaic (Window management)
  - React Resizable (Resizable components)
- **Date Handling**: date-fns 2.30
- **PWA**: vite-plugin-pwa 0.20, Workbox 7.0

### Backend
- **BaaS**: Supabase 2.39
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Real-time

### Development Tools
- **Linting**: ESLint 9.9 with React plugins
- **Type Checking**: TypeScript
- **Web Scraping**: Puppeteer 22.4, Cheerio 1.0
- **Data Processing**:
  - csv-parse, csv-parser, csv-stringify
  - Natural language processing (natural 8.1)
- **AI Integration**: OpenAI 5.9
- **CLI Tools**: Commander 12.0, Chalk 5.3, Ora 8.0

### External Services
- **Payments**: Stripe
- **AI Services**: OpenAI API
- **Hosting**: Vercel/Netlify/CDN compatible

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for backend services)
- Optional: OpenAI API key (for question quality checks)
- Optional: Stripe account (for payment features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campuspandit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   ```

4. **Database Setup**

   Run the database migrations in your Supabase project to create the required tables. See [Database Schema](#database-schema) section.

5. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## Project Structure

```
campuspandit/
├── public/                  # Static assets
│   ├── manifest.json       # PWA manifest
│   └── sw.js              # Service worker
├── scripts/                # Development and data tools
│   ├── scrape-questions.js     # Scrape educational content
│   ├── import-questions.js     # Import and validate questions
│   ├── generate-questions.js   # Generate question data
│   └── convert-questions-for-supabase.js
├── src/
│   ├── components/         # React components
│   │   ├── admin/         # Admin panel components
│   │   │   ├── Analytics.tsx
│   │   │   ├── ContentUploader.tsx
│   │   │   ├── CourseManager.tsx
│   │   │   ├── StudentManagement.tsx
│   │   │   └── TeacherManagement.tsx
│   │   ├── Auth.tsx       # Authentication components
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   ├── GameDashboard.tsx  # Gaming features
│   │   ├── QuizBattle.tsx     # Real-time quiz battles
│   │   ├── TournamentView.tsx # Tournament system
│   │   └── ...
│   ├── config/            # Configuration files
│   │   └── env.ts
│   ├── data/              # Static data and content
│   │   ├── boardCourses.ts    # Board-specific courses
│   │   ├── competitiveExams.ts
│   │   ├── courses.ts
│   │   ├── gameData.ts
│   │   └── jeeMainContent.ts
│   ├── hooks/             # Custom React hooks
│   │   └── usePWA.ts
│   ├── pages/             # Page components
│   │   ├── PaymentSuccess.tsx
│   │   └── Pricing.tsx
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/             # Utility functions
│   │   ├── supabase.ts    # Supabase client and API
│   │   ├── api.ts         # API helper functions
│   │   ├── adminApi.ts    # Admin API functions
│   │   ├── offline.ts     # Offline support utilities
│   │   └── progress.ts    # Progress calculation
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── architecture-diagram.svg  # System architecture diagram
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development Tools

### Question Scraping Tool

Automatically scrape educational questions from open educational resources.

```bash
# Basic usage
npm run scrape-questions -- -o scraped-questions.csv

# Specify sources
npm run scrape-questions -- -s openstax,quizlet-cc,khan

# Limit number of questions
npm run scrape-questions -- -l 100

# Focus on specific topics
npm run scrape-questions -- -t physics,math

# Get help
npm run scrape-questions -- --help
```

**Supported Sources**:
- OpenStax (CC BY 4.0)
- Quizlet CC (Creative Commons)
- Khan Academy (CC BY-NC-SA 3.0)
- OER Commons
- CK-12 (CC BY-NC 3.0)

### Question Import Tool

Import and validate questions with AI-powered quality checks.

```bash
# Basic usage
npm run import-questions -- -f path/to/questions.csv -o output.json

# With OpenAI quality checks
npm run import-questions -- -f path/to/questions.csv -k your-openai-api-key

# Upload to Supabase
npm run import-questions -- -f path/to/questions.csv -u

# Set default values
npm run import-questions -- -f path/to/questions.csv -s physics -b jee -d medium

# Get help
npm run import-questions -- --help
```

**CSV Format**:

Required columns:
- `title`: Question title
- `content`: Question text
- `options`: Answer options (comma/semicolon/pipe-separated or JSON array)
- `correct_answer`: Index (0-based) or text of correct answer

Optional columns:
- `explanation`, `subject`, `board`, `difficulty`, `grade`, `topic_tags`, `question_type`, `marks`, `time_limit`

**Quality Checks**:
1. Title and content length validation
2. Spelling error detection
3. Option count validation
4. AI-powered ambiguity and clarity checks (with OpenAI API key)

## Database Schema

### Core Tables

#### Questions Management
- **questions**: Main question table with metadata
  - Fields: id, title, content, question_type, difficulty, subject, board, grade, topic_tags, marks, time_limit, is_published, metadata
- **question_options**: Answer options for MCQ questions
  - Fields: id, question_id, option_text, option_order, is_correct, explanation
- **question_collections**: Grouped question sets
  - Fields: id, name, description, is_public, metadata
- **collection_questions**: Many-to-many relationship
- **question_analytics**: Performance metrics
  - Fields: total_attempts, correct_attempts, average_time, difficulty_rating

#### User Management
- **users**: Managed by Supabase Auth
- **profiles**: Extended user information
- **roles**: Role definitions (student, teacher, admin, super_admin)
- **user_roles**: User-role assignments

#### Progress Tracking
- **student_responses**: Individual question responses
  - Fields: question_id, student_id, response_data, is_correct, score, time_taken, session_id
- **student_progress**: Overall progress tracking
- **test_sessions**: Mock test sessions
- **achievements**: Earned achievements and badges

#### Gaming System
- **teams**: Team information
  - Fields: name, description, total_points, rank, badge, color
- **team_members**: Team membership with points
- **tournaments**: Tournament definitions
  - Fields: title, subject, difficulty, start_time, end_time, status, max_participants
- **tournament_participants**: Participant scores and ranks
- **quiz_battles**: Real-time battle sessions

#### Content Management
- **courses**: Course definitions with board alignment
- **topics**: Topic groupings within courses
- **lessons**: Individual lesson content
- **exercises**: Practice exercises

#### Admin & Analytics
- **audit_logs**: System action logs
- **system_settings**: Application configuration
- **subscriptions**: User subscription status
- **payments**: Payment transaction records

### Database Features
- **Row Level Security (RLS)**: Fine-grained access control
- **Real-time Subscriptions**: Live updates for quiz battles and tournaments
- **Triggers**: Automatic analytics updates
- **Foreign Key Constraints**: Data integrity
- **Indexes**: Optimized query performance

## API Documentation

### Authentication API

```typescript
// Supabase Auth (built-in)
await supabase.auth.signUp({ email, password })
await supabase.auth.signIn({ email, password })
await supabase.auth.signOut()
const { data: { user } } = await supabase.auth.getUser()
```

### Question API

```typescript
import { questionAPI } from './utils/supabase'

// Get questions with filters
const questions = await questionAPI.getQuestions({
  subject: 'physics',
  board: 'jee',
  difficulty: 'medium',
  is_published: true
})

// Get single question
const question = await questionAPI.getQuestion(questionId)

// Create question
const newQuestion = await questionAPI.createQuestion(questionData, options)

// Update question
await questionAPI.updateQuestion(questionId, updates, newOptions)

// Delete question
await questionAPI.deleteQuestion(questionId)

// Submit response
await questionAPI.submitResponse(
  questionId,
  responseData,
  isCorrect,
  score,
  timeTaken,
  sessionId
)

// Get analytics
const analytics = await questionAPI.getQuestionAnalytics(questionId)
```

### Collection API

```typescript
import { collectionAPI } from './utils/supabase'

// Get all collections
const collections = await collectionAPI.getCollections()

// Create collection
const collection = await collectionAPI.createCollection(collectionData)

// Add question to collection
await collectionAPI.addQuestionToCollection(collectionId, questionId, orderIndex)

// Remove question from collection
await collectionAPI.removeQuestionFromCollection(collectionId, questionId)
```

### Admin API

See `src/utils/adminApi.ts` for user management, analytics, and system administration functions.

## Deployment

### Frontend Deployment

The application is a static React app and can be deployed to any static hosting service:

**Vercel**:
```bash
npm install -g vercel
vercel
```

**Netlify**:
```bash
npm run build
# Upload dist/ folder to Netlify
```

**Traditional Hosting**:
```bash
npm run build
# Upload dist/ folder to your web server
```

### Backend Setup

1. **Supabase Project**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run database migrations to create tables
   - Configure Row Level Security policies
   - Set up authentication providers

2. **Environment Variables**:
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting platform
   - Configure Stripe keys if using payment features

3. **Database Migrations**:
   - Use Supabase CLI or Dashboard to run migrations
   - Set up triggers for analytics updates
   - Configure storage buckets for file uploads

### PWA Configuration

The app is configured as a PWA with:
- Service worker for offline caching
- Manifest file for install prompt
- Workbox for cache strategies

To customize PWA settings, edit `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'CampusPandit',
    short_name: 'CampusPandit',
    // ... other manifest options
  }
})
```

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test thoroughly
4. Run linting: `npm run lint`
5. Build to ensure no errors: `npm run build`
6. Commit changes: `git commit -m "Add my feature"`
7. Push to branch: `git push origin feature/my-feature`
8. Create a Pull Request

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Add TypeScript types for all props and state
- Write meaningful component and variable names
- Comment complex logic
- Keep components small and focused

### Testing

- Test all new features manually
- Ensure offline functionality works
- Test across different browsers
- Verify mobile responsiveness
- Check accessibility compliance

### Commit Guidelines

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove)
- Reference issue numbers if applicable
- Keep commits atomic and focused

## License

[Specify your license here]

## Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact: [your-email@example.com]
- Documentation: [your-docs-url]

## Acknowledgments

- Educational content sources (OpenStax, Khan Academy, etc.)
- Open source libraries and frameworks
- Contributors and maintainers

---

Built with React, TypeScript, Supabase, and modern web technologies.
