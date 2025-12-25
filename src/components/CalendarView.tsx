import { format, subDays, startOfDay, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { he } from "date-fns/locale";
import { useCompletions } from "@/hooks/useCompletions";
import { useHabits } from "@/hooks/useHabits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

type ViewMode = "day" | "week" | "month";

export const CalendarView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const { completions } = useCompletions(30);
  const { habits } = useHabits();
  
  // Generate days based on view mode
  const getDays = () => {
    const today = new Date();
    
    switch (viewMode) {
      case "day":
        return [startOfDay(today)];
      case "week":
        const weekStart = startOfWeek(today, { locale: he });
        const weekEnd = endOfWeek(today, { locale: he });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      case "month":
      default:
        return Array.from({ length: 30 }, (_, i) => {
          return startOfDay(subDays(today, 29 - i));
        });
    }
  };
  
  const days = getDays();

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

  const getTitle = () => {
    switch (viewMode) {
      case "day":
        return "לוח שנה - היום";
      case "week":
        return "לוח שנה - השבוע";
      case "month":
      default:
        return "לוח שנה - 30 ימים אחרונים";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              {getTitle()}
            </CardTitle>
            <CardDescription>מעקב יומי אחר ההשלמות שלך</CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-xs">
                  {viewMode === "day" && "יום"}
                  {viewMode === "week" && "שבוע"}
                  {viewMode === "month" && "חודש"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode("day")}>
                <span className={viewMode === "day" ? "font-bold" : ""}>יום</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("week")}>
                <span className={viewMode === "week" ? "font-bold" : ""}>שבוע</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("month")}>
                <span className={viewMode === "month" ? "font-bold" : ""}>חודש</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid gap-2 ${
          viewMode === "day" ? "grid-cols-1" : 
          viewMode === "week" ? "grid-cols-7" : 
          "grid-cols-10"
        }`}>
          {days.map((day) => {
            const { completedCount, totalCount, percentage } = getCompletionInfo(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  ${viewMode === "day" ? "h-32" : "aspect-square"} 
                  rounded-xl p-2 text-center transition-all cursor-pointer
                  backdrop-blur-sm border
                  ${isToday ? "ring-2 ring-primary shadow-lg scale-105" : ""}
                  ${percentage === 100 ? "bg-success/20 hover:bg-success/30 border-success/30" : ""}
                  ${percentage > 0 && percentage < 100 ? "bg-primary/10 hover:bg-primary/20 border-primary/20" : ""}
                  ${percentage === 0 ? "bg-muted/30 hover:bg-muted/50 border-muted/40" : ""}
                  hover:scale-110 hover:shadow-md
                `}
                title={`${format(day, "d בMMMM", { locale: he })} - ${completedCount}/${totalCount} הושלמו`}
              >
                <div className={`${viewMode === "day" ? "text-lg" : "text-xs"} font-semibold text-foreground mb-1`}>
                  {viewMode === "day" ? format(day, "EEEE, d בMMMM", { locale: he }) : format(day, "d")}
                </div>
                <div className={`${viewMode === "day" ? "text-base" : "text-xs"} font-medium text-muted-foreground`}>
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
