import { useAccountabilityTracking } from "@/hooks/useAccountabilityTracking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Target,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import { useState } from "react";

const Accountability = () => {
  const { analytics, metrics, sessions, isLoading } = useAccountabilityTracking();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedFilters, setSelectedFilters] = useState({
    habits: true,
    goals: true,
    wakeUp: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const {
    totalSessions,
    currentStreak,
    longestStreak,
    totalHabits,
    totalTasks,
    totalGoals,
  } = analytics;

  // Calculate completion data
  const totalDays = metrics.length;
  const completedDays = metrics.filter((m) => m.logged_in && m.engagement_score >= 50).length;
  const incompleteDays = totalDays - completedDays;

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (day: Date) => {
    const metric = metrics.find((m) => isSameDay(new Date(m.date), day));
    if (!metric) return "none";
    if (!metric.logged_in) return "missed";
    if (metric.engagement_score >= 70) return "completed";
    if (metric.engagement_score >= 40) return "partial";
    return "low";
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">בדיקת מעקב</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            עקוב אחר ההתקדמות והאלמנטים שלך
          </p>
        </div>

        {/* Main Stats Card */}
        <Card className="p-4 sm:p-6 md:p-8 text-center" dir="rtl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 sm:border-6 md:border-8 border-primary/20 flex items-center justify-center">
                <Target className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary" />
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold">{completedDays}</div>
              <div className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground">/ {totalDays}</div>
            </div>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2">
            ימים שהושלמו בפועל מתוך סך הכל
          </p>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${(completedDays / totalDays) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" dir="rtl">
          <Card className="p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{completedDays}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              ימים שהושלמו (מתוך {totalDays})
            </div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{incompleteDays}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">ימים לא מושלמים</div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{currentStreak}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">רצף נוכחי</div>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{longestStreak}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">רצף הכי ארוך</div>
          </Card>
        </div>

        {/* Calendar and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-bold">
                {format(currentMonth, "MMMM yyyy", { locale: he })}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={prevMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Headers */}
              {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day) => (
                <div key={day} className="text-center font-bold text-xs sm:text-sm p-1 sm:p-2">
                  {day}
                </div>
              ))}

              {/* Days */}
              {daysInMonth.map((day) => {
                const status = getDayStatus(day);
                const bgColor =
                  status === "completed"
                    ? "bg-blue-500 text-white"
                    : status === "partial"
                    ? "bg-blue-300 text-white"
                    : status === "low"
                    ? "bg-orange-300"
                    : status === "missed"
                    ? "bg-red-300"
                    : "bg-gray-100";

                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square flex items-center justify-center rounded-md sm:rounded-lg ${bgColor} text-xs sm:text-sm font-medium transition-all hover:scale-105 cursor-pointer`}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-6 justify-center text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500" />
                <span>מושלם</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-300" />
                <span>חלקי</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-300" />
                <span>נמוך</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-300" />
                <span>החמצה</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="mt-4 sm:mt-6">
              <TabsList className="grid w-full grid-cols-3 h-8 sm:h-10">
                <TabsTrigger value="weekdays" className="text-xs sm:text-sm">ימי עבודה</TabsTrigger>
                <TabsTrigger value="weekend" className="text-xs sm:text-sm">ימי סוף שבוע</TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">כל הימים</TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          {/* Filters */}
          <Card className="p-4 sm:p-6" dir="rtl">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">מי נמצא בבדיקה</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg border">
                <Checkbox
                  id="wake-up"
                  checked={selectedFilters.wakeUp}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, wakeUp: !!checked })
                  }
                />
                <label htmlFor="wake-up" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm sm:text-base">קימה בבוקר</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">מעקב יומי</div>
                </label>
                <Badge variant="secondary" className="text-xs">{metrics.length}</Badge>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border">
                <Checkbox
                  id="goals"
                  checked={selectedFilters.goals}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, goals: !!checked })
                  }
                />
                <label htmlFor="goals" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm sm:text-base">יעדים יומיים</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">השגת יעדים</div>
                </label>
                <Badge variant="secondary" className="text-xs">{totalGoals}</Badge>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 rounded-lg border">
                <Checkbox
                  id="habits"
                  checked={selectedFilters.habits}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, habits: !!checked })
                  }
                />
                <label htmlFor="habits" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm sm:text-base">הרגלים</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">הרגלים יומיים</div>
                </label>
                <Badge variant="secondary" className="text-xs">{totalHabits}</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="p-4 sm:p-6" dir="rtl">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">ניתוח דפוסים אופטימלי</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Bar Chart Placeholder */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-muted-foreground">התפלגות השבועית</div>
              <div className="h-36 sm:h-48 bg-gradient-to-t from-red-200 via-orange-200 to-green-200 rounded-lg flex items-end justify-center p-3 sm:p-4">
                <div className="text-3xl sm:text-4xl font-bold">{completedDays}</div>
              </div>
            </div>

            {/* Donut Chart Placeholder */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-muted-foreground">אחוז השלמה</div>
              <div className="h-36 sm:h-48 flex items-center justify-center">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      strokeDasharray={`${(completedDays / totalDays) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold">
                      {Math.round((completedDays / totalDays) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 sm:col-span-2 md:col-span-1">
              <div className="text-xs sm:text-sm text-muted-foreground">סטטיסטיקות</div>
              <div className="h-36 sm:h-48 flex flex-col justify-center gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">{totalSessions}</div>
                  <div className="text-xs sm:text-sm">כניסות</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    {Math.round((completedDays / totalDays) * 100)}%
                  </div>
                  <div className="text-xs sm:text-sm">הצלחה</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Accountability;
