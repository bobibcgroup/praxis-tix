import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import debug functions for debugging
import "./lib/testHistory";
import "./lib/debugHistory";
// Import cleanup utilities (exposes window.cleanupUserData and window.listUsersWithData)
import "./lib/cleanupUserData";
// Register service worker for PWA
import { registerServiceWorker } from "./utils/serviceWorker";

// Set up global generation completion listener
// This ensures history is updated even if user navigates away from the generation page
if (typeof window !== 'undefined') {
  window.addEventListener('generation-complete', async (event: Event) => {
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail || {};
    const { imageUrl, historyEntryId, userId, styleName, personalData } = detail;
    
    // Only process if we have the necessary data
    if (imageUrl && historyEntryId && userId) {
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
          historyEntryId,
          imageUrl,
          styleName || undefined,
          personalData?.styleDNA || undefined,
          colorPalette
        );
        
        console.log('✅ [Global] History updated with try-on image:', historyEntryId);
        
        // Clear localStorage
        localStorage.removeItem('praxis_active_generation');
        localStorage.removeItem('praxis_current_history_entry_id');
      } catch (err) {
        console.error('❌ [Global] Error updating history with try-on URL:', err);
      }
    }
  });
}

// Register service worker
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
