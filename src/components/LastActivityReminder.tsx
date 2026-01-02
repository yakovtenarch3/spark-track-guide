import { useState, useEffect } from "react";
import { AlertTriangle, Calendar, CheckCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInHours, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";

const LAST_VISIT_KEY = "last_site_visit";
const REMINDER_DISMISSED_KEY = "reminder_dismissed_date";

export function LastActivityReminder() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastVisit, setLastVisit] = useState<Date | null>(null);
  const [lastHabitCompletion, setLastHabitCompletion] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkActivity();
  }, []);

  const checkActivity = async () => {
    try {
      const now = new Date();
      const todayKey = now.toDateString();

      // Check if reminder was already dismissed today
      const dismissedDate = localStorage.getItem(REMINDER_DISMISSED_KEY);
      if (dismissedDate === todayKey) {
        setLoading(false);
        return;
      }

      // Get last visit from localStorage
      const lastVisitStr = localStorage.getItem(LAST_VISIT_KEY);
      const lastVisitDate = lastVisitStr ? new Date(lastVisitStr) : null;
      setLastVisit(lastVisitDate);

      // Get last habit completion from database
      const { data: completions, error } = await supabase
        .from("habit_completions")
        .select("completed_at")
        .order("completed_at", { ascending: false })
        .limit(1);

      if (!error && completions && completions.length > 0) {
        setLastHabitCompletion(new Date(completions[0].completed_at));
      }

      // Check if we should show reminder
      const hoursSinceVisit = lastVisitDate 
        ? differenceInHours(now, lastVisitDate) 
        : 999;
      
      const hoursSinceCompletion = completions && completions.length > 0
        ? differenceInHours(now, new Date(completions[0].completed_at))
        : 999;

      // Show reminder if more than 24 hours since last visit OR last completion
      if (hoursSinceVisit >= 24 || hoursSinceCompletion >= 24) {
        setIsOpen(true);
      }

      // Update last visit time
      localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
      
    } catch (error) {
      console.error("Error checking activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Mark as dismissed for today
    localStorage.setItem(REMINDER_DISMISSED_KEY, new Date().toDateString());
    setIsOpen(false);
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "לא נרשמה פעילות";
    
    const now = new Date();
    const days = differenceInDays(now, date);
    const hours = differenceInHours(now, date);

    if (days > 0) {
      return `לפני ${days} ${days === 1 ? "יום" : "ימים"}`;
    } else if (hours > 0) {
      return `לפני ${hours} ${hours === 1 ? "שעה" : "שעות"}`;
    } else {
      return "לפני פחות משעה";
    }
  };

  if (loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            תזכורת!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-muted-foreground text-center">
            שמנו לב שעבר קצת זמן מאז הפעילות האחרונה שלך.
            <br />
            בוא נחזור למסלול! 💪
          </p>

          <div className="space-y-4">
            {/* Last Visit Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">כניסה אחרונה לאתר</p>
                <p className="text-sm text-muted-foreground">
                  {lastVisit 
                    ? format(lastVisit, "EEEE, dd בMMMM yyyy בשעה HH:mm", { locale: he })
                    : "זו הכניסה הראשונה שלך!"}
                </p>
                <p className="text-sm font-medium text-blue-500 mt-1">
                  {formatTimeAgo(lastVisit)}
                </p>
              </div>
            </div>

            {/* Last Habit Completion Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">סימון מעקב אחרון</p>
                <p className="text-sm text-muted-foreground">
                  {lastHabitCompletion 
                    ? format(lastHabitCompletion, "EEEE, dd בMMMM yyyy בשעה HH:mm", { locale: he })
                    : "עדיין לא סימנת הרגלים"}
                </p>
                <p className="text-sm font-medium text-green-500 mt-1">
                  {formatTimeAgo(lastHabitCompletion)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1" 
              onClick={handleDismiss}
            >
              הבנתי, בוא נתחיל!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
