/**
 * User sync service to handle data migration when same email signs in with different user ID
 * This happens when users sign in on different devices or with different auth methods
 */

import { supabase } from './supabase';
import { getOutfitHistory, getFavorites, getUserProfile } from './userService';
import { saveOutfitToHistory, addToFavorites, saveUserProfile } from './userService';
import { backfillEmailForUser } from './backfillEmail';
import type { OutfitHistoryEntry } from './userService';

const EMAIL_USER_MAPPING_KEY = 'praxis_email_user_mapping';

interface EmailUserMapping {
  email: string;
  userIds: string[];
  lastSynced: string;
}

/**
 * Get all user IDs associated with an email from localStorage
 */
function getEmailUserMapping(email: string): EmailUserMapping | null {
  try {
    const mappings = JSON.parse(localStorage.getItem(EMAIL_USER_MAPPING_KEY) || '{}');
    return mappings[email] || null;
  } catch {
    return null;
  }
}

/**
 * Store user ID mapping for an email
 */
function setEmailUserMapping(email: string, userId: string): void {
  try {
    const mappings = JSON.parse(localStorage.getItem(EMAIL_USER_MAPPING_KEY) || '{}');
    if (!mappings[email]) {
      mappings[email] = {
        email,
        userIds: [],
        lastSynced: new Date().toISOString(),
      };
    }
    
    // Add userId if not already present
    if (!mappings[email].userIds.includes(userId)) {
      mappings[email].userIds.push(userId);
    }
    
    mappings[email].lastSynced = new Date().toISOString();
    localStorage.setItem(EMAIL_USER_MAPPING_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error('Error storing email-user mapping:', error);
  }
}

/**
 * Migrate data from old user ID to new user ID
 */
async function migrateUserData(
  fromUserId: string,
  toUserId: string,
  email: string
): Promise<{
  historyMigrated: number;
  favoritesMigrated: number;
  profileMigrated: boolean;
  errors: string[];
}> {
  const result = {
    historyMigrated: 0,
    favoritesMigrated: 0,
    profileMigrated: false,
    errors: [] as string[],
  };

  console.log(`🔄 Migrating data from user ${fromUserId} to ${toUserId} for email ${email}`);

  if (!supabase) {
    console.warn('Supabase not configured, cannot migrate data');
    return result;
  }

  try {
    // Migrate outfit history
    try {
      const { data: historyEntries, error: historyError } = await supabase
        .from('outfit_history')
        .select('*')
        .eq('user_id', fromUserId);

      if (historyError) {
        console.error('Error fetching history for migration:', historyError);
        result.errors.push(`History fetch error: ${historyError.message}`);
      } else if (historyEntries && historyEntries.length > 0) {
        console.log(`📦 Found ${historyEntries.length} history entries to migrate`);

        for (const entry of historyEntries) {
          try {
            // Check if entry already exists for new user (by outfit_id + selected_at)
            const { data: existing } = await supabase
              .from('outfit_history')
              .select('id')
              .eq('user_id', toUserId)
              .eq('outfit_id', entry.outfit_id)
              .eq('selected_at', entry.selected_at)
              .limit(1);

            if (existing && existing.length > 0) {
              console.log(`   ⏭️  Entry already exists for new user, skipping: ${entry.id}`);
              continue;
            }

            // Insert entry with new user_id and email
            const insertData: any = {
              user_id: toUserId,
              outfit_id: entry.outfit_id,
              occasion: entry.occasion,
              outfit_data: entry.outfit_data,
              try_on_image_url: entry.try_on_image_url,
              animated_video_url: entry.animated_video_url,
              selected_at: entry.selected_at,
              style_name: entry.style_name,
            };
            
            // Include email if it exists in the original entry
            if (entry.email) {
              insertData.email = entry.email;
            }
            
            const { error: insertError } = await supabase
              .from('outfit_history')
              .insert(insertData);

            if (insertError) {
              console.error(`   ❌ Failed to migrate history entry ${entry.id}:`, insertError);
              result.errors.push(`History entry ${entry.id}: ${insertError.message}`);
            } else {
              result.historyMigrated++;
              console.log(`   ✅ Migrated history entry ${entry.id}`);
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            console.error(`   ❌ Error migrating history entry ${entry.id}:`, err);
            result.errors.push(`History entry ${entry.id}: ${errorMsg}`);
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error during history migration:', err);
      result.errors.push(`History migration: ${errorMsg}`);
    }

    // Migrate favorites
    try {
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('outfit_id')
        .eq('user_id', fromUserId);

      if (favoritesError) {
        console.error('Error fetching favorites for migration:', favoritesError);
        result.errors.push(`Favorites fetch error: ${favoritesError.message}`);
      } else if (favorites && favorites.length > 0) {
        console.log(`📦 Found ${favorites.length} favorites to migrate`);

        for (const fav of favorites) {
          try {
            // Check if favorite already exists
            const { data: existing } = await supabase
              .from('favorites')
              .select('id')
              .eq('user_id', toUserId)
              .eq('outfit_id', fav.outfit_id)
              .limit(1);

            if (existing && existing.length > 0) {
              continue; // Already favorited
            }

            // Add favorite for new user with email
            const insertData: any = {
              user_id: toUserId,
              outfit_id: fav.outfit_id,
            };
            
            // Include email if available
            if (email) {
              insertData.email = email;
            }
            
            const { error: insertError } = await supabase
              .from('favorites')
              .insert(insertData);

            if (insertError) {
              console.error(`   ❌ Failed to migrate favorite ${fav.outfit_id}:`, insertError);
              result.errors.push(`Favorite ${fav.outfit_id}: ${insertError.message}`);
            } else {
              result.favoritesMigrated++;
              console.log(`   ✅ Migrated favorite ${fav.outfit_id}`);
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            console.error(`   ❌ Error migrating favorite ${fav.outfit_id}:`, err);
            result.errors.push(`Favorite ${fav.outfit_id}: ${errorMsg}`);
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error during favorites migration:', err);
      result.errors.push(`Favorites migration: ${errorMsg}`);
    }

    // Migrate profile (merge if both exist, prefer newer)
    try {
      const { data: oldProfile, error: oldProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', fromUserId)
        .single();

      if (!oldProfileError && oldProfile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', toUserId)
          .single();

        // Merge profiles - prefer newer data, but keep styleDNA from old if new doesn't have it
        const mergedProfile: any = {
          style_dna: newProfile?.style_dna || oldProfile.style_dna,
          fit_calibration: newProfile?.fit_calibration || oldProfile.fit_calibration,
          lifestyle: newProfile?.lifestyle || oldProfile.lifestyle,
          updated_at: new Date().toISOString(),
        };
        
        // Include email
        if (email) {
          mergedProfile.email = email;
        }

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            user_id: toUserId,
            ...mergedProfile,
          }, {
            onConflict: 'user_id',
          });

        if (upsertError) {
          console.error('Error migrating profile:', upsertError);
          result.errors.push(`Profile migration: ${upsertError.message}`);
        } else {
          result.profileMigrated = true;
          console.log('✅ Migrated profile');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error during profile migration:', err);
      result.errors.push(`Profile migration: ${errorMsg}`);
    }

    console.log(`✅ Migration complete:`, result);
  } catch (err) {
    console.error('❌ Error during user data migration:', err);
    result.errors.push(`Migration error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return result;
}

// Track sync attempts to avoid duplicate runs
const syncAttempts = new Map<string, { lastAttempt: number; inProgress: boolean }>();

/**
 * Sync user data when user signs in
 * Checks if there's existing data for this email with a different user ID and migrates it
 */
export async function syncUserDataOnSignIn(
  userId: string,
  email: string
): Promise<{
  synced: boolean;
  migrated: boolean;
  historyMigrated: number;
  favoritesMigrated: number;
  profileMigrated: boolean;
  errors: string[];
}> {
  const result = {
    synced: false,
    migrated: false,
    historyMigrated: 0,
    favoritesMigrated: 0,
    profileMigrated: false,
    errors: [] as string[],
  };

  if (!email || !userId) {
    console.warn('⚠️ Cannot sync: missing email or userId');
    return result;
  }

  // Check if we've already synced recently (within last 5 minutes)
  const syncKey = `${email}_${userId}`;
  const lastSync = syncAttempts.get(syncKey);
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (lastSync) {
    if (lastSync.inProgress) {
      console.log('⏳ Sync already in progress for this user, skipping');
      return result;
    }
    if (now - lastSync.lastAttempt < fiveMinutes) {
      console.log('⏭️  Sync attempted recently, skipping');
      return result;
    }
  }

  // Mark sync as in progress
  syncAttempts.set(syncKey, { lastAttempt: now, inProgress: true });

  console.log(`🔄 Syncing user data for email: ${email}, userId: ${userId}`);

  // Query database for all user_ids with this email (best approach for cross-device sync)
  let previousUserIds: string[] = [];
  
  if (supabase) {
    try {
      // Query outfit_history for user_ids with this email
      // Handle case where email column might not exist yet (backward compatibility)
      const { data: historyUsers, error: historyError } = await supabase
        .from('outfit_history')
        .select('user_id')
        .eq('email', email)
        .neq('user_id', userId);
      
      if (historyError) {
        // If error is about column not existing, fall back to localStorage
        if (historyError.message?.includes('column') || historyError.code === '42703') {
          console.log('⚠️ Email column not found in outfit_history, using localStorage fallback');
        } else {
          console.error('Error querying outfit_history by email:', historyError);
        }
      } else if (historyUsers) {
        const uniqueIds = [...new Set(historyUsers.map(r => r.user_id))];
        previousUserIds.push(...uniqueIds);
        console.log(`📦 Found ${uniqueIds.length} user IDs in outfit_history with email ${email}`);
      }
      
      // Query profiles for user_ids with this email
      const { data: profileUsers, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .neq('user_id', userId);
      
      if (profileError) {
        if (profileError.message?.includes('column') || profileError.code === '42703') {
          console.log('⚠️ Email column not found in profiles, using localStorage fallback');
        } else {
          console.error('Error querying profiles by email:', profileError);
        }
      } else if (profileUsers) {
        const uniqueIds = [...new Set(profileUsers.map(r => r.user_id))];
        uniqueIds.forEach(id => {
          if (!previousUserIds.includes(id)) {
            previousUserIds.push(id);
          }
        });
        console.log(`📦 Found ${uniqueIds.length} user IDs in profiles with email ${email}`);
      }
      
      // Query favorites for user_ids with this email
      const { data: favoriteUsers, error: favoriteError } = await supabase
        .from('favorites')
        .select('user_id')
        .eq('email', email)
        .neq('user_id', userId);
      
      if (favoriteError) {
        if (favoriteError.message?.includes('column') || favoriteError.code === '42703') {
          console.log('⚠️ Email column not found in favorites, using localStorage fallback');
        } else {
          console.error('Error querying favorites by email:', favoriteError);
        }
      } else if (favoriteUsers) {
        const uniqueIds = [...new Set(favoriteUsers.map(r => r.user_id))];
        uniqueIds.forEach(id => {
          if (!previousUserIds.includes(id)) {
            previousUserIds.push(id);
          }
        });
        console.log(`📦 Found ${uniqueIds.length} user IDs in favorites with email ${email}`);
      }
      
      // Remove duplicates
      previousUserIds = [...new Set(previousUserIds)];
      
      if (previousUserIds.length > 0) {
        console.log(`✅ Found ${previousUserIds.length} previous user IDs for email ${email}:`, previousUserIds);
      } else {
        // Fallback to localStorage mapping if no results from database
        const mapping = getEmailUserMapping(email);
        const localUserIds = mapping?.userIds.filter(id => id !== userId) || [];
        if (localUserIds.length > 0) {
          console.log(`📦 Found ${localUserIds.length} user IDs in localStorage mapping`);
          previousUserIds = localUserIds;
        }
      }
    } catch (err) {
      console.error('❌ Error querying database for user IDs by email:', err);
      // Fallback to localStorage mapping if database query fails
      const mapping = getEmailUserMapping(email);
      previousUserIds = mapping?.userIds.filter(id => id !== userId) || [];
    }
  } else {
    // Fallback to localStorage if Supabase not configured
    const mapping = getEmailUserMapping(email);
    previousUserIds = mapping?.userIds.filter(id => id !== userId) || [];
  }

  // Store current mapping in localStorage (for fallback scenarios)
  setEmailUserMapping(email, userId);

  // Backfill email for existing entries (in case email column was just added)
  try {
    await backfillEmailForUser(userId, email);
  } catch (err) {
    console.warn('⚠️ Error backfilling email, continuing with sync:', err);
  }

  // Check if we have data for current user
  const currentHistory = await getOutfitHistory(userId);
  const currentFavorites = await getFavorites(userId);
  const currentProfile = await getUserProfile(userId);

  // If current user already has data, still check if there's more data to migrate
  // (in case user has data on both old and new accounts)
  const hasCurrentData = currentHistory.length > 0 || currentFavorites.length > 0 || currentProfile;
  
  if (hasCurrentData && previousUserIds.length === 0) {
    console.log('✅ Current user has data and no previous user IDs found, no migration needed');
    result.synced = true;
    return result;
  }

  // If no previous user IDs, nothing to migrate
  if (previousUserIds.length === 0) {
    console.log('ℹ️ No previous user IDs found for this email');
    result.synced = true;
    return result;
  }

  console.log(`📦 Found ${previousUserIds.length} previous user IDs:`, previousUserIds);

  // Migrate data from all previous user IDs
  for (const oldUserId of previousUserIds) {
    try {
      const migrationResult = await migrateUserData(oldUserId, userId, email);
      result.historyMigrated += migrationResult.historyMigrated;
      result.favoritesMigrated += migrationResult.favoritesMigrated;
      if (migrationResult.profileMigrated) {
        result.profileMigrated = true;
      }
      result.errors.push(...migrationResult.errors);
      result.migrated = true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Error migrating from ${oldUserId}:`, err);
      result.errors.push(`Migration from ${oldUserId}: ${errorMsg}`);
    }
  }

  result.synced = true;
  
  // Mark sync as complete
  syncAttempts.set(syncKey, { lastAttempt: now, inProgress: false });
  
  console.log(`✅ Sync complete:`, {
    migrated: result.migrated,
    historyMigrated: result.historyMigrated,
    favoritesMigrated: result.favoritesMigrated,
    profileMigrated: result.profileMigrated,
    errors: result.errors.length,
  });

  return result;
}

/**
 * Get all user IDs for an email (for debugging)
 */
export function getUserIdsForEmail(email: string): string[] {
  const mapping = getEmailUserMapping(email);
  return mapping?.userIds || [];
}
