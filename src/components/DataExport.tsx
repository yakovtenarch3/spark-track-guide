import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Database,
  CheckSquare,
  Target,
  Calendar,
  Trophy,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface ExportData {
  habits?: boolean;
  tasks?: boolean;
  goals?: boolean;
  achievements?: boolean;
  settings?: boolean;
  completions?: boolean;
}

type ExportFormat = "json" | "csv" | "txt";

interface DataExportProps {
  habits?: any[];
  tasks?: any[];
  goals?: any[];
  achievements?: any[];
}

export const DataExport = ({ habits = [], tasks = [], goals = [], achievements = [] }: DataExportProps) => {
  const [selectedData, setSelectedData] = useState<ExportData>({
    habits: true,
    tasks: true,
    goals: true,
    achievements: true,
    settings: false,
    completions: true,
  });
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);

  const toggleData = (key: keyof ExportData) => {
    setSelectedData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const dataOptions = [
    { key: "habits" as keyof ExportData, label: "הרגלים", icon: CheckSquare, count: habits.length, color: "purple" },
    { key: "tasks" as keyof ExportData, label: "משימות", icon: Target, count: tasks.length, color: "blue" },
    { key: "goals" as keyof ExportData, label: "יעדים יומיים", icon: Calendar, count: goals.length, color: "green" },
    { key: "achievements" as keyof ExportData, label: "הישגים", icon: Trophy, count: achievements.length, color: "yellow" },
    { key: "completions" as keyof ExportData, label: "היסטוריית השלמות", icon: Database, count: null, color: "cyan" },
    { key: "settings" as keyof ExportData, label: "הגדרות", icon: Package, count: null, color: "gray" },
  ];

  const formatOptions = [
    { value: "json" as ExportFormat, label: "JSON", icon: FileJson, desc: "מובנה, מתאים לגיבוי" },
    { value: "csv" as ExportFormat, label: "CSV", icon: FileSpreadsheet, desc: "מתאים ל-Excel" },
    { value: "txt" as ExportFormat, label: "TXT", icon: FileText, desc: "קריא לאנשים" },
  ];

  const gatherExportData = () => {
    const data: Record<string, any> = {
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    if (selectedData.habits) {
      data.habits = habits;
    }

    if (selectedData.tasks) {
      data.tasks = tasks;
    }

    if (selectedData.goals) {
      data.goals = goals;
    }

    if (selectedData.achievements) {
      data.achievements = achievements;
    }

    if (selectedData.completions) {
      // Gather completions from localStorage
      const completionsData: Record<string, any> = {};
      
      // Habit completions
      const habitCompletions = localStorage.getItem("habit-completions");
      if (habitCompletions) {
        completionsData.habits = JSON.parse(habitCompletions);
      }

      // Task completions
      const taskCompletions = localStorage.getItem("task-completions");
      if (taskCompletions) {
        completionsData.tasks = JSON.parse(taskCompletions);
      }

      // Goal logs
      const goalLogs = localStorage.getItem("daily-goal-logs");
      if (goalLogs) {
        completionsData.goals = JSON.parse(goalLogs);
      }

      data.completions = completionsData;
    }

    if (selectedData.settings) {
      // Export all settings from localStorage
      const settingsKeys = [
        "theme-settings",
        "notification-settings",
        "auto-dark-mode-settings",
        "background-music-settings",
        "focus-mode-settings",
        "timer-settings",
      ];

      const settings: Record<string, any> = {};
      settingsKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          settings[key] = JSON.parse(value);
        }
      });

      data.settings = settings;
    }

    return data;
  };

  const convertToCSV = (data: any): string => {
    const lines: string[] = [];
    
    // Header
    lines.push("סוג,שם,תאריך יצירה,סטטוס,פרטים נוספים");

    // Habits
    if (data.habits) {
      data.habits.forEach((h: any) => {
        lines.push(`הרגל,"${h.name || h.title}",${h.createdAt || ""},${h.streak || 0} רצף,"${h.category || ""}"`);
      });
    }

    // Tasks
    if (data.tasks) {
      data.tasks.forEach((t: any) => {
        lines.push(`משימה,"${t.title}",${t.createdAt || ""},${t.completed ? "הושלם" : "פתוח"},"${t.priority || ""}"`);
      });
    }

    // Goals
    if (data.goals) {
      data.goals.forEach((g: any) => {
        lines.push(`יעד,"${g.name || g.title}",${g.createdAt || ""},${g.current || 0}/${g.target || 0},"${g.unit || ""}"`);
      });
    }

    // Achievements
    if (data.achievements) {
      data.achievements.forEach((a: any) => {
        lines.push(`הישג,"${a.title || a.name}",${a.unlockedAt || ""},${a.unlocked ? "נפתח" : "נעול"},"${a.description || ""}"`);
      });
    }

    return lines.join("\n");
  };

  const convertToTXT = (data: any): string => {
    let text = "";
    
    text += `═══════════════════════════════════════════════════\n`;
    text += `            📊 ייצוא נתונים - Spark Track\n`;
    text += `═══════════════════════════════════════════════════\n\n`;
    text += `📅 תאריך ייצוא: ${new Date().toLocaleDateString("he-IL")}\n`;
    text += `⏰ שעה: ${new Date().toLocaleTimeString("he-IL")}\n\n`;

    // Habits
    if (data.habits && data.habits.length > 0) {
      text += `\n🔄 הרגלים (${data.habits.length})\n`;
      text += `${"─".repeat(40)}\n`;
      data.habits.forEach((h: any, i: number) => {
        text += `${i + 1}. ${h.name || h.title}\n`;
        text += `   • קטגוריה: ${h.category || "כללי"}\n`;
        text += `   • רצף: ${h.streak || 0} ימים\n`;
        text += `   • השלמות: ${(h.completedDates || []).length}\n\n`;
      });
    }

    // Tasks
    if (data.tasks && data.tasks.length > 0) {
      text += `\n📋 משימות (${data.tasks.length})\n`;
      text += `${"─".repeat(40)}\n`;
      data.tasks.forEach((t: any, i: number) => {
        const status = t.completed ? "✅" : "⬜";
        text += `${status} ${i + 1}. ${t.title}\n`;
        if (t.description) text += `   📝 ${t.description}\n`;
        text += `   📌 עדיפות: ${t.priority || "רגיל"}\n\n`;
      });
    }

    // Goals
    if (data.goals && data.goals.length > 0) {
      text += `\n🎯 יעדים יומיים (${data.goals.length})\n`;
      text += `${"─".repeat(40)}\n`;
      data.goals.forEach((g: any, i: number) => {
        const progress = g.target ? Math.round((g.current || 0) / g.target * 100) : 0;
        text += `${i + 1}. ${g.name || g.title}\n`;
        text += `   • התקדמות: ${g.current || 0}/${g.target || 0} ${g.unit || ""} (${progress}%)\n\n`;
      });
    }

    // Achievements
    if (data.achievements && data.achievements.length > 0) {
      text += `\n🏆 הישגים (${data.achievements.length})\n`;
      text += `${"─".repeat(40)}\n`;
      data.achievements.forEach((a: any, i: number) => {
        const status = a.unlocked ? "🏅" : "🔒";
        text += `${status} ${i + 1}. ${a.title || a.name}\n`;
        text += `   ${a.description || ""}\n\n`;
      });
    }

    text += `\n═══════════════════════════════════════════════════\n`;
    text += `         נוצר על ידי Spark Track ✨\n`;
    text += `═══════════════════════════════════════════════════\n`;

    return text;
  };

  const handleExport = async () => {
    const hasSelection = Object.values(selectedData).some(Boolean);
    if (!hasSelection) {
      toast.error("יש לבחור לפחות סוג נתונים אחד לייצוא");
      return;
    }

    setIsExporting(true);

    try {
      const data = gatherExportData();
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (exportFormat) {
        case "csv":
          content = convertToCSV(data);
          mimeType = "text/csv;charset=utf-8";
          extension = "csv";
          break;
        case "txt":
          content = convertToTXT(data);
          mimeType = "text/plain;charset=utf-8";
          extension = "txt";
          break;
        case "json":
        default:
          content = JSON.stringify(data, null, 2);
          mimeType = "application/json;charset=utf-8";
          extension = "json";
          break;
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spark-track-export-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("הנתונים יוצאו בהצלחה!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("שגיאה בייצוא הנתונים");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = Object.values(selectedData).filter(Boolean).length;

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-none shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="w-5 h-5 text-purple-500" />
          ייצוא נתונים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Data Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            בחר נתונים לייצוא
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {dataOptions.map((option) => (
              <div
                key={option.key}
                onClick={() => toggleData(option.key)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedData[option.key]
                    ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedData[option.key]}
                    onCheckedChange={() => toggleData(option.key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <option.icon className={`w-4 h-4 text-${option.color}-500`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                {option.count !== null && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {option.count} פריטים
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            פורמט קובץ
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setExportFormat(option.value)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  exportFormat === option.value
                    ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <option.icon className="w-6 h-6 mx-auto mb-1 text-gray-600 dark:text-gray-300" />
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Export Summary */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              נבחרו {selectedCount} סוגי נתונים
            </span>
            <Badge variant="outline" className="uppercase">
              {exportFormat}
            </Badge>
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || selectedCount === 0}
          className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              מייצא...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 ml-2" />
              הורד קובץ ייצוא
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          💾 הנתונים נשמרים מקומית במכשיר שלך. מומלץ לגבות באופן קבוע.
        </p>
      </CardContent>
    </Card>
  );
};

export default DataExport;
