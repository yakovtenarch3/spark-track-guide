import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all active goals
    const { data: goals, error: goalsError } = await supabase
      .from("daily_goals")
      .select("*")
      .eq("is_active", true);

    if (goalsError) throw goalsError;

    // Fetch logs from last 60 days for pattern analysis
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split("T")[0];

    const { data: logs, error: logsError } = await supabase
      .from("daily_goal_logs")
      .select("*")
      .gte("log_date", sixtyDaysAgoStr)
      .order("log_date", { ascending: false });

    if (logsError) throw logsError;

    // Analyze patterns for each goal
    const goalAnalyses = goals.map(goal => {
      const goalLogs = logs.filter(l => l.goal_id === goal.id);
      
      // Calculate day-of-week patterns
      const dayOfWeekStats: Record<number, { success: number; fail: number }> = {};
      for (let i = 0; i < 7; i++) {
        dayOfWeekStats[i] = { success: 0, fail: 0 };
      }
      
      goalLogs.forEach(log => {
        const dayOfWeek = new Date(log.log_date).getDay();
        if (log.succeeded) {
          dayOfWeekStats[dayOfWeek].success++;
        } else {
          dayOfWeekStats[dayOfWeek].fail++;
        }
      });

      // Find weak days (high failure rate)
      const weakDays: number[] = [];
      const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
      Object.entries(dayOfWeekStats).forEach(([day, stats]) => {
        const total = stats.success + stats.fail;
        if (total >= 2) {
          const failRate = stats.fail / total;
          if (failRate >= 0.5) {
            weakDays.push(parseInt(day));
          }
        }
      });

      // Calculate streak patterns - when do failures usually occur?
      const streakBeforeFail: number[] = [];
      let currentStreak = 0;
      
      // Sort logs chronologically
      const sortedLogs = [...goalLogs].sort((a, b) => 
        new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
      );
      
      sortedLogs.forEach(log => {
        if (log.succeeded) {
          currentStreak++;
        } else {
          if (currentStreak > 0) {
            streakBeforeFail.push(currentStreak);
          }
          currentStreak = 0;
        }
      });

      // Find typical "danger zone" - average streak length before failure
      const avgStreakBeforeFail = streakBeforeFail.length > 0 
        ? Math.round(streakBeforeFail.reduce((a, b) => a + b, 0) / streakBeforeFail.length)
        : 0;

      // Calculate current streak
      let currentGoalStreak = 0;
      for (const log of sortedLogs.reverse()) {
        if (log.succeeded) {
          currentGoalStreak++;
        } else {
          break;
        }
      }

      // Determine risk level
      const today = new Date().getDay();
      const isWeakDay = weakDays.includes(today);
      const isNearDangerZone = avgStreakBeforeFail > 0 && currentGoalStreak >= avgStreakBeforeFail - 1;
      
      let riskLevel: "low" | "medium" | "high" = "low";
      if (isWeakDay && isNearDangerZone) {
        riskLevel = "high";
      } else if (isWeakDay || isNearDangerZone) {
        riskLevel = "medium";
      }

      return {
        goalId: goal.id,
        goalTitle: goal.title,
        weakDays: weakDays.map(d => dayNames[d]),
        avgStreakBeforeFail,
        currentStreak: currentGoalStreak,
        riskLevel,
        isWeakDay,
        isNearDangerZone,
        totalLogs: goalLogs.length,
        successRate: goalLogs.length > 0 
          ? Math.round((goalLogs.filter(l => l.succeeded).length / goalLogs.length) * 100)
          : 0,
      };
    });

    // Filter to goals with some risk
    const atRiskGoals = goalAnalyses.filter(g => g.riskLevel !== "low" && g.totalLogs >= 5);

    if (atRiskGoals.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "אין התראות מיוחדות כרגע - המשך ככה! 💪",
          analyses: goalAnalyses,
          alerts: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate AI personalized alerts
    const systemPrompt = `אתה מאמן אישי תומך. צור הודעות תזכורת קצרות, חמות ומעודדות בעברית.
כל הודעה צריכה להיות:
- קצרה (משפט אחד או שניים)
- אישית ומעודדת
- מזכירה את הסיכון בלי להפחיד
- מציעה טיפ קטן ומעשי

השב בפורמט JSON בלבד, מערך של אובייקטים עם goalId ו-message.`;

    const userPrompt = `צור תזכורות חכמות ליעדים הבאים שנמצאים בסיכון:

${atRiskGoals.map(g => `
יעד: ${g.goalTitle}
רמת סיכון: ${g.riskLevel === "high" ? "גבוהה" : "בינונית"}
רצף נוכחי: ${g.currentStreak} ימים
${g.isWeakDay ? "⚠️ היום הוא יום חלש (נפילות תכופות ביום זה)" : ""}
${g.isNearDangerZone ? `⚠️ קרוב לאזור סכנה (בד"כ נופל אחרי ${g.avgStreakBeforeFail} ימים)` : ""}
ימים חלשים: ${g.weakDays.join(", ") || "אין"}
אחוז הצלחה: ${g.successRate}%
`).join("\n---\n")}

החזר מערך JSON בלבד בפורמט: [{"goalId": "...", "message": "..."}]`;

    console.log("Generating smart reminders with AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "המערכת עמוסה כרגע. אנא נסה שוב בעוד מספר דקות.",
            errorCode: "RATE_LIMIT"
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "נגמרו הקרדיטים.",
            errorCode: "PAYMENT_REQUIRED"
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content || "[]";
    
    // Parse AI response - extract JSON from response
    let alerts = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        alerts = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      // Fallback to generic messages
      alerts = atRiskGoals.map(g => ({
        goalId: g.goalId,
        message: g.riskLevel === "high" 
          ? `⚠️ שים לב! היום יכול להיות מאתגר עבור "${g.goalTitle}". תכנן מראש איך תתמודד!`
          : `💡 תזכורת: שמור על הרצף ב"${g.goalTitle}" - אתה עושה עבודה מעולה!`
      }));
    }

    // Add risk data to alerts
    const enrichedAlerts = alerts.map((alert: any) => {
      const analysis = atRiskGoals.find(g => g.goalId === alert.goalId);
      return {
        ...alert,
        riskLevel: analysis?.riskLevel || "medium",
        currentStreak: analysis?.currentStreak || 0,
        isWeakDay: analysis?.isWeakDay || false,
        isNearDangerZone: analysis?.isNearDangerZone || false,
      };
    });

    console.log("Smart reminders generated successfully");

    return new Response(
      JSON.stringify({ 
        alerts: enrichedAlerts,
        analyses: goalAnalyses,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in smart-reminders function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "שגיאה בניתוח הנתונים",
        errorCode: "INTERNAL_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
