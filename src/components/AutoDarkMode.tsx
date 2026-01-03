import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Clock, Monitor } from "lucide-react";
import { toast } from "sonner";

interface AutoDarkModeSettings {
  enabled: boolean;
  mode: "system" | "schedule" | "manual";
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

const defaultSettings: AutoDarkModeSettings = {
  enabled: false,
  mode: "system",
  startTime: "20:00",
  endTime: "07:00",
};

export const AutoDarkMode = () => {
  const [settings, setSettings] = useState<AutoDarkModeSettings>(() => {
    const saved = localStorage.getItem("auto-dark-mode-settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

  // Apply theme based on settings
  useEffect(() => {
    const applyTheme = () => {
      let shouldBeDark = false;

      if (settings.enabled) {
        if (settings.mode === "system") {
          // Follow system preference
          shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        } else if (settings.mode === "schedule") {
          // Check if current time is within dark mode schedule
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          
          const [startHour, startMin] = settings.startTime.split(":").map(Number);
          const [endHour, endMin] = settings.endTime.split(":").map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          // Handle overnight schedule (e.g., 20:00 - 07:00)
          if (startMinutes > endMinutes) {
            shouldBeDark = currentMinutes >= startMinutes || currentMinutes < endMinutes;
          } else {
            shouldBeDark = currentMinutes >= startMinutes && currentMinutes < endMinutes;
          }
        }
      }

      setCurrentTheme(shouldBeDark ? "dark" : "light");
      
      // Apply theme to document
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (settings.mode === "system") applyTheme();
    };
    mediaQuery.addEventListener("change", handleChange);

    // Check schedule every minute
    const interval = setInterval(applyTheme, 60000);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      clearInterval(interval);
    };
  }, [settings]);

  // Save settings
  useEffect(() => {
    localStorage.setItem("auto-dark-mode-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AutoDarkModeSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleManualDark = () => {
    if (!settings.enabled || settings.mode === "manual") {
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      setCurrentTheme(newTheme);
      toast.success(`מצב ${newTheme === "dark" ? "לילה" : "יום"} הופעל`);
    }
  };

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-none shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {currentTheme === "dark" ? (
            <Moon className="w-5 h-5 text-purple-400" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-500" />
          )}
          מצב לילה אוטומטי
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable Auto Dark Mode */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-dark" className="text-sm font-medium">
            הפעל מצב לילה אוטומטי
          </Label>
          <Switch
            id="auto-dark"
            checked={settings.enabled}
            onCheckedChange={(enabled) => {
              updateSettings({ enabled });
              toast.success(enabled ? "מצב לילה אוטומטי הופעל" : "מצב לילה אוטומטי כבוי");
            }}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Mode Selection */}
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                שיטת הפעלה
              </Label>

              {/* System Mode */}
              <button
                onClick={() => updateSettings({ mode: "system" })}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                  settings.mode === "system"
                    ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-400"
                    : "bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300"
                }`}
              >
                <Monitor className="w-5 h-5 text-purple-500" />
                <div className="text-right">
                  <p className="font-medium text-sm">לפי המערכת</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    עוקב אחרי הגדרות המערכת שלך
                  </p>
                </div>
              </button>

              {/* Schedule Mode */}
              <button
                onClick={() => updateSettings({ mode: "schedule" })}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                  settings.mode === "schedule"
                    ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-400"
                    : "bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300"
                }`}
              >
                <Clock className="w-5 h-5 text-blue-500" />
                <div className="text-right">
                  <p className="font-medium text-sm">לפי לוח זמנים</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    קבע שעות קבועות למצב לילה
                  </p>
                </div>
              </button>

              {/* Schedule Time Inputs */}
              {settings.mode === "schedule" && (
                <div className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                      התחלה (לילה)
                    </Label>
                    <input
                      type="time"
                      value={settings.startTime}
                      onChange={(e) => updateSettings({ startTime: e.target.value })}
                      className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-center"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                      סיום (יום)
                    </Label>
                    <input
                      type="time"
                      value={settings.endTime}
                      onChange={(e) => updateSettings({ endTime: e.target.value })}
                      className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Manual Toggle Button */}
        <button
          onClick={toggleManualDark}
          className="w-full p-3 mt-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {currentTheme === "dark" ? (
            <>
              <Sun className="w-5 h-5" />
              עבור למצב יום
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              עבור למצב לילה
            </>
          )}
        </button>

        {/* Current Status */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
          מצב נוכחי: {currentTheme === "dark" ? "🌙 לילה" : "☀️ יום"}
          {settings.enabled && settings.mode === "schedule" && (
            <span className="block mt-1">
              לוח זמנים: {settings.startTime} - {settings.endTime}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoDarkMode;
