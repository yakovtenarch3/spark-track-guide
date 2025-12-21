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

    // Fetch habits data
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("is_archived", false);

    if (habitsError) throw habitsError;

    // Fetch completions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completions, error: completionsError } = await supabase
      .from("habit_completions")
      .select("*, habits(title, category)")
      .gte("completed_at", thirtyDaysAgo.toISOString());

    if (completionsError) throw completionsError;

    // Fetch achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from("user_achievements")
      .select("*, achievements(name, description)")
      .order("unlocked_at", { ascending: false })
      .limit(5);

    if (achievementsError) throw achievementsError;

    // Calculate statistics
    const totalHabits = habits.length;
    const completionRate = completions.length / (totalHabits * 30) * 100;
    const categoriesCount = new Set(habits.map(h => h.category)).size;
    const avgStreak = habits.reduce((sum, h) => sum + h.streak, 0) / totalHabits;

    // Group completions by hour
    const completionsByHour: Record<number, number> = {};
    completions.forEach(c => {
      const hour = new Date(c.completed_at).getHours();
      completionsByHour[hour] = (completionsByHour[hour] || 0) + 1;
    });

    const bestHours = Object.entries(completionsByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${parseInt(hour) + 1}:00`);

    // Prepare analysis prompt
    const systemPrompt = `אתה מומחה לפיתוח הרגלים ומוטיבציה אישית. תפקידך לנתח נתוני הרגלים של המשתמש ולספק תובנות מעשיות והמלצות מותאמות אישית בעברית.

התמקד ב:
1. זיהוי דפוסים והתנהגויות
2. המלצות ספציפיות ומעשיות
3. הצעות להרגלים חדשים המתאימים לפרופיל המשתמש
4. עצות לשיפור קיימים
5. הודעות מוטיבציה מותאמות אישית

השב בפורמט מובנה וברור, עם כותרות ונקודות.`;

    const userPrompt = `נתח את נתוני ההרגלים הבאים וספק המלצות מפורטות:

**סטטיסטיקות כלליות:**
- סה"כ הרגלים: ${totalHabits}
- אחוז השלמה (30 יום): ${completionRate.toFixed(1)}%
- קטגוריות שונות: ${categoriesCount}
- רצף ממוצע: ${avgStreak.toFixed(1)} ימים

**הרגלים פעילים:**
${habits.map(h => `- ${h.title} (${h.category}) - רצף: ${h.streak} ימים`).join("\n")}

**השעות הכי טובות להשלמת הרגלים:**
${bestHours.join(", ")}

**הישגים אחרונים:**
${achievements.map(a => `- ${a.achievements?.name}: ${a.achievements?.description}`).join("\n")}

ספק:
1. **ניתוח דפוסים**: מה עובד טוב? מה צריך שיפור?
2. **המלצות להרגלים חדשים**: 3-5 הרגלים שיכולים להתאים למשתמש
3. **טיפים לשיפור**: עצות ספציפיות לשיפור ההרגלים הקיימים
4. **זמנים אופטימליים**: מתי כדאי לתזמן הרגלים חדשים
5. **הודעת מוטיבציה**: מסר מעודד ומעורר השראה`;

    console.log("Sending request to Lovable AI...");

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

    console.log("Analysis completed successfully");

    // Save analysis to database
    const { error: saveError } = await supabase
      .from("ai_analyses")
      .insert([
        {
          analysis_text: analysis,
          habits_count: totalHabits,
          completion_rate: completionRate,
        },
      ]);

    if (saveError) {
      console.error("Error saving analysis:", saveError);
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        stats: {
          totalHabits,
          completionRate: completionRate.toFixed(1),
          avgStreak: avgStreak.toFixed(1),
          categoriesCount,
          bestHours,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-habits function:", error);
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
