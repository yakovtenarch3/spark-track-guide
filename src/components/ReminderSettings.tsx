import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, BellOff } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { Habit } from "@/hooks/useHabits";
import { toast } from "sonner";

interface ReminderSettingsProps {
  habit: Habit;
  onUpdate: (habitId: string, reminderEnabled: boolean, reminderTime?: string) => void;
}

export const ReminderSettings = ({ habit, onUpdate }: ReminderSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(habit.reminder_enabled || false);
  const [time, setTime] = useState(habit.reminder_time || "09:00");
  const { permission, scheduleNotification, cancelNotification, requestPermission } =
    useNotifications();

  const handleSave = async () => {
    if (enabled) {
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          toast.error("לא ניתן להפעיל תזכורות ללא הרשאות התראות");
          return;
        }
      }
      
      await scheduleNotification(
        habit.title,
        `הגיע הזמן: ${habit.description || habit.title}`,
        time,
        habit.id
      );
      onUpdate(habit.id, true, time);
      toast.success("התזכורת הופעלה! 🔔");
    } else {
      cancelNotification(habit.id);
      onUpdate(habit.id, false, undefined);
    }
    
    setOpen(false);
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      // If disabling, save immediately
      cancelNotification(habit.id);
      onUpdate(habit.id, false, undefined);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`flex-shrink-0 ${
            habit.reminder_enabled
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title={habit.reminder_enabled ? "תזכורת מופעלת" : "הגדר תזכורת"}
        >
          {habit.reminder_enabled ? (
            <Bell className="w-5 h-5 fill-current" />
          ) : (
            <BellOff className="w-5 h-5" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הגדרות תזכורת</DialogTitle>
          <DialogDescription>
            קבע תזכורת יומית להרגל "{habit.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-enabled" className="text-base">
              הפעל תזכורת יומית
            </Label>
            <Switch
              id="reminder-enabled"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Time Picker */}
          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="reminder-time">שעת התזכורת</Label>
              <Input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                תקבל תזכורת מידי יום בשעה זו
              </p>
            </div>
          )}

          {/* Permission Status */}
          {permission === "denied" && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              הרשאות התראות נחסמו. אנא אפשר התראות בהגדרות הדפדפן
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            ביטול
          </Button>
          {enabled && (
            <Button type="button" onClick={handleSave}>
              שמור
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
