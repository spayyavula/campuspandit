# Python Backend Architecture Guide

**AI-Ready FastAPI Backend for CampusPandit**

---

## Why Python Backend?

✅ **AI/ML Ecosystem** - TensorFlow, PyTorch, scikit-learn, OpenAI
✅ **Data Science Ready** - Pandas, NumPy, advanced analytics
✅ **Async Performance** - FastAPI with async/await
✅ **Easy Scaling** - Celery for background tasks, Redis caching
✅ **Future-Proof** - Perfect for AI features (smart matching, personalization)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React/TypeScript)             │
│                    Port: 3000/5173                       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST API
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI Backend                      │
│                    Port: 8000                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   API       │  │   Service    │  │   AI/ML       │ │
│  │   Routes    │→ │   Layer      │→ │   Services    │ │
│  └─────────────┘  └──────────────┘  └───────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│           Supabase PostgreSQL Database                   │
│           (Same database, different access)              │
│  - Scheduling tables                                     │
│  - User data                                            │
│  - Analytics                                            │
└─────────────────────────────────────────────────────────┘

          ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Redis     │    │   Celery     │    │   OpenAI     │
│   (Cache)    │    │ (Background) │    │   (AI API)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env with your settings
```

**Required Environment Variables:**

```bash
# Database (use your Supabase connection string)
DATABASE_URL=postgresql+asyncpg://postgres:[password]@[host]:5432/postgres

# Supabase (for auth integration)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# AI (optional, for future features)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Stripe (payment)
STRIPE_SECRET_KEY=sk_test_your-stripe-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key

# SMS (Twilio - optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Initial scheduling tables"

# Apply migration
alembic upgrade head
```

### Step 4: Start the Server

```bash
# Development mode (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Step 5: Test the API

```bash
# Health check
curl http://localhost:8000/health

# API documentation
open http://localhost:8000/api/docs

# Test endpoint
curl http://localhost:8000/api/v1/scheduling/health
```

---

## Project Structure

```
backend/
├── main.py                      # FastAPI app entry point
├── requirements.txt             # Python dependencies
├── .env                        # Environment variables (gitignored)
├── .env.example                # Example environment file
├── Dockerfile                  # Docker container config
├── docker-compose.yml          # Multi-container setup
│
├── app/
│   ├── __init__.py
│   │
│   ├── core/                   # Core configuration
│   │   ├── config.py          # Settings management
│   │   ├── database.py        # DB connection
│   │   ├── security.py        # Auth & JWT
│   │   └── logging.py         # Logging setup
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── scheduling.py      # Scheduling tables
│   │   ├── users.py           # User model
│   │   └── payments.py        # Payment model
│   │
│   ├── schemas/                # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── scheduling.py      # Scheduling DTOs
│   │   └── common.py          # Shared schemas
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/                # API version 1
│   │       ├── __init__.py
│   │       ├── endpoints/     # API routes
│   │       │   ├── scheduling.py
│   │       │   ├── users.py
│   │       │   └── ai.py      # AI endpoints
│   │       └── dependencies.py
│   │
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── scheduling.py      # Scheduling logic
│   │   ├── notifications.py   # Email/SMS/Push
│   │   ├── ai/                # AI services
│   │   │   ├── matching.py    # Smart tutor matching
│   │   │   ├── recommendations.py
│   │   │   └── analytics.py
│   │   └── payments.py        # Payment processing
│   │
│   ├── tasks/                  # Celery background tasks
│   │   ├── __init__.py
│   │   ├── reminders.py       # Send reminders
│   │   └── analytics.py       # Generate reports
│   │
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       ├── dates.py           # Date/time helpers
│       └── validators.py      # Custom validators
│
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
│
└── tests/                      # Test suite
    ├── __init__.py
    ├── test_scheduling.py
    └── test_ai.py
```

---

## API Endpoints

### Scheduling Endpoints

#### **GET** `/api/v1/scheduling/availability/{tutor_id}`
Get tutor's availability for a date range.

**Query Parameters:**
- `start_date`: ISO date string
- `end_date`: ISO date string

**Response:**
```json
{
  "tutor_id": "uuid",
  "slots": [
    {
      "start": "2025-02-01T09:00:00Z",
      "end": "2025-02-01T10:00:00Z",
      "is_available": true
    }
  ]
}
```

#### **POST** `/api/v1/scheduling/availability`
Set tutor's weekly availability.

**Request:**
```json
{
  "tutor_id": "uuid",
  "slots": [
    {
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "17:00:00",
      "timezone": "America/New_York"
    }
  ]
}
```

#### **POST** `/api/v1/scheduling/sessions`
Book a new tutoring session.

**Request:**
```json
{
  "tutor_id": "uuid",
  "subject": "Mathematics",
  "topic": "Calculus",
  "duration_minutes": 60,
  "scheduled_start": "2025-02-01T14:00:00Z",
  "timezone": "America/New_York",
  "price_per_hour": 50
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "status": "scheduled",
  "total_price": 50.00,
  "payment_url": "https://checkout.stripe.com/..."
}
```

#### **GET** `/api/v1/scheduling/sessions/upcoming`
Get user's upcoming sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "subject": "Math",
      "scheduled_start": "2025-02-01T14:00:00Z",
      "tutor_name": "John Doe",
      "status": "confirmed"
    }
  ]
}
```

#### **PUT** `/api/v1/scheduling/sessions/{session_id}/reschedule`
Reschedule a session.

**Request:**
```json
{
  "new_start_time": "2025-02-02T15:00:00Z",
  "reason": "Schedule conflict"
}
```

#### **POST** `/api/v1/scheduling/sessions/{session_id}/cancel`
Cancel a session.

**Request:**
```json
{
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "refund_amount": 50.00,
  "refund_percentage": 100,
  "message": "Session cancelled with full refund"
}
```

---

### AI Endpoints (Future-Ready)

#### **POST** `/api/v1/ai/match-tutor`
AI-powered tutor matching.

**Request:**
```json
{
  "student_id": "uuid",
  "subject": "Mathematics",
  "grade_level": "10",
  "learning_style": "visual",
  "goals": "Improve calculus understanding",
  "budget_max": 60
}
```

**Response:**
```json
{
  "matches": [
    {
      "tutor_id": "uuid",
      "name": "Jane Smith",
      "match_score": 0.95,
      "reasons": [
        "Expert in calculus",
        "Visual teaching style",
        "Within budget",
        "95% student success rate"
      ],
      "hourly_rate": 55
    }
  ]
}
```

#### **POST** `/api/v1/ai/personalized-path`
Generate personalized learning path.

**Request:**
```json
{
  "student_id": "uuid",
  "subject": "Mathematics",
  "current_level": "Algebra II",
  "target_level": "AP Calculus",
  "timeline_weeks": 12
}
```

**Response:**
```json
{
  "path_id": "uuid",
  "milestones": [
    {
      "week": 1,
      "topics": ["Functions Review", "Graph Transformations"],
      "estimated_hours": 4
    }
  ],
  "estimated_total_cost": 600
}
```

---

## AI Integration (Ready to Use)

### OpenAI Integration

```python
# app/services/ai/matching.py

from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def match_tutor_with_ai(student_profile, tutor_pool):
    """Use GPT-4 to match students with best tutors"""

    prompt = f"""
    Student Profile:
    - Subject: {student_profile['subject']}
    - Level: {student_profile['grade_level']}
    - Learning Style: {student_profile['learning_style']}
    - Goals: {student_profile['goals']}

    Available Tutors:
    {format_tutors(tutor_pool)}

    Rank these tutors from best to worst match and explain why.
    """

    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert educational consultant."},
            {"role": "user", "content": prompt}
        ]
    )

    return parse_ai_response(response)
```

### Anthropic Claude Integration

```python
# app/services/ai/recommendations.py

from anthropic import AsyncAnthropic
from app.core.config import settings

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

async def generate_learning_path(student_data):
    """Use Claude to generate personalized learning paths"""

    message = await client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"Create a 12-week learning path for: {student_data}"
            }
        ]
    )

    return parse_learning_path(message.content)
```

---

## Background Tasks with Celery

### Setup Celery Worker

```python
# app/tasks/__init__.py

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "campuspandit",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)
```

### Send Reminders Task

```python
# app/tasks/reminders.py

from app.tasks import celery_app
from app.services.notifications import send_email, send_sms

@celery_app.task(name="send_session_reminder")
def send_session_reminder(session_id: str, user_id: str, reminder_type: str):
    """Send reminder for upcoming session"""

    session = get_session(session_id)
    user = get_user(user_id)

    # Send via preferred channels
    if user.email_enabled:
        send_email(
            to=user.email,
            subject=f"Reminder: Session in {reminder_type}",
            template="session_reminder",
            context={"session": session}
        )

    if user.sms_enabled:
        send_sms(
            to=user.phone,
            message=f"Reminder: Your session with {session.tutor_name} starts in {reminder_type}"
        )

    return {"status": "sent", "session_id": session_id}
```

### Run Celery Worker

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery worker
celery -A app.tasks worker --loglevel=info

# Terminal 3: Start Celery beat (for scheduled tasks)
celery -A app.tasks beat --loglevel=info
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/campuspandit
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./:/app

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=campuspandit
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery:
    build: .
    command: celery -A app.tasks worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/campuspandit
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

## Testing

### Run Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_scheduling.py

# Run with verbose output
pytest -v
```

### Example Test

```python
# tests/test_scheduling.py

import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_create_booking():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/scheduling/sessions",
            json={
                "tutor_id": "test-uuid",
                "subject": "Math",
                "duration_minutes": 60,
                "scheduled_start": "2025-02-01T14:00:00Z",
                "price_per_hour": 50
            }
        )

    assert response.status_code == 201
    assert response.json()["status"] == "scheduled"
```

---

## Performance Optimization

### Redis Caching

```python
# app/services/scheduling.py

import aioredis
from app.core.config import settings

redis = aioredis.from_url(settings.REDIS_URL)

async def get_tutor_availability(tutor_id: str, start_date, end_date):
    # Check cache first
    cache_key = f"availability:{tutor_id}:{start_date}:{end_date}"
    cached = await redis.get(cache_key)

    if cached:
        return json.loads(cached)

    # Fetch from database
    slots = await db_get_availability(tutor_id, start_date, end_date)

    # Cache for 5 minutes
    await redis.setex(cache_key, 300, json.dumps(slots))

    return slots
```

### Database Query Optimization

```python
# Use indexes and eager loading
from sqlalchemy import select
from sqlalchemy.orm import joinedload

async def get_sessions_with_tutors(student_id):
    stmt = (
        select(TutoringSession)
        .options(joinedload(TutoringSession.tutor))  # Eager load
        .where(TutoringSession.student_id == student_id)
        .order_by(TutoringSession.scheduled_start)
    )

    result = await db.execute(stmt)
    return result.scalars().all()
```

---

## Monitoring & Logging

### Sentry Integration

```python
# main.py

import sentry_sdk
from app.core.config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        environment=settings.ENVIRONMENT
    )
```

### Structured Logging

```python
# app/core/logging.py

from loguru import logger
import sys

logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

logger.add(
    "logs/app.log",
    rotation="500 MB",
    retention="10 days",
    level="DEBUG"
)
```

---

## Migration from Supabase Edge Functions

### What Changes?

**Before (TypeScript Edge Functions):**
```typescript
// Supabase Edge Function
supabase.functions.invoke('create-booking', {
  body: { tutorId, subject, duration }
})
```

**After (Python FastAPI):**
```typescript
// Frontend calls Python API
fetch('http://localhost:8000/api/v1/scheduling/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tutor_id, subject, duration })
})
```

### Advantages of Python Backend:

1. **AI Libraries**: Use OpenAI, Anthropic, LangChain natively
2. **Data Science**: NumPy, Pandas for analytics
3. **ML Models**: Train custom models with scikit-learn, TensorFlow
4. **Better Debugging**: Full IDE support, better error messages
5. **Celery**: Powerful background task system
6. **Easier Testing**: Pytest, mocking, async tests

---

## Next Steps

1. ✅ **Deploy backend** with Docker
2. ✅ **Update frontend** to call Python API instead of Edge Functions
3. ✅ **Add AI features** (smart matching, personalized paths)
4. ✅ **Implement background tasks** (reminders, analytics)
5. ✅ **Scale horizontally** with load balancers

---

## Support & Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **SQLAlchemy**: https://docs.sqlalchemy.org
- **Celery**: https://docs.celeryq.dev
- **OpenAI Python**: https://platform.openai.com/docs
- **Pytest**: https://docs.pytest.org

---

**Your Python backend is ready to scale with AI! 🚀🤖**

---

**Last Updated**: 2025-01-24
**Version**: 1.0.0
