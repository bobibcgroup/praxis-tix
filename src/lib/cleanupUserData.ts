/**
 * Utility to clean up all user data from database and localStorage
 * Use this after deleting a Clerk user account
 */

import { supabase } from './supabase';

export interface CleanupResult {
  outfitHistory: { deleted: number; error?: any };
  favorites: { deleted: number; error?: any };
  profile: { deleted: number; error?: any };
  localStorage: { cleared: boolean };
  totalDeleted: number;
}

/**
 * Delete all data for a specific user ID from Supabase and localStorage
 * WARNING: This is irreversible!
 */
export async function cleanupUserData(userId: string): Promise<CleanupResult> {
  const result: CleanupResult = {
    outfitHistory: { deleted: 0 },
    favorites: { deleted: 0 },
    profile: { deleted: 0 },
    localStorage: { cleared: false },
    totalDeleted: 0,
  };

  console.log(`🧹 Starting cleanup for user: ${userId}`);

  // Clean up Supabase data
  if (supabase) {
    // Delete outfit history
    try {
      const { data, error } = await supabase
        .from('outfit_history')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error('❌ Error deleting outfit history:', error);
        result.outfitHistory.error = error;
      } else {
        result.outfitHistory.deleted = data?.length || 0;
        console.log(`✅ Deleted ${result.outfitHistory.deleted} outfit history entries`);
      }
    } catch (error) {
      console.error('❌ Exception deleting outfit history:', error);
      result.outfitHistory.error = error;
    }

    // Delete favorites
    try {
      const { data, error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error('❌ Error deleting favorites:', error);
        result.favorites.error = error;
      } else {
        result.favorites.deleted = data?.length || 0;
        console.log(`✅ Deleted ${result.favorites.deleted} favorites`);
      }
    } catch (error) {
      console.error('❌ Exception deleting favorites:', error);
      result.favorites.error = error;
    }

    // Delete profile
    try {
      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error('❌ Error deleting profile:', error);
        result.profile.error = error;
      } else {
        result.profile.deleted = data ? 1 : 0;
        console.log(`✅ Deleted profile`);
      }
    } catch (error) {
      console.error('❌ Exception deleting profile:', error);
      result.profile.error = error;
    }
  } else {
    console.warn('⚠️ Supabase not configured, skipping database cleanup');
  }

  // Clean up localStorage
  try {
    // Clean outfit history from localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    const filteredHistory = history.filter((entry: any) => entry.userId !== userId);
    localStorage.setItem('praxis_outfit_history', JSON.stringify(filteredHistory));

    // Clean favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('praxis_favorites') || '[]');
    // Note: localStorage favorites don't have userId, so we can't filter by user
    // But we'll clear it if it exists
    if (favorites.length > 0) {
      localStorage.removeItem('praxis_favorites');
    }

    result.localStorage.cleared = true;
    console.log('✅ Cleaned localStorage');
  } catch (error) {
    console.error('❌ Error cleaning localStorage:', error);
  }

  // Calculate total
  result.totalDeleted = 
    result.outfitHistory.deleted + 
    result.favorites.deleted + 
    result.profile.deleted;

  console.log(`✅ Cleanup complete. Total items deleted: ${result.totalDeleted}`);
  return result;
}

/**
 * List all user IDs that have data in the database
 * Useful for finding orphaned data after user deletion
 */
export async function listUsersWithData(): Promise<{
  outfitHistory: string[];
  favorites: string[];
  profiles: string[];
  all: Set<string>;
}> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const result = {
    outfitHistory: [] as string[],
    favorites: [] as string[],
    profiles: [] as string[],
    all: new Set<string>(),
  };

  try {
    // Get unique user_ids from outfit_history
    const { data: historyData } = await supabase
      .from('outfit_history')
      .select('user_id');
    
    if (historyData) {
      result.outfitHistory = [...new Set(historyData.map(r => r.user_id))];
      result.outfitHistory.forEach(id => result.all.add(id));
    }

    // Get unique user_ids from favorites
    const { data: favData } = await supabase
      .from('favorites')
      .select('user_id');
    
    if (favData) {
      result.favorites = [...new Set(favData.map(r => r.user_id))];
      result.favorites.forEach(id => result.all.add(id));
    }

    // Get unique user_ids from profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id');
    
    if (profileData) {
      result.profiles = [...new Set(profileData.map(r => r.user_id))];
      result.profiles.forEach(id => result.all.add(id));
    }

    console.log('📊 Users with data:', {
      outfitHistory: result.outfitHistory.length,
      favorites: result.favorites.length,
      profiles: result.profiles.length,
      totalUnique: result.all.size,
    });
  } catch (error) {
    console.error('Error listing users:', error);
  }

  return result;
}

// Make cleanup functions available globally in browser console
if (typeof window !== 'undefined') {
  (window as any).cleanupUserData = cleanupUserData;
  (window as any).listUsersWithData = listUsersWithData;
  
  console.log('💡 Cleanup utilities available:');
  console.log('   window.cleanupUserData(userId) - Delete all data for a user');
  console.log('   window.listUsersWithData() - List all users with data');
}
