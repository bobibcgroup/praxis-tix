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
}

/**
 * Save user profile (Style DNA, fit calibration, lifestyle)
 */
export async function saveUserProfile(
  userId: string,
  personalData: PersonalData
): Promise<void> {
  if (!supabase) {
    console.warn('Supabase not configured. Profile not saved.');
    return;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        style_dna: personalData.styleDNA,
        fit_calibration: personalData.fitCalibration,
        lifestyle: personalData.lifestyle,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving profile:', error);
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
 */
export async function saveOutfitToHistory(
  userId: string,
  outfit: Outfit,
  occasion: string,
  tryOnImageUrl?: string,
  animatedVideoUrl?: string
): Promise<void> {
  if (!supabase) {
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    history.push({
      outfitId: outfit.id,
      occasion,
      outfitData: outfit,
      tryOnImageUrl,
      animatedVideoUrl,
      selectedAt: new Date().toISOString(),
    });
    localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
    return;
  }

  try {
    const { error } = await supabase
      .from('outfit_history')
      .insert({
        user_id: userId,
        outfit_id: outfit.id,
        occasion,
        outfit_data: outfit,
        try_on_image_url: tryOnImageUrl || null,
        animated_video_url: animatedVideoUrl || null,
        selected_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving outfit history:', error);
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    history.push({
      outfitId: outfit.id,
      occasion,
      outfitData: outfit,
      tryOnImageUrl,
      animatedVideoUrl,
      selectedAt: new Date().toISOString(),
    });
    localStorage.setItem('praxis_outfit_history', JSON.stringify(history));
  }
}

/**
 * Get outfit history for user
 */
export async function getOutfitHistory(userId: string): Promise<OutfitHistoryEntry[]> {
  if (!supabase) {
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    return history;
  }

  try {
    const { data, error } = await supabase
      .from('outfit_history')
      .select('*')
      .eq('user_id', userId)
      .order('selected_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      outfitId: row.outfit_id,
      occasion: row.occasion,
      outfitData: row.outfit_data,
      tryOnImageUrl: row.try_on_image_url,
      animatedVideoUrl: row.animated_video_url,
      selectedAt: row.selected_at,
    }));
  } catch (error) {
    console.error('Error fetching outfit history:', error);
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    return history;
  }
}

/**
 * Add outfit to favorites
 */
export async function addToFavorites(userId: string, outfitId: number): Promise<void> {
  if (!supabase) {
    const favorites = JSON.parse(localStorage.getItem('praxis_favorites') || '[]');
    if (!favorites.includes(outfitId)) {
      favorites.push(outfitId);
      localStorage.setItem('praxis_favorites', JSON.stringify(favorites));
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        outfit_id: outfitId,
      });

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
