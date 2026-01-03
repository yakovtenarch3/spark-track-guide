import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import { QuoteManagement } from "@/components/QuoteManagement";
import { TypographySettings } from "@/components/TypographySettings";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Settings as SettingsIcon, Code2, Terminal, Inspect, KeyRound, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDeveloperMode } from "@/hooks/useDeveloperMode";
import { Badge } from "@/components/ui/badge";
import { ApiKeysManager } from "@/components/ApiKeysManager";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { enabled, consoleEnabled, inspectorEnabled, toggleDevMode, toggleConsole, toggleInspector, hardRefresh } = useDeveloperMode();
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleHardRefresh = async () => {
    setIsRefreshing(true);
    await hardRefresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-3 sm:p-4 md:p-6 overflow-x-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <div className="flex-1" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center flex items-center justify-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            הגדרות
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setApiKeysOpen(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="ניהול מפתחות API"
            >
              <KeyRound className="h-6 w-6 text-[#1e3a5f]" />
            </button>
          </div>
        </div>

        <ApiKeysManager open={apiKeysOpen} onOpenChange={setApiKeysOpen} />

        <div className="space-y-4 sm:space-y-6">
          {/* Developer Mode */}
          <Card className="border-2 border-orange-200 bg-orange-50/50">
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
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
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
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
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

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
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

                  {/* כפתור ניקוי קאש עמוק */}
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleHardRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? '🔄 מנקה קאש...' : '🗑️ ניקוי קאש עמוק וריענון'}
                  </Button>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
                    <p className="font-medium text-blue-900">💡 טיפים:</p>
                    <ul className="text-blue-800 list-disc list-inside space-y-1">
                      <li><strong>קונסול:</strong> אוסף את כל console.log, שגיאות ואזהרות</li>
                      <li><strong>זיהוי:</strong> לחץ על אלמנט לראות שם קומפוננטה ומיקום</li>
                      <li><strong>ניקוי קאש:</strong> מנקה הכל ומרענן - לפתרון בעיות</li>
                    </ul>
                  </div>

                  {(consoleEnabled || inspectorEnabled) && (
                    <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg text-sm">
                      <p className="font-medium text-orange-900">⚠️ שים לב:</p>
                      <p className="text-orange-800">
                        הכפתורים מופיעים בצד שמאל למטה של המסך. הבחירות נשמרות אוטומטית.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ערכות נושא</CardTitle>
              <CardDescription>התאם אישית את מראה האפליקציה</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>

          <TypographySettings />

          <NotificationSettings />

          <Card>
            <CardHeader>
              <CardTitle>משפטי מוטיבציה</CardTitle>
              <CardDescription>נהל את משפטי המוטיבציה המותאמים אישית שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteManagement />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
