import { useMemo } from "react";
import {
  Clock,
  Calendar,
  BarChart3,
  TrendingUp,
  Award,
  Flame,
  Target,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, startOfDay, startOfWeek, isToday, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimerSession {
  id: string;
  topic_id: string | null;
  topic_name: string;
  duration_seconds: number;
  created_at: string;
}

interface TimerTopic {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TimerStatsProps {
  sessions: TimerSession[];
  topics: TimerTopic[];
  formatTime: (seconds: number) => string;
}

export function TimerStats({ sessions, topics, formatTime }: TimerStatsProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });

    const totalSeconds = sessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    const todaySessions = sessions.filter((s) =>
      isToday(new Date(s.created_at))
    );
    const todaySeconds = todaySessions.reduce(
      (acc, s) => acc + s.duration_seconds,
      0
    );

    const weekSessions = sessions.filter(
      (s) => new Date(s.created_at) >= weekStart
    );
    const weekSeconds = weekSessions.reduce(
      (acc, s) => acc + s.duration_seconds,
      0
    );

    // Calculate streak (days in a row with sessions)
    let streak = 0;
    let checkDate = startOfDay(now);
    while (true) {
      const hasSessions = sessions.some((s) =>
        isSameDay(new Date(s.created_at), checkDate)
      );
      if (hasSessions) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Average per day (last 7 days with sessions)
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i));
    const daysWithSessions = last7Days.filter((day) =>
      sessions.some((s) => isSameDay(new Date(s.created_at), day))
    ).length;
    const avgPerDay = daysWithSessions > 0 ? weekSeconds / daysWithSessions : 0;

    return {
      totalSeconds,
      todaySeconds,
      weekSeconds,
      totalSessions: sessions.length,
      todaySessions: todaySessions.length,
      weekSessions: weekSessions.length,
      streak,
      avgPerDay,
    };
  }, [sessions]);

  // Generate chart data for last 7 days
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const daySessions = sessions.filter((s) =>
        isSameDay(new Date(s.created_at), date)
      );
      const totalMinutes = daySessions.reduce(
        (acc, s) => acc + s.duration_seconds / 60,
        0
      );
      data.push({
        date: format(date, "EEE", { locale: he }),
        fullDate: format(date, "dd/MM", { locale: he }),
        minutes: Math.round(totalMinutes),
        sessions: daySessions.length,
      });
    }
    return data;
  }, [sessions]);

  // Topic distribution data
  const topicData = useMemo(() => {
    const topicMinutes: { [key: string]: number } = {};
    sessions.forEach((s) => {
      const key = s.topic_name;
      topicMinutes[key] = (topicMinutes[key] || 0) + s.duration_seconds / 60;
    });

    return Object.entries(topicMinutes)
      .map(([name, minutes]) => {
        const topic = topics.find((t) => t.name === name);
        return {
          name,
          value: Math.round(minutes),
          color: topic?.color || "#8B5CF6",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [sessions, topics]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ זמן</p>
                <p className="text-2xl font-bold font-mono bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {formatTime(stats.totalSeconds)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">היום</p>
                <p className="text-2xl font-bold font-mono">
                  {formatTime(stats.todaySeconds)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">רצף ימים</p>
                <p className="text-2xl font-bold">
                  {stats.streak}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    🔥
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">מפגשים</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              פעילות שבועית
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--muted))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value}ד`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg bg-popover border p-3 shadow-lg">
                            <p className="font-medium mb-1">{label}</p>
                            <p className="text-sm text-primary">
                              {payload[0].value} דקות
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0].payload.sessions} מפגשים
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Topic Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              חלוקה לפי נושא
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {topicData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                אין נתונים להצגה
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topicData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {topicData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg bg-popover border p-3 shadow-lg">
                                <p className="font-medium">
                                  {payload[0].payload.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {payload[0].value} דקות
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {topicData.slice(0, 5).map((topic, index) => (
                    <div key={topic.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      />
                      <span className="text-sm flex-1 truncate">{topic.name}</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {topic.value}ד
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary */}
      <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            סיכום שבועי
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">זמן כולל השבוע</p>
              <p className="text-3xl font-bold font-mono text-primary">
                {formatTime(stats.weekSeconds)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.weekSessions} מפגשים
              </p>
            </div>

            <div className="text-center p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">ממוצע יומי</p>
              <p className="text-3xl font-bold font-mono text-green-500">
                {formatTime(Math.round(stats.avgPerDay))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">בימים פעילים</p>
            </div>

            <div className="text-center p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">הנושא המוביל</p>
              {topicData.length > 0 ? (
                <>
                  <p className="text-xl font-bold">{topicData[0].name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {topicData[0].value} דקות
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
