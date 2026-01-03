import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Target,
  Coffee,
  Zap,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task } from "@/hooks/useTasks";

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

type TimerMode = "work" | "shortBreak" | "longBreak";

const TIMER_PRESETS = {
  work: { duration: 25 * 60, label: "עבודה", color: "bg-red-500", icon: Target },
  shortBreak: { duration: 5 * 60, label: "הפסקה קצרה", color: "bg-green-500", icon: Coffee },
  longBreak: { duration: 15 * 60, label: "הפסקה ארוכה", color: "bg-blue-500", icon: Coffee },
};

export function FocusMode({ task, onClose, onComplete }: FocusModeProps) {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentPreset = TIMER_PRESETS[mode];
  const progress = ((currentPreset.duration - timeLeft) / currentPreset.duration) * 100;

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Play notification sound
  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1lZG1scGVjZGVnZWVmZ2hpamtrbm5vb3Bxc3N0dXV2d3d4eHl6ent7fHx9fX5+f4CAgYGCg4OEhYWGhoeIiImJioqLi4yMjY2OjpCQkJGRkpKTk5SVlZaWl5eYmJmam5ucnJ2dnp6fn6ChoaKio6OkpaWmp6eoqKmqqqusra2urq+vsLGxsrO0tLS1tre3uLi5urq7u7y9vb6/v8DAwcHCw8TExcXGx8fIycnKy8vMzM3Oz8/Q0NHS0tPU1NXV1tfX2NjZ2drb29zc3d7e39/g4OHi4uPj5OXl5ufn6Onp6uvr7O3t7u/v8PDx8vLz9PT19vb3+Pj5+fr7+/z9/f7+/w==');
      audio.play().catch(() => {});
    } catch {
      // Ignore audio errors
    }
  }, [soundEnabled]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed
            setIsRunning(false);
            playSound();

            if (mode === "work") {
              setPomodorosCompleted((p) => p + 1);
              setTotalFocusTime((t) => t + TIMER_PRESETS.work.duration);
              
              // Every 4 pomodoros = long break
              const newCount = pomodorosCompleted + 1;
              if (newCount % 4 === 0) {
                toast.success("🎉 מעולה! הגיע זמן להפסקה ארוכה", { duration: 5000 });
                setMode("longBreak");
                return TIMER_PRESETS.longBreak.duration;
              } else {
                toast.success("✅ פומודורו הושלם! הגיע זמן להפסקה קצרה", { duration: 5000 });
                setMode("shortBreak");
                return TIMER_PRESETS.shortBreak.duration;
              }
            } else {
              toast.info("☕ ההפסקה נגמרה! חזרה לעבודה", { duration: 5000 });
              setMode("work");
              return TIMER_PRESETS.work.duration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, pomodorosCompleted, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "r" || e.key === "R") {
        resetTimer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetTimer = () => {
    setTimeLeft(TIMER_PRESETS[mode].duration);
    setIsRunning(false);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_PRESETS[newMode].duration);
    setIsRunning(false);
  };

  const handleComplete = () => {
    onComplete();
    toast.success("🎉 משימה הושלמה!", { duration: 3000 });
  };

  const ModeIcon = currentPreset.icon;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] bg-gradient-to-br flex items-center justify-center",
        mode === "work" 
          ? "from-slate-900 via-slate-800 to-slate-900" 
          : mode === "shortBreak"
          ? "from-green-900 via-green-800 to-emerald-900"
          : "from-blue-900 via-blue-800 to-indigo-900"
      )}
      dir="rtl"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 max-w-lg w-full px-4">
        {/* Task title */}
        <Card className="w-full bg-white/10 backdrop-blur-sm border-white/20 p-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-white" />
            <div>
              <p className="text-white/60 text-sm">המשימה הנוכחית</p>
              <h2 className="text-white text-xl font-bold">{task.title}</h2>
            </div>
          </div>
        </Card>

        {/* Mode selector */}
        <div className="flex gap-2">
          {(Object.keys(TIMER_PRESETS) as TimerMode[]).map((m) => {
            const preset = TIMER_PRESETS[m];
            const Icon = preset.icon;
            return (
              <Button
                key={m}
                variant={mode === m ? "default" : "outline"}
                className={cn(
                  "gap-2",
                  mode === m 
                    ? `${preset.color} hover:${preset.color}/90 text-white border-0` 
                    : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:text-white"
                )}
                onClick={() => switchMode(m)}
              >
                <Icon className="h-4 w-4" />
                {preset.label}
              </Button>
            );
          })}
        </div>

        {/* Timer display */}
        <div className="relative">
          <div className="w-64 h-64 rounded-full border-8 border-white/20 flex items-center justify-center relative">
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className={cn(
                  "transition-all duration-300",
                  mode === "work" ? "text-red-500" : mode === "shortBreak" ? "text-green-500" : "text-blue-500"
                )}
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="text-center z-10">
              <ModeIcon className="h-8 w-8 text-white/50 mx-auto mb-2" />
              <span className="text-6xl font-mono font-bold text-white">
                {formatTime(timeLeft)}
              </span>
              <p className="text-white/50 mt-2">{currentPreset.label}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={resetTimer}
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            className={cn(
              "h-20 w-20 rounded-full text-white shadow-xl",
              currentPreset.color,
              `hover:${currentPreset.color}/90`
            )}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <Pause className="h-10 w-10" />
            ) : (
              <Play className="h-10 w-10 mr-[-4px]" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(0);
            }}
          >
            <Square className="h-6 w-6" />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-white/70">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span>{pomodorosCompleted} פומודורו</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span>{Math.floor(totalFocusTime / 60)} דקות מיקוד</span>
          </div>
        </div>

        {/* Complete task button */}
        <Button
          variant="outline"
          className="gap-2 bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 hover:text-green-300"
          onClick={handleComplete}
        >
          <CheckCircle2 className="h-5 w-5" />
          סיימתי את המשימה!
        </Button>

        {/* Keyboard shortcuts hint */}
        <div className="text-white/40 text-sm text-center">
          <p>Space = התחל/עצור | R = אפס | Esc = סגור</p>
        </div>
      </div>
    </div>
  );
}
