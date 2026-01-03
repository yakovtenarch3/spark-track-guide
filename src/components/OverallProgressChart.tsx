import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  Calendar,
  Trophy,
  Star,
  Zap,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface ProgressData {
  habits?: Array<{
    id: string;
    name: string;
    completedDates?: string[];
    streak?: number;
    category?: string;
  }>;
  tasks?: Array<{
    id: string;
    completed: boolean;
    completedAt?: string;
    createdAt?: string;
  }>;
  goals?: Array<{
    id: string;
    name: string;
    current: number;
    target: number;
  }>;
}

interface OverallProgressChartProps {
  data?: ProgressData;
  timeRange?: "week" | "month" | "year";
}

export const OverallProgressChart = ({
  data = {},
  timeRange = "month",
}: OverallProgressChartProps) => {
  const { habits = [], tasks = [], goals = [] } = data;

  // Generate chart data based on time range
  const chartData = useMemo(() => {
    const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLabel = timeRange === "year"
        ? date.toLocaleDateString("he-IL", { month: "short" })
        : date.toLocaleDateString("he-IL", { weekday: "short", day: "numeric" });

      // Count habit completions for this day
      const habitCompletions = habits.filter((h) =>
        (h.completedDates || []).includes(dateStr)
      ).length;
      const habitRate = habits.length > 0
        ? Math.round((habitCompletions / habits.length) * 100)
        : 0;

      // Count task completions for this day
      const taskCompletions = tasks.filter((t) =>
        t.completed && t.completedAt?.startsWith(dateStr)
      ).length;

      // Goal average progress (snapshot - simplified)
      const goalProgress = goals.length > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + Math.min(100, (g.current / g.target) * 100), 0) /
              goals.length
          )
        : 0;

      // Only add data points at intervals for year view
      if (timeRange === "year" && i % 7 !== 0 && i !== 0) continue;

      result.push({
        date: dateStr,
        label: dayLabel,
        habitRate,
        habitCompletions,
        taskCompletions,
        goalProgress,
        // Calculate overall score
        overall: Math.round((habitRate + goalProgress) / 2),
      });
    }

    return result;
  }, [habits, tasks, goals, timeRange]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const recentData = chartData.slice(-7);
    const olderData = chartData.slice(-14, -7);

    const recentAvg = recentData.length > 0
      ? Math.round(recentData.reduce((sum, d) => sum + d.overall, 0) / recentData.length)
      : 0;
    const olderAvg = olderData.length > 0
      ? Math.round(olderData.reduce((sum, d) => sum + d.overall, 0) / olderData.length)
      : 0;

    const trend = recentAvg - olderAvg;
    const trendDirection = trend > 5 ? "up" : trend < -5 ? "down" : "stable";

    // Current streaks
    const maxStreak = Math.max(...habits.map((h) => h.streak || 0), 0);

    // Best day
    const bestDay = chartData.reduce(
      (best, day) => (day.overall > best.overall ? day : best),
      chartData[0] || { overall: 0, label: "N/A" }
    );

    // Category performance (radar chart data)
    const categoryStats: Record<string, number[]> = {};
    habits.forEach((habit) => {
      const cat = habit.category || "כללי";
      const weekCompletions = chartData.slice(-7).filter((d) =>
        (habit.completedDates || []).includes(d.date)
      ).length;
      const rate = Math.round((weekCompletions / 7) * 100);
      if (!categoryStats[cat]) categoryStats[cat] = [];
      categoryStats[cat].push(rate);
    });

    const radarData = Object.entries(categoryStats).map(([cat, rates]) => ({
      category: cat,
      value: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
    }));

    return {
      recentAvg,
      trend,
      trendDirection,
      maxStreak,
      bestDay,
      radarData,
      totalHabitCompletions: chartData.reduce((sum, d) => sum + d.habitCompletions, 0),
      totalTaskCompletions: chartData.reduce((sum, d) => sum + d.taskCompletions, 0),
    };
  }, [chartData, habits]);

  const getTrendIcon = () => {
    switch (stats.trendDirection) {
      case "up":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "down":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (stats.trendDirection) {
      case "up":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "down":
        return "text-red-600 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-700";
    }
  };

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-none shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-purple-500" />
            גרף התקדמות כללי
          </CardTitle>
          <Badge className={getTrendColor()}>
            {getTrendIcon()}
            <span className="mr-1">
              {stats.trendDirection === "up" && "מגמת עלייה"}
              {stats.trendDirection === "down" && "מגמת ירידה"}
              {stats.trendDirection === "stable" && "יציב"}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-xl font-bold text-purple-600">{stats.recentAvg}%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">ממוצע שבועי</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xl font-bold text-orange-600">{stats.maxStreak}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">רצף מקסימלי</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-green-500" />
              <span className="text-xl font-bold text-green-600">{stats.totalHabitCompletions}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">הרגלים שהושלמו</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-xl font-bold text-blue-600">{stats.totalTaskCompletions}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">משימות שהושלמו</p>
          </div>
        </div>

        {/* Main Progress Chart */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            התקדמות לאורך זמן
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={timeRange === "week" ? 0 : "preserveStartEnd"}
                />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === "overall" ? "ציון כללי" : name === "habitRate" ? "הרגלים" : "יעדים",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "overall" ? "ציון כללי" : value === "habitRate" ? "הרגלים" : "יעדים"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="overall"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOverall)"
                />
                <Line
                  type="monotone"
                  dataKey="habitRate"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="goalProgress"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Radar Chart */}
        {stats.radarData.length > 2 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              ביצועים לפי קטגוריה
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={stats.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="ביצועים"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Best Day Highlight */}
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">היום הכי טוב</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {stats.bestDay?.label}
              </span>
              <Badge className="bg-yellow-100 text-yellow-700">
                {stats.bestDay?.overall}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
          {stats.recentAvg >= 80 && "🌟 מדהים! אתה בדרך הנכונה!"}
          {stats.recentAvg >= 60 && stats.recentAvg < 80 && "💪 עבודה טובה! המשך כך!"}
          {stats.recentAvg >= 40 && stats.recentAvg < 60 && "🎯 יש מקום לשיפור, אל תוותר!"}
          {stats.recentAvg < 40 && "🚀 בוא נתחיל מחדש! כל יום הוא הזדמנות חדשה!"}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallProgressChart;
