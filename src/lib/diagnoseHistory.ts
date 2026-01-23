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
    const { data: testData, error: testError } = await supabase
      .from('outfit_history')
      .select('id, user_id')
      .limit(5);

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
      console.log(`   ✅ Can query table, found ${result.entryCount} total entries`);
      
      if (testData && testData.length > 0) {
        const userIds = [...new Set(testData.map(r => r.user_id))];
        console.log(`   Found user_ids in table:`, userIds);
        
        if (!userIds.includes(userId)) {
          result.rlsIssue = true;
          result.recommendations.push(`Table has entries but none for user_id ${userId}. Possible RLS filtering issue.`);
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

  // Final recommendation
  if (result.rlsIssue && !result.hasEntries) {
    result.recommendations.push('Try running: window.diagnoseHistory.check(userId, email) in browser console for detailed diagnosis');
  }

  console.log('✅ Diagnosis complete:', result);
  return result;
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).diagnoseHistory = {
    check: diagnoseHistoryIssue,
  };
}
