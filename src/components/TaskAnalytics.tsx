import { useTaskAnalytics } from "@/hooks/useTaskAnalytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export const TaskAnalytics = () => {
  const { analytics, isLoading } = useTaskAnalytics();

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const {
    totalCompletions,
    totalFailures,
    overallSuccessRate,
    bestDay,
    worstDay,
    bestHours,
    worstHours,
    dayPatterns,
    hourPatterns,
    recommendations,
    insights,
    currentStreak,
    longestStreak,
  } = analytics;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">ניתוח חכם והמלצות</h2>
        <p className="text-sm text-muted-foreground">
          מבוסס על {totalCompletions + totalFailures} משימות
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalCompletions}</div>
              <div className="text-sm text-muted-foreground">הושלמו</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalFailures}</div>
              <div className="text-sm text-muted-foreground">נכשלו</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overallSuccessRate.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">אחוז הצלחה</div>
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
      </div>

      {/* Streaks */}
      {(currentStreak > 0 || longestStreak > 0) && (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-bold">🔥 רצפים</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
              <div className="text-sm">רצף נוכחי</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{longestStreak}</div>
              <div className="text-sm">רצף הכי ארוך</div>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-bold">המלצות חכמות</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-4 bg-purple-50 border-r-4 border-purple-500 rounded-lg"
              >
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold">תובנות</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Day Patterns */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-bold">דפוסים לפי ימים בשבוע</h3>
        </div>

        <div className="space-y-3">
          {dayPatterns.map((day) => {
            const total = day.completions + day.failures;
            if (total === 0) return null;

            const isBest = bestDay && day.dayOfWeek === bestDay.dayOfWeek;
            const isWorst = worstDay && day.dayOfWeek === worstDay.dayOfWeek;

            return (
              <div
                key={day.dayOfWeek}
                className={`p-4 rounded-lg border-2 ${
                  isBest
                    ? "bg-green-50 border-green-300"
                    : isWorst
                    ? "bg-red-50 border-red-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{day.dayName}</span>
                    {isBest && <Badge className="bg-green-600">הכי טוב</Badge>}
                    {isWorst && <Badge variant="destructive">הכי חלש</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">✓ {day.completions}</span>
                    <span className="text-red-600">✗ {day.failures}</span>
                    <Badge variant="outline">{day.successRate.toFixed(0)}%</Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                    style={{ width: `${day.successRate}%` }}
                  />
                </div>

                {/* Energy & Difficulty */}
                {day.avgEnergy > 0 && (
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>⚡ אנרגיה: {day.avgEnergy.toFixed(1)}/5</span>
                    {day.avgDifficulty > 0 && (
                      <span>🎯 קושי: {day.avgDifficulty.toFixed(1)}/5</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Hour Patterns */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold">דפוסים לפי שעות ביום</h3>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-2">
            {hourPatterns
              .filter((h) => h.completions + h.failures > 0)
              .sort((a, b) => b.successRate - a.successRate)
              .map((hour) => {
                const total = hour.completions + hour.failures;
                const isBest = bestHours.some((h) => h.hour === hour.hour);
                const isWorst = worstHours.some((h) => h.hour === hour.hour);

                return (
                  <div
                    key={hour.hour}
                    className={`p-3 rounded-lg ${
                      isBest
                        ? "bg-green-50 border-2 border-green-300"
                        : isWorst
                        ? "bg-red-50 border-2 border-red-300"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {String(hour.hour).padStart(2, "0")}:00
                        </span>
                        {isBest && <Badge className="bg-green-600 text-xs">מומלץ</Badge>}
                        {isWorst && <Badge variant="destructive" className="text-xs">נמוך</Badge>}
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-600">✓ {hour.completions}</span>
                        <span className="text-red-600">✗ {hour.failures}</span>
                        <Badge variant="outline">{hour.successRate.toFixed(0)}%</Badge>
                      </div>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${hour.successRate}%` }}
                      />
                    </div>

                    {hour.avgEnergy > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ⚡ {hour.avgEnergy.toFixed(1)}/5
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
