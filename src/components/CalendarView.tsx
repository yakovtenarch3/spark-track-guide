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
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-base sm:text-xl">{getTitle()}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">מעקב יומי אחר ההשלמות שלך</CardDescription>
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
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
        <div className={`grid gap-1 sm:gap-2 ${
          viewMode === "day" ? "grid-cols-1" : 
          viewMode === "week" ? "grid-cols-7" : 
          "grid-cols-6 sm:grid-cols-10"
        }`}>
          {days.map((day) => {
            const { completedCount, totalCount, percentage } = getCompletionInfo(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  ${viewMode === "day" ? "h-24 sm:h-32" : "aspect-square"} 
                  rounded-lg sm:rounded-xl p-1 sm:p-2 text-center transition-all cursor-pointer
                  backdrop-blur-sm border
                  ${isToday ? "ring-2 ring-primary shadow-lg scale-105" : ""}
                  ${percentage === 100 ? "bg-success/20 hover:bg-success/30 border-success/30" : ""}
                  ${percentage > 0 && percentage < 100 ? "bg-primary/10 hover:bg-primary/20 border-primary/20" : ""}
                  ${percentage === 0 ? "bg-muted/30 hover:bg-muted/50 border-muted/40" : ""}
                  hover:scale-110 hover:shadow-md
                `}
                title={`${format(day, "d בMMMM", { locale: he })} - ${completedCount}/${totalCount} הושלמו`}
              >
                <div className={`${viewMode === "day" ? "text-sm sm:text-lg" : "text-[10px] sm:text-xs"} font-semibold text-foreground mb-0.5 sm:mb-1`}>
                  {viewMode === "day" ? format(day, "EEEE, d בMMMM", { locale: he }) : format(day, "d")}
                </div>
                <div className={`${viewMode === "day" ? "text-xs sm:text-base" : "text-[9px] sm:text-xs"} font-medium text-muted-foreground`}>
                  {completedCount}/{totalCount}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-success/20 border border-success/30 rounded-md"></div>
            <span className="text-muted-foreground">הושלמו כולם</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary/10 border border-primary/20 rounded-md"></div>
            <span className="text-muted-foreground">הושלמו חלקית</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted/30 border border-muted/40 rounded-md"></div>
            <span className="text-muted-foreground">לא הושלמו</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
