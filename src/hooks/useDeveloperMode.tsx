import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DeveloperModeState {
  enabled: boolean;
  consoleEnabled: boolean;
  inspectorEnabled: boolean;
  toggleDevMode: () => void;
  toggleConsole: () => void;
  toggleInspector: () => void;
}

export const useDeveloperMode = create<DeveloperModeState>()(
  persist(
    (set) => ({
      enabled: false,
      consoleEnabled: false,
      inspectorEnabled: false,
      toggleDevMode: () =>
        set((state) => {
          const newEnabled = !state.enabled;
          // If disabling dev mode, also disable all tools
          if (!newEnabled) {
            return {
              enabled: false,
              consoleEnabled: false,
              inspectorEnabled: false,
            };
          }
          return { enabled: newEnabled };
        }),
      toggleConsole: () =>
        set((state) => ({
          consoleEnabled: !state.consoleEnabled,
        })),
      toggleInspector: () =>
        set((state) => ({
          inspectorEnabled: !state.inspectorEnabled,
        })),
    }),
    {
      name: "developer-mode-storage",
    }
  )
);
