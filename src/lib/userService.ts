import { supabase } from './supabase';
import type { PersonalData, Outfit, StyleDNA } from '@/types/praxis';

export interface OutfitHistoryEntry {
  id: string;
  outfitId: number;
  occasion: string;
  outfitData: Outfit;
  tryOnImageUrl?: string | null;
  animatedVideoUrl?: string | null;
  selectedAt: string;
  styleName?: string | null;
  styleDNA?: StyleDNA | null;
  colorPalette?: Array<{ name: string; hex: string }> | null;
  userId?: string; // Optional for localStorage entries
}

/**
 * Save user profile (Style DNA, fit calibration, lifestyle)
 */
export async function saveUserProfile(
  userId: string,
  personalData: PersonalData,
  email?: string // Optional email for cross-device sync
): Promise<void> {
  if (!supabase) {
    console.warn('Supabase not configured. Profile not saved.');
    return;
  }

  // Validate that we have at least something to save
  if (!personalData.styleDNA && !personalData.lifestyle && !personalData.fitCalibration) {
    console.warn('⚠️ Cannot save profile: no data to save (missing styleDNA, lifestyle, and fitCalibration)');
    throw new Error('No profile data to save');
  }

  try {
    const profileData: any = {
      user_id: userId,
      style_dna: personalData.styleDNA || null,
      fit_calibration: personalData.fitCalibration || null,
      lifestyle: personalData.lifestyle || null,
      updated_at: new Date().toISOString(),
    };
    
    // Add email if provided (for cross-device sync)
    if (email) {
      profileData.email = email;
    }

    console.log('💾 Saving profile to database:', {
      userId,
      hasStyleDNA: !!profileData.style_dna,
      hasFitCalibration: !!profileData.fit_calibration,
      lifestyle: profileData.lifestyle
    });

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'user_id',
      })
      .select();

    if (error) {
      console.error('❌ Supabase error saving profile:', error);
      throw error;
    }

    console.log('✅ Profile saved successfully:', data?.[0]?.id);
  } catch (error) {
    console.error('❌ Error saving profile:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<PersonalData | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      hasPhoto: false,
      lifestyle: data.lifestyle || '',
      hasWardrobe: false,
      hasInspiration: false,
      styleDNA: data.style_dna,
      fitCalibration: data.fit_calibration,
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

/**
 * Save outfit selection to history
 * Returns the history entry ID for potential updates
 */
export async function saveOutfitToHistory(
  userId: string,
  outfit: Outfit,
  occasion: string,
  tryOnImageUrl?: string,
  animatedVideoUrl?: string,
  styleName?: string,
  styleDNA?: StyleDNA,
  colorPalette?: Array<{ name: string; hex: string }>,
  email?: string // Optional email for cross-device sync
): Promise<string | null> {
  if (!supabase) {
    // Fallback to localStorage
    console.log('Supabase not configured, using localStorage fallback');
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    const entryId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    history.push({
      id: entryId,
      userId, // Store userId for filtering
      outfitId: outfit.id,
      occasion,
      outfitData: outfit,
      tryOnImageUrl,
      animatedVideoUrl,
      selectedAt: new Date().toISOString(),
      styleName: styleName || null,
      styleDNA: styleDNA || null,
      colorPalette: colorPalette || null,
    });
    localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
    console.log('Saved to localStorage:', entryId);
    return entryId;
  }

  try {
    // Validate required fields
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!outfit || !outfit.id) {
      throw new Error('Outfit data is required');
    }
    if (!occasion) {
      throw new Error('Occasion is required');
    }

    console.log('💾 Saving outfit to history:', { userId, outfitId: outfit.id, occasion, email });
    
    // Build insert object - exclude color_palette and style_dna as columns don't exist in database
    const insertData: any = {
      user_id: userId,
      outfit_id: outfit.id,
      occasion,
      outfit_data: outfit,
      try_on_image_url: tryOnImageUrl || null,
      animated_video_url: animatedVideoUrl || null,
      selected_at: new Date().toISOString(),
      style_name: styleName || null,
      // Note: style_dna and color_palette columns don't exist in database schema
      // The data will be stored in localStorage fallback if needed
    };
    
    // Add email if provided (for cross-device sync)
    if (email) {
      insertData.email = email;
    }
    
    const { data, error } = await supabase
      .from('outfit_history')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error saving outfit history:', error);
      throw error;
    }
    
    console.log('Outfit saved to history successfully:', data?.id);
    return data?.id || null;
  } catch (error) {
    console.error('Error saving outfit history:', error);
    // Fallback to localStorage
    try {
      console.log('Falling back to localStorage due to error');
      const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
      const entryId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      history.push({
        id: entryId,
        userId, // Store userId for filtering
        outfitId: outfit.id,
        occasion,
        outfitData: outfit,
        tryOnImageUrl,
        animatedVideoUrl,
        selectedAt: new Date().toISOString(),
        styleName: styleName || null,
        styleDNA: styleDNA || null,
        colorPalette: colorPalette || null,
      });
      localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
      console.log('✅ Saved to localStorage fallback:', entryId);
      return entryId;
    } catch (localError) {
      console.error('❌ Error saving to localStorage fallback:', localError);
      throw error; // Re-throw original error
    }
  }
}

/**
 * Update style name for an existing outfit history entry (for quick flow)
 */
export async function updateOutfitHistoryStyleName(
  userId: string,
  historyId: string,
  styleName: string
): Promise<void> {
  if (!supabase) {
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    const entry = history.find((e: OutfitHistoryEntry) => e.id === historyId);
    if (entry) {
      entry.styleName = styleName;
      localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
    }
    return;
  }

  try {
    const updateData: any = {
      style_name: styleName,
    };
    
    console.log('🔄 Updating history entry style name:', { historyId, userId, styleName });
    
    const { error } = await supabase
      .from('outfit_history')
      .update(updateData)
      .eq('id', historyId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Supabase update error:', error);
      throw error;
    }
    
    console.log('✅ History entry style name updated successfully:', styleName);
  } catch (error) {
    console.error('Error updating outfit history style name:', error);
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    const entry = history.find((e: OutfitHistoryEntry) => e.id === historyId);
    if (entry) {
      entry.styleName = styleName;
      localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
    }
  }
}

/**
 * Update existing outfit history entry with try-on image URL and style data
 * If historyId is not provided, will try to find the most recent entry for the outfitId
 */
export async function updateOutfitHistoryTryOn(
  userId: string,
  historyId: string | null | undefined,
  tryOnImageUrl: string,
  styleName?: string,
  styleDNA?: StyleDNA,
  colorPalette?: Array<{ name: string; hex: string }>,
  outfitId?: number, // Optional: used as fallback if historyId is missing
  email?: string // Optional email for cross-device sync
): Promise<void> {
  if (!historyId && !outfitId) {
    console.error('❌ Cannot update history: both historyId and outfitId are missing');
    return;
  }

  if (!supabase) {
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    let entry: OutfitHistoryEntry | undefined;
    
    if (historyId) {
      entry = history.find((e: OutfitHistoryEntry) => e.id === historyId);
    } else if (outfitId) {
      // Find most recent entry for this outfitId and userId
      const matchingEntries = history.filter((e: OutfitHistoryEntry) => 
        e.outfitId === outfitId && (!e.userId || e.userId === userId)
      );
      entry = matchingEntries.sort((a, b) => 
        new Date(b.selectedAt).getTime() - new Date(a.selectedAt).getTime()
      )[0];
    }
    
    if (entry) {
      entry.tryOnImageUrl = tryOnImageUrl;
      if (styleName) entry.styleName = styleName;
      if (styleDNA) entry.styleDNA = styleDNA;
      if (colorPalette) entry.colorPalette = colorPalette;
      localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
      console.log('✅ Updated history entry in localStorage:', entry.id);
    } else {
      console.warn('⚠️ History entry not found in localStorage for update');
    }
    return;
  }

  try {
    // Build update object - exclude color_palette and style_dna as columns don't exist in database
    const updateData: any = {
      try_on_image_url: tryOnImageUrl,
      style_name: styleName || null,
      // Note: style_dna and color_palette columns don't exist in database schema
    };
    
    // Update email if provided (for cross-device sync and backfilling)
    if (email) {
      updateData.email = email;
    }
    
    console.log('🔄 Updating history entry:', { historyId, outfitId, userId, styleName, hasTryOnUrl: !!tryOnImageUrl });
    
    let finalHistoryId = historyId;
    
    // If historyId is missing but outfitId is provided, find the most recent entry for this outfitId
    if (!finalHistoryId && outfitId) {
      const { data: entries, error: findError } = await supabase
        .from('outfit_history')
        .select('id')
        .eq('user_id', userId)
        .eq('outfit_id', outfitId)
        .order('selected_at', { ascending: false })
        .limit(1);
      
      if (findError) {
        console.error('❌ Error finding history entry by outfitId:', findError);
        throw findError;
      }
      
      if (!entries || entries.length === 0) {
        console.warn('⚠️ No history entry found for outfitId:', outfitId);
        return;
      }
      
      finalHistoryId = entries[0].id;
      console.log('📝 Found history entry by outfitId:', finalHistoryId);
    }
    
    if (!finalHistoryId) {
      console.error('❌ Cannot update: no historyId found');
      return;
    }
    
    // Update the history entry
    const { error } = await supabase
      .from('outfit_history')
      .update(updateData)
      .eq('id', finalHistoryId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Supabase update error:', error);
      throw error;
    }
    
    console.log('✅ History entry updated successfully with style name:', styleName);
  } catch (error) {
    console.error('Error updating outfit history:', error);
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    let entry: OutfitHistoryEntry | undefined;
    
    if (historyId) {
      entry = history.find((e: OutfitHistoryEntry) => e.id === historyId);
    } else if (outfitId) {
      const matchingEntries = history.filter((e: OutfitHistoryEntry) => 
        e.outfitId === outfitId && (!e.userId || e.userId === userId)
      );
      entry = matchingEntries.sort((a, b) => 
        new Date(b.selectedAt).getTime() - new Date(a.selectedAt).getTime()
      )[0];
    }
    
    if (entry) {
      entry.tryOnImageUrl = tryOnImageUrl;
      if (styleName) entry.styleName = styleName;
      if (styleDNA) entry.styleDNA = styleDNA;
      if (colorPalette) entry.colorPalette = colorPalette;
      localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
    }
  }
}

/**
 * Delete outfit from history
 */
export async function deleteOutfitFromHistory(
  userId: string,
  historyId: string
): Promise<void> {
  if (!supabase) {
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    const updated = history.filter((e: OutfitHistoryEntry) => e.id !== historyId);
    localStorage.setItem('praxis_outfit_history', JSON.stringify(updated));
    return;
  }

  try {
    const { error } = await supabase
      .from('outfit_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting outfit history:', error);
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    const updated = history.filter((e: OutfitHistoryEntry) => e.id !== historyId);
    localStorage.setItem('praxis_outfit_history', JSON.stringify(updated));
  }
}

/**
 * Get outfit history for user
 */
export async function getOutfitHistory(
  userId: string,
  email?: string // Optional email for fallback query
): Promise<OutfitHistoryEntry[]> {
  if (!userId) {
    console.warn('getOutfitHistory called without userId');
    return [];
  }

  if (!supabase) {
    // Fallback to localStorage
    console.log('Supabase not configured, using localStorage fallback');
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    // Filter by userId if stored in localStorage
    const filtered = history.filter((entry: OutfitHistoryEntry) => {
      // If localStorage entries have userId, filter by it
      return !entry.userId || entry.userId === userId;
    });
    return filtered;
  }

  try {
    // Simple query by user_id (accounts are now synced, no need for fallbacks)
    const { data, error } = await supabase
      .from('outfit_history')
      .select('*')
      .eq('user_id', userId)
      .order('selected_at', { ascending: false });

    if (error) {
      // Only log actual errors, not empty results
      if (error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
        console.error('Error fetching outfit history:', error.message);
      }
      throw error;
    }

    // Map database rows to OutfitHistoryEntry format
    return (data || []).map(row => ({
      id: row.id,
      outfitId: row.outfit_id,
      occasion: row.occasion,
      outfitData: row.outfit_data,
      tryOnImageUrl: row.try_on_image_url,
      animatedVideoUrl: row.animated_video_url,
      selectedAt: row.selected_at,
      styleName: row.style_name || null,
      styleDNA: row.style_dna || null,
      colorPalette: null, // Column doesn't exist in database, always null
    }));
  } catch (error) {
    // Only log actual errors, not empty results
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
        console.error('Error fetching outfit history:', err.message);
      }
    }
    
    // Return empty array on error (accounts are synced, no localStorage fallback needed)
    return [];
  }
}

/**
 * Add outfit to favorites
 */
export async function addToFavorites(
  userId: string, 
  outfitId: number,
  email?: string // Optional email for cross-device sync
): Promise<void> {
  if (!supabase) {
    const favorites = JSON.parse(localStorage.getItem('praxis_favorites') || '[]');
    if (!favorites.includes(outfitId)) {
      favorites.push(outfitId);
      localStorage.setItem('praxis_favorites', JSON.stringify(favorites));
    }
    return;
  }

  try {
    const insertData: any = {
      user_id: userId,
      outfit_id: outfitId,
    };
    
    // Add email if provided (for cross-device sync)
    if (email) {
      insertData.email = email;
    }
    
    const { error } = await supabase
      .from('favorites')
      .insert(insertData);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding to favorites:', error);
  }
}

/**
 * Remove outfit from favorites
 */
export async function removeFromFavorites(userId: string, outfitId: number): Promise<void> {
  if (!supabase) {
    const favorites = JSON.parse(localStorage.getItem('praxis_favorites') || '[]');
    const updated = favorites.filter((id: number) => id !== outfitId);
    localStorage.setItem('praxis_favorites', JSON.stringify(updated));
    return;
  }

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('outfit_id', outfitId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing from favorites:', error);
  }
}

/**
 * Get user's favorite outfit IDs
 */
export async function getFavorites(userId: string): Promise<number[]> {
  if (!supabase) {
    const favorites = JSON.parse(localStorage.getItem('praxis_favorites') || '[]');
    return favorites;
  }

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('outfit_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(row => row.outfit_id);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    const favorites = JSON.parse(localStorage.getItem('praxis_favorites') || '[]');
    return favorites;
  }
}

/**
 * Get favorited outfit history entries (deduplicated)
 */
export async function getFavoritedOutfits(userId: string): Promise<OutfitHistoryEntry[]> {
  const favorites = await getFavorites(userId);
  const history = await getOutfitHistory(userId);
  const favoritedEntries = history.filter(entry => favorites.includes(entry.outfitId));
  
  // Deduplicate by outfitId - keep only the most recent entry for each outfit
  const seen = new Map<number, OutfitHistoryEntry>();
  favoritedEntries.forEach(entry => {
    const existing = seen.get(entry.outfitId);
    if (!existing || new Date(entry.selectedAt) > new Date(existing.selectedAt)) {
      seen.set(entry.outfitId, entry);
    }
  });
  
  return Array.from(seen.values()).sort((a, b) => 
    new Date(b.selectedAt).getTime() - new Date(a.selectedAt).getTime()
  );
}
