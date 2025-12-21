import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isFuture, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { useDailyGoals } from "@/hooks/useDailyGoals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Flame,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  TrendingUp,
  Target,
  AlertTriangle,
  ArrowUp,
  MessageSquare,
  Moon,
  Dumbbell,
  Book,
  Heart,
  Coffee,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { value: "target", label: "יעד", icon: Target },
  { value: "moon", label: "שינה", icon: Moon },
  { value: "dumbbell", label: "ספורט", icon: Dumbbell },
  { value: "book", label: "לימוד", icon: Book },
  { value: "heart", label: "בריאות", icon: Heart },
  { value: "coffee", label: "הרגל", icon: Coffee },
];

const COLOR_OPTIONS = [
  { value: "#8B5CF6", label: "סגול" },
  { value: "#10B981", label: "ירוק" },
  { value: "#F59E0B", label: "כתום" },
  { value: "#3B82F6", label: "כחול" },
  { value: "#EC4899", label: "ורוד" },
  { value: "#EF4444", label: "אדום" },
];

export const DailyGoalTracker = () => {
  const {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleDayLog,
    getLogForDate,
    calculateStreak,
    calculateLongestStreak,
    getMonthlyStats,
    getFallsHistory,
  } = useDailyGoals();

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  
  // New goal form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#8B5CF6");
  const [newIcon, setNewIcon] = useState("target");

  const activeGoals = goals.filter((g) => g.is_active);
  const selectedGoal = activeGoals.find((g) => g.id === selectedGoalId) || activeGoals[0];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = monthStart.getDay();
  const paddedDays = [...Array(startPadding).fill(null), ...days];
  const weekDays = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

  const handleDayClick = (date: Date) => {
    if (isFuture(date) || !selectedGoal) return;
    const log = getLogForDate(selectedGoal.id, date);
    setSelectedDate(date);
    setNotes(log?.notes || "");
    setDialogOpen(true);
  };

  const handleSaveLog = (succeeded: boolean) => {
    if (!selectedDate || !selectedGoal) return;
    toggleDayLog.mutate({
      goalId: selectedGoal.id,
      date: selectedDate,
      succeeded,
      notes: notes || undefined,
    });
    setDialogOpen(false);
    setNotes("");
  };

  const handleCreateGoal = () => {
    if (!newTitle.trim()) return;
    createGoal.mutate({
      title: newTitle,
      description: newDescription || undefined,
      color: newColor,
      icon: newIcon,
    });
    setNewTitle("");
    setNewDescription("");
    setNewColor("#8B5CF6");
    setNewIcon("target");
    setAddGoalOpen(false);
  };

  const handleDeleteGoal = () => {
    if (!selectedGoal) return;
    deleteGoal.mutate(selectedGoal.id);
    setEditGoalOpen(false);
    setSelectedGoalId(null);
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const getDayStatus = (date: Date) => {
    if (!selectedGoal) return "empty";
    const log = getLogForDate(selectedGoal.id, date);
    if (!log) return "empty";
    return log.succeeded ? "success" : "failed";
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find((i) => i.value === iconName);
    return iconOption?.icon || Target;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentStreak = selectedGoal ? calculateStreak(selectedGoal.id) : 0;
  const longestStreak = selectedGoal ? calculateLongestStreak(selectedGoal.id) : 0;
  const monthlyStats = selectedGoal ? getMonthlyStats(selectedGoal.id) : { successDays: 0, totalDays: 0, percentage: 0 };
  const fallsHistory = selectedGoal ? getFallsHistory(selectedGoal.id) : [];

  return (
    <div className="space-y-6">
      {/* Goals Tabs + Add Button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2">
          {activeGoals.map((goal) => {
            const GoalIcon = getIconComponent(goal.icon);
            const isSelected = selectedGoal?.id === goal.id;
            return (
              <Button
                key={goal.id}
                variant={isSelected ? "default" : "outline"}
                className="flex items-center gap-2 shrink-0"
                style={{ 
                  backgroundColor: isSelected ? goal.color : undefined,
                  borderColor: goal.color,
                }}
                onClick={() => setSelectedGoalId(goal.id)}
              >
                <GoalIcon className="w-4 h-4" />
                {goal.title}
              </Button>
            );
          })}
        </div>
        <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>יעד חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>שם היעד</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="לדוגמה: ללכת לישון בזמן"
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור (אופציונלי)</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="פירוט נוסף על היעד"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>אייקון</Label>
                  <Select value={newIcon} onValueChange={setNewIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>צבע</Label>
                  <Select value={newColor} onValueChange={setNewColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: opt.value }}
                            />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateGoal} className="w-full" disabled={!newTitle.trim()}>
                צור יעד
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {selectedGoal && (
          <Dialog open={editGoalOpen} onOpenChange={setEditGoalOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Pencil className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>עריכת יעד</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-muted-foreground">יעד: {selectedGoal.title}</p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDeleteGoal}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  מחק יעד
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {activeGoals.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין יעדים עדיין</h3>
            <p className="text-muted-foreground mb-4">
              צור יעד חדש כמו "ללכת לישון בזמן" ותוכל לעקוב אחרי ההתקדמות שלך
            </p>
            <Button onClick={() => setAddGoalOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              צור יעד ראשון
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                    <p className="text-2xl font-bold text-info">
                      {monthlyStats.successDays}/{monthlyStats.totalDays}
                    </p>
                    <p className="text-sm text-muted-foreground">ימים החודש</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedGoal && (() => {
                    const GoalIcon = getIconComponent(selectedGoal.icon);
                    return <GoalIcon className="w-6 h-6" style={{ color: selectedGoal.color }} />;
                  })()}
                  <CardTitle className="text-2xl">{selectedGoal?.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <span className="font-semibold min-w-[120px] text-center">
                    {format(currentMonth, "MMMM yyyy", { locale: he })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth(1)}
                    disabled={format(currentMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <CardDescription>לחץ על יום כדי לסמן הצלחה או כישלון</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Week days header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <TooltipProvider>
                <div className="grid grid-cols-7 gap-2">
                  {paddedDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const status = getDayStatus(day);
                    const log = selectedGoal ? getLogForDate(selectedGoal.id, day) : null;
                    const isCurrentDay = isToday(day);
                    const isFutureDay = isFuture(day);
                    const hasNotes = log?.notes && log.notes.length > 0;

                    const dayButton = (
                      <button
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
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            status === "success" && "text-success",
                            status === "failed" && "text-destructive"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {status === "success" && <Check className="w-4 h-4 text-success mt-1" />}
                        {status === "failed" && <X className="w-4 h-4 text-destructive mt-1" />}
                        {hasNotes && <MessageSquare className="w-3 h-3 text-info absolute top-1 left-1" />}
                      </button>
                    );

                    if (hasNotes) {
                      return (
                        <Tooltip key={day.toISOString()}>
                          <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] text-right">
                            <p className="text-sm">{log?.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={day.toISOString()}>{dayButton}</div>;
                  })}
                </div>
              </TooltipProvider>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 pt-6 border-t mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-success/20 border border-success/40 rounded-md flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-muted-foreground">הצלחתי</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive/20 border border-destructive/40 rounded-md flex items-center justify-center">
                    <X className="w-3 h-3 text-destructive" />
                  </div>
                  <span className="text-muted-foreground">לא הצלחתי</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted/30 border border-muted/40 rounded-md"></div>
                  <span className="text-muted-foreground">לא סומן</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Falls History */}
          {fallsHistory.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <CardTitle className="text-lg">היסטוריית נפילות והתאוששות</CardTitle>
                </div>
                <CardDescription>כמה זמן החזקת מעמד ואיך התאוששת</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fallsHistory.map((fall) => (
                    <div
                      key={fall.date}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-muted/50"
                    >
                      <div className="flex-shrink-0 p-2 bg-destructive/20 rounded-lg">
                        <X className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {format(parseISO(fall.date), "d בMMMM yyyy", { locale: he })}
                          </span>
                          {fall.streakBefore > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Flame className="w-3 h-3 ml-1" />
                              {fall.streakBefore} ימים לפני הנפילה
                            </Badge>
                          )}
                        </div>
                        {fall.notes && <p className="text-sm text-muted-foreground">{fall.notes}</p>}
                        {fall.recoveryDays !== null && (
                          <div className="flex items-center gap-1 text-sm text-success">
                            <ArrowUp className="w-3 h-3" />
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
        </>
      )}

      {/* Day Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDate && format(selectedDate, "EEEE, d בMMMM yyyy", { locale: he })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">הערות (אופציונלי)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="מה קרה? איך הרגשת?"
                className="text-right"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleSaveLog(true)}
              className="flex-1 bg-success hover:bg-success/90"
              disabled={toggleDayLog.isPending}
            >
              <Check className="w-4 h-4 ml-2" />
              הצלחתי!
            </Button>
            <Button
              onClick={() => handleSaveLog(false)}
              variant="outline"
              className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              disabled={toggleDayLog.isPending}
            >
              <X className="w-4 h-4 ml-2" />
              לא הצלחתי
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
