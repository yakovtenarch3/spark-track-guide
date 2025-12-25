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
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-4xl font-bold mb-2">בדיקת מעקב</h1>
          <p className="text-muted-foreground">
            עקוב אחר ההתקדמות והאלמנטים שלך
          </p>
        </div>

        {/* Main Stats Card */}
        <Card className="p-8 text-center" dir="rtl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
                <Target className="w-16 h-16 text-primary" />
              </div>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold">{completedDays}</div>
              <div className="text-4xl text-muted-foreground">/ {totalDays}</div>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{completedDays}</div>
            <div className="text-sm text-muted-foreground mt-1">
              ימים שהושלמו (מתוך {totalDays})
            </div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{incompleteDays}</div>
            <div className="text-sm text-muted-foreground mt-1">ימים לא מושלמים</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{currentStreak}</div>
            <div className="text-sm text-muted-foreground mt-1">רצף נוכחי</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{longestStreak}</div>
            <div className="text-sm text-muted-foreground mt-1">רצף הכי ארוך</div>
          </Card>
        </div>

        {/* Calendar and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 p-6" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
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
            <div className="grid grid-cols-7 gap-2">
              {/* Headers */}
              {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day) => (
                <div key={day} className="text-center font-bold text-sm p-2">
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
                    className={`aspect-square flex items-center justify-center rounded-lg ${bgColor} text-sm font-medium transition-all hover:scale-105 cursor-pointer`}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>מושלם</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-300" />
                <span>חלקי</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-300" />
                <span>נמוך</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-300" />
                <span>החמצה</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekdays">ימי עבודה</TabsTrigger>
                <TabsTrigger value="weekend">ימי סוף שבוע</TabsTrigger>
                <TabsTrigger value="all">כל הימים</TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          {/* Filters */}
          <Card className="p-6" dir="rtl">
            <h3 className="text-xl font-bold mb-4">מי נמצא בבדיקה</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border">
                <Checkbox
                  id="wake-up"
                  checked={selectedFilters.wakeUp}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, wakeUp: !!checked })
                  }
                />
                <label htmlFor="wake-up" className="flex-1 cursor-pointer">
                  <div className="font-medium">קימה בבוקר</div>
                  <div className="text-sm text-muted-foreground">מעקב יומי</div>
                </label>
                <Badge variant="secondary">{metrics.length}</Badge>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border">
                <Checkbox
                  id="goals"
                  checked={selectedFilters.goals}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, goals: !!checked })
                  }
                />
                <label htmlFor="goals" className="flex-1 cursor-pointer">
                  <div className="font-medium">יעדים יומיים</div>
                  <div className="text-sm text-muted-foreground">השגת יעדים</div>
                </label>
                <Badge variant="secondary">{totalGoals}</Badge>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border">
                <Checkbox
                  id="habits"
                  checked={selectedFilters.habits}
                  onCheckedChange={(checked) =>
                    setSelectedFilters({ ...selectedFilters, habits: !!checked })
                  }
                />
                <label htmlFor="habits" className="flex-1 cursor-pointer">
                  <div className="font-medium">הרגלים</div>
                  <div className="text-sm text-muted-foreground">הרגלים יומיים</div>
                </label>
                <Badge variant="secondary">{totalHabits}</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="p-6" dir="rtl">
          <h3 className="text-xl font-bold mb-6">ניתוח דפוסים אופטימלי</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bar Chart Placeholder */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">התפלגות השבועית</div>
              <div className="h-48 bg-gradient-to-t from-red-200 via-orange-200 to-green-200 rounded-lg flex items-end justify-center p-4">
                <div className="text-4xl font-bold">{completedDays}</div>
              </div>
            </div>

            {/* Donut Chart Placeholder */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">אחוז השלמה</div>
              <div className="h-48 flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="16"
                      strokeDasharray={`${(completedDays / totalDays) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {Math.round((completedDays / totalDays) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">סטטיסטיקות</div>
              <div className="h-48 flex flex-col justify-center gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{totalSessions}</div>
                  <div className="text-sm">כניסות</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((completedDays / totalDays) * 100)}%
                  </div>
                  <div className="text-sm">הצלחה</div>
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
