import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskCalendar } from "@/components/TaskCalendar";
import { TaskAnalytics } from "@/components/TaskAnalytics";
import { LayoutGrid, Calendar, LineChart } from "lucide-react";

const Tasks = () => {
  const [activeTab, setActiveTab] = useState("board");

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-l from-purple-600 to-blue-600 bg-clip-text text-transparent">
            לוח משימות חכם
          </h1>
          <p className="text-muted-foreground">
            נהל משימות עם ניתוח חכם והמלצות מותאמות אישית
          </p>
        </div>

        {/* Main Tabs */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="board" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                <span>לוח משימות</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>לוח שנה</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                <span>ניתוח ותובנות</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="mt-0">
              <TaskBoard />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <TaskCalendar />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <TaskAnalytics />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Tasks;
