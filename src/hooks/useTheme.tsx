import { useEffect, useState } from "react";

export type ThemeName = "default" | "ocean" | "sunset" | "forest" | "lavender" | "midnight" | "coral" | "mint" | "warm" | string;

export interface Theme {
  name: string;
  label: string;
  isCustom?: boolean;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: "default",
    label: "ברירת מחדל",
    colors: {
      background: "40 30% 97%",
      foreground: "210 20% 12%",
      card: "40 40% 99%",
      cardForeground: "210 20% 12%",
      primary: "210 30% 15%",
      primaryForeground: "40 40% 99%",
      secondary: "40 25% 88%",
      secondaryForeground: "210 30% 15%",
      muted: "40 20% 92%",
      mutedForeground: "210 10% 45%",
      accent: "210 25% 20%",
      accentForeground: "40 40% 99%",
      border: "40 15% 88%",
      input: "40 20% 90%",
      ring: "210 30% 15%",
    },
  },
  ocean: {
    name: "ocean",
    label: "אוקיינוס",
    colors: {
      background: "205 100% 96%",
      foreground: "209 62% 18%",
      card: "205 95% 98%",
      cardForeground: "209 62% 18%",
      primary: "209 62% 35%",
      primaryForeground: "0 0% 100%",
      secondary: "200 50% 75%",
      secondaryForeground: "209 62% 18%",
      muted: "205 50% 90%",
      mutedForeground: "209 40% 35%",
      accent: "195 60% 45%",
      accentForeground: "0 0% 100%",
      border: "205 40% 85%",
      input: "205 45% 88%",
      ring: "209 62% 35%",
    },
  },
  midnight: {
    name: "midnight",
    label: "חצות",
    colors: {
      background: "230 35% 95%",
      foreground: "230 60% 15%",
      card: "230 40% 97%",
      cardForeground: "230 60% 15%",
      primary: "230 60% 25%",
      primaryForeground: "0 0% 100%",
      secondary: "220 50% 70%",
      secondaryForeground: "230 60% 15%",
      muted: "230 30% 88%",
      mutedForeground: "230 40% 40%",
      accent: "240 55% 35%",
      accentForeground: "0 0% 100%",
      border: "230 30% 82%",
      input: "230 32% 85%",
      ring: "230 60% 25%",
    },
  },
  coral: {
    name: "coral",
    label: "אלמוגים",
    colors: {
      background: "15 45% 96%",
      foreground: "15 40% 18%",
      card: "15 50% 98%",
      cardForeground: "15 40% 18%",
      primary: "350 70% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "25 75% 65%",
      secondaryForeground: "15 40% 18%",
      muted: "20 35% 90%",
      mutedForeground: "15 30% 40%",
      accent: "340 65% 45%",
      accentForeground: "0 0% 100%",
      border: "20 30% 85%",
      input: "20 32% 87%",
      ring: "350 70% 50%",
    },
  },
  mint: {
    name: "mint",
    label: "מנטה",
    colors: {
      background: "165 40% 96%",
      foreground: "165 45% 15%",
      card: "165 45% 98%",
      cardForeground: "165 45% 15%",
      primary: "165 65% 40%",
      primaryForeground: "0 0% 100%",
      secondary: "155 55% 70%",
      secondaryForeground: "165 45% 15%",
      muted: "165 30% 90%",
      mutedForeground: "165 35% 40%",
      accent: "175 60% 45%",
      accentForeground: "0 0% 100%",
      border: "165 30% 85%",
      input: "165 32% 87%",
      ring: "165 65% 40%",
    },
  },
  warm: {
    name: "warm",
    label: "חם",
    colors: {
      background: "35 45% 96%",
      foreground: "35 40% 18%",
      card: "35 50% 98%",
      cardForeground: "35 40% 18%",
      primary: "25 75% 45%",
      primaryForeground: "0 0% 100%",
      secondary: "45 70% 70%",
      secondaryForeground: "35 40% 18%",
      muted: "35 35% 90%",
      mutedForeground: "35 30% 40%",
      accent: "15 70% 50%",
      accentForeground: "0 0% 100%",
      border: "35 30% 85%",
      input: "35 32% 87%",
      ring: "25 75% 45%",
    },
  },
  sunset: {
    name: "sunset",
    label: "שקיעה",
    colors: {
      background: "20 50% 95%",
      foreground: "20 30% 15%",
      card: "20 55% 97%",
      cardForeground: "20 30% 15%",
      primary: "15 80% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "35 70% 60%",
      secondaryForeground: "20 30% 15%",
      muted: "25 40% 88%",
      mutedForeground: "20 20% 45%",
      accent: "340 75% 55%",
      accentForeground: "0 0% 100%",
      border: "25 30% 85%",
      input: "25 35% 87%",
      ring: "15 80% 50%",
    },
  },
  forest: {
    name: "forest",
    label: "יער",
    colors: {
      background: "120 20% 95%",
      foreground: "120 25% 15%",
      card: "120 25% 97%",
      cardForeground: "120 25% 15%",
      primary: "145 60% 35%",
      primaryForeground: "0 0% 100%",
      secondary: "85 45% 70%",
      secondaryForeground: "120 25% 15%",
      muted: "110 20% 88%",
      mutedForeground: "120 15% 45%",
      accent: "165 55% 40%",
      accentForeground: "0 0% 100%",
      border: "115 20% 85%",
      input: "115 22% 87%",
      ring: "145 60% 35%",
    },
  },
  lavender: {
    name: "lavender",
    label: "לבנדר",
    colors: {
      background: "270 30% 96%",
      foreground: "270 25% 15%",
      card: "270 35% 98%",
      cardForeground: "270 25% 15%",
      primary: "265 60% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "280 40% 75%",
      secondaryForeground: "270 25% 15%",
      muted: "270 25% 90%",
      mutedForeground: "270 15% 45%",
      accent: "250 65% 55%",
      accentForeground: "0 0% 100%",
      border: "270 20% 87%",
      input: "270 22% 89%",
      ring: "265 60% 50%",
    },
  },
};

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const saved = localStorage.getItem("app-theme");
    return saved || "default";
  });

  const [customThemes, setCustomThemes] = useState<Record<string, Theme>>(() => {
    const saved = localStorage.getItem("custom-themes");
    return saved ? JSON.parse(saved) : {};
  });

  const allThemes = { ...themes, ...customThemes };

  useEffect(() => {
    const theme = allThemes[currentTheme];
    if (!theme) return;

    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    localStorage.setItem("app-theme", currentTheme);
  }, [currentTheme, allThemes]);

  const addCustomTheme = (name: string, colors: {
    background: string;
    primary: string;
    secondary: string;
  }) => {
    const customTheme: Theme = {
      name,
      label: name,
      isCustom: true,
      colors: {
        background: colors.background,
        foreground: "0 0% 100%",
        card: colors.background,
        cardForeground: "0 0% 100%",
        primary: colors.primary,
        primaryForeground: "0 0% 100%",
        secondary: colors.secondary,
        secondaryForeground: "0 0% 100%",
        muted: colors.background,
        mutedForeground: "0 0% 100%",
        accent: colors.primary,
        accentForeground: "0 0% 100%",
        border: colors.secondary,
        input: colors.background,
        ring: colors.primary,
      },
    };

    const newCustomThemes = { ...customThemes, [name]: customTheme };
    setCustomThemes(newCustomThemes);
    localStorage.setItem("custom-themes", JSON.stringify(newCustomThemes));
    setCurrentTheme(name);
  };

  const updateCustomTheme = (oldName: string, newName: string, colors: {
    background: string;
    primary: string;
    secondary: string;
  }) => {
    const newCustomThemes = { ...customThemes };
    
    // Remove old theme
    delete newCustomThemes[oldName];
    
    // Add updated theme
    const updatedTheme: Theme = {
      name: newName,
      label: newName,
      isCustom: true,
      colors: {
        background: colors.background,
        foreground: "0 0% 100%",
        card: colors.background,
        cardForeground: "0 0% 100%",
        primary: colors.primary,
        primaryForeground: "0 0% 100%",
        secondary: colors.secondary,
        secondaryForeground: "0 0% 100%",
        muted: colors.background,
        mutedForeground: "0 0% 100%",
        accent: colors.primary,
        accentForeground: "0 0% 100%",
        border: colors.secondary,
        input: colors.background,
        ring: colors.primary,
      },
    };
    
    newCustomThemes[newName] = updatedTheme;
    setCustomThemes(newCustomThemes);
    localStorage.setItem("custom-themes", JSON.stringify(newCustomThemes));
    
    // Update current theme if editing active theme
    if (currentTheme === oldName) {
      setCurrentTheme(newName);
    }
  };

  const deleteCustomTheme = (name: string) => {
    const newCustomThemes = { ...customThemes };
    delete newCustomThemes[name];
    setCustomThemes(newCustomThemes);
    localStorage.setItem("custom-themes", JSON.stringify(newCustomThemes));
    
    if (currentTheme === name) {
      setCurrentTheme("default");
    }
  };

  return {
    currentTheme,
    setTheme: setCurrentTheme,
    themes: allThemes,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
  };
};
