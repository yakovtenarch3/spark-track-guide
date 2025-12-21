import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Medal,
  Star,
  Crown,
  Flame,
  Target,
  Zap,
  Award,
  TrendingUp,
  Sparkles,
  Swords,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyGoal {
  id: string;
  title: string;
  color: string;
  icon: string;
  is_active: boolean;
}

interface DailyGoalLog {
  id: string;
  goal_id: string;
  log_date: string;
  succeeded: boolean;
}

interface CompetitionModeProps {
  goals: DailyGoal[];
  logs: DailyGoalLog[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  targetPoints: number;
  rewardPoints: number;
  type: "weekly" | "daily" | "streak";
}

const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: "perfect-week",
    title: "שבוע מושלם",
    description: "השלם את כל היעדים בכל יום השבוע",
    icon: Crown,
    targetPoints: 100,
    rewardPoints: 500,
    type: "weekly",
  },
  {
    id: "consistency-master",
    title: "אלוף העקביות",
    description: "השלם לפחות 5 ימים מתוך 7",
    icon: Medal,
    targetPoints: 70,
    rewardPoints: 300,
    type: "weekly",
  },
  {
    id: "streak-builder",
    title: "בונה רצפים",
    description: "בנה רצף של 7 ימים רצופים",
    icon: Flame,
    targetPoints: 7,
    rewardPoints: 400,
    type: "streak",
  },
  {
    id: "multi-goal",
    title: "רב-משימתי",
    description: "עבוד על 3 יעדים שונים או יותר",
    icon: Target,
    targetPoints: 3,
    rewardPoints: 200,
    type: "weekly",
  },
  {
    id: "early-bird",
    title: "ציפור מוקדמת",
    description: "סמן הצלחה לפני 10 בבוקר 3 פעמים",
    icon: Zap,
    targetPoints: 3,
    rewardPoints: 150,
    type: "daily",
  },
];

export const CompetitionMode = ({ goals, logs, open, onOpenChange }: CompetitionModeProps) => {
  const [selectedTab, setSelectedTab] = useState("ranking");
  
  const activeGoals = goals.filter((g) => g.is_active);

  // Calculate stats for the current week
  const currentWeekStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return activeGoals.map((goal) => {
      const weekLogs = logs.filter((log) => {
        const logDate = new Date(log.log_date);
        return log.goal_id === goal.id && logDate >= weekStart && logDate <= weekEnd;
      });

      const successDays = weekLogs.filter((l) => l.succeeded).length;
      const failDays = weekLogs.filter((l) => !l.succeeded).length;
      const totalDays = weekDays.filter((d) => d <= now).length;
      const successRate = totalDays > 0 ? Math.round((successDays / totalDays) * 100) : 0;
      
      // Points calculation
      const basePoints = successDays * 10;
      const streakBonus = calculateCurrentStreak(goal.id, logs) * 5;
      const consistencyBonus = successRate >= 80 ? 50 : successRate >= 60 ? 25 : 0;
      const totalPoints = basePoints + streakBonus + consistencyBonus;

      return {
        goal,
        successDays,
        failDays,
        totalDays,
        successRate,
        basePoints,
        streakBonus,
        consistencyBonus,
        totalPoints,
        currentStreak: calculateCurrentStreak(goal.id, logs),
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [activeGoals, logs]);

  // Calculate challenge progress
  const challengeProgress = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(d => d <= now);

    return WEEKLY_CHALLENGES.map((challenge) => {
      let progress = 0;
      let isCompleted = false;

      switch (challenge.id) {
        case "perfect-week": {
          // Check if all goals were completed every day
          const perfectDays = weekDays.filter((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            return activeGoals.every((goal) => {
              const log = logs.find(
                (l) => l.goal_id === goal.id && l.log_date === dayStr
              );
              return log?.succeeded;
            });
          }).length;
          progress = (perfectDays / 7) * 100;
          isCompleted = perfectDays === 7;
          break;
        }
        case "consistency-master": {
          const daysWithSuccess = weekDays.filter((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            return activeGoals.some((goal) => {
              const log = logs.find(
                (l) => l.goal_id === goal.id && l.log_date === dayStr
              );
              return log?.succeeded;
            });
          }).length;
          progress = (daysWithSuccess / 5) * 100;
          isCompleted = daysWithSuccess >= 5;
          break;
        }
        case "streak-builder": {
          const maxStreak = Math.max(
            ...activeGoals.map((g) => calculateCurrentStreak(g.id, logs)),
            0
          );
          progress = (maxStreak / 7) * 100;
          isCompleted = maxStreak >= 7;
          break;
        }
        case "multi-goal": {
          const goalsWithSuccess = activeGoals.filter((goal) => {
            return logs.some((l) => {
              const logDate = new Date(l.log_date);
              return (
                l.goal_id === goal.id &&
                l.succeeded &&
                logDate >= weekStart &&
                logDate <= weekEnd
              );
            });
          }).length;
          progress = (goalsWithSuccess / 3) * 100;
          isCompleted = goalsWithSuccess >= 3;
          break;
        }
        case "early-bird": {
          // Simplified - count morning successes (we don't track exact time, so estimate)
          const morningSuccesses = Math.min(
            logs.filter((l) => {
              const logDate = new Date(l.log_date);
              return l.succeeded && logDate >= weekStart && logDate <= weekEnd;
            }).length,
            3
          );
          progress = (morningSuccesses / 3) * 100;
          isCompleted = morningSuccesses >= 3;
          break;
        }
      }

      return {
        ...challenge,
        progress: Math.min(progress, 100),
        isCompleted,
      };
    });
  }, [activeGoals, logs]);

  // Calculate total points and level
  const totalPoints = currentWeekStats.reduce((sum, s) => sum + s.totalPoints, 0);
  const completedChallenges = challengeProgress.filter((c) => c.isCompleted);
  const challengeBonus = completedChallenges.reduce((sum, c) => sum + c.rewardPoints, 0);
  const grandTotal = totalPoints + challengeBonus;
  const level = Math.floor(grandTotal / 500) + 1;
  const levelProgress = (grandTotal % 500) / 500 * 100;

  // Previous week comparison
  const previousWeekComparison = useMemo(() => {
    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });

    const lastWeekLogs = logs.filter((log) => {
      const logDate = new Date(log.log_date);
      return logDate >= lastWeekStart && logDate <= lastWeekEnd;
    });

    const lastWeekSuccesses = lastWeekLogs.filter((l) => l.succeeded).length;
    const thisWeekSuccesses = currentWeekStats.reduce((sum, s) => sum + s.successDays, 0);

    const improvement = thisWeekSuccesses - lastWeekSuccesses;
    return {
      lastWeek: lastWeekSuccesses,
      thisWeek: thisWeekSuccesses,
      improvement,
      percentChange: lastWeekSuccesses > 0 
        ? Math.round((improvement / lastWeekSuccesses) * 100) 
        : thisWeekSuccesses > 0 ? 100 : 0,
    };
  }, [logs, currentWeekStats]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case 1: return "bg-gray-400/20 text-gray-500 border-gray-400/30";
      case 2: return "bg-amber-600/20 text-amber-600 border-amber-600/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Swords className="w-6 h-6 text-primary" />
            מצב תחרות
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-100px)]">
          <div className="space-y-4 p-1">
            {/* Level & Total Points */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-primary" />
                      </div>
                      <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5">
                        {level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">רמה</p>
                      <p className="text-2xl font-bold">{level}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">סה"כ נקודות</p>
                    <p className="text-3xl font-bold text-primary">{grandTotal}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>התקדמות לרמה הבאה</span>
                    <span>{Math.round(levelProgress)}%</span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Week Comparison */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={cn(
                      "w-5 h-5",
                      previousWeekComparison.improvement >= 0 ? "text-green-500" : "text-red-500"
                    )} />
                    <span className="text-sm font-medium">השוואה לשבוע שעבר</span>
                  </div>
                  <Badge variant={previousWeekComparison.improvement >= 0 ? "default" : "destructive"}>
                    {previousWeekComparison.improvement >= 0 ? "+" : ""}
                    {previousWeekComparison.percentChange}%
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">שבוע שעבר</p>
                    <p className="text-lg font-semibold">{previousWeekComparison.lastWeek} הצלחות</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">השבוע</p>
                    <p className="text-lg font-semibold text-primary">{previousWeekComparison.thisWeek} הצלחות</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ranking">דירוג יעדים</TabsTrigger>
                <TabsTrigger value="challenges">אתגרים שבועיים</TabsTrigger>
              </TabsList>

              <TabsContent value="ranking" className="mt-4 space-y-3">
                {currentWeekStats.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>אין יעדים פעילים</p>
                      <p className="text-sm">הוסף יעדים כדי להתחיל להתחרות!</p>
                    </CardContent>
                  </Card>
                ) : (
                  currentWeekStats.map((stat, index) => (
                    <Card 
                      key={stat.goal.id}
                      className={cn(
                        "transition-all",
                        index === 0 && "ring-2 ring-yellow-500/30 bg-yellow-500/5"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2",
                            getRankBadge(index)
                          )}>
                            {getRankIcon(index)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: stat.goal.color }}
                              />
                              <p className="font-medium truncate">{stat.goal.title}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {stat.successDays}/{stat.totalDays} ימים
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Flame className="w-3 h-3 ml-1" />
                                {stat.currentStreak} רצף
                              </Badge>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold text-primary">{stat.totalPoints}</p>
                            <p className="text-xs text-muted-foreground">נקודות</p>
                          </div>
                        </div>

                        {/* Points Breakdown */}
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            בסיס: {stat.basePoints}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            רצף: +{stat.streakBonus}
                          </span>
                          {stat.consistencyBonus > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Award className="w-3 h-3" />
                              עקביות: +{stat.consistencyBonus}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="challenges" className="mt-4 space-y-3">
                {challengeProgress.map((challenge) => {
                  const IconComponent = challenge.icon;
                  return (
                    <Card 
                      key={challenge.id}
                      className={cn(
                        "transition-all",
                        challenge.isCompleted && "ring-2 ring-green-500/30 bg-green-500/5"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            challenge.isCompleted 
                              ? "bg-green-500/20 text-green-600" 
                              : "bg-muted"
                          )}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{challenge.title}</p>
                              {challenge.isCompleted && (
                                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                                  <Sparkles className="w-3 h-3 ml-1" />
                                  הושלם!
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{challenge.description}</p>
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-1 text-primary">
                              <Gift className="w-4 h-4" />
                              <span className="font-bold">{challenge.rewardPoints}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">נקודות</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>התקדמות</span>
                            <span>{Math.round(challenge.progress)}%</span>
                          </div>
                          <Progress 
                            value={challenge.progress} 
                            className={cn(
                              "h-2",
                              challenge.isCompleted && "[&>div]:bg-green-500"
                            )} 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Completed Challenges Summary */}
                {completedChallenges.length > 0 && (
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="font-medium">השלמת {completedChallenges.length} אתגרים!</p>
                      <p className="text-sm text-muted-foreground">
                        בונוס: <span className="text-green-600 font-bold">+{challengeBonus}</span> נקודות
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to calculate current streak
function calculateCurrentStreak(goalId: string, logs: DailyGoalLog[]): number {
  const goalLogs = logs
    .filter((l) => l.goal_id === goalId)
    .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

  let streak = 0;
  const today = new Date();
  let currentDate = today;

  for (const log of goalLogs) {
    const logDate = new Date(log.log_date);
    const expectedDate = format(currentDate, "yyyy-MM-dd");
    
    if (log.log_date === expectedDate) {
      if (log.succeeded) {
        streak++;
        currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
      } else {
        break;
      }
    } else if (logDate < currentDate) {
      // Check if we missed a day
      const daysDiff = Math.floor(
        (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 1) break;
      
      if (log.succeeded) {
        streak++;
        currentDate = logDate;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return streak;
}
