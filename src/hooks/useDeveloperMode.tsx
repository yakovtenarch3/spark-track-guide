import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DeveloperModeState {
  // מצב כללי
  enabled: boolean;
  // כלי פיתוח
  consoleEnabled: boolean;
  inspectorEnabled: boolean;
  // הגדרות קונסול
  consoleFilter: 'all' | 'error' | 'warn' | 'info' | 'log';
  consoleAutoScroll: boolean;
  // פעולות
  toggleDevMode: () => void;
  toggleConsole: () => void;
  toggleInspector: () => void;
  setConsoleFilter: (filter: 'all' | 'error' | 'warn' | 'info' | 'log') => void;
  setConsoleAutoScroll: (enabled: boolean) => void;
  hardRefresh: () => Promise<void>;
  // עזר
  isFirstTimeEnabled: boolean;
}

export const useDeveloperMode = create<DeveloperModeState>()(
  persist(
    (set, get) => ({
      enabled: false,
      consoleEnabled: true,
      inspectorEnabled: true,
      consoleFilter: 'all',
      consoleAutoScroll: true,
      isFirstTimeEnabled: true,
      
      toggleDevMode: () =>
        set((state) => {
          const newEnabled = !state.enabled;
          // אם מכבים - סוגרים הכל אבל זוכרים את המצב
          if (!newEnabled) {
            return {
              enabled: false,
            };
          }
          // אם מפעילים בפעם הראשונה - פותחים הכל
          if (state.isFirstTimeEnabled) {
            return { 
              enabled: true,
              consoleEnabled: true,
              inspectorEnabled: true,
              isFirstTimeEnabled: false,
            };
          }
          // אחרת - פשוט מפעילים (שומרים על הבחירות הקודמות)
          return { enabled: true };
        }),
        
      toggleConsole: () =>
        set((state) => ({
          consoleEnabled: !state.consoleEnabled,
        })),
        
      toggleInspector: () =>
        set((state) => ({
          inspectorEnabled: !state.inspectorEnabled,
        })),
        
      setConsoleFilter: (filter) =>
        set({ consoleFilter: filter }),
        
      setConsoleAutoScroll: (enabled) =>
        set({ consoleAutoScroll: enabled }),
        
      hardRefresh: async () => {
        try {
          // ניקוי כל הקאשים
          if ('caches' in globalThis) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          
          // ביטול רישום Service Workers
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
          }
          
          // ניקוי localStorage (חוץ מהגדרות מצב פיתוח)
          const devModeSettings = localStorage.getItem('developer-mode-storage');
          localStorage.clear();
          if (devModeSettings) {
            localStorage.setItem('developer-mode-storage', devModeSettings);
          }
          
          // ניקוי sessionStorage
          sessionStorage.clear();
          
          // ריענון מלא ללא קאש
          globalThis.location.reload();
        } catch (error) {
          console.error('שגיאה בניקוי קאש:', error);
          globalThis.location.reload();
        }
      },
    }),
    {
      name: "developer-mode-storage",
    }
  )
);
