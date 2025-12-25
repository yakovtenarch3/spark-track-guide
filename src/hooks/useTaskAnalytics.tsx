import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TaskCompletion, TaskFailure } from "./useTasks";

interface DayPattern {
  dayOfWeek: number;
  dayName: string;
  completions: number;
  failures: number;
  successRate: number;
  avgEnergy: number;
  avgDifficulty: number;
}

interface HourPattern {
  hour: number;
  completions: number;
  failures: number;
  successRate: number;
  avgEnergy: number;
}

interface Analytics {
  // Overall stats
  totalCompletions: number;
  totalFailures: number;
  overallSuccessRate: number;
  
  // Patterns
  bestDay: DayPattern | null;
  worstDay: DayPattern | null;
  bestHours: HourPattern[];
  worstHours: HourPattern[];
  dayPatterns: DayPattern[];
  hourPatterns: HourPattern[];
  
  // Recommendations
  recommendations: string[];
  insights: string[];
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
}

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const useTaskAnalytics = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['task-analytics'],
    queryFn: async (): Promise<Analytics> => {
      // Fetch completions
      const { data: completions, error: compError } = await supabase
        .from('task_completions')
        .select('*')
        .order('completed_date', { ascending: false });
      
      if (compError) throw compError;

      // Fetch failures
      const { data: failures, error: failError } = await supabase
        .from('task_failures')
        .select('*')
        .order('failed_date', { ascending: false });
      
      if (failError) throw failError;

      const completionData = (completions || []) as TaskCompletion[];
      const failureData = (failures || []) as TaskFailure[];

      // Calculate day patterns
      const dayStats: Record<number, {
        completions: number;
        failures: number;
        energySum: number;
        energyCount: number;
        difficultySum: number;
        difficultyCount: number;
      }> = {};

      // Initialize all days
      for (let i = 0; i < 7; i++) {
        dayStats[i] = {
          completions: 0,
          failures: 0,
          energySum: 0,
          energyCount: 0,
          difficultySum: 0,
          difficultyCount: 0,
        };
      }

      // Process completions
      completionData.forEach(comp => {
        const day = comp.day_of_week;
        dayStats[day].completions++;
        if (comp.energy_level) {
          dayStats[day].energySum += comp.energy_level;
          dayStats[day].energyCount++;
        }
        if (comp.difficulty_rating) {
          dayStats[day].difficultySum += comp.difficulty_rating;
          dayStats[day].difficultyCount++;
        }
      });

      // Process failures
      failureData.forEach(fail => {
        const day = fail.day_of_week;
        dayStats[day].failures++;
      });

      // Build day patterns
      const dayPatterns: DayPattern[] = Object.entries(dayStats).map(([dayNum, stats]) => {
        const day = parseInt(dayNum);
        const total = stats.completions + stats.failures;
        return {
          dayOfWeek: day,
          dayName: DAYS_HE[day],
          completions: stats.completions,
          failures: stats.failures,
          successRate: total > 0 ? (stats.completions / total) * 100 : 0,
          avgEnergy: stats.energyCount > 0 ? stats.energySum / stats.energyCount : 0,
          avgDifficulty: stats.difficultyCount > 0 ? stats.difficultySum / stats.difficultyCount : 0,
        };
      });

      // Calculate hour patterns
      const hourStats: Record<number, {
        completions: number;
        failures: number;
        energySum: number;
        energyCount: number;
      }> = {};

      for (let i = 0; i < 24; i++) {
        hourStats[i] = { completions: 0, failures: 0, energySum: 0, energyCount: 0 };
      }

      completionData.forEach(comp => {
        const hour = comp.hour_of_day;
        hourStats[hour].completions++;
        if (comp.energy_level) {
          hourStats[hour].energySum += comp.energy_level;
          hourStats[hour].energyCount++;
        }
      });

      failureData.forEach(fail => {
        const hour = fail.hour_of_day;
        hourStats[hour].failures++;
      });

      const hourPatterns: HourPattern[] = Object.entries(hourStats).map(([hourNum, stats]) => {
        const hour = parseInt(hourNum);
        const total = stats.completions + stats.failures;
        return {
          hour,
          completions: stats.completions,
          failures: stats.failures,
          successRate: total > 0 ? (stats.completions / total) * 100 : 0,
          avgEnergy: stats.energyCount > 0 ? stats.energySum / stats.energyCount : 0,
        };
      });

      // Find best and worst days
      const sortedDays = [...dayPatterns].sort((a, b) => b.successRate - a.successRate);
      const bestDay = sortedDays[0] || null;
      const worstDay = sortedDays[sortedDays.length - 1] || null;

      // Find best and worst hours (filter out hours with no activity)
      const activeHours = hourPatterns.filter(h => h.completions + h.failures > 0);
      const sortedHours = [...activeHours].sort((a, b) => b.successRate - a.successRate);
      const bestHours = sortedHours.slice(0, 3);
      const worstHours = sortedHours.slice(-3).reverse();

      // Calculate streaks
      const sortedCompletions = [...completionData].sort((a, b) => 
        new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime()
      );
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      sortedCompletions.forEach(comp => {
        const compDate = new Date(comp.completed_date);
        
        if (!lastDate) {
          tempStreak = 1;
          lastDate = compDate;
        } else {
          const dayDiff = Math.floor((lastDate.getTime() - compDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            tempStreak++;
          } else if (dayDiff > 1) {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
          
          lastDate = compDate;
        }
      });

      longestStreak = Math.max(longestStreak, tempStreak);
      
      // Current streak (only if last completion was today or yesterday)
      if (sortedCompletions.length > 0) {
        const lastCompDate = new Date(sortedCompletions[0].completed_date);
        const today = new Date();
        const daysSinceLastComp = Math.floor((today.getTime() - lastCompDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastComp <= 1) {
          currentStreak = tempStreak;
        }
      }

      // Generate recommendations
      const recommendations: string[] = [];
      const insights: string[] = [];

      // Best day recommendation
      if (bestDay && bestDay.successRate > 70) {
        recommendations.push(
          `💪 ${bestDay.dayName} הוא היום הכי טוב שלך! תכנן משימות חשובות ליום זה (${bestDay.successRate.toFixed(0)}% הצלחה)`
        );
      }

      // Worst day warning
      if (worstDay && worstDay.successRate < 50 && worstDay.failures > 2) {
        recommendations.push(
          `⚠️ ${worstDay.dayName} נראה כיום מאתגר. תכנן פחות משימות או משימות קלות יותר`
        );
      }

      // Best hours
      if (bestHours.length > 0 && bestHours[0].successRate > 80) {
        const hourRange = `${bestHours[0].hour}:00-${bestHours[0].hour + 1}:00`;
        recommendations.push(
          `🌟 השעות הטובות ביותר שלך: ${hourRange}. תכנן משימות קריטיות לשעות אלו`
        );
      }

      // Energy insights
      const highEnergyDay = dayPatterns.reduce((max, day) => 
        day.avgEnergy > max.avgEnergy ? day : max
      );
      
      if (highEnergyDay.avgEnergy > 4) {
        insights.push(
          `⚡ יש לך הכי הרבה אנרגיה ביום ${highEnergyDay.dayName} (${highEnergyDay.avgEnergy.toFixed(1)}/5)`
        );
      }

      // Low energy warning
      const lowEnergyDays = dayPatterns.filter(d => d.avgEnergy > 0 && d.avgEnergy < 3);
      if (lowEnergyDays.length > 0) {
        insights.push(
          `😴 רמת אנרגיה נמוכה ב${lowEnergyDays.map(d => d.dayName).join(', ')}. שקול מנוחה או משימות קלות`
        );
      }

      // Consistency insight
      const totalTasks = completionData.length + failureData.length;
      const overallSuccessRate = totalTasks > 0 ? (completionData.length / totalTasks) * 100 : 0;
      
      if (overallSuccessRate > 80) {
        insights.push(`🎯 אחוז הצלחה מעולה: ${overallSuccessRate.toFixed(0)}%! המשך כך!`);
      } else if (overallSuccessRate < 50) {
        recommendations.push(
          `💡 אחוז ההצלחה שלך ${overallSuccessRate.toFixed(0)}%. נסה לתכנן פחות משימות או להעריך זמנים יותר מדויק`
        );
      }

      // Streak motivation
      if (currentStreak >= 3) {
        insights.push(`🔥 רצף מדהים של ${currentStreak} ימים! אל תשבור אותו!`);
      } else if (currentStreak === 0 && longestStreak >= 5) {
        recommendations.push(`💪 הרצף הארוך ביותר שלך היה ${longestStreak} ימים. תוכל לחזור לזה!`);
      }

      return {
        totalCompletions: completionData.length,
        totalFailures: failureData.length,
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
      };
    },
  });

  return {
    analytics: analytics || null,
    isLoading,
  };
};
