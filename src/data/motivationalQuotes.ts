export interface MotivationalQuote {
  text: string;
  author: string;
  category: "success" | "persistence" | "growth" | "strength" | "action";
}

export const motivationalQuotes: MotivationalQuote[] = [
  {
    text: "הצלחה היא לא סופית, כישלון הוא לא קטלני - האומץ להמשיך הוא מה שקובע",
    author: "וינסטון צ'רצ'יל",
    category: "persistence",
  },
  {
    text: "אל תחכה להזדמנות המושלמת. קח את הרגע הזה והפוך אותו למדהים",
    author: "זיג זיגלר",
    category: "action",
  },
  {
    text: "השינוי מתחיל ברגע שמפסיקים לקוות ומתחילים לעשות",
    author: "ברוס לי",
    category: "action",
  },
  {
    text: "כל יום שאתה לא משתפר, מישהו אחר משתפר במקומך",
    author: "אנונימי",
    category: "growth",
  },
  {
    text: "אתה לא חייב להיות גדול כדי להתחיל, אבל חייב להתחיל כדי להיות גדול",
    author: "ג'ו ספאקס",
    category: "action",
  },
  {
    text: "ההבדל בין משהו טוב למדהים הוא תשומת לב לפרטים הקטנים",
    author: "צ'רלס סווינדול",
    category: "success",
  },
  {
    text: "כוח הרצון שלך חזק יותר מכל מכשול בדרך",
    author: "טוני רובינס",
    category: "strength",
  },
  {
    text: "כל בוקר מתעורר איתך פוטנציאל אדיר - השאלה היא אם תממש אותו",
    author: "אנונימי",
    category: "growth",
  },
  {
    text: "הרגל טוב אחד מוביל לשני, ושני מובילים לשלושה - זה אפקט השלג",
    author: "ג'יימס קליר",
    category: "growth",
  },
  {
    text: "אל תשווה את עצמך לאחרים. השווה את עצמך רק לעצמך של אתמול",
    author: "ג'ורדן פיטרסון",
    category: "growth",
  },
  {
    text: "ההצלחה היא סכום של מאות החלטות קטנות שאיש לא רואה",
    author: "סטיב ג'ובס",
    category: "success",
  },
  {
    text: "אם לא תבנה את החלומות שלך, מישהו אחר ישכור אותך לבנות את שלו",
    author: "דאריל שור",
    category: "action",
  },
  {
    text: "הכוח האמיתי הוא להמשיך כשכולם אחרים מוותרים",
    author: "נפוליאון היל",
    category: "persistence",
  },
  {
    text: "אתה יכול להישבר, אבל אתה לא צריך להישאר שבור",
    author: "דניאל מידלטון",
    category: "strength",
  },
  {
    text: "כל יום הוא סיכוי חדש להיות הגרסה הטובה ביותר של עצמך",
    author: "אנונימי",
    category: "growth",
  },
  {
    text: "אל תספור את הימים - תגרום שהימים יספרו",
    author: "מוחמד עלי",
    category: "action",
  },
  {
    text: "התחל מאיפה שאתה, השתמש במה שיש לך, עשה מה שאתה יכול",
    author: "ארתור אש",
    category: "action",
  },
  {
    text: "הרגלים הם הריבית המצטברת של שיפור עצמי",
    author: "ג'יימס קליר",
    category: "growth",
  },
  {
    text: "אם זה לא מאתגר אותך, זה לא משנה אותך",
    author: "פרד דה ויט",
    category: "growth",
  },
  {
    text: "המוטיבציה היא מה שמתחיל אותך, ההרגל הוא מה ששומר אותך",
    author: "ג'ים ריון",
    category: "persistence",
  },
  {
    text: "תפסיק לחכות לרגע המושלם והתחל לעשות את הרגע מושלם",
    author: "אנונימי",
    category: "action",
  },
  {
    text: "ההבדל בין מי שמצליח למי שלא זה לא כישרון - זו עקשנות",
    author: "וינס לומברדי",
    category: "persistence",
  },
  {
    text: "אתה לא יכול לחזור אחורה ולשנות את ההתחלה, אבל אתה יכול להתחיל היכן שאתה ולשנות את הסוף",
    author: "סי. אס. לואיס",
    category: "growth",
  },
  {
    text: "הזמן שאתה נהנה לבזבז אינו זמן מבוזבז, אבל הזמן שאתה מפחד להתחיל בו כן",
    author: "ברטרנד ראסל",
    category: "action",
  },
  {
    text: "כל מסע של אלף מייל מתחיל בצעד אחד - אבל רק אם אתה באמת עושה אותו",
    author: "לאו דזה",
    category: "action",
  },
  {
    text: "הכוח שלך לא נמדד במה שאתה יכול לעשות, אלא במה שאתה ממשיך לעשות",
    author: "אנונימי",
    category: "persistence",
  },
  {
    text: "התמדה היא לא מרוץ ארוך - זה הרבה מרוצים קצרים אחד אחרי השני",
    author: "וולטר אליוט",
    category: "persistence",
  },
  {
    text: "עשה היום מה שאחרים לא רוצים, תעשה מחר מה שאחרים לא יכולים",
    author: "ג'רי רייס",
    category: "action",
  },
  {
    text: "אתה לא צריך להיות מעולה כדי להתחיל, אבל אתה צריך להתחיל כדי להיות מעולה",
    author: "זיג זיגלר",
    category: "action",
  },
  {
    text: "הדרך היחידה לעשות עבודה נהדרת היא לאהוב את מה שאתה עושה ולהתמיד בזה",
    author: "סטיב ג'ובס",
    category: "success",
  },
];

export const getRandomQuote = (): MotivationalQuote => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};

export const getQuoteByCategory = (category: MotivationalQuote["category"]): MotivationalQuote => {
  const categoryQuotes = motivationalQuotes.filter((q) => q.category === category);
  if (categoryQuotes.length === 0) return getRandomQuote();
  const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
  return categoryQuotes[randomIndex];
};

export const getQuoteOfTheDay = (): MotivationalQuote => {
  // Get a consistent quote for the day based on the date
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const index = dayOfYear % motivationalQuotes.length;
  return motivationalQuotes[index];
};
