import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Code2, 
  Terminal, 
  Inspect, 
  KeyRound, 
  RefreshCw,
  Palette,
  Bell,
  Type,
  Quote,
  AlarmClock,
  Volume2,
  Mail,
  MessageCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeveloperMode } from "@/hooks/useDeveloperMode";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiKeysManager } from "@/components/ApiKeysManager";
import { ThemeSelector } from "@/components/ThemeSelector";
import { QuoteManagement } from "@/components/QuoteManagement";
import { TypographySettings } from "@/components/TypographySettings";
import { NotificationSettings } from "@/components/NotificationSettings";
import { SmartNotifications } from "@/components/SmartNotifications";
import { AlarmManager } from "@/components/AlarmManager";

export default function Settings() {
  const { enabled, consoleEnabled, inspectorEnabled, toggleDevMode, toggleConsole, toggleInspector, hardRefresh } = useDeveloperMode();
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const isMobile = useIsMobile();

  const handleHardRefresh = async () => {
    setIsRefreshing(true);
    await hardRefresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-3 sm:p-4 md:p-6 overflow-x-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex-1" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center flex items-center justify-center gap-2">
            <SettingsIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            הגדרות
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setApiKeysOpen(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="ניהול מפתחות API"
            >
              <KeyRound className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </button>
          </div>
        </div>

        <ApiKeysManager open={apiKeysOpen} onOpenChange={setApiKeysOpen} />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-12 sm:h-14">
            <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Bell className="h-4 w-4" />
              <span className="hidden xs:inline">התראות</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Palette className="h-4 w-4" />
              <span className="hidden xs:inline">מראה</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Quote className="h-4 w-4" />
              <span className="hidden xs:inline">תוכן</span>
            </TabsTrigger>
            {!isMobile && (
              <TabsTrigger value="developer" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Code2 className="h-4 w-4" />
                <span className="hidden xs:inline">פיתוח</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Notifications Tab - The most comprehensive one */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Quick Status Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">מרכז התראות ותזכורות</CardTitle>
                    <CardDescription>
                      נהל התראות push, תזכורות, שעונים מעוררים, מיילים ו-WhatsApp
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Sub-tabs for notification types */}
            <Tabs defaultValue="smart" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 h-11">
                <TabsTrigger value="smart" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">התראות חכמות</span>
                  <span className="sm:hidden">חכמות</span>
                </TabsTrigger>
                <TabsTrigger value="channels" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">ערוצים</span>
                  <span className="sm:hidden">ערוצים</span>
                </TabsTrigger>
                <TabsTrigger value="alarms" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <AlarmClock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">שעונים</span>
                  <span className="sm:hidden">שעונים</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">תזמונים</span>
                  <span className="sm:hidden">תזמון</span>
                </TabsTrigger>
              </TabsList>

              {/* Smart Notifications */}
              <TabsContent value="smart">
                <SmartNotifications />
              </TabsContent>

              {/* Channels - Email, SMS, WhatsApp */}
              <TabsContent value="channels">
                <NotificationSettings />
              </TabsContent>

              {/* Alarms */}
              <TabsContent value="alarms">
                <AlarmManager />
              </TabsContent>

              {/* Schedule - Timer reminders info */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      תזכורות מתוזמנות
                    </CardTitle>
                    <CardDescription>
                      תזכורות שהגדרת בחלקים שונים של האפליקציה
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Bell className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">תזכורות טיימר</p>
                            <p className="text-sm text-muted-foreground">
                              נקבעות מדף הטיימר → יעדים
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Bell className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">תזכורות הרגלים</p>
                            <p className="text-sm text-muted-foreground">
                              נקבעות מכרטיס ההרגל עצמו
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-purple-500/10">
                            <Bell className="h-4 w-4 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium">תזכורות יעדים יומיים</p>
                            <p className="text-sm text-muted-foreground">
                              נקבעות מדף המטרות היומיות
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-orange-500/10">
                            <Bell className="h-4 w-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium">תזכורת השכמה</p>
                            <p className="text-sm text-muted-foreground">
                              נקבעת מדף מעקב השכמה
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-200">💡 טיפ</p>
                      <p className="text-blue-800 dark:text-blue-300 mt-1">
                        כל התזכורות נשלחות כהתראות Push ישירות לדפדפן שלך.
                        וודא שהתראות מופעלות בטאב "התראות חכמות".
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  ערכות נושא
                </CardTitle>
                <CardDescription>התאם אישית את מראה האפליקציה</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSelector />
              </CardContent>
            </Card>

            <TypographySettings />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5" />
                  משפטי מוטיבציה
                </CardTitle>
                <CardDescription>נהל את משפטי המוטיבציה המותאמים אישית שלך</CardDescription>
              </CardHeader>
              <CardContent>
                <QuoteManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Developer Tab - Only on desktop */}
          {!isMobile && (
            <TabsContent value="developer" className="space-y-6">
              <Card className="border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-orange-600" />
                    מצב פיתוח
                    {enabled && <Badge variant="destructive">פעיל</Badge>}
                  </CardTitle>
                  <CardDescription>כלי פיתוח לניפוי באגים ובדיקות</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Code2 className="h-5 w-5 text-orange-600" />
                      <div>
                        <Label htmlFor="dev-mode" className="text-base font-medium cursor-pointer">
                          הפעל מצב פיתוח
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          אפשר גישה לכלי פיתוח מתקדמים
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="dev-mode"
                      checked={enabled}
                      onCheckedChange={toggleDevMode}
                    />
                  </div>

                  {/* Developer Tools - Only visible when enabled */}
                  {enabled && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-background rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Terminal className="h-5 w-5 text-green-600" />
                          <div>
                            <Label htmlFor="console" className="text-base font-medium cursor-pointer">
                              🖥️ קונסול מפתחים
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              הצג לוגים, שגיאות ואזהרות בזמן אמת
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="console"
                          checked={consoleEnabled}
                          onCheckedChange={toggleConsole}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white dark:bg-background rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Inspect className="h-5 w-5 text-blue-600" />
                          <div>
                            <Label htmlFor="inspector" className="text-base font-medium cursor-pointer">
                              🔍 זיהוי אלמנטים
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              לחץ על כל אלמנט לזיהוי - כמו באלמנטור
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="inspector"
                          checked={inspectorEnabled}
                          onCheckedChange={toggleInspector}
                        />
                      </div>

                      {/* Hard refresh button */}
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleHardRefresh}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? '🔄 מנקה קאש...' : '🗑️ ניקוי קאש עמוק וריענון'}
                      </Button>

                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm space-y-2">
                        <p className="font-medium text-blue-900 dark:text-blue-200">💡 טיפים:</p>
                        <ul className="text-blue-800 dark:text-blue-300 list-disc list-inside space-y-1">
                          <li><strong>קונסול:</strong> אוסף את כל console.log, שגיאות ואזהרות</li>
                          <li><strong>זיהוי:</strong> לחץ על אלמנט לראות שם קומפוננטה ומיקום</li>
                          <li><strong>ניקוי קאש:</strong> מנקה הכל ומרענן - לפתרון בעיות</li>
                        </ul>
                      </div>

                      {(consoleEnabled || inspectorEnabled) && (
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg text-sm">
                          <p className="font-medium text-orange-900 dark:text-orange-200">⚠️ שים לב:</p>
                          <p className="text-orange-800 dark:text-orange-300">
                            הכפתורים מופיעים בצד שמאל למטה של המסך. הבחירות נשמרות אוטומטית.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
