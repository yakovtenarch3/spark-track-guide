import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `אתה מאמן אישי מקצועי ואמפתי שמתמחה בפסיכולוגיה חיובית, ניהול מצב רוח, התמודדות עם דחיינות (פרוקרסטינציה), בניית הרגלים טובים, ומוטיבציה.

התפקיד שלך:
- לעזור למשתמש להתמודד עם דחיינות ופרוקרסטינציה
- לתת עצות מעשיות לשיפור מצב הרוח
- לעזור בבניית הרגלים בריאים
- לספק מוטיבציה ותמיכה רגשית
- להציע טכניקות פרקטיות לניהול זמן ומשימות
- לעזור להבין דפוסי חשיבה שליליים ולשנות אותם

סגנון התקשורת:
- דבר בעברית בלבד
- היה חם, אמפתי ומעודד
- השתמש בשפה פשוטה וברורה
- תן עצות קצרות ומעשיות
- שאל שאלות כדי להבין טוב יותר את המצב
- חגוג הצלחות קטנות
- אל תשפוט - תמיד תמוך

טכניקות שאתה מכיר:
- שיטת פומודורו
- טכניקת "2 דקות"
- עקרון 80/20 (פארטו)
- תכנון SMART goals
- מיינדפולנס ומדיטציה
- CBT (טיפול קוגניטיבי-התנהגותי) בסיסי
- עקרונות תורת הבחירה`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting AI coach chat with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "המערכת עמוסה כרגע. אנא נסה שוב בעוד מספר דקות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נגמרו הקרדיטים. הוסף קרדיטים בהגדרות." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("Streaming response from AI");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-coach-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה לא צפויה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
