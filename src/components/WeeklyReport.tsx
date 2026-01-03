import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface WeeklyReportProps {
  habits?: Array<{
    id: string;
    name: string;
    completedDates?: string[];
    streak?: number;
    category?: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
    priority?: string;
  }>;
  goals?: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    unit?: string;
  }>;
}

export const WeeklyReport = ({ habits = [], tasks = [], goals = [] }: WeeklyReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week

  // Get week dates
  const weekDates = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (selectedWeek * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day.toISOString().split("T")[0]);
    }

    return {
      start: startOfWeek,
      end: endOfWeek,
      days,
      label: `${startOfWeek.toLocaleDateString("he-IL")} - ${endOfWeek.toLocaleDateString("he-IL")}`,
    };
  }, [selectedWeek]);

  // Calculate stats
  const stats = useMemo(() => {
    // Habits stats
    const habitCompletions = habits.map((habit) => {
      const weekCompletions = (habit.completedDates || []).filter((date) =>
        weekDates.days.includes(date)
      ).length;
      return {
        name: habit.name,
        completions: weekCompletions,
        rate: Math.round((weekCompletions / 7) * 100),
        streak: habit.streak || 0,
      };
    });

    const totalHabitCompletions = habitCompletions.reduce((sum, h) => sum + h.completions, 0);
    const maxPossibleHabits = habits.length * 7;
    const habitSuccessRate = maxPossibleHabits > 0
      ? Math.round((totalHabitCompletions / maxPossibleHabits) * 100)
      : 0;

    // Tasks stats
    const weekTasks = tasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = task.completedAt.split("T")[0];
      return weekDates.days.includes(completedDate);
    });
    const completedTasks = weekTasks.filter((t) => t.completed).length;

    // Goals stats
    const goalsProgress = goals.map((goal) => ({
      name: goal.name,
      progress: Math.min(100, Math.round((goal.current / goal.target) * 100)),
      current: goal.current,
      target: goal.target,
      unit: goal.unit || "",
    }));
    const avgGoalProgress = goalsProgress.length > 0
      ? Math.round(goalsProgress.reduce((sum, g) => sum + g.progress, 0) / goalsProgress.length)
      : 0;

    // Daily breakdown
    const dailyData = weekDates.days.map((date) => {
      const dayHabits = habits.filter((h) => (h.completedDates || []).includes(date)).length;
      const dayTasks = tasks.filter((t) => t.completed && t.completedAt?.startsWith(date)).length;
      const dayName = new Date(date).toLocaleDateString("he-IL", { weekday: "short" });
      return {
        day: dayName,
        date,
        habits: dayHabits,
        tasks: dayTasks,
        total: dayHabits + dayTasks,
      };
    });

    // Categories breakdown
    const categoryBreakdown: Record<string, number> = {};
    habits.forEach((habit) => {
      const cat = habit.category || "כללי";
      const completions = (habit.completedDates || []).filter((d) => weekDates.days.includes(d)).length;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + completions;
    });

    return {
      habitCompletions,
      totalHabitCompletions,
      habitSuccessRate,
      completedTasks,
      goalsProgress,
      avgGoalProgress,
      dailyData,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({
        name,
        value,
      })),
      bestDay: dailyData.reduce((best, day) => (day.total > best.total ? day : best), dailyData[0]),
      topHabit: habitCompletions.reduce(
        (top, h) => (h.completions > top.completions ? h : top),
        habitCompletions[0]
      ),
    };
  }, [habits, tasks, goals, weekDates]);

  // Generate PDF report
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Create a printable report
      const reportContent = `
דוח שבועי - ${weekDates.label}
${"=".repeat(50)}

📊 סיכום כללי
---------------
✅ הרגלים שהושלמו: ${stats.totalHabitCompletions} מתוך ${habits.length * 7} (${stats.habitSuccessRate}%)
📋 משימות שהושלמו: ${stats.completedTasks}
🎯 התקדמות ממוצעת ביעדים: ${stats.avgGoalProgress}%

🏆 הישגים השבוע
---------------
📅 היום הכי טוב: ${stats.bestDay?.day || "N/A"} (${stats.bestDay?.total || 0} השלמות)
⭐ ההרגל המוביל: ${stats.topHabit?.name || "N/A"} (${stats.topHabit?.completions || 0}/7 ימים)

📈 פירוט הרגלים
---------------
${stats.habitCompletions.map((h) => `• ${h.name}: ${h.completions}/7 ימים (${h.rate}%)`).join("\n")}

🎯 התקדמות יעדים
---------------
${stats.goalsProgress.map((g) => `• ${g.name}: ${g.current}/${g.target} ${g.unit} (${g.progress}%)`).join("\n") || "אין יעדים פעילים"}

📅 פירוט יומי
---------------
${stats.dailyData.map((d) => `${d.day}: ${d.habits} הרגלים, ${d.tasks} משימות`).join("\n")}

---
נוצר על ידי Spark Track - ${new Date().toLocaleDateString("he-IL")}
      `;

      // Create blob and download
      const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `דוח-שבועי-${weekDates.start.toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("הדוח הורד בהצלחה!");
    } catch (error) {
      toast.error("שגיאה ביצירת הדוח");
    } finally {
      setIsGenerating(false);
    }
  };

  const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-none shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-purple-500" />
            דוח שבועי
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek((w) => w - 1)}
            >
              שבוע קודם
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(0)}
              disabled={selectedWeek === 0}
            >
              שבוע נוכחי
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <Calendar className="w-4 h-4 inline ml-1" />
          {weekDates.label}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">{stats.habitSuccessRate}%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">הצלחת הרגלים</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-cyan-500" />
              <span className="text-2xl font-bold text-cyan-600">{stats.completedTasks}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">משימות הושלמו</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600">{stats.avgGoalProgress}%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">יעדים</p>
          </div>
        </div>

        {/* Daily Chart */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            פירוט יומי
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                />
                <Bar dataKey="habits" name="הרגלים" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks" name="משימות" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        {stats.categoryBreakdown.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3">חלוקה לפי קטגוריות</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Performers */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            הרגלים מובילים
          </h3>
          {stats.habitCompletions.slice(0, 5).map((habit, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
            >
              <span className="text-sm">{habit.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${habit.rate}%` }}
                  />
                </div>
                <Badge variant={habit.rate >= 70 ? "default" : habit.rate >= 40 ? "secondary" : "outline"}>
                  {habit.completions}/7
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison with Previous Week */}
        <div className="p-3 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">השוואה לשבוע קודם</span>
            <div className="flex items-center gap-1">
              {stats.habitSuccessRate >= 50 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">מעולה!</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">יש מקום לשיפור</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Download Button */}
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90"
        >
          <Download className="w-4 h-4 ml-2" />
          {isGenerating ? "יוצר דוח..." : "הורד דוח שבועי"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WeeklyReport;
