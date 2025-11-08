# Azure Auth Schema Reference

## Complete Auth Schema Implementation

The following auth schema components have been added to the Azure PostgreSQL migration file:

### 1. Auth Schema Definition
```sql
CREATE SCHEMA IF NOT EXISTS auth;
```

### 2. Auth Users Table
```sql
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    is_super_admin BOOLEAN DEFAULT FALSE,
    last_sign_in_at TIMESTAMPTZ
);
```

#### Column Descriptions

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PRIMARY KEY | Unique user identifier |
| email | TEXT UNIQUE NOT NULL | User email address (unique) |
| encrypted_password | TEXT | Bcrypt/Argon2 hashed password |
| email_confirmed_at | TIMESTAMPTZ | Email verification timestamp |
| created_at | TIMESTAMPTZ | Account creation time |
| updated_at | TIMESTAMPTZ | Last update time |
| raw_user_meta_data | JSONB | User profile metadata (flexible) |
| raw_app_meta_data | JSONB | Application-specific metadata |
| is_super_admin | BOOLEAN | Admin flag |
| last_sign_in_at | TIMESTAMPTZ | Last login timestamp |

### 3. Auth Users Index
```sql
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
```

Provides fast lookups by email address for login operations.

### 4. Auth UID Function
```sql
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### Function Details
- **Purpose**: Returns the current authenticated user's UUID
- **Mechanism**: Reads from session variable `app.current_user_id`
- **Return Type**: UUID (nullable)
- **Error Handling**: Returns NULL if variable not set or conversion fails
- **Stability**: Marked as STABLE for query optimization

### 5. Function Documentation
```sql
COMMENT ON FUNCTION auth.uid() IS 'Returns the current user ID from session variable app.current_user_id';
```

## Integration Examples

### Example 1: User Registration
```sql
-- Backend should execute this when user signs up
INSERT INTO auth.users (
    email,
    encrypted_password,
    raw_user_meta_data,
    email_confirmed_at
) VALUES (
    'newuser@example.com',
    'bcrypt_hashed_password_here',
    '{"name": "John Doe", "role": "student", "created_via": "web"}'::jsonb,
    NOW()
)
RETURNING id, email;
```

### Example 2: User Login
```sql
-- Backend queries to authenticate
SELECT id, email, is_super_admin
FROM auth.users
WHERE email = $1
  AND encrypted_password = $2;
```

### Example 3: Setting User Context in Backend
```sql
-- After successful authentication, set session variable
SET app.current_user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Now auth.uid() will return this value
SELECT auth.uid();  -- Returns: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### Example 4: Using auth.uid() in RLS Policy
```sql
-- Example: Users can only view their own tutor profile
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tutor_profile_select ON tutor_profiles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY tutor_profile_update ON tutor_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Now this query only returns the current user's profile
SELECT * FROM tutor_profiles;  -- Auto-filtered by RLS
```

### Example 5: Application-Wide Usage
```sql
-- Any query using auth.uid() will be protected
SELECT
    t.id,
    t.title,
    t.description
FROM tutoring_sessions t
WHERE t.tutor_id = auth.uid()  -- Only returns sessions for current user
  AND t.session_date > NOW()
ORDER BY t.session_date;
```

## Backend Integration Code

### Node.js/Express
```javascript
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'your-server.postgres.database.azure.com',
    port: 5432,
    database: 'your-database',
    user: 'your-admin-user@your-server',
    password: 'your-password'
});

// Middleware to set user context
const setUserContext = async (req, res, next) => {
    if (req.user && req.user.id) {
        try {
            await pool.query(`SET app.current_user_id = $1`, [req.user.id]);
        } catch (error) {
            console.error('Failed to set user context:', error);
        }
    }
    next();
};

app.use(setUserContext);

// Example route
app.get('/api/tutoring-sessions', async (req, res) => {
    const result = await pool.query(
        `SELECT * FROM tutoring_sessions
         WHERE tutor_id = auth.uid()
         ORDER BY session_date DESC`
    );
    res.json(result.rows);
});
```

### Python/FastAPI
```python
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user@server:password@server.postgres.database.azure.com:5432/database"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

app = FastAPI()

@app.middleware("http")
async def set_user_context(request, call_next):
    user_id = request.state.user_id  # From your auth

    if user_id:
        db = SessionLocal()
        db.execute(f"SET app.current_user_id = '{user_id}'")
        db.commit()
        db.close()

    response = await call_next(request)
    return response

@app.get("/api/tutoring-sessions")
async def get_sessions(db = Depends(get_db)):
    sessions = db.query(TutoringSession).filter(
        TutoringSession.tutor_id == text("auth.uid()")
    ).all()
    return sessions
```

### Java/Spring Boot
```java
@Component
public class AuthContextFilter implements Filter {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                        FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String userId = (String) httpRequest.getAttribute("userId");

        if (userId != null) {
            jdbcTemplate.execute(
                String.format("SET app.current_user_id = '%s'", userId)
            );
        }

        chain.doFilter(request, response);
    }
}

@GetMapping("/api/tutoring-sessions")
public List<TutoringSession> getSessions() {
    return repository.findByTutorIdEqualsAuthUid();
}
```

## Metadata Usage Examples

### Storing User Metadata
```sql
-- During registration
INSERT INTO auth.users (
    email,
    encrypted_password,
    raw_user_meta_data
) VALUES (
    'user@example.com',
    'hashed_password',
    '{
        "name": "Alice Smith",
        "role": "student",
        "subjects": ["Mathematics", "Physics"],
        "grade_level": "10",
        "preferred_language": "en",
        "profile_picture_url": "https://...",
        "created_via": "mobile_app"
    }'::jsonb
);
```

### Querying User Metadata
```sql
-- Get all mathematics tutors
SELECT id, email, raw_user_meta_data->>'name' as name
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'tutor'
  AND raw_user_meta_data->'subjects' ? 'Mathematics';

-- Get users by grade level
SELECT id, email
FROM auth.users
WHERE raw_user_meta_data->>'grade_level' = '10';

-- Update user preferences
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{preferred_language}',
    '"es"'
)
WHERE id = 'user-uuid-here';
```

## Migration Path from Supabase

### Key Differences

| Feature | Supabase | Azure PostgreSQL |
|---------|----------|-----------------|
| Auth Management | Built-in service | Custom auth.users table |
| UID Function | Automatic | Set via `auth.uid()` |
| User Context | `auth.uid()` built-in | Session variable `app.current_user_id` |
| JWT Tokens | Automatic | Manual implementation |
| Metadata | raw_user_meta_data | Same JSONB field |
| Password Hashing | Managed by Supabase | Backend responsibility |

### Migration Checklist
- [ ] Create auth.users table in Azure PostgreSQL
- [ ] Migrate user data from Supabase auth.users
- [ ] Update backend to set `app.current_user_id` session variable
- [ ] Update RLS policies to use `auth.uid()` function
- [ ] Test authentication flow
- [ ] Test RLS policies with new session variable
- [ ] Update email verification logic
- [ ] Update password reset logic
- [ ] Monitor performance and adjust indexes as needed

## Security Considerations

1. **Password Security**
   - Never store plaintext passwords
   - Use bcrypt with salt rounds >= 10
   - Consider Argon2 for better security

2. **Session Variables**
   - Only set authenticated user IDs
   - Clear after request completes
   - Validate format before setting

3. **RLS Policies**
   - Always enforce at database level
   - Test with different user IDs
   - Monitor policy violations in logs

4. **Email Verification**
   - Require email confirmation for sensitive operations
   - Use email_confirmed_at field
   - Generate secure verification tokens

5. **Data Isolation**
   - Use auth.uid() in all RLS policies
   - Test cross-user access is blocked
   - Audit access patterns

## Performance Tips

1. **Index on email** (already created)
   - Speeds up login queries
   - Used for password reset lookups

2. **JSONB indexing** (optional, add if needed)
   ```sql
   CREATE INDEX idx_users_role ON auth.users USING gin(raw_user_meta_data);
   ```

3. **Prepared statements**
   - Use parameterized queries
   - Reuse prepared statements
   - Avoid string concatenation for user IDs

4. **Connection pooling**
   - Reuse connections
   - Set context once per connection
   - Close connections properly

---

**Version**: 2.5 (Azure PostgreSQL Edition)
**Last Updated**: November 8, 2024
