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

    // Get request body with goal ID
    const { goalId } = await req.json();

    // Fetch the specific goal or all goals
    const goalsQuery = supabase
      .from("daily_goals")
      .select("*")
      .eq("is_active", true);

    if (goalId) {
      goalsQuery.eq("id", goalId);
    }

    const { data: goals, error: goalsError } = await goalsQuery;
    if (goalsError) throw goalsError;

    // Fetch logs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const logsQuery = supabase
      .from("daily_goal_logs")
      .select("*")
      .gte("log_date", thirtyDaysAgoStr)
      .order("log_date", { ascending: false });

    if (goalId) {
      logsQuery.eq("goal_id", goalId);
    }

    const { data: logs, error: logsError } = await logsQuery;
    if (logsError) throw logsError;

    // Calculate statistics for each goal
    const goalStats = goals.map(goal => {
      const goalLogs = logs.filter(l => l.goal_id === goal.id);
      const successLogs = goalLogs.filter(l => l.succeeded);
      const failLogs = goalLogs.filter(l => !l.succeeded);
      
      // Get actual values with target comparison
      const logsWithValues = goalLogs
        .filter(l => l.actual_value)
        .map(l => ({
          date: l.log_date,
          actualValue: l.actual_value,
          succeeded: l.succeeded,
          notes: l.notes,
        }));

      return {
        title: goal.title,
        description: goal.description,
        targetValue: goal.target_value,
        targetUnit: goal.target_unit,
        totalDaysLogged: goalLogs.length,
        successDays: successLogs.length,
        failDays: failLogs.length,
        successRate: goalLogs.length > 0 ? ((successLogs.length / goalLogs.length) * 100).toFixed(1) : 0,
        recentLogs: logsWithValues.slice(0, 10),
        allNotes: goalLogs.filter(l => l.notes).map(l => ({ date: l.log_date, note: l.notes })),
      };
    });

    // Prepare analysis prompt
    const systemPrompt = `אתה מאמן אישי מומחה ומנתח ביצועים. תפקידך לנתח יעדים יומיים של המשתמש ולספק:
1. ניתוח מעמיק של ההתקדמות - כמה רחוק/קרוב מהיעד
2. זיהוי מגמות (שיפור, הידרדרות, יציבות)
3. נקודות חוזק ונקודות לשיפור
4. המלצות קונקרטיות ומעשיות
5. טיפים לשיפור ההתמדה
6. מוטיבציה מותאמת אישית

השב בעברית בפורמט מובנה וברור עם כותרות ונקודות.
היה ספציפי ומעשי - לא כללי!`;

    const userPrompt = `נתח את היעדים היומיים הבאים וספק ניתוח מעמיק עם המלצות:

${goalStats.map(g => `
**יעד: ${g.title}**
${g.description ? `תיאור: ${g.description}` : ""}
${g.targetValue ? `יעד מספרי: ${g.targetValue} ${g.targetUnit || ""}` : ""}

📊 סטטיסטיקות (30 יום אחרונים):
- ימים שנרשמו: ${g.totalDaysLogged}
- ימי הצלחה: ${g.successDays}
- ימי כישלון: ${g.failDays}
- אחוז הצלחה: ${g.successRate}%

${g.recentLogs.length > 0 ? `
📝 ערכים אחרונים שנרשמו:
${g.recentLogs.map(l => `  - ${l.date}: ${l.actualValue}${l.succeeded ? " ✓" : " ✗"}${l.notes ? ` (${l.notes})` : ""}`).join("\n")}
` : ""}

${g.allNotes.length > 0 ? `
💭 הערות שנכתבו:
${g.allNotes.slice(0, 5).map(n => `  - ${n.date}: ${n.note}`).join("\n")}
` : ""}
`).join("\n---\n")}

בבקשה ספק:
1. **ניתוח מצב נוכחי**: היכן המשתמש נמצא ביחס ליעדים? זהה מגמות.
2. **פערים וקשיים**: מה מונע מהמשתמש להגיע ליעד? נתח את הכישלונות.
3. **נקודות חוזק**: מה עובד טוב? מתי יש יותר הצלחות?
4. **המלצות לשיפור**: 3-5 טיפים ספציפיים ומעשיים
5. **צעדים הבאים**: מה לעשות מחר? השבוע?
6. **הודעת מוטיבציה**: מסר אישי ומעודד`;

    console.log("Sending request to Lovable AI for daily goals analysis...");

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
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "נגמרו הקרדיטים. אנא הוסף קרדיטים ב-Settings -> Workspace -> Usage.",
            errorCode: "PAYMENT_REQUIRED"
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0]?.message?.content || "לא ניתן לנתח נתונים כרגע.";

    console.log("Daily goals analysis completed successfully");

    return new Response(
      JSON.stringify({ 
        analysis,
        stats: goalStats,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-daily-goals function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "שגיאה בניתוח הנתונים",
        errorCode: "INTERNAL_ERROR"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
