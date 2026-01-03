# 🛠️ מדריך מערכת כלי פיתוח - Developer Tools System

> מדריך מפורט למפתחים על מערכת כלי הפיתוח המובנית באפליקציה

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [ארכיטקטורה](#ארכיטקטורה)
3. [הפעלת מצב פיתוח](#הפעלת-מצב-פיתוח)
4. [קונסול מפתחים](#קונסול-מפתחים)
5. [זיהוי אלמנטים (אלמנטור)](#זיהוי-אלמנטים-אלמנטור)
6. [אינטגרציה עם VS Code Copilot](#אינטגרציה-עם-vs-code-copilot)
7. [ניקוי קאש עמוק](#ניקוי-קאש-עמוק)
8. [היסטוריית בדיקות](#היסטוריית-בדיקות)
9. [קיצורי מקלדת](#קיצורי-מקלדת)
10. [הרחבה ופיתוח עתידי](#הרחבה-ופיתוח-עתידי)

---

## 🎯 סקירה כללית

מערכת כלי הפיתוח נבנתה כדי לספק למפתחים כלים מתקדמים לניפוי באגים, בדיקות ותקשורת ישירה עם GitHub Copilot - **ללא צורך לפתוח את DevTools של הדפדפן**.

### יתרונות המערכת

| יתרון | תיאור |
|-------|--------|
| 🎨 **ממשק עברי** | כל הכלים בעברית עם תמיכה מלאה ב-RTL |
| 🔗 **חיבור ל-Copilot** | שליחת מידע ישירות ל-VS Code Copilot Chat |
| 📜 **היסטוריה** | שמירת בדיקות קודמות לצפייה חוזרת |
| 🧹 **ניקוי קאש** | ניקוי עמוק של כל סוגי הקאש בלחיצה אחת |
| 💾 **שמירה אוטומטית** | כל ההגדרות נשמרות ב-localStorage |

---

## 🏗️ ארכיטקטורה

### קבצים מעורבים

```
src/
├── components/
│   └── DevInspector.tsx      # הקומפוננטה הראשית של כלי הפיתוח
├── hooks/
│   └── useDeveloperMode.tsx  # ניהול מצב (Zustand store)
└── pages/
    └── Settings.tsx          # ממשק הגדרות מצב פיתוח
```

### תרשים זרימה

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Settings.tsx  │────▶│ useDeveloperMode │◀────│  DevInspector   │
│   (הגדרות)      │     │   (Zustand)      │     │   (ביצוע)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   localStorage   │
                    │ (שמירת הגדרות)   │
                    └──────────────────┘
```

---

## ⚡ הפעלת מצב פיתוח

### דרך 1: דף הגדרות

1. עבור ל-**הגדרות** (Settings)
2. מצא את קטע **"מצב פיתוח"**
3. הפעל את המתג הראשי

### דרך 2: קוד

```typescript
import { useDeveloperMode } from '@/hooks/useDeveloperMode';

function MyComponent() {
  const { enabled, toggleDevMode } = useDeveloperMode();
  
  return (
    <button onClick={toggleDevMode}>
      {enabled ? 'כבה' : 'הפעל'} מצב פיתוח
    </button>
  );
}
```

### State Structure

```typescript
interface DeveloperModeState {
  // מצב כללי
  enabled: boolean;
  
  // כלי פיתוח
  consoleEnabled: boolean;      // קונסול פעיל?
  inspectorEnabled: boolean;    // זיהוי אלמנטים פעיל?
  
  // הגדרות קונסול
  consoleFilter: 'all' | 'error' | 'warn' | 'info' | 'log';
  consoleAutoScroll: boolean;
  
  // פעולות
  toggleDevMode: () => void;
  toggleConsole: () => void;
  toggleInspector: () => void;
  setConsoleFilter: (filter) => void;
  setConsoleAutoScroll: (enabled) => void;
  hardRefresh: () => Promise<void>;
  
  // עזר
  isFirstTimeEnabled: boolean;
}
```

---

## 🖥️ קונסול מפתחים

### תכונות

- ✅ **יירוט כל console.log/info/warn/error/debug**
- ✅ **יירוט שגיאות גלובליות (window.onerror)**
- ✅ **יירוט Promise rejections**
- ✅ **סינון לפי סוג**
- ✅ **חיפוש טקסט**
- ✅ **הצגת Stack Trace**
- ✅ **העתקת כל הלוגים**

### מימוש יירוט הקונסול

```typescript
// שמירת הפונקציות המקוריות
const originalConsoleRef = useRef<{
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
  debug: typeof console.debug;
} | null>(null);

useEffect(() => {
  if (!enabled) return;

  // שמירת המקוריים
  if (!originalConsoleRef.current) {
    originalConsoleRef.current = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
  }

  // יירוט console.log
  console.log = (...args) => {
    originalConsoleRef.current?.log(...args);  // קריאה למקורי
    setConsoleLogs(prev => [...prev.slice(-500), createLogEntry('log', args)]);
  };

  // בניקוי - החזרת המקורי
  return () => {
    if (originalConsoleRef.current) {
      console.log = originalConsoleRef.current.log;
      // ... שאר הפונקציות
    }
  };
}, [enabled]);
```

### מבנה LogEntry

```typescript
interface LogEntry {
  id: number;           // מזהה ייחודי
  timestamp: string;    // שעה בפורמט HH:MM:SS
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;      // התוכן
  source?: string;      // מיקום קובץ (לשגיאות)
  stack?: string;       // Stack trace (לשגיאות)
}
```

### סינון לוגים

```typescript
const filteredLogs = consoleLogs.filter(log => {
  // סינון לפי סוג
  if (filter !== 'all' && log.type !== filter) return false;
  
  // סינון לפי חיפוש
  if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }
  
  return true;
});
```

### עיצוב לפי סוג

```typescript
const getLogStyle = () => {
  switch (log.type) {
    case 'error': return 'text-red-400 bg-red-900/20 border-r-2 border-red-500';
    case 'warn': return 'text-yellow-400 bg-yellow-900/20 border-r-2 border-yellow-500';
    case 'info': return 'text-blue-400';
    case 'debug': return 'text-purple-400';
    default: return 'text-green-400';
  }
};
```

---

## 🔍 זיהוי אלמנטים (אלמנטור)

### איך זה עובד?

1. **לחיצה על כפתור Bug** - מפעיל מצב זיהוי
2. **ריחוף מעל אלמנט** - מציג מסגרת כחולה
3. **לחיצה על אלמנט** - מציג מידע מפורט

### זיהוי קומפוננטת React

הכלי משתמש ב-**React Fiber** לזהות את הקומפוננטה:

```typescript
const getComponentInfo = useCallback((element: HTMLElement): InspectedElement | null => {
  try {
    // חיפוש React Fiber
    const fiberKey = Object.keys(element).find(
      key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
    );

    if (!fiberKey) return null;

    let fiber = (element as any)[fiberKey];
    let componentName = 'Unknown';
    let filePath = 'Unknown';

    // טיפוס במעלה עץ ה-Fiber
    while (fiber) {
      if (fiber.type && typeof fiber.type === 'function') {
        componentName = fiber.type.displayName || fiber.type.name || 'Anonymous';
        
        // ניסיון לחלץ מיקום קובץ
        const source = fiber._debugSource;
        if (source) {
          filePath = `${source.fileName}:${source.lineNumber}`;
        }
        break;
      }
      fiber = fiber.return;
    }

    return {
      componentName,
      filePath,
      props: fiber?.memoizedProps || {},
      elementType: element.tagName,
      className: element.className,
      htmlTag: element.tagName.toLowerCase(),
      position: {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      },
      page: window.location.pathname,
      textContent: element.textContent?.slice(0, 100),
    };
  } catch (error) {
    return null;
  }
}, []);
```

### מבנה InspectedElement

```typescript
interface InspectedElement {
  componentName: string;    // שם הקומפוננטה
  filePath: string;         // מיקום בקוד
  props: Record<string, any>;  // Props של הקומפוננטה
  elementType: string;      // סוג אלמנט HTML
  className?: string;       // CSS classes
  htmlTag: string;          // תג HTML
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  page: string;             // נתיב העמוד
  screenshot?: string;      // צילום מסך (base64)
  textContent?: string;     // תוכן טקסט
}
```

### Ctrl+Click לפעולה רגילה

```typescript
const handleClick = useCallback((e: MouseEvent) => {
  if (!isActive) return;
  
  const target = e.target as HTMLElement;
  const isDevInspectorUI = target.closest('.dev-inspector-ui');
  
  // Ctrl+Click = פעולה רגילה
  if (e.ctrlKey || e.metaKey) {
    return; // לא חוסם את האירוע
  }
  
  // אם זה UI של הכלי - מאפשר פעולה רגילה
  if (isDevInspectorUI) {
    return;
  }
  
  // אחרת - זיהוי אלמנט
  e.preventDefault();
  e.stopPropagation();
  
  const info = getComponentInfo(target);
  if (info) {
    setInspectedElement(info);
    addToHistory(info);
  }
}, [isActive, getComponentInfo]);
```

---

## 🤖 אינטגרציה עם VS Code Copilot

### הרעיון

לחיצה על **"פתח ב-Copilot"** פותחת את VS Code Copilot Chat עם מידע על האלמנט!

### מימוש

```typescript
const openInCopilot = async (element: InspectedElement) => {
  // יצירת פורמט מידע
  const copilotFormat = `🔍 אלמנט לבדיקה:
קומפוננטה: ${element.componentName}
מיקום קובץ: ${element.filePath}
עמוד: ${element.page}
תג HTML: ${element.htmlTag}
Class: ${element.className || 'אין'}
מיקום על המסך: X=${element.position.x}, Y=${element.position.y}
גודל: ${element.position.width}x${element.position.height}px
${element.textContent ? `תוכן טקסט: "${element.textContent}"` : ''}

Props:
${Object.entries(element.props)
  .map(([key, value]) => `  ${key}: ${typeof value === 'object' ? '[Object]' : value}`)
  .join('\n')}`;

  try {
    // העתקה ל-clipboard כגיבוי
    await navigator.clipboard.writeText(copilotFormat);
    
    // יצירת prompt מקוצר (URL מוגבל ב-2000 תווים)
    const shortPrompt = `בדוק את הקומפוננטה ${element.componentName} בקובץ ${element.filePath}`;
    
    // פתיחת VS Code עם Copilot Chat
    const vscodeUrl = `vscode://GitHub.copilot-chat/chat?prompt=${encodeURIComponent(shortPrompt)}`;
    
    // ניסיון לפתוח
    const link = document.createElement('a');
    link.href = vscodeUrl;
    link.click();
    
    toast.success('🚀 נפתח ב-Copilot Chat! (המידע המלא הועתק ל-clipboard)');
  } catch (err) {
    toast.error('שגיאה בפתיחת Copilot');
  }
};
```

### פרוטוקול vscode://

```
vscode://GitHub.copilot-chat/chat?prompt=YOUR_PROMPT_HERE
```

| חלק | הסבר |
|-----|------|
| `vscode://` | פרוטוקול לפתיחת VS Code |
| `GitHub.copilot-chat` | Extension ID של Copilot Chat |
| `/chat` | פקודה לפתיחת צ'אט |
| `?prompt=...` | הפרומפט לשלוח |

### גיבוי: העתקה ידנית

```typescript
const copyForCopilot = async (element: InspectedElement) => {
  const copilotFormat = `...`; // אותו פורמט
  
  await navigator.clipboard.writeText(copilotFormat);
  toast.success('📋 הועתק! הדבק ב-Copilot Chat');
};
```

---

## 🧹 ניקוי קאש עמוק

### מה מתנקה?

1. **Cache API** - כל הקאשים של Service Worker
2. **Service Workers** - ביטול רישום כל ה-SW
3. **localStorage** - כל המידע (חוץ מהגדרות פיתוח)
4. **sessionStorage** - כל המידע

### מימוש

```typescript
hardRefresh: async () => {
  try {
    // 1. ניקוי Cache API
    if ('caches' in globalThis) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // 2. ביטול Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
    
    // 3. ניקוי localStorage (שמירת הגדרות פיתוח)
    const devModeSettings = localStorage.getItem('developer-mode-storage');
    localStorage.clear();
    if (devModeSettings) {
      localStorage.setItem('developer-mode-storage', devModeSettings);
    }
    
    // 4. ניקוי sessionStorage
    sessionStorage.clear();
    
    // 5. ריענון מלא
    globalThis.location.reload();
  } catch (error) {
    console.error('שגיאה בניקוי קאש:', error);
    globalThis.location.reload();
  }
}
```

### למה globalThis?

```typescript
// ESLint מעדיף globalThis על window
globalThis.location.reload();  // ✅ נכון
window.location.reload();      // ⚠️ אזהרת ESLint
```

---

## 📜 היסטוריית בדיקות

### מימוש

```typescript
const [inspectionHistory, setInspectionHistory] = useState<InspectedElement[]>([]);

const addToHistory = useCallback((element: InspectedElement) => {
  setInspectionHistory(prev => {
    // מניעת כפילויות
    const exists = prev.some(
      e => e.componentName === element.componentName && 
           e.position.x === element.position.x && 
           e.position.y === element.position.y
    );
    
    if (exists) return prev;
    
    // שמירת עד 20 אלמנטים אחרונים
    return [element, ...prev].slice(0, 20);
  });
}, []);
```

### תצוגה

```tsx
{inspectionHistory.map((item, index) => (
  <div
    key={index}
    onClick={() => {
      setInspectedElement(item);
      setShowHistory(false);
    }}
  >
    <span>{item.componentName}</span>
    <span>{item.filePath}</span>
  </div>
))}
```

---

## ⌨️ קיצורי מקלדת

| קיצור | פעולה |
|-------|-------|
| `ESC` | סגירת כל הפאנלים |
| `Ctrl+Click` | פעולה רגילה (לא זיהוי) |

### מימוש

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInspectedElement(null);
      setIsActive(false);
      setShowConsole(false);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## 🚀 הרחבה ופיתוח עתידי

### רעיונות לפיתוח

1. **Network Inspector** - מעקב אחר בקשות רשת
2. **Performance Monitor** - מדידת ביצועים
3. **State Viewer** - צפייה ב-Zustand/Redux state
4. **Component Tree** - עץ קומפוננטות ויזואלי
5. **Props Editor** - עריכת props בזמן אמת

### הוספת כלי חדש

```typescript
// 1. הוסף state ב-useDeveloperMode
interface DeveloperModeState {
  // ...
  networkEnabled: boolean;
  toggleNetwork: () => void;
}

// 2. הוסף UI ב-DevInspector
{networkEnabled && (
  <Card className="dev-inspector-ui ...">
    {/* Network panel */}
  </Card>
)}

// 3. הוסף כפתור
<Button onClick={() => setNetworkEnabled(!networkEnabled)}>
  <Network className="h-5 w-5" />
</Button>
```

---

## 📁 קבצי הפרויקט

### DevInspector.tsx - הקומפוננטה הראשית

```
src/components/DevInspector.tsx
├── LogEntry interface
├── InspectedElement interface
├── Console interception (useEffect)
├── Element inspection (getComponentInfo)
├── Copilot integration (openInCopilot)
├── Hard refresh (handleHardRefresh)
├── History management
└── UI rendering
```

### useDeveloperMode.tsx - ניהול מצב

```
src/hooks/useDeveloperMode.tsx
├── DeveloperModeState interface
├── Zustand store with persist
├── toggleDevMode()
├── toggleConsole()
├── toggleInspector()
├── hardRefresh()
└── localStorage persistence
```

---

## 🔧 Troubleshooting

### הכלים לא מופיעים

1. ודא שמצב פיתוח מופעל בהגדרות
2. ודא שהקונסול/אלמנטור מופעלים
3. בדוק ש-`enabled` הוא `true` ב-DevTools

### Copilot לא נפתח

1. ודא ש-VS Code מותקן
2. ודא ש-GitHub Copilot Chat מותקן
3. נסה להעתיק ולהדביק ידנית

### ניקוי קאש לא עובד

1. בדוק שגיאות בקונסול
2. נסה לרענן ידנית עם Ctrl+Shift+R
3. נקה ידנית ב-DevTools > Application

---

## 📝 סיכום

מערכת כלי הפיתוח מספקת:

- 🖥️ **קונסול מלא** עם סינון, חיפוש ו-stack traces
- 🔍 **זיהוי אלמנטים** כמו Elementor עם מידע על React Fiber
- 🤖 **אינטגרציה עם Copilot** לניפוי באגים חכם
- 🧹 **ניקוי קאש עמוק** לפתרון בעיות
- 📜 **היסטוריית בדיקות** לצפייה חוזרת
- 💾 **שמירה אוטומטית** של כל ההגדרות

הכל בעברית, עם תמיכה מלאה ב-RTL! 🎉

---

*נכתב על ידי צוות הפיתוח | עודכן לאחרונה: ינואר 2026*
