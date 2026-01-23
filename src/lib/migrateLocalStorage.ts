/**
 * Utility to migrate localStorage data to Supabase
 * Use this if you have data stuck in localStorage that should be in Supabase
 */

import { supabase } from './supabase';
import type { OutfitHistoryEntry } from './userService';

/**
 * Migrate all localStorage history entries to Supabase for a given user
 * This helps recover data that was saved to localStorage instead of Supabase
 */
export async function migrateLocalStorageToSupabase(userId: string): Promise<{
  migrated: number;
  failed: number;
  errors: Array<{ entry: OutfitHistoryEntry; error: any }>;
}> {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const result = {
    migrated: 0,
    failed: 0,
    errors: [] as Array<{ entry: OutfitHistoryEntry; error: any }>,
  };

  // Get all localStorage entries for this user
  const localHistory = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
  const userEntries = localHistory.filter((entry: OutfitHistoryEntry) => {
    return entry.userId === userId;
  });

  console.log(`🔄 Found ${userEntries.length} localStorage entries to migrate for user ${userId}`);

  // Migrate each entry
  for (const entry of userEntries) {
    try {
      // Check if entry already exists in Supabase (by checking if we can find it)
      // Note: We can't easily check by ID since localStorage IDs are different format
      // So we'll try to insert and handle conflicts

      const insertData: any = {
        user_id: userId,
        outfit_id: entry.outfitId,
        occasion: entry.occasion,
        outfit_data: entry.outfitData,
        try_on_image_url: entry.tryOnImageUrl || null,
        animated_video_url: entry.animatedVideoUrl || null,
        selected_at: entry.selectedAt || new Date().toISOString(),
        style_name: entry.styleName || null,
      };
      
      // Add email if available (for cross-device sync)
      // Try to get email from Clerk user or localStorage mapping
      try {
        const emailMapping = JSON.parse(localStorage.getItem('praxis_email_user_mapping') || '{}');
        for (const [email, mapping] of Object.entries(emailMapping)) {
          const map = mapping as any;
          if (map.userIds && map.userIds.includes(userId)) {
            insertData.email = email;
            break;
          }
        }
      } catch (e) {
        // Ignore email mapping errors
      }

      const { data, error } = await supabase
        .from('outfit_history')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        // If it's a duplicate key error, that's okay - entry already exists
        if (error.code === '23505') {
          console.log(`   ⏭️  Entry already exists in Supabase, skipping: ${entry.id}`);
          result.migrated++;
        } else {
          console.error(`   ❌ Failed to migrate entry ${entry.id}:`, error);
          result.failed++;
          result.errors.push({ entry, error });
        }
      } else {
        console.log(`   ✅ Migrated entry ${entry.id} -> ${data?.id}`);
        result.migrated++;
      }
    } catch (error) {
      console.error(`   ❌ Error migrating entry ${entry.id}:`, error);
      result.failed++;
      result.errors.push({ entry, error });
    }
  }

  console.log(`✅ Migration complete: ${result.migrated} migrated, ${result.failed} failed`);
  return result;
}

/**
 * Check if user has data in localStorage that should be migrated
 */
export function hasLocalStorageData(userId: string): boolean {
  const localHistory = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
  const userEntries = localHistory.filter((entry: OutfitHistoryEntry) => {
    return entry.userId === userId;
  });
  return userEntries.length > 0;
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).migrateLocalStorageToSupabase = migrateLocalStorageToSupabase;
  (window as any).hasLocalStorageData = hasLocalStorageData;
}
