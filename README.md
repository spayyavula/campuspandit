campuspandit.com

## Question Scraping Tool

This tool helps you automatically scrape educational questions from open educational resources and other sources that explicitly allow content reuse.

### Usage

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

### Sources

The tool only scrapes from sources that explicitly allow content reuse:

- **OpenStax**: Free, peer-reviewed, openly licensed textbooks (CC BY 4.0)
- **Quizlet CC**: Creative Commons licensed flashcards and quizzes
- **Khan Academy**: Free educational exercises and videos (CC BY-NC-SA 3.0)
- **OER Commons**: Open educational resources with various open licenses
- **CK-12**: Free online textbooks and quizzes (CC BY-NC 3.0)

### Output Format

The tool outputs a CSV file compatible with the import-questions tool, including:
- Question content
- Answer options
- Correct answer
- Subject and topic information
- Source and license details

## Question Import Tool

This tool helps you automatically import questions and answers into the system, with quality checks for ambiguous or poor English.

### Usage

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

### CSV Format

Required columns:
- `title`: Question title
- `content`: Question content/text
- `options`: Answer options (comma, semicolon, or pipe-separated, or JSON array)
- `correct_answer`: Index of correct answer (0-based) or text matching the correct option

Optional columns:
- `explanation`: Explanation for the correct answer
- `subject`: Question subject (physics, math, chemistry, biology)
- `board`: Board/curriculum (cambridge, ib, cbse, isc, jee, neet, general)
- `difficulty`: Difficulty level (easy, medium, hard)
- `grade`: Grade/class level
- `topic_tags`: Topic tags (comma-separated or JSON array)
- `question_type`: Question type (mcq, structured, essay, practical, data_analysis)
- `marks`: Question marks/points
- `time_limit`: Time limit in minutes

### Quality Checks

The tool performs several quality checks:
1. Title and content length
2. Spelling errors
3. Number of options
4. AI-powered checks for ambiguity and clarity (if OpenAI API key provided)

Questions that fail quality checks are flagged for review.

## Authentication Troubleshooting

If users can't login after successful registration, here are common issues and solutions:

### 1. Email Verification Required
- **Issue**: Users trying to login before verifying their email
- **Solution**: 
  - Check email for verification link (including spam folder)
  - Click the verification link before attempting to login
  - Use the "Resend Verification Email" button if needed

### 2. Supabase Configuration
- **Issue**: Missing or incorrect environment variables
- **Solution**: 
  - Ensure `VITE_SUPABASE_URL` is set correctly
  - Ensure `VITE_SUPABASE_ANON_KEY` is set correctly
  - Check that email authentication is enabled in Supabase dashboard

### 3. Database Setup
- **Issue**: User profile not created after registration
- **Solution**: 
  - Verify that the `create_user_profile_trigger` is active
  - Check that RLS policies allow profile creation
  - Ensure the `user_profiles` table exists

### 4. Debug Steps
1. Open browser console and look for auth state changes
2. Try the registration flow with a new email
3. Check email for verification link
4. Verify the link redirects to `/auth/callback`
5. Check if user appears in Supabase auth users table

### 5. Recent Improvements
- ✅ Enhanced error messages for unverified emails
- ✅ Added email verification callback handler
- ✅ Improved auth state debugging
- ✅ Added resend verification email option

For additional debugging, run: `node scripts/debug-auth.js`