# Azure PostgreSQL Backend Integration Guide

This guide explains how to integrate your FastAPI backend with Azure PostgreSQL to support Row-Level Security (RLS) policies.

## Overview

Azure PostgreSQL doesn't have Supabase's built-in `auth.users` table and `auth.uid()` function. We've created a compatibility layer that:
- Creates an `auth` schema and `auth.users` table
- Provides an `auth.uid()` function that reads from PostgreSQL session variables
- Uses middleware to set the current user ID automatically on each request

## What Was Created

### 1. Middleware: `app/middleware/auth_context.py`

**Purpose**: Automatically sets the PostgreSQL session variable for each authenticated request.

**How it works**:
- Extracts user ID from JWT token in Authorization header
- Stores user ID in request state
- Provides `set_user_context()` function to set PostgreSQL session variable

### 2. Dependencies: `app/dependencies/auth.py`

**Purpose**: Provides FastAPI dependencies for authentication and authorization.

**Available dependencies**:
- `get_current_user` - Get authenticated user (sets RLS context)
- `get_current_verified_user` - Requires email verification
- `get_optional_user` - Returns user or None if not authenticated
- `require_role(*roles)` - Factory for role-based access control
- `require_admin` - Convenience for admin-only endpoints
- `require_tutor` - Convenience for tutor/admin endpoints
- `require_student` - Convenience for student/admin endpoints

## Integration Steps

### Step 1: Add Middleware to main.py

Add the auth context middleware to your FastAPI app:

```python
# backend/main.py
from app.middleware import AuthContextMiddleware

# Add after CORS middleware
app.add_middleware(AuthContextMiddleware)
```

**Complete example**:
```python
# After line 71 in your main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ADD THIS:
app.add_middleware(AuthContextMiddleware)
```

### Step 2: Use Dependencies in Your Endpoints

Replace manual authentication logic with the dependencies:

**Before** (manual auth):
```python
@router.get("/profile")
async def get_profile(
    db: AsyncSession = Depends(get_db)
):
    # Manual token extraction and validation
    # ...
```

**After** (with dependency):
```python
from app.dependencies import get_current_user

@router.get("/profile")
async def get_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return {
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}"
    }
```

### Step 3: Protect Endpoints with Roles

Use role-based dependencies for authorization:

```python
from app.dependencies import require_admin, require_tutor, require_role

# Admin-only endpoint
@router.get("/admin/users")
async def list_all_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Only admins can access this
    pass

# Tutor or admin endpoint
@router.get("/tutors/sessions")
async def get_tutor_sessions(
    tutor: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db)
):
    # Tutors and admins can access this
    pass

# Custom role requirement
@router.get("/moderators/content")
async def moderate_content(
    moderator: User = Depends(require_role("moderator", "admin")),
    db: AsyncSession = Depends(get_db)
):
    # Only moderators and admins can access this
    pass
```

### Step 4: Handle Optional Authentication

For endpoints that work for both authenticated and anonymous users:

```python
from app.dependencies import get_optional_user
from typing import Optional

@router.get("/posts")
async def get_posts(
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    if user:
        # Show personalized content
        return {"posts": await get_user_posts(db, user.id)}
    else:
        # Show public content
        return {"posts": await get_public_posts(db)}
```

## How RLS Works

When you use `get_current_user` dependency:

1. **JWT Token Extracted**: From Authorization header
2. **User ID Retrieved**: From token payload (`sub` claim)
3. **Session Variable Set**: `SET LOCAL app.current_user_id = 'user-uuid'`
4. **RLS Policies Apply**: PostgreSQL uses `auth.uid()` to filter data

Example RLS policy in PostgreSQL:
```sql
CREATE POLICY "Users can view their own sessions"
ON tutoring_sessions
FOR SELECT
USING (student_id = auth.uid() OR tutor_id = auth.uid());
```

This policy automatically filters rows based on the current user!

## Examples

### Example 1: Protected Endpoint with RLS

```python
from app.dependencies import get_current_user

@router.get("/sessions")
async def get_my_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # RLS is automatically applied!
    # Only returns sessions where user is student or tutor
    result = await db.execute(
        select(TutoringSession)
    )
    sessions = result.scalars().all()
    return {"sessions": sessions}
```

### Example 2: Creating Records with User Context

```python
from app.dependencies import get_current_user

@router.post("/notes")
async def create_note(
    note_data: NoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # User context is set, RLS policies will apply
    note = StudentNote(
        student_id=user.id,  # Current user
        content=note_data.content
    )
    db.add(note)
    await db.commit()
    return {"note": note}
```

### Example 3: Admin Override

```python
from app.dependencies import require_admin

@router.get("/admin/all-sessions")
async def get_all_sessions(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Admin can see all sessions
    # You might need to bypass RLS for admin views
    result = await db.execute(
        select(TutoringSession)
    )
    return {"sessions": result.scalars().all()}
```

## Testing

### Test RLS is Working

1. **Create test users** with different roles
2. **Login as User A** and create some data
3. **Login as User B** and try to access User A's data
4. **Verify** User B cannot see User A's private data

### Test Session Variable

Connect to your database and check:
```sql
-- After authentication, this should show the user ID
SHOW app.current_user_id;

-- Test auth.uid() function
SELECT auth.uid();
```

## Troubleshooting

### Issue: RLS policies not filtering data

**Solution**: Make sure middleware is added and dependency is used:
- Check `AuthContextMiddleware` is added to `main.py`
- Use `get_current_user` dependency in your endpoint
- Verify JWT token is sent in Authorization header

### Issue: "permission denied" errors

**Cause**: RLS policies are too restrictive or user context not set

**Solution**:
```python
# Verify user is authenticated
user: User = Depends(get_current_user)

# Check database logs to see if session variable is set
# Enable query logging in config.py:
DB_ECHO = True
```

### Issue: auth.uid() returns NULL

**Cause**: Session variable not set correctly

**Solution**:
1. Verify middleware is installed
2. Check JWT token is valid
3. Test manually:
```python
await db.execute("SET LOCAL app.current_user_id = 'your-user-uuid'")
result = await db.execute("SELECT auth.uid()")
print(result.scalar())  # Should print the UUID
```

## Migration Checklist

- [ ] Add `AuthContextMiddleware` to `main.py`
- [ ] Update existing endpoints to use `get_current_user`
- [ ] Replace manual role checks with `require_role()` dependencies
- [ ] Test RLS policies with different user roles
- [ ] Update API documentation
- [ ] Deploy database migration
- [ ] Update environment variables with Azure PostgreSQL connection string
- [ ] Test in staging environment
- [ ] Deploy to production

## Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate SECRET_KEY** regularly
3. **Set token expiration** appropriately (default: 30 minutes)
4. **Validate user is active** (dependency does this automatically)
5. **Use RLS policies** for all user-specific data
6. **Audit admin actions** (log all admin operations)
7. **Rate limit** authentication endpoints

## Performance Considerations

1. **Session Variable Overhead**: Minimal (~1ms per request)
2. **Database Connection**: Use connection pooling (already configured)
3. **Token Validation**: Cached in memory, very fast
4. **RLS Policy Execution**: Adds small overhead to queries, but worth the security

## Additional Resources

- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Azure PostgreSQL Best Practices](https://learn.microsoft.com/en-us/azure/postgresql/)

## Support

If you encounter issues:
1. Check the logs: `az containerapp logs show --name campuspandit-backend`
2. Verify database connection: Test `/health` endpoint
3. Check middleware order in `main.py`
4. Validate JWT token structure
5. Review PostgreSQL logs for RLS policy errors
