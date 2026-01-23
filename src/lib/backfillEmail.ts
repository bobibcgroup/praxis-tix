/**
 * Utility to backfill email for existing database entries
 * This helps migrate existing data to include email for cross-device sync
 */

import { supabase } from './supabase';

/**
 * Backfill email for all entries belonging to a user
 * Call this when user signs in to ensure all their data has email
 */
export async function backfillEmailForUser(
  userId: string,
  email: string
): Promise<{
  historyUpdated: number;
  favoritesUpdated: number;
  profileUpdated: boolean;
  errors: string[];
}> {
  const result = {
    historyUpdated: 0,
    favoritesUpdated: 0,
    profileUpdated: false,
    errors: [] as string[],
  };

  if (!supabase || !email || !userId) {
    return result;
  }

  console.log(`🔄 Backfilling email for user ${userId}: ${email}`);

  try {
    // Update outfit_history entries missing email
    try {
      const { data: historyEntries, error: updateError } = await supabase
        .from('outfit_history')
        .update({ email })
        .eq('user_id', userId)
        .is('email', null)
        .select('id');

      if (updateError) {
        // If column doesn't exist, that's okay - it will be added on next save
        if (updateError.message?.includes('column') || updateError.code === '42703') {
          console.log('⚠️ Email column not found in outfit_history, will be added on next save');
        } else {
          console.error('Error backfilling email in outfit_history:', updateError);
          result.errors.push(`History: ${updateError.message}`);
        }
      } else {
        result.historyUpdated = historyEntries?.length || 0;
        console.log(`✅ Updated ${result.historyUpdated} history entries with email`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error backfilling history email:', err);
      result.errors.push(`History: ${errorMsg}`);
    }

    // Update favorites entries missing email
    try {
      const { data: favoriteEntries, error: updateError } = await supabase
        .from('favorites')
        .update({ email })
        .eq('user_id', userId)
        .is('email', null)
        .select('id');

      if (updateError) {
        if (updateError.message?.includes('column') || updateError.code === '42703') {
          console.log('⚠️ Email column not found in favorites, will be added on next save');
        } else {
          console.error('Error backfilling email in favorites:', updateError);
          result.errors.push(`Favorites: ${updateError.message}`);
        }
      } else {
        result.favoritesUpdated = favoriteEntries?.length || 0;
        console.log(`✅ Updated ${result.favoritesUpdated} favorites with email`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error backfilling favorites email:', err);
      result.errors.push(`Favorites: ${errorMsg}`);
    }

    // Update profile missing email
    try {
      const { data: profileEntry, error: updateError } = await supabase
        .from('profiles')
        .update({ email })
        .eq('user_id', userId)
        .is('email', null)
        .select('id')
        .single();

      if (updateError) {
        if (updateError.message?.includes('column') || updateError.code === '42703') {
          console.log('⚠️ Email column not found in profiles, will be added on next save');
        } else if (updateError.code === 'PGRST116') {
          // No profile found, that's okay
          console.log('ℹ️ No profile found to update');
        } else {
          console.error('Error backfilling email in profiles:', updateError);
          result.errors.push(`Profile: ${updateError.message}`);
        }
      } else if (profileEntry) {
        result.profileUpdated = true;
        console.log('✅ Updated profile with email');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error backfilling profile email:', err);
      result.errors.push(`Profile: ${errorMsg}`);
    }

    console.log(`✅ Backfill complete:`, result);
  } catch (err) {
    console.error('❌ Error during email backfill:', err);
    result.errors.push(`Backfill error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return result;
}
