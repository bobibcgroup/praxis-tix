# Troubleshooting: History Not Showing on Mobile

## Diagnosis Results Summary

Based on your diagnostic output:
- ✅ **Can query table**: Yes (RLS is not blocking)
- ❌ **Has entries**: No (0 entries found)
- ⚠️ **Auth issue**: Yes (expected - you're using Clerk, not Supabase Auth)

## Root Cause

The database table is **completely empty** (0 entries). This means:
1. History was never saved to Supabase, OR
2. History exists only in localStorage (browser storage), OR  
3. History was saved under a different user_id that we can't find

## Solution Steps

### Step 1: Check Desktop Browser localStorage

On your **desktop browser** (where history works), open the browser console and run:

```javascript
// Check if history exists in localStorage
const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
console.log('History entries:', history.length);
console.log('Entries:', history);

// Check your user ID
// (Get this from Settings page or Clerk dashboard)
const userId = 'your-desktop-user-id';
const userEntries = history.filter(e => e.userId === userId);
console.log('Entries for your user:', userEntries.length);
```

### Step 2: Migrate localStorage to Supabase (if entries exist)

If you found entries in localStorage, migrate them to Supabase:

**On Desktop Browser:**
```javascript
// Replace with your actual user ID from desktop
const desktopUserId = 'user_38frUGbFevKsxV7X2bZ2HzeZTQq';
const email = 'bobwazneh@gmail.com';

// Migrate localStorage entries
const result = await window.migrateLocalStorageToSupabase(desktopUserId);
console.log('Migration result:', result);
```

**On Mobile Browser:**
```javascript
// Use your mobile user ID (should be the same)
const mobileUserId = 'user_38frUGbFevKsxV7X2bZ2HzeZTQq';
const email = 'bobwazneh@gmail.com';

// Sync data from email
const syncResult = await window.diagnoseHistory.migrateFromEmail(email, mobileUserId);
console.log('Sync result:', syncResult);
```

### Step 3: Run Full Diagnosis Again

After migration, run diagnosis again:

```javascript
window.diagnoseHistory.check('user_38frUGbFevKsxV7X2bZ2HzeZTQq', 'bobwazneh@gmail.com')
```

### Step 4: If No Entries Found Anywhere

If there are **no entries** in localStorage or database:
- You'll need to **generate new outfits** - the old history is lost
- **You do NOT need to delete your Clerk account** - your account is fine
- **You do NOT need to delete database entries** - the database is already empty

## Do You Need to Delete User?

**NO, you do NOT need to delete your Clerk user or database entries.**

The issue is that:
- Your user account is working correctly (same user_id on both devices)
- The database is accessible (RLS is not blocking)
- The problem is simply that **no history entries exist in the database**

## Prevention for Future

To prevent this issue:
1. ✅ **Run the SQL migration** (`SUPABASE_MIGRATION.sql`) to add email columns
2. ✅ **Ensure history is saved with email** - the code now does this automatically
3. ✅ **Sync runs automatically** when you sign in on a new device

## Quick Commands Reference

```javascript
// Check diagnosis
window.diagnoseHistory.check(userId, email)

// Migrate localStorage to Supabase
window.migrateLocalStorageToSupabase(userId)

// Migrate entries by email
window.diagnoseHistory.migrateFromEmail(email, userId)

// Check localStorage
JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]')
```

## Next Steps

1. **Check desktop localStorage** - see if history exists there
2. **If found, migrate it** - use the migration commands above
3. **If not found** - generate new outfits (old history is lost)
4. **Run SQL migration** - ensure email columns exist for future sync
