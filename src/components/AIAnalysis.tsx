import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, TrendingUp, Target, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AIAnalysis = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-habits", {
        body: {},
      });

      if (error) {
        if (error.message?.includes("RATE_LIMIT") || error.message?.includes("429")) {
          toast.error("המערכת עמוסה כרגע. אנא נסה שוב בעוד מספר דקות.");
        } else if (error.message?.includes("PAYMENT_REQUIRED") || error.message?.includes("402")) {
          toast.error("נגמרו הקרדיטים. הוסף קרדיטים בהגדרות.");
        } else {
          toast.error("שגיאה בניתוח הנתונים");
        }
        throw error;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data.analysis);
      setStats(data.stats);
      toast.success("הניתוח הושלם בהצלחה! ✨");
    } catch (error) {
      console.error("Error analyzing habits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">ניתוח AI מתקדם</CardTitle>
                <CardDescription>קבל המלצות מותאמות אישית לשיפור ההרגלים שלך</CardDescription>
              </div>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              size="lg"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  קבל ניתוח AI
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {!analysis && !isLoading && (
          <CardContent>
            <Alert className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <Brain className="h-4 w-4 text-primary" />
              <AlertDescription className="text-base">
                המערכת תנתח את ההרגלים שלך ותספק המלצות מותאמות אישית:
                <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                  <li>זיהוי דפוסים והתנהגויות</li>
                  <li>המלצות להרגלים חדשים</li>
                  <li>זמנים אופטימליים לביצוע</li>
                  <li>טיפים לשיפור קיימים</li>
                  <li>הודעות מוטיבציה מותאמות</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ הרגלים</p>
                  <p className="text-2xl font-bold">{stats.totalHabits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">אחוז השלמה</p>
                  <p className="text-2xl font-bold text-success">{stats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">רצף ממוצע</p>
                  <p className="text-2xl font-bold">{stats.avgStreak}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-info" />
                <div>
                  <p className="text-sm text-muted-foreground">קטגוריות</p>
                  <p className="text-2xl font-bold">{stats.categoriesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {analysis && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              תוצאות הניתוח
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {analysis}
              </div>
            </div>
            
            {stats?.bestHours && stats.bestHours.length > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  השעות הכי טובות שלך:
                </h4>
                <p className="text-muted-foreground">{stats.bestHours.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
