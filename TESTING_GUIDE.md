# 🧪 CampusPandit Testing Guide

Complete guide for testing the AI Matching and Chat systems using PostQode/Postman and E2E tests.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [API Testing with PostQode/Postman](#api-testing-with-postqodepostman)
4. [Test Data](#test-data)
5. [Running Tests](#running-tests)
6. [E2E Testing](#e2e-testing)
7. [Test Coverage](#test-coverage)
8. [CI/CD Integration](#cicd-integration)

---

## Overview

### Test Collections

We have **2 comprehensive API test collections:**

1. **Chat API Tests** - `tests/postman/chat-api-tests.postman_collection.json`
   - 25+ test cases
   - Health checks
   - Conversation management
   - Message CRUD
   - Typing indicators
   - Online status
   - Error handling

2. **AI Matching API Tests** - `tests/postman/matching-api-tests.postman_collection.json`
   - 30+ test cases
   - Tutor matching
   - Profile management
   - Matching history
   - Analytics
   - Feedback system

### Test Environments

- **Local** - `tests/postman/environments/local.postman_environment.json`
- **Production** - `tests/postman/environments/production.postman_environment.json`

---

## Setup

### Prerequisites

- **PostQode Extension** (VS Code) OR **Postman Desktop**
- Backend running on `http://localhost:8000`
- Database migrations applied
- Test user accounts (student & tutor)

### 1. Import Collections into PostQode/Postman

#### Using PostQode (VS Code):

1. Install PostQode extension
2. Open Command Palette (`Ctrl+Shift+P`)
3. Select "PostQode: Import Collection"
4. Select `tests/postman/chat-api-tests.postman_collection.json`
5. Repeat for `matching-api-tests.postman_collection.json`

#### Using Postman:

1. Open Postman
2. Click "Import" button
3. Drag and drop both collection files:
   - `chat-api-tests.postman_collection.json`
   - `matching-api-tests.postman_collection.json`

### 2. Import Environment

1. Import environment file:
   - For local: `tests/postman/environments/local.postman_environment.json`
   - For production: `tests/postman/environments/production.postman_environment.json`

2. Select the environment from dropdown

### 3. Configure Test Users

Update environment variables:

```json
{
  "student_id": "your-student-uuid-here",
  "tutor_id": "your-tutor-uuid-here"
}
```

To get test user IDs:

```sql
-- Run in Supabase SQL Editor
SELECT id, email FROM users LIMIT 5;
```

---

## API Testing with PostQode/Postman

### Running Individual Tests

1. Select a collection (Chat or Matching)
2. Select a request
3. Click "Send"
4. View response and test results

### Running Full Collection

#### PostQode:
1. Right-click on collection
2. Select "Run Collection"
3. View test results

#### Postman:
1. Click collection → "Run"
2. Click "Run CampusPandit..."
3. View test results dashboard

### Test Results

Each test validates:
- ✅ **Status codes** (200, 201, 404, etc.)
- ✅ **Response structure** (has required fields)
- ✅ **Data types** (strings, numbers, arrays)
- ✅ **Business logic** (match scores 0-100, budget filters work)
- ✅ **Response times** (< 500ms for most, < 5s for AI matching)

---

## Test Data

### Sample Test Data

#### Create Test Student

```bash
curl -X POST http://localhost:8000/api/v1/matching/students/profile?user_id=STUDENT_UUID \
  -H "Content-Type: application/json" \
  -d '{
    "grade_level": "10",
    "learning_style": "visual",
    "learning_pace": "moderate",
    "primary_goals": ["improve grades", "prepare for SAT"],
    "target_subjects": ["Mathematics"],
    "budget_per_hour": 60
  }'
```

#### Create Test Tutor

```bash
curl -X POST http://localhost:8000/api/v1/matching/tutors/profile?user_id=TUTOR_UUID \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Experienced math tutor...",
    "headline": "Expert Math Tutor",
    "years_experience": 5,
    "education_level": "master",
    "subjects": ["Mathematics"],
    "specializations": ["AP Calculus"],
    "grade_levels": ["9-10", "11-12"],
    "teaching_style": "patient",
    "hourly_rate_min": 40,
    "hourly_rate_max": 60
  }'
```

---

## Running Tests

### Test Workflow

**Chat System Tests:**

1. **Health Check** → Verify service is running
2. **Create Conversation** → Student + Tutor conversation
3. **Send Messages** → Test message sending
4. **Mark as Read** → Test read receipts
5. **Get Unread Count** → Verify badge counts
6. **Typing Indicators** → Test real-time features
7. **Online Status** → Test presence system

**Matching System Tests:**

1. **Health Check** → Verify AI service
2. **Create Profiles** → Student and tutor profiles
3. **Find Matches** → Test AI matching algorithm
4. **Quick Match** → Test anonymous matching
5. **Get History** → Verify match logging
6. **Submit Feedback** → Test feedback system
7. **Analytics** → Verify metrics

### Expected Results

**Chat Tests:**
```
✓ 25/25 tests passed
✓ All status codes correct
✓ All response structures valid
✓ Response times < 500ms
```

**Matching Tests:**
```
✓ 30/30 tests passed
✓ AI matching returns valid scores
✓ Filters work correctly
✓ Response times < 5s
```

---

## E2E Testing

### Playwright E2E Tests

End-to-end tests for full user flows.

#### Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

#### Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/chat.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI
npx playwright test --ui
```

### E2E Test Scenarios

**Chat E2E Flow:**

1. Student logs in
2. Finds tutor via matching
3. Clicks "Message Tutor"
4. Conversation created
5. Sends message
6. Message appears in real-time
7. Tutor receives notification
8. Tutor responds
9. Read receipts update

**Matching E2E Flow:**

1. Student logs in
2. Navigates to "Find Tutor"
3. Fills matching form (subject, budget, etc.)
4. Clicks "Find My Perfect Tutor"
5. AI matches load
6. Views top match details
7. Sees AI reasoning
8. Clicks "Contact Tutor"
9. Redirects to chat

---

## Test Coverage

### API Test Coverage

| Feature | Endpoint Coverage | Test Cases | Status |
|---------|------------------|------------|--------|
| **Chat System** | 15/15 endpoints | 25 tests | ✅ Complete |
| **AI Matching** | 18/18 endpoints | 30 tests | ✅ Complete |
| **Total** | 33 endpoints | 55+ tests | ✅ 100% |

### Feature Coverage

**Chat:**
- ✅ Conversation CRUD
- ✅ Message send/edit/delete
- ✅ Read receipts
- ✅ Unread counts
- ✅ Typing indicators
- ✅ Online status
- ✅ Error handling

**Matching:**
- ✅ Full matching
- ✅ Quick match
- ✅ Profile management
- ✅ Match history
- ✅ Feedback system
- ✅ Analytics
- ✅ Filtering

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/api-tests.yml`:

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Start backend
        run: |
          cd backend
          uvicorn main:app --host 0.0.0.0 --port 8000 &
          sleep 10

      - name: Install Newman (Postman CLI)
        run: npm install -g newman

      - name: Run Chat API Tests
        run: |
          newman run tests/postman/chat-api-tests.postman_collection.json \
            -e tests/postman/environments/local.postman_environment.json \
            --reporters cli,json \
            --reporter-json-export test-results/chat-results.json

      - name: Run Matching API Tests
        run: |
          newman run tests/postman/matching-api-tests.postman_collection.json \
            -e tests/postman/environments/local.postman_environment.json \
            --reporters cli,json \
            --reporter-json-export test-results/matching-results.json

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Run Tests Locally with Newman

```bash
# Install Newman
npm install -g newman

# Run Chat tests
newman run tests/postman/chat-api-tests.postman_collection.json \
  -e tests/postman/environments/local.postman_environment.json

# Run Matching tests
newman run tests/postman/matching-api-tests.postman_collection.json \
  -e tests/postman/environments/local.postman_environment.json

# Generate HTML report
newman run tests/postman/chat-api-tests.postman_collection.json \
  -e tests/postman/environments/local.postman_environment.json \
  --reporters htmlextra \
  --reporter-htmlextra-export test-results/chat-report.html
```

---

## Troubleshooting

### Common Issues

**❌ "Connection refused"**
- Backend not running
- Run: `cd backend && uvicorn main:app --reload`

**❌ "404 Not Found"**
- Check `base_url` in environment
- Verify endpoint path is correct

**❌ "Conversation not found"**
- Create conversation first
- Check `conversation_id` variable is set

**❌ "AI matching timeout"**
- OpenAI API key not set
- Check `OPENAI_API_KEY` in backend `.env`
- Network timeout - increase request timeout

**❌ "Test failed: Status code 422"**
- Request body validation failed
- Check required fields
- Verify data types (UUIDs, numbers, etc.)

### Debug Mode

Enable detailed logging:

**PostQode:**
- Settings → PostQode → Enable Debug Logging

**Postman:**
- Console → Show Postman Console
- View request/response details

**Backend:**
```bash
# Enable debug mode
cd backend
DEBUG=true uvicorn main:app --reload --log-level debug
```

---

## Best Practices

### Writing Tests

1. **Test Independence** - Each test should be self-contained
2. **Use Variables** - Save IDs for reuse (`pm.collectionVariables.set`)
3. **Clear Assertions** - Test one thing per assertion
4. **Error Cases** - Test both success and failure paths
5. **Performance** - Check response times

### Test Organization

```
tests/
├── postman/
│   ├── chat-api-tests.postman_collection.json
│   ├── matching-api-tests.postman_collection.json
│   └── environments/
│       ├── local.postman_environment.json
│       └── production.postman_environment.json
├── e2e/
│   ├── chat.spec.ts
│   └── matching.spec.ts
└── fixtures/
    ├── users.json
    └── conversations.json
```

---

## Quick Start Checklist

- [ ] Install PostQode extension or Postman
- [ ] Import both test collections
- [ ] Import local environment
- [ ] Update student_id and tutor_id variables
- [ ] Start backend server
- [ ] Run health check tests
- [ ] Run full chat collection
- [ ] Run full matching collection
- [ ] Verify all tests pass ✅

---

## Resources

- **PostQode**: https://marketplace.visualstudio.com/items?itemName=postqode
- **Postman**: https://www.postman.com/downloads/
- **Newman CLI**: https://www.npmjs.com/package/newman
- **Playwright**: https://playwright.dev/

---

**🎉 Happy Testing!**

All your API endpoints are thoroughly tested with 55+ automated test cases.
