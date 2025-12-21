import { useState, useEffect } from "react";
import { format, subDays, startOfDay, isSameDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isFuture, parseISO, differenceInDays } from "date-fns";
import { WakeUpAnalytics } from "./WakeUpAnalytics";
import { he } from "date-fns/locale";
import { useWakeUpLogs } from "@/hooks/useWakeUpLogs";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  Sun, 
  Moon, 
  Flame, 
  Trophy, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X,
  Clock,
  TrendingUp,
  Target,
  Sparkles,
  AlertTriangle,
  ArrowUp,
  MessageSquare,
  Bell,
  BellOff,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export const WakeUpTracker = () => {
  const queryClient = useQueryClient();
  const { 
    logs, 
    isLoading, 
    toggleWakeUp, 
    currentStreak, 
    longestStreak, 
    getLogForDate,
    monthlyStats 
  } = useWakeUpLogs();
  
  const { permission, requestPermission } = useNotifications();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [actualTime, setActualTime] = useState("");
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Wake-up settings
  const [targetTime, setTargetTime] = useState(() => {
    return localStorage.getItem("wakeUpTargetTime") || "06:00";
  });
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    return localStorage.getItem("wakeUpReminderEnabled") === "true";
  });
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(() => {
    return parseInt(localStorage.getItem("wakeUpReminderMinutes") || "15");
  });

  // Save wake-up reminder to localStorage
  useEffect(() => {
    localStorage.setItem("wakeUpTargetTime", targetTime);
    localStorage.setItem("wakeUpReminderEnabled", String(reminderEnabled));
    localStorage.setItem("wakeUpReminderMinutes", String(reminderMinutesBefore));
    
    if (reminderEnabled && targetTime) {
      // Calculate reminder time (before target)
      const [hours, minutes] = targetTime.split(":").map(Number);
      let reminderMinutes = hours * 60 + minutes - reminderMinutesBefore;
      if (reminderMinutes < 0) reminderMinutes += 24 * 60;
      
      const reminderHours = Math.floor(reminderMinutes / 60);
      const reminderMins = reminderMinutes % 60;
      
      const reminder = {
        id: "wakeup",
        title: "הגיע זמן לקום!",
        body: `עוד ${reminderMinutesBefore} דקות ליעד הקימה שלך (${targetTime})`,
        time: `${reminderHours.toString().padStart(2, "0")}:${reminderMins.toString().padStart(2, "0")}`,
        hours: reminderHours,
        minutes: reminderMins,
        type: "wakeup",
      };
      
      localStorage.setItem("wakeUpReminder", JSON.stringify(reminder));
    } else {
      localStorage.removeItem("wakeUpReminder");
    }
  }, [reminderEnabled, targetTime, reminderMinutesBefore]);

  const handleEnableReminder = async () => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setReminderEnabled(true);
    toast.success("התזכורת לקימה הופעלה!");
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for week alignment (Sunday start)
  const startPadding = monthStart.getDay();
  const paddedDays = [
    ...Array(startPadding).fill(null),
    ...days
  ];

  const weekDays = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

  const handleDayClick = (date: Date) => {
    if (isFuture(date)) return;
    
    const log = getLogForDate(date);
    setSelectedDate(date);
    setActualTime(log?.actual_time?.slice(0, 5) || "");
    setNotes(log?.notes || "");
    setDialogOpen(true);
  };

  const handleSaveWakeUp = (wokeUp: boolean) => {
    if (!selectedDate) return;

    toggleWakeUp.mutate({
      date: selectedDate,
      wokeUp,
      // We still store details even when "לא קמתי" (meaning: not on time)
      actualTime: actualTime || undefined,
      notes: notes || undefined,
    });

    setDialogOpen(false);
    setActualTime("");
    setNotes("");
  };

  const handleClearMark = async () => {
    if (!selectedDate) return;
    
    const log = getLogForDate(selectedDate);
    if (!log) return;

    const { error } = await supabase
      .from("wake_up_logs")
      .delete()
      .eq("id", log.id);

    if (error) {
      toast.error("שגיאה במחיקת הסימון");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["wake-up-logs"] });
    toast.success("הסימון בוטל");
    setDialogOpen(false);
    setActualTime("");
    setNotes("");
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const getDayStatus = (date: Date) => {
    const log = getLogForDate(date);
    if (!log) return "empty";
    return log.woke_up ? "success" : "failed";
  };

  // Calculate falls and recoveries
  const getFallsHistory = () => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.wake_date).getTime() - new Date(a.wake_date).getTime()
    );
    
    const falls: { date: string; streakBefore: number; recoveryDays: number | null; notes: string | null }[] = [];
    
    // Find days where woke_up = false
    sortedLogs.forEach((log, index) => {
      if (!log.woke_up) {
        // Count streak before this fall
        let streakBefore = 0;
        const fallDate = parseISO(log.wake_date);
        
        for (let i = 1; i <= 365; i++) {
          const checkDate = format(subDays(fallDate, i), "yyyy-MM-dd");
          const prevLog = sortedLogs.find(l => l.wake_date === checkDate);
          if (prevLog?.woke_up) {
            streakBefore++;
          } else {
            break;
          }
        }
        
        // Find recovery - next success after this fall
        let recoveryDays: number | null = null;
        for (let i = 1; i <= 30; i++) {
          const checkDate = format(addDays(fallDate, i), "yyyy-MM-dd");
          const nextLog = sortedLogs.find(l => l.wake_date === checkDate);
          if (nextLog?.woke_up) {
            recoveryDays = i;
            break;
          }
        }
        
        falls.push({
          date: log.wake_date,
          streakBefore,
          recoveryDays,
          notes: log.notes
        });
      }
    });
    
    return falls.slice(0, 10); // Last 10 falls
  };

  const fallsHistory = getFallsHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden max-w-full" dir="rtl">
      {/* Settings Card */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-3 sm:py-4 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg sm:rounded-xl">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">שעת יעד לקימה</p>
                <p className="text-xs sm:text-sm text-muted-foreground">הגדר את השעה שבה אתה רוצה לקום</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-24 sm:w-28 h-8 sm:h-9 text-sm"
              />
              
              <div className="flex items-center gap-2 border-r pr-2 sm:pr-4">
                {reminderEnabled ? (
                  <Bell className="w-4 h-4 text-success" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnableReminder();
                    } else {
                      setReminderEnabled(false);
                      toast.info("התזכורת לקימה בוטלה");
                    }
                  }}
                />
              </div>
              
              {reminderEnabled && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Label className="text-xs sm:text-sm whitespace-nowrap">דקות לפני:</Label>
                  <select
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                    className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={45}>45</option>
                    <option value={60}>60</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {reminderEnabled && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground border-t pt-2 sm:pt-3">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>
                תזכורת תישלח בשעה{" "}
                {(() => {
                  const [h, m] = targetTime.split(":").map(Number);
                  let mins = h * 60 + m - reminderMinutesBefore;
                  if (mins < 0) mins += 24 * 60;
                  return `${Math.floor(mins / 60).toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}`;
                })()}
                {" "}(לפני היעד)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card className="glass-card border-success/20 bg-success/5">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-success/20 rounded-lg sm:rounded-xl">
                <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-success" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-success">{currentStreak}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">רצף נוכחי</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-warning/20 bg-warning/5">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-warning/20 rounded-lg sm:rounded-xl">
                <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-warning" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-warning">{longestStreak}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">שיא רצף</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary/20 rounded-lg sm:rounded-xl">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-primary">{monthlyStats.percentage}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">הצלחה החודש</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-info/20 bg-info/5">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-info/20 rounded-lg sm:rounded-xl">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-info" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-info">{monthlyStats.successDays}/{monthlyStats.totalDays}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">ימים החודש</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Message */}
      {currentStreak >= 3 && (
        <Card className="glass-card border-success/30 bg-gradient-to-l from-success/10 to-transparent">
          <CardContent className="p-3 sm:py-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0" />
              <p className="text-success font-medium text-sm sm:text-base">
                {currentStreak >= 7 
                  ? `מדהים! ${currentStreak} ימים ברצף! אתה בדרך להרגל קבוע 🎉`
                  : `יופי! ${currentStreak} ימים ברצף, המשך כך! 💪`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              <CardTitle className="text-lg sm:text-2xl">מעקב קימה בבוקר</CardTitle>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <span className="font-semibold min-w-[100px] sm:min-w-[120px] text-center text-sm sm:text-base">
                {format(currentMonth, "MMMM yyyy", { locale: he })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => navigateMonth(1)}
                disabled={isSameMonth(currentMonth, new Date())}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs sm:text-sm">לחץ על יום כדי לסמן אם קמת בבוקר</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
          {/* Week days header - reversed for RTL */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
            {[...weekDays].reverse().map((day) => (
              <div
                key={day}
                className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid - reversed for RTL */}
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1 sm:gap-2" style={{ direction: 'rtl' }}>
              {[...paddedDays].reverse().map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const status = getDayStatus(day);
                const log = getLogForDate(day);
                const isCurrentDay = isToday(day);
                const isFutureDay = isFuture(day);
                const hasNotes = log?.notes && log.notes.length > 0;

                const dayButton = (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    disabled={isFutureDay}
                    className={cn(
                      "aspect-square rounded-lg sm:rounded-xl p-1 sm:p-2 flex flex-col items-center justify-center transition-all border relative",
                      "hover:scale-105 hover:shadow-md",
                      isCurrentDay && "ring-2 ring-primary shadow-lg",
                      isFutureDay && "opacity-40 cursor-not-allowed",
                      status === "success" && "bg-success/20 border-success/40 hover:bg-success/30",
                      status === "failed" && "bg-destructive/20 border-destructive/40 hover:bg-destructive/30",
                      status === "empty" && !isFutureDay && "bg-muted/30 border-muted/40 hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "text-xs sm:text-sm font-semibold",
                      status === "success" && "text-success",
                      status === "failed" && "text-destructive"
                    )}>
                      {format(day, "d")}
                    </span>
                    {status === "success" && (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                    )}
                    {status === "failed" && (
                      <X className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                    )}
                    {log?.actual_time && (
                      <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                        {log.actual_time.slice(0, 5)}
                      </span>
                    )}
                    {hasNotes && (
                      <MessageSquare className="w-2 h-2 sm:w-3 sm:h-3 text-info absolute top-0.5 left-0.5 sm:top-1 sm:left-1" />
                    )}
                  </button>
                );

                if (hasNotes) {
                  return (
                    <Tooltip key={day.toISOString()}>
                      <TooltipTrigger asChild>
                        {dayButton}
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-right">
                        <p className="text-sm">{log.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return dayButton;
              })}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-3 sm:pt-6 border-t mt-3 sm:mt-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-success/20 border border-success/40 rounded-md flex items-center justify-center">
                <Check className="w-2 h-2 sm:w-3 sm:h-3 text-success" />
              </div>
              <span className="text-muted-foreground">קמתי בזמן</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-destructive/20 border border-destructive/40 rounded-md flex items-center justify-center">
                <X className="w-2 h-2 sm:w-3 sm:h-3 text-destructive" />
              </div>
              <span className="text-muted-foreground">לא קמתי</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted/30 border border-muted/40 rounded-md"></div>
              <span className="text-muted-foreground">לא סומן</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wake Up Analytics */}
      <WakeUpAnalytics 
        logs={logs} 
        targetTime={logs[0]?.target_time || "06:00"} 
      />

      {/* Falls History */}
      {fallsHistory.length > 0 && (
        <Card className="glass-card overflow-hidden">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              <CardTitle className="text-base sm:text-lg">היסטוריית נפילות והתאוששות</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">כמה זמן החזקת מעמד ואיך התאוששת</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2 sm:space-y-3">
              {fallsHistory.map((fall, index) => (
                <div 
                  key={fall.date} 
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 border border-muted/50"
                >
                  <div className="flex-shrink-0 p-1.5 sm:p-2 bg-destructive/20 rounded-lg">
                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="font-medium text-sm sm:text-base">
                        {format(parseISO(fall.date), "d בMMMM yyyy", { locale: he })}
                      </span>
                      {fall.streakBefore > 0 && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />
                          {fall.streakBefore} ימים לפני
                        </Badge>
                      )}
                    </div>
                    {fall.notes && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{fall.notes}</p>
                    )}
                    {fall.recoveryDays !== null && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-success">
                        <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        קם אחרי {fall.recoveryDays === 1 ? "יום אחד" : `${fall.recoveryDays} ימים`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedDate && format(selectedDate, "EEEE, d בMMMM yyyy", { locale: he })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actual-time">שעת קימה בפועל</Label>
              <Input
                id="actual-time"
                type="time"
                value={actualTime}
                onChange={(e) => setActualTime(e.target.value)}
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">הערות (אופציונלי)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="איך היה הבוקר? מה עזר לך לקום?"
                className="text-right"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                onClick={() => handleSaveWakeUp(true)}
                className="flex-1 bg-success hover:bg-success/90"
                disabled={toggleWakeUp.isPending}
              >
                <Check className="w-4 h-4 ml-2" />
                קמתי!
              </Button>
              <Button
                onClick={() => handleSaveWakeUp(false)}
                variant="outline"
                className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                disabled={toggleWakeUp.isPending}
              >
                <X className="w-4 h-4 ml-2" />
                לא קמתי
              </Button>
            </div>
            {selectedDate && getLogForDate(selectedDate) && (
              <Button
                onClick={handleClearMark}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                disabled={toggleWakeUp.isPending}
              >
                בטל סימון
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
