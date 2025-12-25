import { useAccountabilityTracking } from "@/hooks/useAccountabilityTracking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const Accountability = () => {
  const { analytics, metrics, sessions, isLoading } = useAccountabilityTracking();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const {
    totalSessions,
    totalMinutes,
    averageSessionMinutes,
    currentStreak,
    longestStreak,
    totalHabits,
    totalTasks,
    totalGoals,
    totalJournalEntries,
    bestDays,
    worstDays,
    engagementTrend,
    missedDays,
    lowEngagementDays,
    recommendations,
  } = analytics;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
            מערכת בקרת מעקב
          </h1>
          <p className="text-muted-foreground">
            מעקב אחר הפעילות שלך עם ניתוח חכם והמלצות
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalSessions}</div>
                <div className="text-sm text-muted-foreground">כניסות</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.floor(totalMinutes / 60)}:{String(totalMinutes % 60).padStart(2, "0")}
                </div>
                <div className="text-sm text-muted-foreground">שעות פעילות</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{currentStreak}</div>
                <div className="text-sm text-muted-foreground">רצף נוכחי</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {metrics[0]?.engagement_score || 0}
                </div>
                <div className="text-sm text-muted-foreground">ציון מעורבות</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Streak Status */}
        {currentStreak > 0 && (
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200" dir="rtl">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-bold">🔥 סטטוס רצף</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-4xl font-bold text-orange-600">{currentStreak}</div>
                <div className="text-sm">ימים רצופים</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-600">{longestStreak}</div>
                <div className="text-sm">רצף הכי ארוך</div>
              </div>
            </div>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="p-6" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold">המלצות חכמות</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-4 bg-blue-50 border-r-4 border-blue-500 rounded-lg"
                >
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Activity Summary */}
        <Card className="p-6" dir="rtl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            סיכום פעילות
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{totalHabits}</div>
              <div className="text-sm text-muted-foreground">הרגלים הושלמו</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">משימות הושלמו</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{totalGoals}</div>
              <div className="text-sm text-muted-foreground">יעדים עוקבו</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-pink-600">{totalJournalEntries}</div>
              <div className="text-sm text-muted-foreground">רשומות יומן</div>
            </div>
          </div>
        </Card>

        {/* Engagement Trend */}
        <Card className="p-6" dir="rtl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            מגמת מעורבות (14 ימים אחרונים)
          </h3>
          <div className="space-y-2">
            {engagementTrend.map((day, i) => {
              const maxScore = 100;
              const percentage = (day.score / maxScore) * 100;
              const color =
                day.score >= 70
                  ? "bg-green-500"
                  : day.score >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500";

              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">
                    {format(new Date(day.date), "d MMM", { locale: he })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all flex items-center justify-center text-white text-sm font-bold`}
                      style={{ width: `${percentage}%` }}
                    >
                      {day.score > 20 && day.score}
                    </div>
                  </div>
                  <div className="w-12 text-sm font-bold">{day.score}%</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Best & Worst Days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Days */}
          {bestDays.length > 0 && (
            <Card className="p-6" dir="rtl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                הימים הכי טובים
              </h3>
              <div className="space-y-2">
                {bestDays.map((day, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">#{i + 1}</Badge>
                      <span className="font-medium">
                        {format(new Date(day.day), "d MMMM yyyy", { locale: he })}
                      </span>
                    </div>
                    <Badge variant="outline">{day.score}%</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Worst Days */}
          {worstDays.length > 0 && (
            <Card className="p-6" dir="rtl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />
                ימים עם ביצועים נמוכים
              </h3>
              <div className="space-y-2">
                {worstDays.map((day, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium">
                        {format(new Date(day.day), "d MMMM yyyy", { locale: he })}
                      </span>
                    </div>
                    <Badge variant="outline">{day.score}%</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Alerts Summary */}
        {(missedDays > 0 || lowEngagementDays > 0) && (
          <Card className="p-6 bg-red-50 border-red-200" dir="rtl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              התראות
            </h3>
            <div className="space-y-2">
              {missedDays > 0 && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm">
                    ⚠️ לא נכנסת לאתר {missedDays} ימים ב-30 הימים האחרונים
                  </p>
                </div>
              )}
              {lowEngagementDays > 0 && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm">
                    📉 {lowEngagementDays} ימים עם מעורבות נמוכה (מתחת ל-30%)
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recent Sessions */}
        <Card className="p-6" dir="rtl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            כניסות אחרונות
          </h3>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {sessions.slice(0, 20).map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {format(new Date(session.session_start), "d MMMM yyyy, HH:mm", {
                        locale: he,
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.duration_minutes
                        ? `${session.duration_minutes} דקות`
                        : "פעיל כרגע"}
                    </div>
                  </div>
                  <Badge variant="outline">{session.actions_count} פעולות</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default Accountability;
