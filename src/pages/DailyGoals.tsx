import { DailyGoalTracker } from "@/components/DailyGoalTracker";

const DailyGoals = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
            מעקב יעדים יומיים
          </h1>
          <p className="text-muted-foreground text-lg">עקוב אחרי ההתקדמות שלך יום אחרי יום</p>
        </div>
        
        <DailyGoalTracker />
      </div>
    </div>
  );
};

export default DailyGoals;
