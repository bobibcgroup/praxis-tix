import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import debug functions for debugging
import "./lib/testHistory";
import "./lib/debugHistory";
// Import cleanup utilities (exposes window.cleanupUserData and window.listUsersWithData)
import "./lib/cleanupUserData";
// Import diagnosis utility (exposes window.diagnoseHistory and window.migrateLocalStorageToSupabase)
import "./lib/diagnoseHistory";
// Import localStorage migration (exposes window.migrateLocalStorageToSupabase)
import "./lib/migrateLocalStorage";
// Register service worker for PWA
import { registerServiceWorker } from "./utils/serviceWorker";

// Set up global generation completion listener
// This ensures history is updated even if user navigates away from the generation page
if (typeof window !== 'undefined') {
  window.addEventListener('generation-complete', async (event: Event) => {
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail || {};
    const { imageUrl, historyEntryId, userId, styleName, personalData, outfitId, email } = detail;
    
    // Only process if we have the necessary data
    // We can update even if historyEntryId is missing by using outfitId as fallback
    if (imageUrl && userId && (historyEntryId || outfitId)) {
      try {
        // Dynamic import to avoid circular dependencies
        const { updateOutfitHistoryTryOn } = await import('./lib/userService');
        const { getRecommendedSwatches } = await import('./lib/personalOutfitGenerator');
        
        // Get color palette if skinTone is available
        const colorPalette = personalData?.skinTone?.bucket
          ? getRecommendedSwatches(personalData.skinTone.bucket).slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
          : undefined;
        
        await updateOutfitHistoryTryOn(
          userId,
          historyEntryId || null,
          imageUrl,
          styleName || undefined,
          personalData?.styleDNA || undefined,
          colorPalette,
          outfitId, // Pass outfitId as fallback
          email // Email from event detail
        );
        
        console.log('✅ [Global] History updated with try-on image:', { historyEntryId, outfitId });
        
        // Dispatch a custom event to notify Profile page to refresh
        // Profile will be saved by StepStyleDNA when it mounts, we just need to refresh
        window.dispatchEvent(new CustomEvent('profile-should-refresh'));
        
        // Clear localStorage
        localStorage.removeItem('praxis_active_generation');
        localStorage.removeItem('praxis_current_history_entry_id');
      } catch (err) {
        console.error('❌ [Global] Error updating history with try-on URL:', err);
      }
    } else {
      console.warn('⚠️ [Global] Missing data for history update:', { imageUrl: !!imageUrl, historyEntryId: !!historyEntryId, outfitId: !!outfitId, userId: !!userId });
    }
  });
}

// Register service worker
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
