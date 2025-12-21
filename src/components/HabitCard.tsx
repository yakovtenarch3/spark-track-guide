import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Trash2, Clock } from "lucide-react";
import type { Habit } from "@/hooks/useHabits";
import { ReminderSettings } from "./ReminderSettings";

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateReminder: (habitId: string, reminderEnabled: boolean, reminderTime?: string) => void;
}

export const HabitCard = ({ habit, onToggle, onDelete, onUpdateReminder }: HabitCardProps) => {
  const handleToggle = () => {
    onToggle(habit.id, habit.completedToday || false);
  };

  const handleDelete = () => {
    onDelete(habit.id);
  };

  return (
    <Card
      className={`p-6 transition-[var(--transition)] hover:shadow-[var(--shadow-hover)] border-r-4 ${
        habit.completedToday
          ? "bg-success/5 border-success/40 shadow-[var(--shadow-success)]"
          : "bg-card border-border"
      }`}
      style={{ borderRightColor: habit.completedToday ? undefined : habit.color }}
      dir="rtl"
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 mt-1">
          <Checkbox
            id={habit.id}
            checked={habit.completedToday}
            onCheckedChange={handleToggle}
            className="w-7 h-7 rounded-full border-2 data-[state=checked]:bg-success data-[state=checked]:border-success"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor={habit.id}
            className={`block text-xl font-semibold cursor-pointer transition-all ${
              habit.completedToday
                ? "text-success line-through"
                : "text-foreground"
            }`}
          >
            {habit.title}
          </label>
          {habit.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {habit.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {/* Streak */}
            {habit.streak > 0 && (
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-medium text-primary">
                  {habit.streak} ימים רצופים
                </span>
              </div>
            )}

            {/* Preferred Time */}
            {habit.preferred_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {habit.preferred_time}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ReminderSettings habit={habit} onUpdate={onUpdateReminder} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
