import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Circle,
  Flame,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface FloatingWidgetProps {
  habits?: Array<{
    id: string;
    name: string;
    completedDates?: string[];
    streak?: number;
  }>;
  onToggleHabit?: (habitId: string) => void;
}

export const FloatingWidget = ({ habits = [], onToggleHabit }: FloatingWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem("floating-widget-visible");
    return saved !== "false";
  });
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-left");

  const today = new Date().toISOString().split("T")[0];

  // Calculate today's progress
  const todayCompletions = habits.filter((h) =>
    (h.completedDates || []).includes(today)
  ).length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 
    ? Math.round((todayCompletions / totalHabits) * 100) 
    : 0;

  // Top 5 habits to show in widget
  const topHabits = habits.slice(0, 5);

  // Get total streak
  const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

  useEffect(() => {
    localStorage.setItem("floating-widget-visible", String(isVisible));
  }, [isVisible]);

  const handleToggleHabit = (habitId: string) => {
    if (onToggleHabit) {
      onToggleHabit(habitId);
      toast.success("הרגל עודכן!");
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg hover:shadow-xl transition-all"
        size="icon"
      >
        <Sparkles className="w-5 h-5 text-white" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed ${
        position === "bottom-right" ? "right-4" : "left-4"
      } bottom-20 z-40 transition-all duration-300 ${
        isExpanded ? "w-72" : "w-48"
      }`}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-purple-500 to-cyan-500 p-3 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">Spark Track</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white" />
            ) : (
              <ChevronUp className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Quick Stats (always visible) */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="url(#progress-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercent} 100`}
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold">{progressPercent}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">היום</p>
                <p className="text-sm font-medium">
                  {todayCompletions}/{totalHabits}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-500">{totalStreak}</span>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
            {topHabits.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                אין הרגלים עדיין
              </p>
            ) : (
              topHabits.map((habit) => {
                const isCompletedToday = (habit.completedDates || []).includes(today);
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      isCompletedToday
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleToggleHabit(habit.id)}
                  >
                    {isCompletedToday ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs flex-1 truncate ${
                        isCompletedToday ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {habit.name}
                    </span>
                    {habit.streak && habit.streak > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {habit.streak}🔥
                      </Badge>
                    )}
                  </div>
                );
              })
            )}

            {habits.length > 5 && (
              <p className="text-[10px] text-center text-gray-400 pt-1">
                +{habits.length - 5} הרגלים נוספים
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        {isExpanded && (
          <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                setPosition((p) =>
                  p === "bottom-right" ? "bottom-left" : "bottom-right"
                )
              }
            >
              <Settings className="w-3 h-3 ml-1" />
              הזז
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => window.location.href = "/habits"}
            >
              <Target className="w-3 h-3 ml-1" />
              כל ההרגלים
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingWidget;
