/**
 * Test function to verify history saving is working
 * Can be called from browser console: window.testHistorySave()
 */
import { saveOutfitToHistory, getOutfitHistory } from './userService';
import type { Outfit } from '@/types/praxis';

export async function testHistorySave(userId: string) {
  console.log('🧪 Testing history save functionality...');
  
  const testOutfit: Outfit = {
    id: 999999,
    title: 'Test Outfit',
    label: 'Safest choice',
    items: {
      top: 'Test Top',
      bottom: 'Test Bottom',
      shoes: 'Test Shoes',
    },
    reason: 'This is a test outfit to verify history saving works',
    imageUrl: 'https://via.placeholder.com/300x400',
  };

  try {
    console.log('1. Attempting to save test outfit...');
    const entryId = await saveOutfitToHistory(
      userId,
      testOutfit,
      'WORK',
      undefined,
      undefined
    );
    
    if (entryId) {
      console.log('✅ Test outfit saved successfully! Entry ID:', entryId);
      
      console.log('2. Attempting to retrieve history...');
      const history = await getOutfitHistory(userId);
      console.log('📋 Retrieved history entries:', history.length);
      console.log('📋 History:', history);
      
      const testEntry = history.find(e => e.outfitId === testOutfit.id);
      if (testEntry) {
        console.log('✅ Test entry found in history!', testEntry);
        return { success: true, entryId, testEntry };
      } else {
        console.error('❌ Test entry NOT found in history');
        return { success: false, error: 'Entry not found after save' };
      }
    } else {
      console.error('❌ saveOutfitToHistory returned null');
      return { success: false, error: 'Save returned null' };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testHistorySave = testHistorySave;
}
