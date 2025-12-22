import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Target, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { getTipForToday, dailyCoachTips, DailyTip } from "@/data/dailyCoachTips";
import { toast } from "sonner";

const DailyCoach = () => {
  const [currentTip, setCurrentTip] = useState<DailyTip>(getTipForToday());
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Load completed tasks and streak from localStorage
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
    }
  }, []);

  const handleTaskComplete = () => {
    if (taskCompleted) return;
    
    setTaskCompleted(true);
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    const today = new Date().toDateString();
    localStorage.setItem("dailyCoachData", JSON.stringify({
      lastCompletedDate: today,
      streak: newStreak
    }));
    
    toast.success("מעולה! השלמת את המשימה היומית! 🎉", {
      description: `רצף של ${newStreak} ימים!`
    });
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
          {streak > 0 && (
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
              🔥 {streak} ימים ברצף
            </Badge>
          )}
        </div>
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
