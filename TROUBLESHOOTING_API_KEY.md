# Troubleshooting: "No API key found" Error

## Error Message
```
{"message":"No API key found in request","hint":"No `apikey` request header or url param was found."}
```

## Root Causes & Solutions

### 1. Development Server Not Restarted
**Issue**: Vite doesn't hot-reload environment variables.

**Solution**: Restart your dev server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# or
yarn dev
```

### 2. Check Environment Variables Are Loaded
Create a test file to verify env vars are loaded:

```typescript
// src/utils/checkEnv.ts
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
```

Import this in your main App file temporarily to verify.

### 3. Authentication Issue
**Issue**: User is not authenticated, session expired, or auth token is invalid.

**Solution**: Check authentication status:
```typescript
// In your component or console
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

If no session, redirect to login or sign in again.

### 4. Supabase Client Configuration
Verify your Supabase client is properly initialized in browser DevTools:

```javascript
// In browser console:
console.log(window.__supabase || 'Supabase client not in window');
```

### 5. Check Network Request Headers
Open DevTools → Network tab → Find the failed request → Check Headers:

**Should have:**
```
apikey: your-anon-key
Authorization: Bearer your-jwt-token (if authenticated)
```

**If missing**, the Supabase client isn't configured correctly.

### 6. Verify Supabase Project URL
Make sure the URL in `.env.local` matches your actual Supabase project:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-actual-anon-key"
```

Get these from: Supabase Dashboard → Project Settings → API

### 7. Clear Browser Cache & Storage
Sometimes cached data causes issues:

```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 8. Check Row Level Security Policies
If the API key IS being sent but queries still fail, check RLS policies:

```sql
-- Check if policies allow your user to SELECT
SELECT * FROM crm_contacts LIMIT 1;
```

If you get permission denied, run the RLS policy fixes:
- `fix_all_crm_foreign_keys.sql`
- `fix_crm_insert_update_policies.sql`

## Quick Diagnostic Checklist

- [ ] Restart dev server
- [ ] Check browser console for errors
- [ ] Verify env vars are loaded (`console.log(import.meta.env)`)
- [ ] Check authentication status (`supabase.auth.getSession()`)
- [ ] Inspect network request headers (DevTools → Network)
- [ ] Verify Supabase project URL is correct
- [ ] Clear browser localStorage/sessionStorage
- [ ] Check RLS policies are set up correctly
- [ ] Reload PostgREST schema cache

## Still Not Working?

Check the Supabase client initialization:

```typescript
// src/utils/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'campuspandit-auth-storage'
  }
});
```

## Common Mistakes

1. ❌ Using `.env` instead of `.env.local` for local development
2. ❌ Forgetting to prefix with `VITE_` (required for Vite)
3. ❌ Not restarting dev server after changing env vars
4. ❌ Using production URL in development
5. ❌ Expired or invalid JWT token
