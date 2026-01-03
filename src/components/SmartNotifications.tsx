import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Bell,
  BellOff,
  Clock,
  Target,
  Flame,
  Trophy,
  Smartphone,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Settings,
  TestTube,
} from "lucide-react";
import { toast } from "sonner";

interface SmartNotificationSettings {
  enabled: boolean;
  habitReminders: boolean;
  streakAlerts: boolean;
  goalProgress: boolean;
  motivationalQuotes: boolean;
  weeklyReports: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  frequency: "low" | "medium" | "high";
}

const defaultSettings: SmartNotificationSettings = {
  enabled: false,
  habitReminders: true,
  streakAlerts: true,
  goalProgress: true,
  motivationalQuotes: true,
  weeklyReports: true,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  soundEnabled: true,
  vibrationEnabled: true,
  frequency: "medium",
};

export const SmartNotifications = () => {
  const [settings, setSettings] = useState<SmartNotificationSettings>(() => {
    const saved = localStorage.getItem("smart-notification-settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isRegistering, setIsRegistering] = useState(false);

  // Check notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem("smart-notification-settings", JSON.stringify(settings));
  }, [settings]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("הדפדפן לא תומך בהתראות");
      return;
    }

    setIsRegistering(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("התראות הופעלו בהצלחה!");
        setSettings((prev) => ({ ...prev, enabled: true }));
        
        // Register service worker for push
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log("Service Worker ready for notifications:", registration);
        }
      } else if (result === "denied") {
        toast.error("התראות נחסמו. יש לאפשר בהגדרות הדפדפן");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("שגיאה בהפעלת התראות");
    } finally {
      setIsRegistering(false);
    }
  };

  const sendTestNotification = () => {
    if (permission !== "granted") {
      toast.error("יש להפעיל התראות קודם");
      return;
    }

    try {
      new Notification("🔔 Spark Track", {
        body: "זוהי התראת בדיקה! ההתראות פועלות מצוין ✨",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "test-notification",
        silent: !settings.soundEnabled,
      });
      toast.success("התראת בדיקה נשלחה!");
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("שגיאה בשליחת התראה");
    }
  };

  const updateSettings = (updates: Partial<SmartNotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const notificationTypes = [
    {
      key: "habitReminders" as keyof SmartNotificationSettings,
      label: "תזכורות להרגלים",
      description: "קבל תזכורת לפני סיום היום",
      icon: Clock,
      color: "blue",
    },
    {
      key: "streakAlerts" as keyof SmartNotificationSettings,
      label: "התראות רצף",
      description: "הזהר לפני שהרצף נשבר",
      icon: Flame,
      color: "orange",
    },
    {
      key: "goalProgress" as keyof SmartNotificationSettings,
      label: "התקדמות יעדים",
      description: "עדכונים על התקדמות ביעדים",
      icon: Target,
      color: "green",
    },
    {
      key: "motivationalQuotes" as keyof SmartNotificationSettings,
      label: "משפטים מעוררי השראה",
      description: "קבל מוטיבציה יומית",
      icon: Trophy,
      color: "purple",
    },
    {
      key: "weeklyReports" as keyof SmartNotificationSettings,
      label: "דוחות שבועיים",
      description: "סיכום שבועי של ההתקדמות",
      icon: Smartphone,
      color: "cyan",
    },
  ];

  const frequencyOptions = [
    { value: "low" as const, label: "נמוך", description: "1-2 התראות ביום" },
    { value: "medium" as const, label: "בינוני", description: "3-5 התראות ביום" },
    { value: "high" as const, label: "גבוה", description: "6+ התראות ביום" },
  ];

  const getPermissionStatus = () => {
    switch (permission) {
      case "granted":
        return { icon: CheckCircle, text: "התראות מופעלות", color: "text-green-500" };
      case "denied":
        return { icon: AlertTriangle, text: "התראות חסומות", color: "text-red-500" };
      default:
        return { icon: Bell, text: "יש לאפשר התראות", color: "text-yellow-500" };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-none shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-purple-500" />
            התראות חכמות
          </CardTitle>
          <Badge className={`flex items-center gap-1 ${permissionStatus.color}`}>
            <permissionStatus.icon className="w-3 h-3" />
            {permissionStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Permission Request */}
        {permission !== "granted" && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">התראות לא מופעלות</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  הפעל התראות כדי לקבל תזכורות, עדכוני התקדמות והודעות מוטיבציה
                </p>
                <Button
                  onClick={requestPermission}
                  disabled={isRegistering}
                  className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white"
                  size="sm"
                >
                  {isRegistering ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      מפעיל...
                    </span>
                  ) : (
                    "הפעל התראות"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Master Toggle */}
        {permission === "granted" && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <Bell className="w-5 h-5 text-purple-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-sm">התראות פעילות</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  הפעל/כבה את כל ההתראות
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </div>
        )}

        {/* Notification Types */}
        {permission === "granted" && settings.enabled && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              סוגי התראות
            </Label>
            {notificationTypes.map((type) => (
              <div
                key={type.key}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <type.icon className={`w-4 h-4 text-${type.color}-500`} />
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings[type.key] as boolean}
                  onCheckedChange={(checked) =>
                    updateSettings({ [type.key]: checked })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Frequency */}
        {permission === "granted" && settings.enabled && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              תדירות התראות
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {frequencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSettings({ frequency: option.value })}
                  className={`p-3 rounded-lg text-center transition-all ${
                    settings.frequency === option.value
                      ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-400"
                      : "bg-gray-100 dark:bg-gray-700 border-2 border-transparent"
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quiet Hours */}
        {permission === "granted" && settings.enabled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                שעות שקט
              </Label>
              <Switch
                checked={settings.quietHoursEnabled}
                onCheckedChange={(quietHoursEnabled) =>
                  updateSettings({ quietHoursEnabled })
                }
              />
            </div>
            {settings.quietHoursEnabled && (
              <div className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                    התחלה
                  </Label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) =>
                      updateSettings({ quietHoursStart: e.target.value })
                    }
                    className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-center"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                    סיום
                  </Label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) =>
                      updateSettings({ quietHoursEnd: e.target.value })
                    }
                    className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-center"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sound & Vibration */}
        {permission === "granted" && settings.enabled && (
          <div className="flex gap-4">
            <div className="flex-1 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-blue-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm">צליל</span>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(soundEnabled) => updateSettings({ soundEnabled })}
              />
            </div>
            <div className="flex-1 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-500" />
                <span className="text-sm">רטט</span>
              </div>
              <Switch
                checked={settings.vibrationEnabled}
                onCheckedChange={(vibrationEnabled) =>
                  updateSettings({ vibrationEnabled })
                }
              />
            </div>
          </div>
        )}

        {/* Test Notification */}
        {permission === "granted" && (
          <Button
            onClick={sendTestNotification}
            variant="outline"
            className="w-full"
          >
            <TestTube className="w-4 h-4 ml-2" />
            שלח התראת בדיקה
          </Button>
        )}

        {/* Info */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
          🔔 התראות חכמות מותאמות אישית לפי דפוסי הפעילות שלך
        </p>
      </CardContent>
    </Card>
  );
};

export default SmartNotifications;
