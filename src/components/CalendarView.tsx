import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { useCompletions } from "@/hooks/useCompletions";
import { useHabits } from "@/hooks/useHabits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export const CalendarView = () => {
  const { completions } = useCompletions(30);
  const { habits } = useHabits();
  
  // Generate last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    return startOfDay(subDays(new Date(), 29 - i));
  });

  const getCompletionInfo = (date: Date) => {
    const dayCompletions = completions.filter((c) => {
      const completionDate = new Date(c.completed_at);
      return isSameDay(completionDate, date);
    });

    const uniqueHabits = new Set(dayCompletions.map((c) => c.habit_id));
    const completedCount = uniqueHabits.size;
    const totalCount = habits.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return { completedCount, totalCount, percentage };
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          לוח שנה - 30 ימים אחרונים
        </CardTitle>
        <CardDescription>מעקב יומי אחר ההשלמות שלך</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-10 gap-2">
          {days.map((day) => {
            const { completedCount, totalCount, percentage } = getCompletionInfo(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square rounded-xl p-2 text-center transition-all cursor-pointer
                  backdrop-blur-sm border
                  ${isToday ? "ring-2 ring-primary shadow-lg scale-105" : ""}
                  ${percentage === 100 ? "bg-success/20 hover:bg-success/30 border-success/30" : ""}
                  ${percentage > 0 && percentage < 100 ? "bg-primary/10 hover:bg-primary/20 border-primary/20" : ""}
                  ${percentage === 0 ? "bg-muted/30 hover:bg-muted/50 border-muted/40" : ""}
                  hover:scale-110 hover:shadow-md
                `}
                title={`${format(day, "d בMMMM", { locale: he })} - ${completedCount}/${totalCount} הושלמו`}
              >
                <div className="text-xs font-semibold text-foreground mb-1">
                  {format(day, "d")}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  {completedCount}/{totalCount}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/20 border border-success/30 rounded-md"></div>
            <span className="text-muted-foreground">הושלמו כולם</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/10 border border-primary/20 rounded-md"></div>
            <span className="text-muted-foreground">הושלמו חלקית</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted/30 border border-muted/40 rounded-md"></div>
            <span className="text-muted-foreground">לא הושלמו</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
