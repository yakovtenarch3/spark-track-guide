import { useState } from "react";
import { format, subDays, startOfDay, isSameDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isFuture } from "date-fns";
import { he } from "date-fns/locale";
import { useWakeUpLogs } from "@/hooks/useWakeUpLogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export const WakeUpTracker = () => {
  const { 
    logs, 
    isLoading, 
    toggleWakeUp, 
    currentStreak, 
    longestStreak, 
    getLogForDate,
    monthlyStats 
  } = useWakeUpLogs();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [actualTime, setActualTime] = useState("");
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/20 rounded-xl">
                <Flame className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{currentStreak}</p>
                <p className="text-sm text-muted-foreground">רצף נוכחי</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/20 rounded-xl">
                <Trophy className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{longestStreak}</p>
                <p className="text-sm text-muted-foreground">שיא רצף</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{monthlyStats.percentage}%</p>
                <p className="text-sm text-muted-foreground">הצלחה החודש</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-info/20 bg-info/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-info/20 rounded-xl">
                <Target className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-info">{monthlyStats.successDays}/{monthlyStats.totalDays}</p>
                <p className="text-sm text-muted-foreground">ימים החודש</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Message */}
      {currentStreak >= 3 && (
        <Card className="glass-card border-success/30 bg-gradient-to-l from-success/10 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-success" />
              <p className="text-success font-medium">
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
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-warning" />
              <CardTitle className="text-2xl">מעקב קימה בבוקר</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <span className="font-semibold min-w-[120px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: he })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
                disabled={isSameMonth(currentMonth, new Date())}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <CardDescription>לחץ על יום כדי לסמן אם קמת בבוקר</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {paddedDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const status = getDayStatus(day);
              const log = getLogForDate(day);
              const isCurrentDay = isToday(day);
              const isFutureDay = isFuture(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={isFutureDay}
                  className={cn(
                    "aspect-square rounded-xl p-2 flex flex-col items-center justify-center transition-all border relative",
                    "hover:scale-105 hover:shadow-md",
                    isCurrentDay && "ring-2 ring-primary shadow-lg",
                    isFutureDay && "opacity-40 cursor-not-allowed",
                    status === "success" && "bg-success/20 border-success/40 hover:bg-success/30",
                    status === "failed" && "bg-destructive/20 border-destructive/40 hover:bg-destructive/30",
                    status === "empty" && !isFutureDay && "bg-muted/30 border-muted/40 hover:bg-muted/50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-semibold",
                    status === "success" && "text-success",
                    status === "failed" && "text-destructive"
                  )}>
                    {format(day, "d")}
                  </span>
                  {status === "success" && (
                    <Check className="w-4 h-4 text-success mt-1" />
                  )}
                  {status === "failed" && (
                    <X className="w-4 h-4 text-destructive mt-1" />
                  )}
                  {log?.actual_time && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {log.actual_time.slice(0, 5)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/20 border border-success/40 rounded-md flex items-center justify-center">
                <Check className="w-3 h-3 text-success" />
              </div>
              <span className="text-muted-foreground">קמתי בזמן</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive/20 border border-destructive/40 rounded-md flex items-center justify-center">
                <X className="w-3 h-3 text-destructive" />
              </div>
              <span className="text-muted-foreground">לא קמתי</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted/30 border border-muted/40 rounded-md"></div>
              <span className="text-muted-foreground">לא סומן</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
        </DialogContent>
      </Dialog>
    </div>
  );
};
