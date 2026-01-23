/**
 * Diagnostic utility to help debug history loading issues
 */

import { supabase } from './supabase';
import { getOutfitHistory } from './userService';

/**
 * Comprehensive diagnosis of why history might not be loading
 */
export async function diagnoseHistoryIssue(
  userId: string,
  email?: string
): Promise<{
  canQueryTable: boolean;
  hasEntries: boolean;
  entryCount: number;
  rlsIssue: boolean;
  authIssue: boolean;
  errors: string[];
  recommendations: string[];
}> {
  const result = {
    canQueryTable: false,
    hasEntries: false,
    entryCount: 0,
    rlsIssue: false,
    authIssue: false,
    errors: [] as string[],
    recommendations: [] as string[],
  };

  if (!supabase) {
    result.errors.push('Supabase not configured');
    result.recommendations.push('Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
    return result;
  }

  console.log('🔍 Diagnosing history loading issue...');
  console.log('   User ID:', userId);
  console.log('   Email:', email || 'not provided');

  // Test 1: Can we query the table at all?
  try {
    // Query without limit to get ALL entries (to find entries under different user_ids)
    const { data: testData, error: testError } = await supabase
      .from('outfit_history')
      .select('id, user_id, email');

    if (testError) {
      result.rlsIssue = true;
      result.errors.push(`Cannot query table: ${testError.message} (code: ${testError.code})`);
      
      if (testError.code === '42501' || testError.message?.includes('permission') || testError.message?.includes('RLS')) {
        result.recommendations.push('RLS policy is blocking access. Check Supabase RLS policies for outfit_history table.');
        result.recommendations.push('RLS policy should allow: SELECT WHERE user_id = current_setting(\'app.user_id\')::text');
        result.recommendations.push('Or disable RLS temporarily to test: ALTER TABLE outfit_history DISABLE ROW LEVEL SECURITY;');
      }
    } else {
      result.canQueryTable = true;
      result.entryCount = testData?.length || 0;
      console.log(`   ✅ Can query table, found ${result.entryCount} total entries in database`);
      
      if (testData && testData.length > 0) {
        const userIds = [...new Set(testData.map(r => r.user_id))];
        console.log(`   Found ${userIds.length} unique user_ids in table:`, userIds);
        
        // Check if any entries match current user_id
        const entriesForCurrentUser = testData.filter(r => r.user_id === userId);
        console.log(`   Entries for current user_id: ${entriesForCurrentUser.length}`);
        
        // Check if any entries match email
        if (email) {
          const entriesForEmail = testData.filter(r => r.email === email);
          console.log(`   Entries for email ${email}: ${entriesForEmail.length}`);
          
          if (entriesForEmail.length > 0) {
            const emailUserIds = [...new Set(entriesForEmail.map(r => r.user_id))];
            console.log(`   ⚠️ Found ${entriesForEmail.length} entries with email but different user_ids:`, emailUserIds);
            result.recommendations.push(`Found ${entriesForEmail.length} entries with your email but different user_ids. Run sync to migrate.`);
            result.recommendations.push(`Run: window.migrateHistoryFromEmail('${email}', '${userId}')`);
          }
        }
        
        if (!userIds.includes(userId) && testData.length > 0) {
          result.recommendations.push(`Table has ${testData.length} entries but none for user_id ${userId}. Data may be under different user_ids.`);
        }
      } else {
        console.log('   ⚠️ Table is empty - checking localStorage...');
        // Check localStorage
        try {
          const localStorageHistory = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
          if (localStorageHistory.length > 0) {
            const userEntries = localStorageHistory.filter((e: any) => e.userId === userId);
            console.log(`   📦 Found ${localStorageHistory.length} entries in localStorage (${userEntries.length} for current user)`);
            result.recommendations.push(`Found ${localStorageHistory.length} entries in localStorage. Run migration to save to Supabase.`);
            result.recommendations.push(`Run: window.migrateLocalStorageToSupabase('${userId}')`);
          }
        } catch (e) {
          console.log('   Could not check localStorage:', e);
        }
      }
    }
  } catch (err) {
    result.errors.push(`Test query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Test 2: Query by user_id
  try {
    const { data: userData, error: userError } = await supabase
      .from('outfit_history')
      .select('id, user_id, email')
      .eq('user_id', userId)
      .limit(10);

    if (userError) {
      result.errors.push(`Query by user_id failed: ${userError.message} (code: ${userError.code})`);
    } else {
      result.hasEntries = (userData?.length || 0) > 0;
      console.log(`   Query by user_id: ${userData?.length || 0} entries`);
      
      if (userData && userData.length > 0) {
        console.log('   Sample entries:', userData.slice(0, 3).map(e => ({
          id: e.id,
          user_id: e.user_id,
          hasEmail: !!e.email
        })));
      }
    }
  } catch (err) {
    result.errors.push(`User ID query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Test 3: Query by email (if available)
  if (email) {
    try {
      const { data: emailData, error: emailError } = await supabase
        .from('outfit_history')
        .select('id, user_id, email')
        .eq('email', email)
        .limit(10);

      if (emailError) {
        if (emailError.message?.includes('column') || emailError.code === '42703') {
          result.recommendations.push('Email column does not exist in database. Run migration to add it.');
        } else {
          result.errors.push(`Query by email failed: ${emailError.message}`);
        }
      } else {
        console.log(`   Query by email: ${emailData?.length || 0} entries`);
        
        if (emailData && emailData.length > 0) {
          const emailUserIds = [...new Set(emailData.map(r => r.user_id))];
          console.log(`   Found user_ids for email:`, emailUserIds);
          
          if (!emailUserIds.includes(userId)) {
            result.recommendations.push(`Found ${emailData.length} entries for email but with different user_ids. Run sync to migrate.`);
          }
        }
      }
    } catch (err) {
      // Email column might not exist, that's okay
      console.log('   Email query not available (column might not exist)');
    }
  }

  // Test 4: Check auth session
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      result.authIssue = true;
      result.errors.push(`Auth session error: ${authError.message}`);
      result.recommendations.push('Supabase auth is not configured. Since you\'re using Clerk, RLS policies need to be adjusted.');
    } else {
      console.log('   Auth session:', authData?.session ? 'exists' : 'missing');
      if (!authData?.session) {
        result.authIssue = true;
        result.recommendations.push('No Supabase auth session. RLS policies requiring auth.uid() will fail.');
        result.recommendations.push('Consider updating RLS to use user_id directly instead of auth.uid()');
      }
    }
  } catch (err) {
    console.log('   Auth check failed (expected if using Clerk)');
  }

  // Test 5: Check localStorage for entries
  try {
    const localStorageHistory = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    if (localStorageHistory.length > 0) {
      const userEntries = localStorageHistory.filter((e: any) => e.userId === userId);
      const allEntries = localStorageHistory.length;
      console.log(`   📦 Found ${allEntries} entries in localStorage (${userEntries.length} for current user)`);
      
      if (userEntries.length > 0) {
        result.recommendations.push(`Found ${userEntries.length} entries in localStorage. Migrate to Supabase.`);
        result.recommendations.push(`Run: window.migrateLocalStorageToSupabase('${userId}')`);
      } else if (allEntries > 0) {
        result.recommendations.push(`Found ${allEntries} entries in localStorage but none for current user_id.`);
        result.recommendations.push(`Check localStorage: JSON.parse(localStorage.getItem('praxis_outfit_history'))`);
      }
    }
  } catch (e) {
    console.log('   Could not check localStorage:', e);
  }

  // Final recommendation
  if (result.rlsIssue && !result.hasEntries) {
    result.recommendations.push('Try running: window.diagnoseHistory.check(userId, email) in browser console for detailed diagnosis');
  }
  
  // If no entries found anywhere, suggest checking if data exists elsewhere
  if (!result.hasEntries && result.entryCount === 0) {
    result.recommendations.push('No entries found in database. Check if history was saved to localStorage or if you need to generate new outfits.');
    result.recommendations.push('If you had history before, it may have been saved under a different user_id. Check desktop browser.');
  }

  console.log('✅ Diagnosis complete:', result);
  return result;
}

/**
 * Find and migrate all history entries for an email to a specific user_id
 * This helps when entries exist but are under different user_ids
 */
export async function migrateHistoryFromEmail(
  email: string,
  targetUserId: string
): Promise<{
  found: number;
  migrated: number;
  errors: string[];
}> {
  const result = {
    found: 0,
    migrated: 0,
    errors: [] as string[],
  };

  if (!supabase) {
    result.errors.push('Supabase not configured');
    return result;
  }

  console.log(`🔄 Migrating history for email ${email} to user_id ${targetUserId}`);

  try {
    // First, try to find entries by email
    const { data: emailEntries, error: emailError } = await supabase
      .from('outfit_history')
      .select('*')
      .eq('email', email);

    if (!emailError && emailEntries) {
      result.found = emailEntries.length;
      console.log(`   Found ${emailEntries.length} entries with email ${email}`);

      // Migrate each entry
      for (const entry of emailEntries) {
        if (entry.user_id === targetUserId) {
          console.log(`   ⏭️  Entry already belongs to target user, skipping`);
          continue;
        }

        try {
          // Check if entry already exists for target user
          const { data: existing } = await supabase
            .from('outfit_history')
            .select('id')
            .eq('user_id', targetUserId)
            .eq('outfit_id', entry.outfit_id)
            .eq('selected_at', entry.selected_at)
            .limit(1);

          if (existing && existing.length > 0) {
            console.log(`   ⏭️  Entry already exists for target user, skipping`);
            continue;
          }

          // Insert entry with new user_id
          const { error: insertError } = await supabase
            .from('outfit_history')
            .insert({
              user_id: targetUserId,
              outfit_id: entry.outfit_id,
              occasion: entry.occasion,
              outfit_data: entry.outfit_data,
              try_on_image_url: entry.try_on_image_url,
              animated_video_url: entry.animated_video_url,
              selected_at: entry.selected_at,
              style_name: entry.style_name,
              email: email, // Ensure email is set
            });

          if (insertError) {
            console.error(`   ❌ Failed to migrate entry ${entry.id}:`, insertError);
            result.errors.push(`Entry ${entry.id}: ${insertError.message}`);
          } else {
            console.log(`   ✅ Migrated entry ${entry.id}`);
            result.migrated++;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error(`   ❌ Error migrating entry ${entry.id}:`, err);
          result.errors.push(`Entry ${entry.id}: ${errorMsg}`);
        }
      }
    } else if (emailError) {
      if (emailError.message?.includes('column') || emailError.code === '42703') {
        console.log('   ⚠️ Email column does not exist yet');
        result.errors.push('Email column does not exist. Run SQL migration first.');
      } else {
        console.error('   ❌ Error querying by email:', emailError);
        result.errors.push(`Query error: ${emailError.message}`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Error in migrateHistoryFromEmail:', err);
    result.errors.push(errorMsg);
  }

  console.log(`✅ Migration complete: ${result.migrated} migrated, ${result.errors.length} errors`);
  return result;
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).diagnoseHistory = {
    check: diagnoseHistoryIssue,
    migrateFromEmail: migrateHistoryFromEmail,
  };
  
  // Note: migrateLocalStorageToSupabase is exposed by migrateLocalStorage.ts
  // No need to expose it here to avoid conflicts
}
