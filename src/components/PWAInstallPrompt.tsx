import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Smartphone,
  Monitor,
  X,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("desktop");

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if not dismissed before
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      toast.success("האפליקציה הותקנה בהצלחה! 🎉");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS or when prompt is not available
      toast.info(getInstallInstructions());
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        toast.success("תודה! האפליקציה מותקנת");
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Install error:", error);
      toast.error("שגיאה בהתקנה");
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const getInstallInstructions = (): string => {
    switch (platform) {
      case "ios":
        return "לחץ על כפתור השיתוף ואז 'הוסף למסך הבית'";
      case "android":
        return "לחץ על תפריט הדפדפן ואז 'התקן אפליקציה'";
      default:
        return "לחץ על אייקון ההתקנה בשורת הכתובת";
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case "ios":
      case "android":
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Badge className="bg-green-500 text-white flex items-center gap-2 px-3 py-2">
          <CheckCircle className="w-4 h-4" />
          מותקן כאפליקציה
        </Badge>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-2xl" />
        
        {/* Close button */}
        <button
          onClick={dismissPrompt}
          className="absolute top-2 left-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Content */}
        <div className="relative">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm">התקן את Spark Track</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                גישה מהירה מהמסך הראשי
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>עובד גם בלי אינטרנט</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>התראות ותזכורות</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>גישה מהירה מהמסך הראשי</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90"
              size="sm"
            >
              <Download className="w-4 h-4 ml-2" />
              התקן עכשיו
            </Button>
            <Button
              onClick={dismissPrompt}
              variant="ghost"
              size="sm"
            >
              לא עכשיו
            </Button>
          </div>

          {/* Platform hint */}
          <p className="text-[10px] text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
            {getPlatformIcon()}
            {platform === "ios" && "iPhone/iPad"}
            {platform === "android" && "Android"}
            {platform === "desktop" && "Desktop"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
