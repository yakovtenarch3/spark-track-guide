import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "app-typography-settings";

export interface TypographySettings {
  fontSize: number; // percentage, 100 = default
  fontFamily: string;
  headingFontFamily: string;
  lineHeight: number; // percentage, 100 = default (1.5)
  letterSpacing: number; // em value * 100
}

const DEFAULT_SETTINGS: TypographySettings = {
  fontSize: 100,
  fontFamily: "system-ui",
  headingFontFamily: "system-ui",
  lineHeight: 100,
  letterSpacing: 0,
};

export const FONT_OPTIONS = [
  { value: "system-ui", label: "ברירת מחדל" },
  { value: "'Rubik', sans-serif", label: "Rubik" },
  { value: "'Heebo', sans-serif", label: "Heebo" },
  { value: "'Assistant', sans-serif", label: "Assistant" },
  { value: "'Alef', sans-serif", label: "Alef" },
  { value: "'Secular One', sans-serif", label: "Secular One" },
  { value: "'Frank Ruhl Libre', serif", label: "Frank Ruhl Libre" },
  { value: "'David Libre', serif", label: "David Libre" },
  { value: "'Miriam Libre', sans-serif", label: "Miriam Libre" },
];

export const useTypography = () => {
  const [settings, setSettings] = useState<TypographySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    root.style.setProperty("--app-font-size", `${settings.fontSize}%`);
    root.style.fontSize = `${settings.fontSize}%`;
    
    // Apply font family
    root.style.setProperty("--app-font-family", settings.fontFamily);
    document.body.style.fontFamily = settings.fontFamily;
    
    // Apply heading font
    root.style.setProperty("--app-heading-font", settings.headingFontFamily);
    
    // Apply line height
    const lineHeightValue = 1.5 * (settings.lineHeight / 100);
    root.style.setProperty("--app-line-height", String(lineHeightValue));
    document.body.style.lineHeight = String(lineHeightValue);
    
    // Apply letter spacing
    const letterSpacingValue = settings.letterSpacing / 100;
    root.style.setProperty("--app-letter-spacing", `${letterSpacingValue}em`);
    document.body.style.letterSpacing = `${letterSpacingValue}em`;
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<TypographySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    DEFAULT_SETTINGS,
  };
};
