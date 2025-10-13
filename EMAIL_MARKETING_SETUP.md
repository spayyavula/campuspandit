# Email Marketing Setup Guide

This guide will help you set up the email marketing functionality in CampusPandit.

## Overview

The email marketing system allows you to:
- Collect email subscribers during registration
- Manage user email preferences
- Export subscriber lists for marketing campaigns
- Track subscription sources and preferences
- Maintain GDPR/compliance with proper consent tracking

## Database Setup

### 1. Run the SQL Schema

Execute the SQL script in your Supabase SQL Editor:

```bash
# Location: database/email_marketing_schema.sql
```

This will create:
- `email_subscribers` table with proper indexes
- Row Level Security (RLS) policies
- Automatic timestamp triggers
- Admin statistics view
- Helper functions

### 2. Verify Tables

After running the schema, verify the table was created:

```sql
SELECT * FROM email_subscribers LIMIT 1;
```

## Features

### For Users

#### 1. Registration with Marketing Consent

During registration, users see an attractive opt-in box:
- Clear description of what emails they'll receive
- Easy to understand benefits
- One-click opt-in/opt-out

**Location**: `src/components/Auth.tsx`

#### 2. Email Preferences Management

Users can manage their preferences from their profile:
- Master subscribe/unsubscribe toggle
- Granular preferences:
  - Course updates
  - Tournament notifications
  - Weekly digest
  - Promotional offers

**Location**: `src/components/EmailPreferences.tsx`

**Integration**: Add to your user dashboard/profile:

```tsx
import EmailPreferences from './components/EmailPreferences';

// In your profile or settings component:
<EmailPreferences />
```

### For Admins

#### Admin Email Subscribers Dashboard

View and manage all subscribers with:
- Real-time statistics (total, active, conversion rate)
- Search and filter functionality
- Export to CSV for email marketing platforms
- View individual preferences
- Track subscription sources

**Location**: `src/components/admin/EmailSubscribers.tsx`

**Integration**: Add to your admin dashboard:

```tsx
import EmailSubscribers from './components/admin/EmailSubscribers';

// In your admin panel routing:
<Route path="/admin/email-subscribers" element={<EmailSubscribers />} />
```

## API Usage

### Basic Operations

```typescript
import { emailMarketingAPI } from './utils/emailMarketing';

// Subscribe a user
await emailMarketingAPI.subscribe(
  'user@example.com',
  'User Name',
  userId,
  'registration'
);

// Unsubscribe
await emailMarketingAPI.unsubscribe('user@example.com');

// Update preferences
await emailMarketingAPI.updatePreferences('user@example.com', {
  course_updates: true,
  tournament_notifications: false,
  weekly_digest: true,
  promotional_offers: false
});

// Get subscriber info
const subscriber = await emailMarketingAPI.getSubscriber('user@example.com');

// Get all subscribers (admin only)
const subscribers = await emailMarketingAPI.getAllSubscribers({
  subscribed: true
});

// Export to CSV
const csv = await emailMarketingAPI.exportSubscribersCSV(true);
```

## Email Marketing Platform Integration

### Exporting Subscriber Lists

1. Go to Admin Dashboard → Email Subscribers
2. Apply filters if needed (e.g., only active subscribers)
3. Click "Export CSV"
4. Import the CSV into your email marketing platform

### Supported Platforms

The CSV export is compatible with:
- **Mailchimp**: Direct import via CSV
- **SendGrid**: Import as contacts
- **ConvertKit**: Bulk subscriber upload
- **ActiveCampaign**: Contact import
- **Brevo (Sendinblue)**: Contact list upload
- **Any platform supporting CSV import**

### CSV Format

```csv
email,name,subscribed,consent_date,source,course_updates,tournament_notifications,weekly_digest,promotional_offers
user@example.com,User Name,true,2025-01-15,registration,true,true,true,false
```

## Segmentation Strategies

Use the preferences columns to segment your audience:

### Course Updates Segment
Target users interested in new courses and learning materials:
```
Filter: course_updates = true
```

### Tournament Players Segment
Target competitive users for tournament announcements:
```
Filter: tournament_notifications = true
```

### Engaged Users Segment
Users who want weekly digests are highly engaged:
```
Filter: weekly_digest = true
```

### Deal Seekers Segment
Users interested in promotions and special offers:
```
Filter: promotional_offers = true
```

## Compliance & Best Practices

### GDPR Compliance

✅ **Consent Tracking**: Every subscriber record includes:
- Consent date
- Explicit opt-in confirmation
- Source of subscription

✅ **Easy Unsubscribe**: Users can:
- Unsubscribe from profile settings
- Unsubscribe date is tracked
- Re-subscribe is allowed

✅ **Transparency**: Clear information about:
- What emails they'll receive
- How to manage preferences
- How to unsubscribe

### Email Marketing Best Practices

1. **Respect Preferences**
   - Only send emails matching user preferences
   - Honor unsubscribe requests immediately

2. **Maintain Clean Lists**
   - Regularly remove unsubscribed users
   - Track engagement metrics
   - Remove inactive subscribers

3. **Segment Your Campaigns**
   - Use preferences for targeted campaigns
   - Higher engagement = better deliverability

4. **Test and Optimize**
   - A/B test subject lines
   - Track open and click rates
   - Adjust frequency based on engagement

5. **Add Unsubscribe Links**
   - Include in all marketing emails
   - Make it one-click easy
   - Update your database immediately

## Automation Ideas

### Welcome Email Series
When a user subscribes (`source = 'registration'`):
1. Welcome email (immediate)
2. Getting started guide (day 2)
3. Feature highlights (day 5)
4. Tips for success (day 10)

### Weekly Digest
For users with `weekly_digest = true`:
- Send every Monday
- Include: Progress summary, new courses, upcoming tournaments
- Personalize with user's name and stats

### Tournament Notifications
For users with `tournament_notifications = true`:
- New tournament announcements
- Registration reminders
- Results and leaderboards

### Course Launch Emails
For users with `course_updates = true`:
- New course announcements
- Early access offers
- Beta testing opportunities

### Promotional Campaigns
For users with `promotional_offers = true`:
- Special discounts
- Limited-time offers
- Referral bonuses

## Troubleshooting

### Users Not Being Added to Subscribers Table

Check that the Auth.tsx component is properly calling the API:
```typescript
// In Auth.tsx, after successful registration:
if (authData.user && form.optin) {
  await supabase.from('email_subscribers').insert({
    user_id: authData.user.id,
    email: form.email,
    name: form.name,
    subscribed: true,
    consent_date: new Date().toISOString(),
    source: 'registration'
  });
}
```

### RLS Policies Not Working

Verify that the `roles` and `user_roles` tables exist for admin policies:
```sql
SELECT * FROM roles;
SELECT * FROM user_roles;
```

### Export CSV Shows Empty

Make sure you have:
1. Active subscribers in the database
2. Admin permissions
3. Proper Supabase connection

## Migration from Existing System

If you already have users and want to import them:

```typescript
// Batch import existing users
const existingUsers = [
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
  // ... more users
];

const result = await emailMarketingAPI.batchImport(existingUsers);
console.log(`Success: ${result.success}, Failed: ${result.failed}`);
```

## Support

For issues or questions:
- Check the main README.md
- Review the database schema comments
- Inspect the API functions in `utils/emailMarketing.ts`
- Test with sample data first

---

**Remember**: Always respect user privacy and comply with email marketing regulations in your jurisdiction (GDPR, CAN-SPAM, etc.).
