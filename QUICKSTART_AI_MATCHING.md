# 🚀 Quick Start: AI Tutor Matching

Get the AI-powered tutor matching system up and running in 10 minutes!

---

## Prerequisites

- ✅ Python 3.11+ installed
- ✅ Node.js 18+ installed
- ✅ Supabase account (free tier is fine)
- ✅ OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

---

## Step 1: Backend Setup (5 minutes)

### 1.1 Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 1.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set these **required** values:

```bash
# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-your-key-here

# Database (REQUIRED)
DATABASE_URL=your-supabase-connection-string

# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
```

### 1.3 Run Database Migration

**Option A: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project → SQL Editor
3. Copy contents of `backend/database/migrations/20251024120000_create_ai_matching_tables.sql`
4. Paste and click "Run"

**Option B: Command Line**
```bash
psql your_database_url < backend/database/migrations/20251024120000_create_ai_matching_tables.sql
```

### 1.4 Start Backend

```bash
uvicorn main:app --reload
```

✅ Backend running at: `http://localhost:8000`
✅ API docs at: `http://localhost:8000/docs`

---

## Step 2: Frontend Setup (3 minutes)

### 2.1 Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_API_URL=http://localhost:8000/api/v1
```

### 2.2 Start Frontend

```bash
npm install
npm run dev
```

✅ Frontend running at: `http://localhost:5173`

---

## Step 3: Test It Out (2 minutes)

### 3.1 Create a Test Tutor

Open `http://localhost:8000/docs` and try the **POST /matching/tutors/profile** endpoint:

```json
{
  "bio": "Experienced math tutor with 5 years teaching calculus and algebra",
  "headline": "Expert Math Tutor - Calculus Specialist",
  "years_experience": 5,
  "education_level": "master",
  "subjects": ["Mathematics", "Calculus", "Algebra"],
  "specializations": ["AP Calculus", "SAT Math"],
  "grade_levels": ["9-10", "11-12", "college"],
  "teaching_style": "patient",
  "teaching_methods": ["visual", "interactive"],
  "hourly_rate_min": 40,
  "hourly_rate_max": 60
}
```

Add `?user_id=test-tutor-123` to the URL.

### 3.2 Find Matches

Try the **POST /matching/quick-match** endpoint:

```json
{
  "subject": "Mathematics",
  "budget_max": 60,
  "max_results": 3
}
```

You should get back AI-ranked matches! 🎉

### 3.3 Use the Frontend Component

Visit: `http://localhost:5173`

Add the matching wizard to your page:

```tsx
import TutorMatchingWizard from './components/matching/TutorMatchingWizard';

function App() {
  return <TutorMatchingWizard />;
}
```

---

## Verify Everything Works

✅ **Backend Health Check:**
```bash
curl http://localhost:8000/api/v1/matching/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "AI Matching",
  "version": "1.0.0",
  "ai_provider": "OpenAI GPT-4"
}
```

✅ **Quick Match Test:**
```bash
curl -X POST http://localhost:8000/api/v1/matching/quick-match \
  -H "Content-Type: application/json" \
  -d '{"subject": "Mathematics", "max_results": 3}'
```

---

## What You Just Built

🎯 **AI-Powered Matching** - Using GPT-4 to rank tutors intelligently
📊 **Detailed Scoring** - 6 different match factors
💬 **Natural Language Reasoning** - AI explains why each tutor matches
📈 **Analytics** - Track matching performance
🔄 **Feedback Loop** - Improve with user feedback

---

## Next Steps

1. **Add More Tutors** - Create profiles for multiple tutors
2. **Create Student Profiles** - Use POST `/matching/students/profile`
3. **Test Full Matching** - Use POST `/matching/find-tutors` with student ID
4. **Customize Frontend** - Modify `TutorMatchingWizard.tsx` to match your design
5. **Enable Analytics** - View at `/matching/analytics`

---

## Common Issues

**"No matches found"**
- Make sure you created at least one tutor profile
- Check that the subject matches (case-sensitive)
- Verify tutor `is_active=true` and `accepts_new_students=true`

**"OpenAI API error"**
- Verify your API key is correct
- Check you have credits in your OpenAI account
- AI reasoning is optional - set `include_ai_reasoning: false` to skip it

**"Database connection failed"**
- Verify your DATABASE_URL is correct
- Check that the migration ran successfully
- Ensure Supabase project is active

**"CORS error"**
- Check `ALLOWED_ORIGINS` in backend `.env`
- Should include your frontend URL (e.g., `http://localhost:5173`)

---

## Production Deployment

When ready to deploy:

1. **Backend:**
   ```bash
   docker-compose up -d
   ```

2. **Set Production Env Vars:**
   - Use production OpenAI key
   - Use production database URL
   - Set `ENVIRONMENT=production`
   - Enable HTTPS only

3. **Security:**
   - Enable Row Level Security (RLS) - already in migration
   - Add rate limiting
   - Implement API authentication
   - Monitor with Sentry

---

## Resources

📚 **Full Documentation:** [AI_MATCHING_GUIDE.md](./AI_MATCHING_GUIDE.md)
🧪 **Tests:** `backend/tests/test_matching.py`
🔧 **API Reference:** `http://localhost:8000/docs`
💻 **Frontend Service:** `src/services/aiMatching.ts`
🎨 **React Component:** `src/components/matching/TutorMatchingWizard.tsx`

---

## Need Help?

1. Check the [Troubleshooting section](./AI_MATCHING_GUIDE.md#troubleshooting)
2. Review the API docs at `/docs`
3. Check backend logs for errors
4. Test individual endpoints first

---

**🎉 You're all set!**

Your AI-powered tutor matching system is ready to help students find their perfect tutor.

Happy matching! 🚀
