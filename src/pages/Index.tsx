import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreakChart } from "@/components/StreakChart";
import { CompletionTrendChart } from "@/components/CompletionTrendChart";
import { CalendarView } from "@/components/CalendarView";
import { CategoryDistribution } from "@/components/CategoryDistribution";
import { QuoteOfTheDay } from "@/components/QuoteOfTheDay";
import { Statistics } from "@/components/Statistics";
import { AIAnalysis } from "@/components/AIAnalysis";
import { GoalsTracking } from "@/components/GoalsTracking";
import DailyCoach from "@/components/DailyCoach";
import { LayoutDashboard, TrendingUp, Trophy, Brain, Flag } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            לוח בקרה
          </h1>
          <p className="text-muted-foreground text-lg">עקוב אחר ההתקדמות שלך וקבל תובנות מתקדמות</p>
        </div>

        <Tabs defaultValue="analytics" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-5 mb-6 glass-card p-1">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">סקירה כללית</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">ניתוחים</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">הישגים</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">ניתוח AI</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">יעדים</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2">
              <QuoteOfTheDay />
              <DailyCoach />
            </div>
            <Statistics />
            <div className="grid gap-6 md:grid-cols-2">
              <StreakChart />
              <CompletionTrendChart />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2">
              <CalendarView />
              <CategoryDistribution />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <StreakChart />
              <CompletionTrendChart />
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6 animate-fade-in">
            <Statistics />
            <CategoryDistribution />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 animate-fade-in">
            <AIAnalysis />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6 animate-fade-in">
            <GoalsTracking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
