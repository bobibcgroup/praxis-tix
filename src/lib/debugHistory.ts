/**
 * Debug utilities for history functionality
 * Usage in browser console:
 *   window.debugHistory.check('user_38a2I0g1kYuU0IqRRR5BQd6r6pO')
 *   window.debugHistory.testSave('user_38a2I0g1kYuU0IqRRR5BQd6r6pO')
 *   window.debugHistory.clearLocalStorage()
 */

import { saveOutfitToHistory, getOutfitHistory } from './userService';
import { supabase } from './supabase';
import type { Outfit } from '@/types/praxis';

export const debugHistory = {
  /**
   * Check current history state for a user
   */
  async check(userId: string) {
    console.log('🔍 Checking history for user:', userId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check Supabase status
    if (!supabase) {
      console.warn('⚠️ Supabase is NOT configured');
      console.log('   History will use localStorage fallback');
    } else {
      console.log('✅ Supabase is configured');
    }
    
    // Check localStorage
    const localHistory = JSON.parse(localStorage.getItem('praxis_outfit_history') || '[]');
    console.log('\n📦 LocalStorage entries:', localHistory.length);
    if (localHistory.length > 0) {
      const userEntries = localHistory.filter((e: any) => !e.userId || e.userId === userId);
      console.log('   Entries for this user:', userEntries.length);
      console.log('   All entries:', localHistory);
    }
    
    // Try to fetch from Supabase
    if (supabase) {
      try {
        console.log('\n🗄️ Fetching from Supabase...');
        const { data, error } = await supabase
          .from('outfit_history')
          .select('*')
          .eq('user_id', userId)
          .order('selected_at', { ascending: false });
        
        if (error) {
          console.error('❌ Supabase error:', error);
          console.error('   Error details:', JSON.stringify(error, null, 2));
        } else {
          console.log('✅ Supabase entries:', data?.length || 0);
          if (data && data.length > 0) {
            console.log('   Entries:', data);
          } else {
            console.log('   No entries found in Supabase');
          }
        }
      } catch (err) {
        console.error('❌ Error querying Supabase:', err);
      }
    }
    
    // Try getOutfitHistory function
    try {
      console.log('\n📋 Using getOutfitHistory function...');
      const history = await getOutfitHistory(userId);
      console.log('✅ Retrieved', history.length, 'entries');
      if (history.length > 0) {
        console.log('   Entries:', history);
      }
    } catch (err) {
      console.error('❌ Error in getOutfitHistory:', err);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  },

  /**
   * Test saving an outfit to history
   */
  async testSave(userId: string) {
    console.log('🧪 Testing history save for user:', userId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const testOutfit: Outfit = {
      id: Date.now(), // Unique ID
      title: 'Debug Test Outfit',
      label: 'Safest choice',
      items: {
        top: 'Test Top',
        bottom: 'Test Bottom',
        shoes: 'Test Shoes',
      },
      reason: 'This is a debug test outfit',
      imageUrl: 'https://via.placeholder.com/300x400',
    };

    try {
      console.log('1️⃣ Attempting to save test outfit...');
      console.log('   Outfit:', testOutfit);
      console.log('   Occasion: WORK');
      
      const entryId = await saveOutfitToHistory(
        userId,
        testOutfit,
        'WORK',
        undefined,
        undefined
      );
      
      if (entryId) {
        console.log('✅ Test outfit saved! Entry ID:', entryId);
        
        // Wait a moment then check if it's retrievable
        console.log('\n2️⃣ Waiting 1 second, then checking if entry is retrievable...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const history = await getOutfitHistory(userId);
        const testEntry = history.find(e => e.outfitId === testOutfit.id || e.outfitData.title === testOutfit.title);
        
        if (testEntry) {
          console.log('✅ Test entry found in history!');
          console.log('   Entry:', testEntry);
          return { success: true, entryId, testEntry };
        } else {
          console.error('❌ Test entry NOT found in history');
          console.log('   Retrieved history:', history);
          return { success: false, error: 'Entry not found after save', history };
        }
      } else {
        console.error('❌ saveOutfitToHistory returned null');
        return { success: false, error: 'Save returned null' };
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
      console.error('   Error details:', error);
      return { success: false, error };
    }
  },

  /**
   * Clear localStorage history (use with caution)
   */
  clearLocalStorage() {
    console.log('🗑️ Clearing localStorage history...');
    localStorage.removeItem('praxis_outfit_history');
    console.log('✅ localStorage cleared');
  },

  /**
   * Check Supabase connection and table structure
   */
  async checkSupabase() {
    console.log('🔍 Checking Supabase connection...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!supabase) {
      console.error('❌ Supabase is not configured');
      console.log('   Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      return;
    }
    
    try {
      // Test connection by querying outfit_history table
      const { data, error } = await supabase
        .from('outfit_history')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        console.error('   Error hint:', error.hint);
        
        if (error.code === 'PGRST116') {
          console.error('\n⚠️ Table "outfit_history" does not exist!');
          console.error('   You need to create the table in Supabase.');
        }
      } else {
        console.log('✅ Supabase connection successful');
        console.log('   Table "outfit_history" exists');
      }
    } catch (err) {
      console.error('❌ Error checking Supabase:', err);
    }
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugHistory = debugHistory;
  console.log('💡 Debug tools available:');
  console.log('   window.debugHistory.check(userId) - Check history state');
  console.log('   window.debugHistory.testSave(userId) - Test saving');
  console.log('   window.debugHistory.checkSupabase() - Check Supabase connection');
  console.log('   window.debugHistory.clearLocalStorage() - Clear localStorage');
}
