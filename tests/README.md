# 🧪 CampusPandit Test Suite

Complete API and E2E test coverage for Chat and AI Matching systems.

---

## 📦 What's Included

### API Test Collections (PostQode/Postman)

✅ **Chat API Tests** - 25+ test cases
- Health checks
- Conversation CRUD
- Message send/edit/delete
- Read receipts & unread counts
- Typing indicators
- Online status
- Error handling

✅ **AI Matching API Tests** - 30+ test cases
- AI-powered tutor matching
- Profile management (tutor & student)
- Matching history & feedback
- Analytics & top tutors
- Budget/rating filters
- Error scenarios

### Environments

- **Local** - `http://localhost:8000`
- **Production** - Production API URL

---

## 🚀 Quick Start (5 minutes)

### 1. Install PostQode (VS Code Extension)

```bash
# In VS Code:
# 1. Open Extensions (Ctrl+Shift+X)
# 2. Search "PostQode"
# 3. Install
```

OR use **Postman Desktop**: https://www.postman.com/downloads/

### 2. Import Test Collections

**Using PostQode:**
1. Press `Ctrl+Shift+P`
2. Type "PostQode: Import Collection"
3. Select `tests/postman/chat-api-tests.postman_collection.json`
4. Repeat for `matching-api-tests.postman_collection.json`

**Using Postman:**
1. Click "Import"
2. Drag both `.json` files from `tests/postman/`

### 3. Import Environment

Import: `tests/postman/environments/local.postman_environment.json`

### 4. Configure Test Users

Update environment variables:

```json
{
  "student_id": "your-student-uuid",
  "tutor_id": "your-tutor-uuid"
}
```

Get IDs from Supabase:

```sql
SELECT id, email FROM users LIMIT 5;
```

### 5. Run Tests!

**Individual Test:**
1. Select a request
2. Click "Send"
3. View test results

**Full Collection:**
1. Right-click collection
2. "Run Collection"
3. View results dashboard

---

## 📊 Test Coverage

| System | Endpoints | Tests | Coverage |
|--------|-----------|-------|----------|
| Chat | 15 | 25+ | 100% |
| AI Matching | 18 | 30+ | 100% |
| **Total** | **33** | **55+** | **100%** |

---

## 🧪 Example Tests

### Chat Tests

```javascript
// Test: Send Message
pm.test('Message sent successfully', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql('success');
    pm.expect(jsonData.message_id).to.exist;
});

// Test: Unread Count
pm.test('Unread count is valid', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.total_unread).to.be.a('number');
    pm.expect(jsonData.total_unread).to.be.at.least(0);
});
```

### Matching Tests

```javascript
// Test: AI Matching
pm.test('AI returns valid matches', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.matches).to.be.an('array');

    jsonData.matches.forEach(match => {
        pm.expect(match.overall_match_percentage).to.be.at.least(0);
        pm.expect(match.overall_match_percentage).to.be.at.most(100);
    });
});

// Test: Budget Filter
pm.test('All tutors within budget', function () {
    const jsonData = pm.response.json();
    jsonData.matches.forEach(match => {
        pm.expect(match.hourly_rate).to.be.at.most(60);
    });
});
```

---

## 🔧 Command Line Testing (Newman)

Install Newman (Postman CLI):

```bash
npm install -g newman
```

Run tests:

```bash
# Chat API tests
newman run tests/postman/chat-api-tests.postman_collection.json \
  -e tests/postman/environments/local.postman_environment.json

# Matching API tests
newman run tests/postman/matching-api-tests.postman_collection.json \
  -e tests/postman/environments/local.postman_environment.json

# Both with HTML report
npm run test:api
```

---

## 📁 File Structure

```
tests/
├── README.md                          # This file
├── postman/
│   ├── chat-api-tests.postman_collection.json        # 25+ chat tests
│   ├── matching-api-tests.postman_collection.json    # 30+ matching tests
│   └── environments/
│       ├── local.postman_environment.json            # Local config
│       └── production.postman_environment.json       # Production config
└── TESTING_GUIDE.md                   # Full testing guide
```

---

## ✅ Pre-Test Checklist

Before running tests, ensure:

- [ ] Backend is running (`uvicorn main:app --reload`)
- [ ] Database migrations applied
- [ ] OpenAI API key set (for matching tests)
- [ ] Test users created (student & tutor)
- [ ] Environment variables configured

---

## 🎯 Test Scenarios

### Chat System Flow

1. ✅ Health Check
2. ✅ Create Conversation (student + tutor)
3. ✅ Send Message
4. ✅ Get Messages
5. ✅ Mark as Read
6. ✅ Check Unread Count (should be 0)
7. ✅ Set Typing Indicator
8. ✅ Update Online Status
9. ✅ Edit Message
10. ✅ Delete Message
11. ✅ Archive Conversation

### Matching System Flow

1. ✅ Health Check
2. ✅ Create Student Profile
3. ✅ Create Tutor Profile
4. ✅ Find Matching Tutors (AI-powered)
5. ✅ Verify Match Scores (0-100)
6. ✅ Check AI Reasoning
7. ✅ Mark Tutor Contacted
8. ✅ Mark Session Booked
9. ✅ Submit Feedback
10. ✅ Get Matching History
11. ✅ View Analytics

---

## 🐛 Troubleshooting

### Common Issues

**"Connection refused"**
```bash
# Start backend
cd backend
uvicorn main:app --reload
```

**"Conversation not found"**
- Run "Create Conversation" test first
- Check `conversation_id` variable is set

**"AI matching timeout"**
- Verify `OPENAI_API_KEY` in backend `.env`
- Check internet connection

**"Test variables not set"**
- Update `student_id` and `tutor_id` in environment
- Run collection in order (some tests save variables)

---

## 📚 Full Documentation

See `TESTING_GUIDE.md` for:
- Detailed test documentation
- E2E testing with Playwright
- CI/CD integration
- Best practices
- Advanced scenarios

---

## 🎉 Quick Test Commands

```bash
# Health checks only
newman run chat-api-tests.postman_collection.json \
  --folder "Health Check"

# Chat tests only
newman run chat-api-tests.postman_collection.json

# Matching tests only
newman run matching-api-tests.postman_collection.json

# All tests with report
npm run test:all
```

---

## 📊 Expected Results

After running all tests, you should see:

```
✓ Chat API Tests
  ✓ Health Check (1/1)
  ✓ Conversations (5/5)
  ✓ Messages (8/8)
  ✓ Unread Count (1/1)
  ✓ Typing Indicators (1/1)
  ✓ Online Status (3/3)
  ✓ Error Cases (3/3)

Total: 25/25 tests passed ✅

✓ Matching API Tests
  ✓ Health Check (1/1)
  ✓ Tutor Matching (5/5)
  ✓ Tutor Profiles (6/6)
  ✓ Student Profiles (2/2)
  ✓ Matching History (4/4)
  ✓ Analytics (3/3)

Total: 30/30 tests passed ✅

Overall: 55/55 tests passed 🎉
```

---

**Happy Testing! 🧪**

Your APIs are now covered with comprehensive automated tests!
