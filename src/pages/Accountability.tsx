import { useAccountabilityTracking } from "@/hooks/useAccountabilityTracking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Target,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sunrise,
  Bell,
  BellOff,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isAfter, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { useState, useMemo, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { getMissedDayMessage, checkAndNotifyMissedDays } from "@/utils/missedDaysNotifier";

const Accountability = () => {
  const { analytics, metrics, isLoading } = useAccountabilityTracking();
  const { permission, requestPermission } = useNotifications();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedFilters, setSelectedFilters] = useState({
    habits: true,
    goals: true,
    wakeUp: true,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("missedDaysNotificationsEnabled") === "true";
  });

  // Toggle missed days notifications
  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return;
      }
      setNotificationsEnabled(true);
      localStorage.setItem("missedDaysNotificationsEnabled", "true");
      toast.success("התראות על ימים שפספסת הופעלו!");
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem("missedDaysNotificationsEnabled", "false");
      toast.info("התראות על ימים שפספסת כובו");
    }
  };

  // Test notification
  const sendTestNotification = async () => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        toast.error("יש לאשר הרשאות התראות קודם");
        return;
      }
    }

    // Calculate missed days from metrics
    let missedCount = 0;
    for (let i = 0; i < metrics.length; i++) {
      if (!metrics[i].logged_in) {
        missedCount++;
      } else {
        break;
      }
    }

    if (missedCount === 0) {
      toast.success("מעולה! אין לך ימים שפספסת!");
      return;
    }

    const { title, body, quote } = getMissedDayMessage(missedCount);
    const fullBody = `${body}\n\n💡 "${quote.text}"\n- ${quote.author}`;
    
    new Notification(`⚠️ ${title}`, {
      body: fullBody,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
    
    toast.success("התראה נשלחה!");
  };

  // Filter metrics based on selected filters
  const filteredMetrics = useMemo(() => {
    return metrics.map((m) => {
      let score = 0;
      let logged = false;

      if (selectedFilters.habits && m.habits_completed > 0) {
        score += 40;
        logged = true;
      }
      if (selectedFilters.goals && m.goals_logged > 0) {
        score += 40;
        logged = true;
      }
      if (selectedFilters.wakeUp && m.wake_up_logged) {
        score += 20;
        logged = true;
      }

      return {
        ...m,
        engagement_score: Math.min(100, score),
        logged_in: logged,
      };
    });
  }, [metrics, selectedFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { currentStreak, longestStreak } = analytics;

  // Calculate completion data from filtered metrics
  const totalDays = filteredMetrics.length;
  const completedDays = filteredMetrics.filter((m) => m.logged_in && m.engagement_score >= 50).length;
  const incompleteDays = filteredMetrics.filter((m) => !m.logged_in).length;
  const partialDays = filteredMetrics.filter((m) => m.logged_in && m.engagement_score < 50).length;

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = startOfDay(new Date());

  const getDayData = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const metric = filteredMetrics.find((m) => m.date === dateStr);
    
    if (isAfter(day, today)) {
      return { status: "future", metric: null };
    }
    
    if (!metric || !metric.logged_in) {
      return { status: "missed", metric };
    }
    if (metric.engagement_score >= 70) {
      return { status: "completed", metric };
    }
    if (metric.engagement_score >= 40) {
      return { status: "partial", metric };
    }
    return { status: "low", metric };
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Count activities
  const totalHabitsLogged = metrics.reduce((sum, m) => sum + m.habits_completed, 0);
  const totalGoalsLogged = metrics.reduce((sum, m) => sum + m.goals_logged, 0);
  const totalWakeUpsLogged = metrics.filter((m) => m.wake_up_logged).length;

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">בדיקת מעקב</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            באילו ימים סימנת פעילות ובאילו פספסת
          </p>
          
          {/* Notification Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
            <Button
              variant={notificationsEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleNotifications}
              className="gap-2"
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="w-4 h-4" />
                  התראות מופעלות
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  הפעל התראות
                </>
              )}
            </Button>
            
            {incompleteDays > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={sendTestNotification}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                שלח התראה על {incompleteDays} ימים שפספסתי
              </Button>
            )}
          </div>
        </div>

        {/* Main Stats Card */}
        <Card className="p-4 sm:p-6 md:p-8 text-center" dir="rtl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 sm:border-6 md:border-8 border-primary/20 flex items-center justify-center">
                <Target className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary" />
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-success">{completedDays}</div>
              <div className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground">/ {totalDays}</div>
            </div>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2">
            ימים שסימנת פעילות מתוך 60 הימים האחרונים
          </p>
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-success h-3 rounded-full transition-all"
                style={{ width: `${totalDays > 0 ? (completedDays / totalDays) * 100 : 0}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" dir="rtl">
          <Card className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-success">{completedDays}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">ימים מלאים</div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between">
              <XCircle className="w-5 h-5 text-destructive" />
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-destructive">{incompleteDays}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">ימים שפספסת</div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between">
              <Target className="w-5 h-5 text-primary" />
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{currentStreak}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">רצף נוכחי</div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-warning">{longestStreak}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">רצף שיא</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-bold">
                {format(currentMonth, "MMMM yyyy", { locale: he })}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={prevMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <TooltipProvider>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Headers */}
                {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day) => (
                  <div key={day} className="text-center font-bold text-xs sm:text-sm p-1 sm:p-2">
                    {day}
                  </div>
                ))}

                {/* Days */}
                {daysInMonth.map((day) => {
                  const { status, metric } = getDayData(day);
                  const isToday = isSameDay(day, today);
                  
                  const bgColor =
                    status === "future"
                      ? "bg-muted/30"
                      : status === "completed"
                      ? "bg-success text-success-foreground"
                      : status === "partial"
                      ? "bg-warning/80 text-warning-foreground"
                      : status === "low"
                      ? "bg-warning/50"
                      : status === "missed"
                      ? "bg-destructive/70 text-destructive-foreground"
                      : "bg-muted";

                  const content = (
                    <div
                      className={`aspect-square flex flex-col items-center justify-center rounded-md sm:rounded-lg ${bgColor} text-xs sm:text-sm font-medium transition-all hover:scale-105 cursor-pointer ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
                    >
                      <span>{format(day, "d")}</span>
                      {metric && status !== "future" && (
                        <div className="flex gap-0.5 mt-0.5">
                          {metric.habits_completed > 0 && selectedFilters.habits && (
                            <div className="w-1 h-1 rounded-full bg-purple-600" />
                          )}
                          {metric.goals_logged > 0 && selectedFilters.goals && (
                            <div className="w-1 h-1 rounded-full bg-green-600" />
                          )}
                          {metric.wake_up_logged && selectedFilters.wakeUp && (
                            <div className="w-1 h-1 rounded-full bg-blue-600" />
                          )}
                        </div>
                      )}
                    </div>
                  );

                  if (status === "future") {
                    return <div key={day.toISOString()}>{content}</div>;
                  }

                  return (
                    <Tooltip key={day.toISOString()}>
                      <TooltipTrigger asChild>{content}</TooltipTrigger>
                      <TooltipContent side="top" className="text-right" dir="rtl">
                        <div className="text-sm font-medium mb-1">
                          {format(day, "EEEE, d MMMM", { locale: he })}
                        </div>
                        {metric ? (
                          <div className="space-y-1 text-xs">
                            {selectedFilters.habits && (
                              <div className="flex items-center gap-1 justify-end">
                                <span>הרגלים: {metric.habits_completed}</span>
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                              </div>
                            )}
                            {selectedFilters.goals && (
                              <div className="flex items-center gap-1 justify-end">
                                <span>יעדים: {metric.goals_logged}</span>
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              </div>
                            )}
                            {selectedFilters.wakeUp && (
                              <div className="flex items-center gap-1 justify-end">
                                <span>{metric.wake_up_logged ? "נרשמה קימה ✓" : "לא נרשמה קימה"}</span>
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              </div>
                            )}
                            <div className="border-t pt-1 mt-1">
                              ציון: {metric.engagement_score}%
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-destructive">לא נרשמה פעילות</div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-6 justify-center text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-success" />
                <span>מלא (70%+)</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-warning/80" />
                <span>חלקי (40-70%)</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-destructive/70" />
                <span>החמצה</span>
              </div>
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-4 sm:p-6" dir="rtl">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-right">מה נמצא בבדיקה</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Checkbox
                  id="habits"
                  checked={selectedFilters.habits}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, habits: !!checked })
                  }
                />
                <label htmlFor="habits" className="flex-1 cursor-pointer text-right">
                  <div className="font-medium text-sm sm:text-base">הרגלים</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">השלמות הרגלים יומיות</div>
                </label>
                <Badge variant="secondary" className="text-xs">{totalHabitsLogged}</Badge>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <Checkbox
                  id="goals"
                  checked={selectedFilters.goals}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, goals: !!checked })
                  }
                />
                <label htmlFor="goals" className="flex-1 cursor-pointer text-right">
                  <div className="font-medium text-sm sm:text-base">יעדים יומיים</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">רישום הצלחה/כישלון</div>
                </label>
                <Badge variant="secondary" className="text-xs">{totalGoalsLogged}</Badge>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Checkbox
                  id="wake-up"
                  checked={selectedFilters.wakeUp}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, wakeUp: !!checked })
                  }
                />
                <label htmlFor="wake-up" className="flex-1 cursor-pointer text-right">
                  <div className="font-medium text-sm sm:text-base">קימה בבוקר</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">מעקב זמני קימה</div>
                </label>
                <Badge variant="secondary" className="text-xs">{totalWakeUpsLogged}</Badge>
              </div>
            </div>

            {/* Recommendations */}
            {analytics.recommendations.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3 text-right">המלצות</h4>
                <div className="space-y-2">
                  {analytics.recommendations.slice(0, 3).map((rec, i) => (
                    <div key={i} className="text-sm text-muted-foreground text-right p-2 bg-muted/50 rounded">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Summary Section */}
        <Card className="p-4 sm:p-6" dir="rtl">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-right">סיכום 60 ימים אחרונים</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Progress Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="hsl(var(--success))"
                    strokeWidth="10"
                    strokeDasharray={`${totalDays > 0 ? (completedDays / totalDays) * 352 : 0} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold">
                    {totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">אחוז הצלחה כללי</div>
            </div>

            {/* Stats */}
            <div className="space-y-3 sm:col-span-2">
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <Badge className="bg-success">{completedDays}</Badge>
                <span className="font-medium">ימים מלאים</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                <Badge className="bg-warning">{partialDays}</Badge>
                <span className="font-medium">ימים חלקיים</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <Badge className="bg-destructive">{incompleteDays}</Badge>
                <span className="font-medium">ימים שפספסת</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <Badge className="bg-primary">{longestStreak}</Badge>
                <span className="font-medium">רצף הכי ארוך</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Accountability;
