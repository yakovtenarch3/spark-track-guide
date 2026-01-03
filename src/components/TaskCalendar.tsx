import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, ListTodo, Bell, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Task } from "@/hooks/useTasks";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

export const TaskCalendar = () => {
  const { tasks, addTask } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<"task" | "reminder" | "meeting">("task");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemTime, setNewItemTime] = useState("");

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

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };

  const openAddDialog = (type: "task" | "reminder" | "meeting") => {
    setAddType(type);
    setNewItemTitle("");
    setNewItemDescription("");
    setNewItemTime("");
    setShowAddDialog(true);
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim() || !selectedDate) return;

    const typeLabels = {
      task: "משימה",
      reminder: "תזכורת",
      meeting: "פגישה"
    };

    const priorityMap = {
      task: "medium" as const,
      reminder: "low" as const,
      meeting: "high" as const
    };

    const categoryMap = {
      task: "work" as const,
      reminder: "other" as const,
      meeting: "other" as const
    };

    // Add the item as a task with special prefix
    addTask.mutate({
      title: `${addType === "meeting" ? "👥 " : addType === "reminder" ? "🔔 " : ""}${newItemTitle}`,
      description: newItemDescription + (newItemTime ? `\n⏰ שעה: ${newItemTime}` : ""),
      priority: priorityMap[addType],
      due_date: selectedDate,
    });

    toast.success(`${typeLabels[addType]} נוספ/ה בהצלחה!`);
    setShowAddDialog(false);
    setSelectedDate(null);
  };

  const formatDateHebrew = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${Number.parseInt(d)} ${MONTHS[Number.parseInt(m) - 1]} ${y}`;
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

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = selectedDate === dateStr;

    return (
      <DropdownMenu key={day} onOpenChange={(open) => open && handleDayClick(day)}>
        <DropdownMenuTrigger asChild>
          <Card
            className={`p-2 min-h-[100px] hover:shadow-lg transition-all cursor-pointer ${
              isToday ? "ring-2 ring-primary" : ""
            } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${isToday ? "text-primary" : ""}`}>{day}</span>
              <div className="flex items-center gap-1">
                {total > 0 && (
                  <Badge variant={successRate === 100 ? "default" : "secondary"} className="text-xs">
                    {completed}/{total}
                  </Badge>
                )}
                <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={() => openAddDialog("task")} className="cursor-pointer">
            <ListTodo className="w-4 h-4 ml-2" />
            הוסף משימה
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openAddDialog("reminder")} className="cursor-pointer">
            <Bell className="w-4 h-4 ml-2" />
            הוסף תזכורת
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openAddDialog("meeting")} className="cursor-pointer">
            <Users className="w-4 h-4 ml-2" />
            הוסף פגישה
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl" className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {addType === "task" && <><ListTodo className="w-5 h-5" /> הוסף משימה</>}
              {addType === "reminder" && <><Bell className="w-5 h-5" /> הוסף תזכורת</>}
              {addType === "meeting" && <><Users className="w-5 h-5" /> הוסף פגישה</>}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedDate && (
              <div className="text-sm text-muted-foreground text-center bg-muted p-2 rounded">
                📅 {formatDateHebrew(selectedDate)}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">כותרת</Label>
              <Input
                id="title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder={
                  addType === "task" ? "שם המשימה..." :
                  addType === "reminder" ? "תוכן התזכורת..." :
                  "נושא הפגישה..."
                }
              />
            </div>

            {(addType === "meeting" || addType === "reminder") && (
              <div className="space-y-2">
                <Label htmlFor="time">שעה</Label>
                <Input
                  id="time"
                  type="time"
                  value={newItemTime}
                  onChange={(e) => setNewItemTime(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">פרטים נוספים</Label>
              <Textarea
                id="description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder={
                  addType === "meeting" ? "משתתפים, מיקום, הערות..." :
                  "פרטים נוספים..."
                }
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddItem} disabled={!newItemTitle.trim()}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
