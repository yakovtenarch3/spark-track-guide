import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, Bell, Wifi, Zap } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      toast.success("האפליקציה הותקנה בהצלחה! 🎉");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success("מתחיל התקנה...");
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const features = [
    {
      icon: Wifi,
      title: "עובד אופליין",
      description: "המשך לעקוב אחרי ההרגלים שלך גם בלי אינטרנט",
    },
    {
      icon: Bell,
      title: "התראות דחיפה",
      description: "קבל תזכורות להרגלים היומיים שלך",
    },
    {
      icon: Smartphone,
      title: "התקנה קלה",
      description: "תוסיף למסך הבית כמו כל אפליקציה",
    },
    {
      icon: Zap,
      title: "מהיר וקליל",
      description: "נטען מהר ופועל בצורה חלקה",
    },
  ];

  if (isInstalled) {
    return (
      <div className="container mx-auto p-6 max-w-2xl" dir="rtl">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">האפליקציה מותקנת!</CardTitle>
            <CardDescription>
              האפליקציה כבר מותקנת במכשיר שלך ופועלת במצב אופליין
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = "/"} size="lg">
              חזור לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          התקן את האפליקציה
        </h1>
        <p className="text-lg text-muted-foreground">
          קבל גישה מהירה, עבוד אופליין, וקבל התראות
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <feature.icon className="w-10 h-10 mb-2 text-primary" />
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <Download className="w-12 h-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">מוכן להתקנה?</CardTitle>
          <CardDescription>
            {isInstallable
              ? "לחץ על הכפתור למטה כדי להתקין את האפליקציה"
              : "השתמש בתפריט הדפדפן שלך כדי להוסיף למסך הבית"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isInstallable ? (
            <Button onClick={handleInstall} size="lg" className="w-full max-w-sm">
              <Download className="ml-2 h-5 w-5" />
              התקן עכשיו
            </Button>
          ) : (
            <div className="space-y-4 text-right max-w-md mx-auto">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">📱 באייפון:</h3>
                <p className="text-sm text-muted-foreground">
                  לחץ על כפתור השיתוף (
                  <span className="inline-block">⬆️</span>) ובחר "הוסף למסך הבית"
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">🤖 באנדרואיד:</h3>
                <p className="text-sm text-muted-foreground">
                  לחץ על תפריט הדפדפן (⋮) ובחר "הוסף למסך הבית" או "התקן אפליקציה"
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
