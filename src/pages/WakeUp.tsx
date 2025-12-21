import { WakeUpTracker } from "@/components/WakeUpTracker";

const WakeUp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-warning/5 p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-warning to-primary bg-clip-text text-transparent">
            מעקב קימה בבוקר
          </h1>
          <p className="text-muted-foreground text-lg">בנה את הרגל הקימה המושלם שלך</p>
        </div>
        
        <WakeUpTracker />
      </div>
    </div>
  );
};

export default WakeUp;
