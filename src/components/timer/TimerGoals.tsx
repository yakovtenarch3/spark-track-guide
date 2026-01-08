import { useState, useEffect } from "react";
import {
  Target,
  Trophy,
  Flame,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Bell,
  BellOff,
  Check,
  X,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  saveTimerReminder, 
  removeTimerReminder, 
  requestNotificationPermission 
} from "@/utils/notificationScheduler";
import { toast } from "sonner";

interface TimerGoal {
  id: string;
  topic_id: string;
  daily_target_minutes: number;
  weekly_target_minutes: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_days: number[];
}

interface TopicWithStats {
  id: string;
  name: string;
  color: string;
  icon: string;
  todayMinutes: number;
  weekMinutes: number;
  goal?: TimerGoal;
}

interface TimerGoalsProps {
  topicsWithStats: TopicWithStats[];
  goals: TimerGoal[];
  onAddGoal: (goal: Omit<TimerGoal, "id">) => void;
  onUpdateGoal: (id: string, goal: Partial<TimerGoal>) => void;
  onDeleteGoal: (id: string) => void;
}

const daysMap: { [key: number]: string } = {
  0: "א׳",
  1: "ב׳",
  2: "ג׳",
  3: "ד׳",
  4: "ה׳",
  5: "ו׳",
  6: "ש׳",
};

export function TimerGoals({
  topicsWithStats,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}: TimerGoalsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TimerGoal | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [dailyTarget, setDailyTarget] = useState(60);
  const [weeklyTarget, setWeeklyTarget] = useState(420);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Sync reminders with localStorage when goals change
  useEffect(() => {
    goals.forEach((goal) => {
      const topic = topicsWithStats.find((t) => t.id === goal.topic_id);
      if (goal.reminder_enabled && goal.reminder_time && topic) {
        saveTimerReminder({
          goalId: goal.id,
          topicName: topic.name,
          time: goal.reminder_time,
          days: goal.reminder_days || [0, 1, 2, 3, 4, 5, 6],
          enabled: true,
        });
      }
    });
  }, [goals, topicsWithStats]);

  const resetForm = () => {
    setSelectedTopicId("");
    setDailyTarget(60);
    setWeeklyTarget(420);
    setReminderEnabled(false);
    setReminderTime("09:00");
    setReminderDays([0, 1, 2, 3, 4, 5, 6]);
    setEditingGoal(null);
  };

  const handleSave = async () => {
    if (!selectedTopicId && !editingGoal) return;

    const topicId = editingGoal?.topic_id || selectedTopicId;
    const topic = topicsWithStats.find((t) => t.id === topicId);

    const goalData = {
      topic_id: topicId,
      daily_target_minutes: dailyTarget,
      weekly_target_minutes: weeklyTarget,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : null,
      reminder_days: reminderDays,
    };

    // Request notification permission if reminder is enabled
    if (reminderEnabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        toast.error('יש לאשר התראות בדפדפן כדי לקבל תזכורות');
      } else {
        // Save reminder to localStorage for the scheduler
        saveTimerReminder({
          goalId: editingGoal?.id || topicId,
          topicName: topic?.name || 'נושא',
          time: reminderTime,
          days: reminderDays,
          enabled: true,
        });
        toast.success('התראות push הופעלו בהצלחה!');
      }
    } else {
      // Remove reminder if disabled
      removeTimerReminder(editingGoal?.id || topicId);
    }

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, goalData);
    } else {
      onAddGoal(goalData);
    }

    setShowAddDialog(false);
    resetForm();
  };

  const handleEdit = (goal: TimerGoal) => {
    setEditingGoal(goal);
    setSelectedTopicId(goal.topic_id);
    setDailyTarget(goal.daily_target_minutes);
    setWeeklyTarget(goal.weekly_target_minutes);
    setReminderEnabled(goal.reminder_enabled);
    setReminderTime(goal.reminder_time || "09:00");
    setReminderDays(goal.reminder_days || [0, 1, 2, 3, 4, 5, 6]);
    setShowAddDialog(true);
  };

  const toggleReminderDay = (day: number) => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    // Remove reminder from localStorage
    removeTimerReminder(goalId);
    // Delete goal from database
    onDeleteGoal(goalId);
  };

  // Get topics that don't have goals yet
  const availableTopics = topicsWithStats.filter(
    (t) => !goals.some((g) => g.topic_id === t.id)
  );

  // Merge topics with their goals
  const topicsWithGoals = topicsWithStats.filter((t) =>
    goals.some((g) => g.topic_id === t.id)
  );

  return (
    <>
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              יעדים ומעקב
            </span>
          </CardTitle>
          {availableTopics.length > 0 && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="h-4 w-4 ml-2" />
              הגדר יעד
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {topicsWithGoals.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary/50" />
              </div>
              <div>
                <p className="text-muted-foreground">אין יעדים מוגדרים עדיין</p>
                <p className="text-sm text-muted-foreground/70">
                  הגדר יעדים יומיים ושבועיים לכל נושא
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {topicsWithGoals.map((topic) => {
                const goal = goals.find((g) => g.topic_id === topic.id)!;
                const dailyProgress = Math.min(
                  100,
                  (topic.todayMinutes / goal.daily_target_minutes) * 100
                );
                const weeklyProgress = Math.min(
                  100,
                  (topic.weekMinutes / goal.weekly_target_minutes) * 100
                );
                const dailyAchieved = dailyProgress >= 100;
                const weeklyAchieved = weeklyProgress >= 100;

                return (
                  <Card
                    key={topic.id}
                    className={cn(
                      "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                      dailyAchieved && "ring-2 ring-green-500/50"
                    )}
                  >
                    {dailyAchieved && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 animate-pulse" />
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2.5 rounded-xl shadow-lg"
                            style={{
                              background: `linear-gradient(135deg, ${topic.color}, ${topic.color}dd)`,
                            }}
                          >
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{topic.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {goal.reminder_enabled && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                                >
                                  <Bell className="h-3 w-3 ml-1" />
                                  {goal.reminder_time}
                                </Badge>
                              )}
                              {dailyAchieved && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-bounce">
                                  <Trophy className="h-3 w-3 ml-1" />
                                  יעד יומי הושג!
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(goal)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Daily Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame
                              className={cn(
                                "h-4 w-4",
                                dailyAchieved
                                  ? "text-orange-500 animate-pulse"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span className="text-sm font-medium">יעד יומי</span>
                          </div>
                          <span className="text-sm font-mono">
                            <span
                              className={cn(
                                "font-bold",
                                dailyAchieved && "text-green-500"
                              )}
                            >
                              {topic.todayMinutes}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              / {goal.daily_target_minutes} דק׳
                            </span>
                          </span>
                        </div>
                        <div className="relative">
                          <Progress
                            value={dailyProgress}
                            className="h-3 bg-muted/50"
                          />
                          <div
                            className={cn(
                              "absolute inset-0 rounded-full transition-all duration-500",
                              dailyAchieved
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : "bg-gradient-to-r from-primary/80 to-primary"
                            )}
                            style={{
                              width: `${dailyProgress}%`,
                              opacity: 0.15,
                            }}
                          />
                        </div>
                      </div>

                      {/* Weekly Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp
                              className={cn(
                                "h-4 w-4",
                                weeklyAchieved
                                  ? "text-blue-500"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span className="text-sm font-medium">יעד שבועי</span>
                          </div>
                          <span className="text-sm font-mono">
                            <span
                              className={cn(
                                "font-bold",
                                weeklyAchieved && "text-blue-500"
                              )}
                            >
                              {Math.floor(topic.weekMinutes / 60)}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              / {Math.floor(goal.weekly_target_minutes / 60)} שעות
                            </span>
                          </span>
                        </div>
                        <div className="relative">
                          <Progress
                            value={weeklyProgress}
                            className="h-2 bg-muted/50"
                          />
                        </div>
                      </div>

                      {/* Motivation Text */}
                      {!dailyAchieved && dailyProgress > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span>
                            עוד {goal.daily_target_minutes - topic.todayMinutes} דקות
                            להשגת היעד היומי!
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Goal Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setShowAddDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {editingGoal ? "עריכת יעד" : "הגדרת יעד חדש"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Topic Selection */}
            {!editingGoal && (
              <div className="space-y-2">
                <Label>בחר נושא</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTopics.map((topic) => (
                    <Button
                      key={topic.id}
                      variant={selectedTopicId === topic.id ? "default" : "outline"}
                      className="h-auto py-3 flex flex-col items-center gap-2"
                      style={{
                        borderColor:
                          selectedTopicId === topic.id ? topic.color : undefined,
                        backgroundColor:
                          selectedTopicId === topic.id ? topic.color : undefined,
                      }}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{topic.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Target */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                יעד יומי (דקות)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={dailyTarget}
                  onChange={(e) =>
                    setDailyTarget(Math.max(5, parseInt(e.target.value) || 5))
                  }
                  className="text-center font-mono text-lg"
                />
                <div className="flex gap-1">
                  {[30, 60, 90, 120].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      size="sm"
                      className={cn(
                        dailyTarget === mins && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => setDailyTarget(mins)}
                    >
                      {mins}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Target */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                יעד שבועי (שעות)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={Math.floor(weeklyTarget / 60)}
                  onChange={(e) =>
                    setWeeklyTarget(
                      Math.max(1, parseInt(e.target.value) || 1) * 60
                    )
                  }
                  className="text-center font-mono text-lg"
                />
                <div className="flex gap-1">
                  {[5, 7, 10, 14].map((hrs) => (
                    <Button
                      key={hrs}
                      variant="outline"
                      size="sm"
                      className={cn(
                        weeklyTarget === hrs * 60 &&
                          "bg-primary text-primary-foreground"
                      )}
                      onClick={() => setWeeklyTarget(hrs * 60)}
                    >
                      {hrs}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reminder Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                {reminderEnabled ? (
                  <Bell className="h-5 w-5 text-yellow-500" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <span className="font-medium">תזכורת יומית</span>
                  <p className="text-xs text-muted-foreground">
                    קבל התראה לעבוד על הנושא
                  </p>
                </div>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {/* Reminder Settings */}
            {reminderEnabled && (
              <div className="space-y-4 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div className="space-y-2">
                  <Label>שעת תזכורת</Label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="text-center font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ימים</Label>
                  <div className="flex gap-1 justify-center">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <Button
                        key={day}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-9 h-9 p-0",
                          reminderDays.includes(day) &&
                            "bg-primary text-primary-foreground"
                        )}
                        onClick={() => toggleReminderDay(day)}
                      >
                        {daysMap[day]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editingGoal && !selectedTopicId}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Check className="h-4 w-4 ml-2" />
              {editingGoal ? "עדכן" : "שמור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
