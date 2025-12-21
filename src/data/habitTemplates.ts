export interface HabitTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  preferredTime?: string;
  templateCategory: "health" | "productivity" | "learning";
}

export const habitTemplates: HabitTemplate[] = [
  // בריאות
  {
    id: "health-1",
    title: "שתיית 8 כוסות מים",
    description: "שמירה על הידרציה מיטבית לאורך היום",
    category: "health",
    color: "#3B82F6",
    templateCategory: "health",
  },
  {
    id: "health-2",
    title: "פעילות גופנית 30 דקות",
    description: "אימון קרדיו או כוח לשיפור הבריאות",
    category: "health",
    color: "#EF4444",
    preferredTime: "07:00",
    templateCategory: "health",
  },
  {
    id: "health-3",
    title: "מדיטציה 10 דקות",
    description: "תרגול מיינדפולנס להרגעת המוח",
    category: "health",
    color: "#8B5CF6",
    preferredTime: "06:30",
    templateCategory: "health",
  },
  {
    id: "health-4",
    title: "שינה 8 שעות",
    description: "מנוחה מספקת לשיקום הגוף והנפש",
    category: "health",
    color: "#6366F1",
    preferredTime: "22:00",
    templateCategory: "health",
  },
  {
    id: "health-5",
    title: "אכילת 5 פירות וירקות",
    description: "צריכת תזונה מאוזנת ועשירה בוויטמינים",
    category: "health",
    color: "#10B981",
    templateCategory: "health",
  },
  {
    id: "health-6",
    title: "מתיחות בוקר",
    description: "תרגילי גמישות לשיפור התנועתיות",
    category: "health",
    color: "#F59E0B",
    preferredTime: "06:00",
    templateCategory: "health",
  },
  {
    id: "health-7",
    title: "הליכה 10,000 צעדים",
    description: "פעילות אירובית קלה לשמירה על כושר",
    category: "health",
    color: "#14B8A6",
    templateCategory: "health",
  },
  {
    id: "health-8",
    title: "נטילת ויטמינים",
    description: "שמירה על רמות תזונתיות אופטימליות",
    category: "health",
    color: "#F97316",
    preferredTime: "08:00",
    templateCategory: "health",
  },

  // פרודוקטיביות
  {
    id: "productivity-1",
    title: "תכנון יומי",
    description: "רשימת משימות ויעדים ליום הקרוב",
    category: "productivity",
    color: "#EC4899",
    preferredTime: "21:00",
    templateCategory: "productivity",
  },
  {
    id: "productivity-2",
    title: "פומודורו של שעה מרוכזת",
    description: "עבודה ממוקדת ללא הסחות דעת",
    category: "productivity",
    color: "#8B5CF6",
    preferredTime: "09:00",
    templateCategory: "productivity",
  },
  {
    id: "productivity-3",
    title: "סידור סביבת העבודה",
    description: "יצירת מרחב נקי ומאורגן",
    category: "productivity",
    color: "#06B6D4",
    preferredTime: "08:30",
    templateCategory: "productivity",
  },
  {
    id: "productivity-4",
    title: "ביקורת יומית",
    description: "הערכת ההתקדמות והישגי היום",
    category: "productivity",
    color: "#A855F7",
    preferredTime: "20:00",
    templateCategory: "productivity",
  },
  {
    id: "productivity-5",
    title: "ניתוק מדיה חברתית",
    description: "שעה ללא רשתות חברתיות ומסכים",
    category: "productivity",
    color: "#DC2626",
    preferredTime: "18:00",
    templateCategory: "productivity",
  },
  {
    id: "productivity-6",
    title: "עדכון משימות בקלנדר",
    description: "סנכרון וארגון לוח שנה יומי",
    category: "productivity",
    color: "#7C3AED",
    preferredTime: "08:00",
    templateCategory: "productivity",
  },
  {
    id: "productivity-7",
    title: "דחיית פרוקרסטינציה",
    description: "התחלת המשימה הכי קשה ראשונה",
    category: "productivity",
    color: "#EAB308",
    preferredTime: "09:30",
    templateCategory: "productivity",
  },
  {
    id: "productivity-8",
    title: "ניקוי תיבת דואר",
    description: "ארגון ומחיקת אימיילים מיותרים",
    category: "productivity",
    color: "#0EA5E9",
    preferredTime: "16:00",
    templateCategory: "productivity",
  },

  // למידה
  {
    id: "learning-1",
    title: "קריאת 20 עמודים בספר",
    description: "הרחבת אופקים וידע דרך קריאה",
    category: "learning",
    color: "#F59E0B",
    preferredTime: "21:30",
    templateCategory: "learning",
  },
  {
    id: "learning-2",
    title: "לימוד שפה זרה 15 דקות",
    description: "תרגול יומי לשליטה בשפה חדשה",
    category: "learning",
    color: "#10B981",
    preferredTime: "07:30",
    templateCategory: "learning",
  },
  {
    id: "learning-3",
    title: "צפייה בהרצאת TED",
    description: "חשיפה לרעיונות ומחשבות מעוררות השראה",
    category: "learning",
    color: "#EF4444",
    preferredTime: "20:30",
    templateCategory: "learning",
  },
  {
    id: "learning-4",
    title: "כתיבת יומן רפלקציה",
    description: "תיעוד מחשבות ולמידה מחוויות",
    category: "learning",
    color: "#6366F1",
    preferredTime: "22:00",
    templateCategory: "learning",
  },
  {
    id: "learning-5",
    title: "קורס אונליין 30 דקות",
    description: "למידה מובנית של נושא חדש",
    category: "learning",
    color: "#8B5CF6",
    preferredTime: "19:00",
    templateCategory: "learning",
  },
  {
    id: "learning-6",
    title: "תרגול כלי מקצועי",
    description: "שיפור מיומנות ספציפית בעבודה",
    category: "learning",
    color: "#14B8A6",
    preferredTime: "18:30",
    templateCategory: "learning",
  },
  {
    id: "learning-7",
    title: "האזנה לפודקאסט חינוכי",
    description: "למידה תוך כדי נסיעה או פעילות",
    category: "learning",
    color: "#F97316",
    preferredTime: "07:00",
    templateCategory: "learning",
  },
  {
    id: "learning-8",
    title: "פתרון חידות וטריוויה",
    description: "חידוד החשיבה והזיכרון",
    category: "learning",
    color: "#EC4899",
    preferredTime: "12:00",
    templateCategory: "learning",
  },
];

export const getTemplatesByCategory = (category: "health" | "productivity" | "learning") => {
  return habitTemplates.filter((template) => template.templateCategory === category);
};

export const getAllTemplates = () => {
  return habitTemplates;
};