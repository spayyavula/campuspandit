# CampusPandit Tutoring System - Complete Guide

A comprehensive global tutoring platform connecting students with expert tutors for Math, Physics, Chemistry, and other subjects for entrance exam preparation.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [User Roles](#user-roles)
- [Components](#components)
- [API Documentation](#api-documentation)
- [Integrating Video Conferencing](#integrating-video-conferencing)
- [Payment Integration](#payment-integration)
- [Best Practices](#best-practices)

## Overview

The tutoring system enables:
- **Tutors** from around the world to offer their teaching services
- **Students** to find, book, and learn from qualified tutors
- **Admins** to verify tutor credentials and manage the platform

### Key Capabilities

✅ Global tutor marketplace with filtering and search
✅ Subject-specific expertise (Physics, Math, Chemistry, Biology, etc.)
✅ Entrance exam specialization (JEE, NEET, IB, Cambridge, etc.)
✅ Real-time session scheduling across timezones
✅ Rating and review system
✅ Tutor earnings tracking
✅ Admin verification and approval workflow
✅ Favorite tutors functionality

## Features

### For Tutors

1. **Profile Creation**
   - Comprehensive profile with bio, qualifications
   - Subject and specialization selection
   - Pricing and availability settings
   - Verification documents upload

2. **Session Management**
   - View upcoming and past sessions
   - Confirm session bookings
   - Join video calls
   - Track earnings and statistics

3. **Dashboard Analytics**
   - Total sessions taught
   - Hours taught
   - Average rating
   - Total earnings

### For Students

1. **Find Tutors**
   - Browse verified tutors
   - Filter by subject, country, rating, price
   - Filter by specialization (JEE, NEET, etc.)
   - View tutor profiles and reviews

2. **Booking System**
   - Request sessions with tutors
   - Specify subject, topic, and preferred times
   - Instant booking (if tutor allows)

3. **Session Management**
   - View upcoming sessions
   - Join video calls
   - Leave reviews and ratings

### For Admins

1. **Tutor Verification**
   - Review tutor applications
   - Approve or reject profiles
   - View qualifications and credentials
   - Track verification status

2. **Platform Management**
   - Monitor all sessions
   - View statistics and analytics
   - Manage disputes
   - Export data

## Architecture

### Database Tables

1. **tutor_profiles** - Tutor information and credentials
2. **tutor_availability_slots** - Weekly availability schedules
3. **tutoring_sessions** - All tutoring sessions
4. **session_reviews** - Student reviews and ratings
5. **tutor_subject_expertise** - Detailed subject proficiency
6. **student_bookings** - Booking requests
7. **tutor_certifications** - Qualifications and certificates
8. **tutor_earnings** - Payment and payout tracking
9. **student_favorite_tutors** - Saved favorites
10. **subjects** - Master list of subjects

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Admins have elevated permissions
- Tutor verification required before appearing in marketplace

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# File: database/tutoring_system_schema.sql
```

This creates all necessary tables, indexes, triggers, and RLS policies.

### 2. Install Dependencies

The required dependencies are already in your `package.json`:

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "react-router-dom": "^6.22.3",
  "lucide-react": "^0.344.0"
}
```

### 3. Add Routes

In your `App.tsx` or routing file, add:

```tsx
import TutorRegistration from './components/tutoring/TutorRegistration';
import FindTutors from './components/tutoring/FindTutors';
import TutorDashboard from './components/tutoring/TutorDashboard';
import TutorManagementAdmin from './components/tutoring/TutorManagementAdmin';

// Add routes:
<Route path="/tutoring/become-tutor" element={<TutorRegistration />} />
<Route path="/tutoring/find-tutors" element={<FindTutors />} />
<Route path="/tutoring/tutor-dashboard" element={<TutorDashboard />} />
<Route path="/admin/tutors" element={<TutorManagementAdmin />} />
```

### 4. Update Navigation

Add tutoring links to your navigation:

```tsx
<Link to="/tutoring/find-tutors">Find Tutors</Link>
<Link to="/tutoring/become-tutor">Become a Tutor</Link>
<Link to="/tutoring/tutor-dashboard">My Dashboard</Link> {/* For tutors */}
```

## User Roles

### Student Flow

1. Browse tutors in marketplace
2. Filter by subject, expertise, price
3. View tutor profiles and reviews
4. Create booking request
5. Wait for tutor confirmation
6. Join session via video link
7. Leave review after session

### Tutor Flow

1. Register as tutor with qualifications
2. Wait for admin verification (24-48 hours)
3. Get approved and profile goes live
4. Receive booking requests from students
5. Accept/reject bookings
6. Conduct sessions
7. Track earnings and statistics

### Admin Flow

1. Review pending tutor applications
2. Verify credentials and qualifications
3. Approve or reject profiles
4. Monitor platform activity
5. Handle disputes and issues

## Components

### Created Components

#### 1. TutorRegistration (`src/components/tutoring/TutorRegistration.tsx`)

Multi-step registration form for tutors:
- Step 1: Basic information (name, country, bio)
- Step 2: Expertise & subjects
- Step 3: Pricing & availability
- Step 4: Review & submit

**Usage:**
```tsx
<TutorRegistration />
```

#### 2. FindTutors (`src/components/tutoring/FindTutors.tsx`)

Student-facing marketplace to browse and search tutors:
- Search by name, subject, expertise
- Filter by country, rating, price, specialization
- View tutor profiles
- Add to favorites
- Navigate to booking

**Usage:**
```tsx
<FindTutors />
```

#### 3. TutorDashboard (`src/components/tutoring/TutorDashboard.tsx`)

Dashboard for tutors to manage their business:
- View statistics (sessions, hours, rating, earnings)
- Upcoming sessions list
- All sessions history
- Quick actions (join session, confirm booking)

**Usage:**
```tsx
<TutorDashboard />
```

#### 4. TutorManagementAdmin (`src/components/tutoring/TutorManagementAdmin.tsx`)

Admin panel for tutor verification:
- View all tutor applications
- Filter by status (pending, verified, rejected)
- Review detailed profiles
- Approve or reject applications
- Statistics dashboard

**Usage:**
```tsx
<TutorManagementAdmin />
```

## API Documentation

### Tutor API (`tutorAPI`)

```typescript
import { tutorAPI } from './utils/tutoringAPI';

// Get all verified tutors
const tutors = await tutorAPI.getTutors({
  subjects: ['Physics', 'Math'],
  country: 'India',
  min_rating: 4.5,
  max_rate: 50
});

// Get specific tutor
const tutor = await tutorAPI.getTutor(tutorId);

// Create/update tutor profile
const result = await tutorAPI.upsertTutorProfile(profileData);

// Get tutor by user ID
const tutor = await tutorAPI.getTutorByUserId(userId);

// Update availability
await tutorAPI.updateAvailability(tutorId, true);
```

### Session API (`sessionAPI`)

```typescript
import { sessionAPI } from './utils/tutoringAPI';

// Create session
const result = await sessionAPI.createSession({
  tutor_id: tutorId,
  student_id: studentId,
  subject: 'Physics',
  topic: 'Mechanics',
  scheduled_start: '2025-01-20T10:00:00Z',
  scheduled_end: '2025-01-20T11:00:00Z',
  duration_minutes: 60,
  timezone: 'Asia/Kolkata',
  price_usd: 25
});

// Get user sessions
const sessions = await sessionAPI.getUserSessions({
  status: 'scheduled',
  upcoming: true
});

// Update session status
await sessionAPI.updateSessionStatus(sessionId, 'confirmed');

// Cancel session
await sessionAPI.cancelSession(sessionId, 'Student cancelled');
```

### Booking API (`bookingAPI`)

```typescript
import { bookingAPI } from './utils/tutoringAPI';

// Create booking request
const result = await bookingAPI.createBooking({
  tutor_id: tutorId,
  requested_subject: 'Physics',
  requested_topic: 'Thermodynamics',
  requested_date: '2025-01-20',
  requested_time_slots: { morning: true, afternoon: false },
  special_requirements: 'Focus on JEE Main problems'
});

// Get user bookings
const bookings = await bookingAPI.getUserBookings('pending');

// Respond to booking (tutor)
await bookingAPI.respondToBooking(bookingId, 'accepted', 'I can help you with that!');
```

### Review API (`reviewAPI`)

```typescript
import { reviewAPI } from './utils/tutoringAPI';

// Create review
const result = await reviewAPI.createReview({
  session_id: sessionId,
  tutor_id: tutorId,
  rating: 5,
  review_text: 'Excellent tutor! Very clear explanations.',
  subject_knowledge_rating: 5,
  teaching_style_rating: 5,
  communication_rating: 5,
  punctuality_rating: 5,
  helpful_tags: ['Patient', 'Clear explanations', 'Great examples']
});

// Get tutor reviews
const reviews = await reviewAPI.getTutorReviews(tutorId, 10);
```

### Subject & Search API (`subjectAPI`)

```typescript
import { subjectAPI } from './utils/tutoringAPI';

// Get all subjects
const subjects = await subjectAPI.getSubjects();

// Search tutors
const tutors = await subjectAPI.searchTutors({
  subject: 'Physics',
  specialization: ['JEE Main', 'JEE Advanced'],
  country: 'India',
  minRating: 4.0,
  maxRate: 50
});
```

### Favorites API (`favoritesAPI`)

```typescript
import { favoritesAPI } from './utils/tutoringAPI';

// Add favorite
await favoritesAPI.addFavorite(tutorId);

// Remove favorite
await favoritesAPI.removeFavorite(tutorId);

// Get favorites
const favorites = await favoritesAPI.getFavorites();

// Check if favorited
const isFav = await favoritesAPI.isFavorite(tutorId);
```

## Integrating Video Conferencing

The system is designed to work with any video conferencing platform. Here's how to integrate:

### Option 1: Zoom Integration

```typescript
// When creating a session
const zoomMeeting = await createZoomMeeting(); // Your Zoom API call

await sessionAPI.createSession({
  // ... other fields
  meeting_platform: 'zoom',
  meeting_url: zoomMeeting.join_url,
  meeting_id: zoomMeeting.id,
  meeting_password: zoomMeeting.password
});
```

### Option 2: Google Meet

```typescript
const meetLink = await createGoogleMeet(); // Your Google API call

await sessionAPI.createSession({
  // ... other fields
  meeting_platform: 'google_meet',
  meeting_url: meetLink
});
```

### Option 3: Custom Solution

You can use any video platform or build your own using WebRTC:
- Agora
- Twilio Video
- Daily.co
- Jitsi
- Custom WebRTC

## Payment Integration

### Stripe Integration Example

```typescript
// 1. When student books a session
const paymentIntent = await stripe.paymentIntents.create({
  amount: session.price_usd * 100, // Convert to cents
  currency: 'usd',
  metadata: {
    session_id: session.id,
    tutor_id: session.tutor_id,
    student_id: session.student_id
  }
});

// 2. Update session with payment info
await sessionAPI.updateSessionStatus(sessionId, 'scheduled', {
  payment_status: 'paid',
  payment_id: paymentIntent.id
});

// 3. After session completes, process tutor payout
await processTeacherPayout(tutorId, sessionId);
```

### Platform Fee Structure

Example commission model:

```typescript
const PLATFORM_FEE_PERCENTAGE = 0.20; // 20% platform fee

const calculateEarnings = (sessionPrice: number) => {
  const grossAmount = sessionPrice;
  const platformFee = grossAmount * PLATFORM_FEE_PERCENTAGE;
  const netAmount = grossAmount - platformFee;

  return {
    grossAmount,
    platformFee,
    netAmount
  };
};
```

## Best Practices

### For Tutors

1. **Complete Profile**
   - Add detailed bio and teaching style
   - Upload verification documents
   - Add video introduction (recommended)
   - List all relevant qualifications

2. **Pricing Strategy**
   - Research competitive rates in your region
   - Consider your experience level
   - Offer introductory rates for first sessions

3. **Session Management**
   - Respond to bookings within 24 hours
   - Confirm sessions in advance
   - Prepare materials before each session
   - Be punctual

4. **Building Reputation**
   - Provide excellent teaching
   - Ask satisfied students for reviews
   - Maintain high availability
   - Specialize in specific topics

### For Students

1. **Finding the Right Tutor**
   - Check reviews and ratings
   - Consider specialization match
   - Try intro sessions with multiple tutors
   - Check timezone compatibility

2. **Booking Sessions**
   - Provide clear topic description
   - Specify learning goals
   - Mention exam preparation needs
   - Book in advance

3. **Getting Most Value**
   - Come prepared with questions
   - Share study materials in advance
   - Take notes during sessions
   - Practice recommended problems

### For Admins

1. **Verification Process**
   - Check qualifications thoroughly
   - Verify teaching credentials
   - Review sample teaching materials
   - Conduct brief interviews if needed

2. **Quality Control**
   - Monitor tutor ratings
   - Handle student complaints promptly
   - Review flagged content
   - Maintain quality standards

3. **Platform Growth**
   - Recruit high-quality tutors
   - Focus on key subjects and exams
   - Maintain tutor-student balance
   - Gather feedback regularly

## Customization Options

### Adding New Subjects

Update the subjects table:

```sql
INSERT INTO subjects (name, category, description, display_order) VALUES
('Sanskrit', 'Language', 'Classical language studies', 11),
('Philosophy', 'Arts', 'Philosophy and logic', 12);
```

### Adding New Exam Types

Update specializations in components:

```typescript
const specializations = [
  'JEE Main', 'JEE Advanced', 'NEET', 'IIT',
  'CBSE', 'ICSE', 'ISC', 'IB', 'Cambridge IGCSE',
  'SAT', 'ACT', 'GMAT', 'GRE' // Add new ones
];
```

### Custom Pricing Models

Modify to support:
- Package pricing (buy 10 sessions, get discount)
- Subscription models
- Group sessions
- Course bundles

## Troubleshooting

### Common Issues

1. **Tutors not appearing in marketplace**
   - Check verification_status is 'verified'
   - Ensure is_active is true
   - Verify RLS policies are correct

2. **Sessions not creating**
   - Check timezone format
   - Verify user authentication
   - Ensure tutor_id and student_id are valid

3. **Reviews not showing**
   - Confirm is_public is true
   - Check session status is 'completed'
   - Verify student_id matches session

### Support

For issues or questions:
- Check database logs in Supabase Dashboard
- Review browser console for errors
- Test API calls directly in Supabase
- Check RLS policies for access issues

## Roadmap & Future Enhancements

Potential features to add:

- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Automated session reminders
- [ ] Tutor chat/messaging system
- [ ] Group session support
- [ ] Recorded session playback
- [ ] Whiteboard collaboration tools
- [ ] Homework assignment system
- [ ] Progress reports for students
- [ ] Tutor certification program
- [ ] Referral rewards system
- [ ] Mobile app (React Native)
- [ ] AI-powered tutor matching
- [ ] Multi-language support

---

## Quick Start Checklist

- [ ] Run database schema (`tutoring_system_schema.sql`)
- [ ] Add routing for tutoring components
- [ ] Update navigation with tutoring links
- [ ] Configure video conferencing integration
- [ ] Set up payment processing (Stripe/PayPal)
- [ ] Customize subjects and specializations
- [ ] Set platform fee percentage
- [ ] Test tutor registration flow
- [ ] Test student booking flow
- [ ] Test admin verification flow
- [ ] Launch to beta users

---

**Built with**: React, TypeScript, Supabase, TailwindCSS, Lucide Icons

**License**: [Your License]

**Support**: [Your Support Email]
