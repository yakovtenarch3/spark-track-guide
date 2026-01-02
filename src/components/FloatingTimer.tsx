import { useState, useEffect } from "react";
import { Timer, Play, Pause, Square, Clock, Plus, Trash2, Briefcase, Book, BookOpen, Dumbbell, Heart, Rocket, Bell, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTimer, TimerTopic } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  book: Book,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  heart: Heart,
  rocket: Rocket,
  clock: Clock,
};

export function FloatingTimer() {
  const {
    topics,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    addTopic,
    saveSession,
    formatTime,
    setOnCountdownComplete,
  } = useTimer();

  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicColor, setNewTopicColor] = useState("#8B5CF6");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [finalDuration, setFinalDuration] = useState(0);
  const [finalTopic, setFinalTopic] = useState<TimerTopic | null>(null);
  const [finalStartedAt, setFinalStartedAt] = useState<Date | null>(null);

  // Countdown timer states
  const [isCountdownMode, setIsCountdownMode] = useState(false);
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [countdownCompleted, setCountdownCompleted] = useState(false);

  // Set up countdown complete notification
  useEffect(() => {
    setOnCountdownComplete(() => {
      if (!countdownCompleted) {
        setCountdownCompleted(true);
        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1lZG1scGVjZGVnZWVmZ2hpamtrbm5vb3Bxc3N0dXV2d3d4eHl6ent7fHx9fX5+f4CAgYGCg4OEhYWGhoeIiImJioqLi4yMjY2OjpCQkJGRkpKTk5SVlZaWl5eYmJmam5ucnJ2dnp6fn6ChoaKio6OkpaWmp6eoqKmqqqusra2urq+vsLGxsrO0tLS1tre3uLi5urq7u7y9vb6/v8DAwcHCw8TExcXGx8fIycnKy8vMzM3Oz8/Q0NHS0tPU1NXV1tfX2NjZ2drb29zc3d7e39/g4OHi4uPj5OXl5ufn6Onp6uvr7O3t7u/v8PDx8vLz9PT19vb3+Pj5+fr7+/z9/f7+/w==');
          audio.play().catch(() => { });
        } catch (e) { }

        // Show toast notification
        toast.success('⏰ הזמן נגמר!', {
          description: timerState.currentTopic?.name || 'ספירה לאחור הסתיימה',
          duration: 10000,
        });

        // Try browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ הזמן נגמר!', {
            body: timerState.currentTopic?.name || 'ספירה לאחור הסתיימה',
            icon: '/favicon.ico',
          });
        }
      }
    });
  }, [setOnCountdownComplete, timerState.currentTopic?.name, countdownCompleted]);

  // Reset countdownCompleted when timer stops
  useEffect(() => {
    if (!timerState.isRunning) {
      setCountdownCompleted(false);
    }
  }, [timerState.isRunning]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleSelectTopic = (topic: TimerTopic) => {
    if (isCountdownMode) {
      const totalSeconds = countdownMinutes * 60 + countdownSeconds;
      if (totalSeconds > 0) {
        startTimer(topic, totalSeconds);
      } else {
        startTimer(topic);
      }
    } else {
      startTimer(topic);
    }
    setIsOpen(false);
  };

  const handleStop = () => {
    const finalState = stopTimer();
    if (finalState.elapsedSeconds > 0 && finalState.currentTopic && finalState.startedAt) {
      setFinalDuration(finalState.elapsedSeconds);
      setFinalTopic(finalState.currentTopic);
      setFinalStartedAt(finalState.startedAt);
      setShowSaveDialog(true);
    }
  };

  const handleSaveSession = () => {
    if (finalTopic && finalStartedAt) {
      saveSession({
        topic_id: finalTopic.id,
        topic_name: finalTopic.name,
        title: sessionTitle || null,
        notes: sessionNotes || null,
        duration_seconds: finalDuration,
        started_at: finalStartedAt.toISOString(),
      });
    }
    setShowSaveDialog(false);
    setSessionTitle("");
    setSessionNotes("");
    setFinalDuration(0);
    setFinalTopic(null);
    setFinalStartedAt(null);
  };

  const handleDiscardSession = () => {
    setShowSaveDialog(false);
    setSessionTitle("");
    setSessionNotes("");
    setFinalDuration(0);
    setFinalTopic(null);
    setFinalStartedAt(null);
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      addTopic({
        name: newTopicName.trim(),
        color: newTopicColor,
        icon: "clock",
      });
      setNewTopicName("");
      setNewTopicColor("#8B5CF6");
      setShowAddTopic(false);
    }
  };

  const getTopicIcon = (iconName: string) => {
    return iconMap[iconName] || Clock;
  };

  // If timer is running, show the running timer
  if (timerState.isRunning) {
    const TopicIcon = timerState.currentTopic ? getTopicIcon(timerState.currentTopic.icon) : Clock;
    const isCountdownComplete = timerState.isCountdown && timerState.remainingSeconds <= 0;

    return (
      <div className="fixed bottom-6 left-6 z-50">
        <div
          className={cn(
            "flex items-center gap-3 rounded-full px-4 py-3 shadow-2xl border border-border/50 transition-all",
            isCountdownComplete && "animate-pulse ring-4 ring-yellow-400"
          )}
          style={{ backgroundColor: isCountdownComplete ? '#EF4444' : (timerState.currentTopic?.color || '#8B5CF6') }}
        >
          {timerState.isCountdown ? (
            <Hourglass className={cn("h-5 w-5 text-white", isCountdownComplete && "animate-bounce")} />
          ) : (
            <TopicIcon className="h-5 w-5 text-white" />
          )}
          <div className="flex flex-col items-center">
            {timerState.isCountdown ? (
              <>
                <span className={cn(
                  "text-white font-mono text-lg font-bold min-w-[80px]",
                  isCountdownComplete && "animate-pulse"
                )}>
                  {isCountdownComplete ? '⚠️ נגמר!' : formatTime(timerState.remainingSeconds)}
                </span>
                <span className="text-white/70 text-xs">
                  {formatTime(timerState.elapsedSeconds)} עברו
                </span>
              </>
            ) : (
              <span className="text-white font-mono text-lg font-bold min-w-[80px]">
                {formatTime(timerState.elapsedSeconds)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {timerState.isPaused ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={resumeTimer}
              >
                <Play className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={pauseTimer}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleStop}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Save Session Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                שמירת זמן
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-primary">
                    {formatTime(finalDuration)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {finalTopic?.name}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>כותרת (אופציונלי)</Label>
                <Input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="מה עשית?"
                />
              </div>
              <div className="space-y-2">
                <Label>הערות (אופציונלי)</Label>
                <Textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="הערות נוספות..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleDiscardSession}>
                ביטול
              </Button>
              <Button onClick={handleSaveSession}>
                שמור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default floating button
  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
      >
        <Timer className="h-6 w-6" />
      </Button>

      {/* Topic Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              בחר נושא להתחלה
            </DialogTitle>
          </DialogHeader>

          {/* Countdown Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-primary" />
              <span className="font-medium">ספירה לאחור</span>
            </div>
            <Button
              variant={isCountdownMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsCountdownMode(!isCountdownMode)}
              className="gap-2"
            >
              {isCountdownMode ? (
                <>
                  <Bell className="h-4 w-4" />
                  פעיל
                </>
              ) : (
                "כבוי"
              )}
            </Button>
          </div>

          {/* Countdown Time Selector */}
          {isCountdownMode && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                הגדר זמן לספירה לאחור
              </Label>
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col items-center">
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    value={countdownMinutes}
                    onChange={(e) => setCountdownMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center text-lg font-mono"
                  />
                  <span className="text-xs text-muted-foreground mt-1">דקות</span>
                </div>
                <span className="text-2xl font-bold">:</span>
                <div className="flex flex-col items-center">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={countdownSeconds}
                    onChange={(e) => setCountdownSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-20 text-center text-lg font-mono"
                  />
                  <span className="text-xs text-muted-foreground mt-1">שניות</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[5, 10, 15, 25, 30, 45, 60].map((mins) => (
                  <Button
                    key={mins}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCountdownMinutes(mins);
                      setCountdownSeconds(0);
                    }}
                    className={cn(
                      "text-xs",
                      countdownMinutes === mins && countdownSeconds === 0 && "bg-primary text-primary-foreground"
                    )}
                  >
                    {mins} דק׳
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                ⏰ תקבל התראה כשהזמן יסתיים
              </p>
            </div>
          )}

          <ScrollArea className="max-h-[300px] py-4">
            <div className="grid grid-cols-2 gap-3">
              {topics.map((topic) => {
                const TopicIcon = getTopicIcon(topic.icon);
                return (
                  <Button
                    key={topic.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                    style={{ borderColor: topic.color }}
                    onClick={() => handleSelectTopic(topic)}
                  >
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    >
                      <TopicIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium">{topic.name}</span>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t pt-4">
            {showAddTopic ? (
              <div className="space-y-3">
                <Input
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="שם הנושא"
                />
                <div className="flex items-center gap-2">
                  <Label>צבע:</Label>
                  <input
                    type="color"
                    value={newTopicColor}
                    onChange={(e) => setNewTopicColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddTopic} className="flex-1">
                    הוסף
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTopic(false)}>
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAddTopic(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף נושא חדש
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Session Dialog (for when timer stops) */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              שמירת זמן
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-primary">
                  {formatTime(finalDuration)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {finalTopic?.name}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>כותרת (אופציונלי)</Label>
              <Input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="מה עשית?"
              />
            </div>
            <div className="space-y-2">
              <Label>הערות (אופציונלי)</Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="הערות נוספות..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDiscardSession}>
              ביטול
            </Button>
            <Button onClick={handleSaveSession}>
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
