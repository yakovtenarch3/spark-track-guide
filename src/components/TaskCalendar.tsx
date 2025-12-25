import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import type { Task } from "@/hooks/useTasks";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

export const TaskCalendar = () => {
  const { tasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getTasksForDate = (day: number): Task[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.due_date === dateStr);
  };

  const renderDay = (day: number) => {
    const dayTasks = getTasksForDate(day);
    const completed = dayTasks.filter((t) => t.status === "completed").length;
    const total = dayTasks.length;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    const isToday =
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    return (
      <Card
        key={day}
        className={`p-2 min-h-[100px] hover:shadow-lg transition-all cursor-pointer ${
          isToday ? "ring-2 ring-primary" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-bold ${isToday ? "text-primary" : ""}`}>{day}</span>
          {total > 0 && (
            <Badge variant={successRate === 100 ? "default" : "secondary"} className="text-xs">
              {completed}/{total}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          {dayTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className={`text-xs p-1 rounded truncate ${
                task.status === "completed"
                  ? "bg-green-100 text-green-800 line-through"
                  : task.status === "in_progress"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
              title={task.title}
            >
              {task.title}
            </div>
          ))}
          {dayTasks.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">+{dayTasks.length - 3}</div>
          )}
        </div>
      </Card>
    );
  };

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(renderDay(day));
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          <h2 className="text-2xl font-bold">
            {MONTHS[month]} {year}
          </h2>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            היום
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {DAYS.map((day) => (
          <div key={day} className="text-center font-semibold text-sm p-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays}
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded" />
            <span>ממתין</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded" />
            <span>בביצוע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded" />
            <span>הושלם</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
