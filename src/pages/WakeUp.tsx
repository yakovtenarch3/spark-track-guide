import { WakeUpTracker } from "@/components/WakeUpTracker";
import { AlarmManager } from "@/components/AlarmManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlarmClock, Calendar } from "lucide-react";

const WakeUp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-warning/5 p-3 sm:p-4 md:p-6 overflow-x-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-warning to-primary bg-clip-text text-transparent">
            מעקב קימה בבוקר
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg">בנה את הרגל הקימה המושלם שלך</p>
        </div>
        
        <Tabs defaultValue="alarms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
            <TabsTrigger value="alarms" className="gap-1.5 text-xs sm:text-sm">
              <AlarmClock className="w-4 h-4" />
              <span>שעונים מעוררים</span>
            </TabsTrigger>
            <TabsTrigger value="tracker" className="gap-1.5 text-xs sm:text-sm">
              <Calendar className="w-4 h-4" />
              <span>מעקב קימה</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="alarms" className="mt-4">
            <AlarmManager />
          </TabsContent>
          
          <TabsContent value="tracker" className="mt-4">
            <WakeUpTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WakeUp;
