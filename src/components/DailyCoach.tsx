import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Lightbulb, 
  Target, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Bell,
  BellOff
} from "lucide-react";
import { getTipForToday, dailyCoachTips, DailyTip } from "@/data/dailyCoachTips";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

const DailyCoach = () => {
  const [currentTip, setCurrentTip] = useState<DailyTip>(getTipForToday());
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  
  const { scheduleNotification, cancelNotification, permission, requestPermission } = useNotifications();

  useEffect(() => {
    // Load completed tasks, streak, and reminder settings from localStorage
    const savedData = localStorage.getItem("dailyCoachData");
    if (savedData) {
      const data = JSON.parse(savedData);
      const today = new Date().toDateString();
      
      if (data.lastCompletedDate === today) {
        setTaskCompleted(true);
      }
      
      // Check if streak should continue
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (data.lastCompletedDate === yesterday.toDateString() || data.lastCompletedDate === today) {
        setStreak(data.streak || 0);
      } else {
        setStreak(0);
      }
      
      // Load reminder settings
      if (data.reminderEnabled !== undefined) {
        setReminderEnabled(data.reminderEnabled);
      }
      if (data.reminderTime) {
        setReminderTime(data.reminderTime);
      }
    }
  }, []);

  const handleTaskComplete = () => {
    if (taskCompleted) return;
    
    setTaskCompleted(true);
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    const today = new Date().toDateString();
    const savedData = localStorage.getItem("dailyCoachData");
    const existingData = savedData ? JSON.parse(savedData) : {};
    
    localStorage.setItem("dailyCoachData", JSON.stringify({
      ...existingData,
      lastCompletedDate: today,
      streak: newStreak
    }));
    
    toast.success("מעולה! השלמת את המשימה היומית! 🎉", {
      description: `רצף של ${newStreak} ימים!`
    });
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    setReminderEnabled(enabled);
    
    const savedData = localStorage.getItem("dailyCoachData");
    const existingData = savedData ? JSON.parse(savedData) : {};
    
    localStorage.setItem("dailyCoachData", JSON.stringify({
      ...existingData,
      reminderEnabled: enabled,
      reminderTime
    }));
    
    if (enabled) {
      const todayTip = getTipForToday();
      await scheduleNotification(
        "מאמן יומי",
        `📖 ${todayTip.title}\n\n🎯 משימה: ${todayTip.task}`,
        reminderTime,
        "daily-coach",
        "coach"
      );
      toast.success("התזכורת היומית הופעלה! 🔔");
    } else {
      cancelNotification("daily-coach", "coach");
    }
  };

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time);
    
    const savedData = localStorage.getItem("dailyCoachData");
    const existingData = savedData ? JSON.parse(savedData) : {};
    
    localStorage.setItem("dailyCoachData", JSON.stringify({
      ...existingData,
      reminderTime: time
    }));
    
    if (reminderEnabled) {
      const todayTip = getTipForToday();
      scheduleNotification(
        "מאמן יומי",
        `📖 ${todayTip.title}\n\n🎯 משימה: ${todayTip.task}`,
        time,
        "daily-coach",
        "coach"
      );
    }
  };

  const goToPreviousTip = () => {
    const currentIndex = dailyCoachTips.findIndex(tip => tip.id === currentTip.id);
    const prevIndex = currentIndex === 0 ? dailyCoachTips.length - 1 : currentIndex - 1;
    setCurrentTip(dailyCoachTips[prevIndex]);
  };

  const goToNextTip = () => {
    const currentIndex = dailyCoachTips.findIndex(tip => tip.id === currentTip.id);
    const nextIndex = (currentIndex + 1) % dailyCoachTips.length;
    setCurrentTip(dailyCoachTips[nextIndex]);
  };

  const goToTodaysTip = () => {
    setCurrentTip(getTipForToday());
  };

  const isTodaysTip = currentTip.id === getTipForToday().id;

  return (
    <Card className="royal-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg gold-underline">
            <Sparkles className="h-5 w-5 text-accent" />
            מאמן יומי
          </CardTitle>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                🔥 {streak} ימים ברצף
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowReminderSettings(!showReminderSettings)}
              className={reminderEnabled ? "text-accent" : "text-muted-foreground"}
            >
              {reminderEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Reminder Settings */}
        {showReminderSettings && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <Label htmlFor="coach-reminder" className="text-sm">תזכורת יומית</Label>
              <Switch
                id="coach-reminder"
                checked={reminderEnabled}
                onCheckedChange={handleReminderToggle}
              />
            </div>
            {reminderEnabled && (
              <div className="flex items-center gap-2">
                <Label htmlFor="reminder-time" className="text-sm shrink-0">שעת תזכורת:</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tip Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousTip}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isTodaysTip ? "default" : "outline"} 
              className={isTodaysTip ? "bg-accent text-accent-foreground" : ""}
            >
              {isTodaysTip ? "טיפ היום" : `טיפ ${currentTip.id}`}
            </Badge>
            {!isTodaysTip && (
              <Button variant="link" size="sm" onClick={goToTodaysTip} className="text-xs">
                חזור להיום
              </Button>
            )}
          </div>
          
          <Button variant="ghost" size="icon" onClick={goToNextTip}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Tip Title */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">{currentTip.title}</h3>
        </div>

        {/* Tip Content */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{currentTip.tip}</p>
          </div>
        </div>

        {/* Task */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">המשימה שלך להיום:</h4>
              <p className="text-sm text-muted-foreground">{currentTip.task}</p>
            </div>
          </div>
          
          {isTodaysTip && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <Checkbox 
                id="taskComplete"
                checked={taskCompleted}
                onCheckedChange={() => handleTaskComplete()}
                disabled={taskCompleted}
              />
              <label 
                htmlFor="taskComplete" 
                className={`text-sm cursor-pointer ${taskCompleted ? 'text-green-600 font-medium' : ''}`}
              >
                {taskCompleted ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    המשימה הושלמה!
                  </span>
                ) : (
                  "סמן כשסיימת את המשימה"
                )}
              </label>
            </div>
          )}
        </div>

        {/* Source */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          <span>מקור: {currentTip.source}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCoach;
