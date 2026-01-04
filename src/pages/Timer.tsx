import { useState } from "react";
import { Timer as TimerIcon, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimer } from "@/hooks/useTimer";
import { TimerStats } from "@/components/timer/TimerStats";
import { TimerGoals } from "@/components/timer/TimerGoals";
import { TimerHistory } from "@/components/timer/TimerHistory";
import { TopicCards } from "@/components/timer/TopicCards";

export default function Timer() {
  const {
    topics,
    sessions,
    goals,
    topicsWithStats,
    topicsLoading,
    sessionsLoading,
    goalsLoading,
    addTopic,
    deleteTopic,
    deleteSession,
    addGoal,
    updateGoal,
    deleteGoal,
    formatTime,
  } = useTimer();

  const [activeTab, setActiveTab] = useState("stats");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 shadow-xl">
            <TimerIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              מעקב זמן
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              עקוב, הגדר יעדים והשג מטרות
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">סטטיסטיקות</span>
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <TimerIcon className="h-4 w-4" />
            <span className="hidden sm:inline">נושאים</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">יעדים</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">היסטוריה</span>
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <TimerStats
            sessions={sessions}
            topics={topics}
            formatTime={formatTime}
          />
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <TopicCards
            topicsWithStats={topicsWithStats}
            formatTime={formatTime}
            onAddTopic={addTopic}
            onDeleteTopic={deleteTopic}
          />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <TimerGoals
            topicsWithStats={topicsWithStats}
            goals={goals}
            onAddGoal={(goal) => addGoal(goal as any)}
            onUpdateGoal={updateGoal}
            onDeleteGoal={deleteGoal}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <TimerHistory
            sessions={sessions}
            topics={topics}
            formatTime={formatTime}
            onDeleteSession={deleteSession}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
