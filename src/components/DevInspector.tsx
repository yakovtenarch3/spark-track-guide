import { useState, useEffect, useCallback } from 'react';
import { Bug, Copy, X, CheckCircle2, Camera, MapPin, Terminal, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import html2canvas from 'html2canvas';

interface InspectedElement {
  componentName: string;
  filePath: string;
  props: Record<string, any>;
  elementType: string;
  className?: string;
  htmlTag: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  page: string;
  screenshot?: string;
  textContent?: string;
}

export function DevInspector() {
  const [isActive, setIsActive] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<InspectedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // הוספת לוג לקונסול
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('he-IL');
    console.log(`[DevInspector] ${message}`); // גם לקונסול הרגיל
    setConsoleLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // ניקוי הקונסול
  const clearConsole = () => {
    console.log('[DevInspector] מנקה קונסול');
    setConsoleLogs([]);
    addLog('🗑️ הקונסול נוקה');
  };

  // העתקת כל תוכן הקונסול
  const copyConsoleLogs = async () => {
    console.log('[DevInspector] מעתיק את כל הלוגים');
    const allLogs = consoleLogs.join('\n');
    try {
      await navigator.clipboard.writeText(allLogs);
      addLog('✅ כל הלוגים הועתקו ללוח');
    } catch (err) {
      addLog('❌ שגיאה בהעתקה');
      console.error('[DevInspector] שגיאה בהעתקת לוגים:', err);
    }
  };

  // פונקציה שמזהה את הקומפוננטה מתוך ה-React Fiber
  const getComponentInfo = useCallback((element: HTMLElement): InspectedElement | null => {
    try {
      // קבלת מיקום האלמנט
      const rect = element.getBoundingClientRect();
      const position = {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

      // זיהוי העמוד הנוכחי
      const currentPage = window.location.pathname;

      // קבלת תוכן הטקסט (עד 200 תווים)
      const textContent = element.textContent?.trim().slice(0, 200) || '';

      // מחפש את ה-React Fiber node
      const fiberKey = Object.keys(element).find(key => 
        key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
      );

      if (!fiberKey) {
        return {
          componentName: 'Unknown Component',
          filePath: 'לא נמצא',
          props: {},
          elementType: element.tagName,
          className: element.className,
          htmlTag: element.tagName.toLowerCase(),
          position,
          page: currentPage,
          textContent
        };
      }

      let fiber = (element as any)[fiberKey];
      let componentName = 'Unknown';
      let filePath = '';
      let props = {};

      // מטפס במעלה עץ הקומפוננטות
      while (fiber) {
        if (fiber.type) {
          if (typeof fiber.type === 'function') {
            componentName = fiber.type.name || fiber.type.displayName || 'Anonymous';
            
            // ניסיון למצוא את המיקום בקוד
            if (fiber._debugSource) {
              filePath = `${fiber._debugSource.fileName}:${fiber._debugSource.lineNumber}`;
            } else if (fiber.type.toString) {
              // ניסיון לחלץ מידע מה-function
              const funcString = fiber.type.toString();
              const match = funcString.match(/\/src\/.*?\.tsx?/);
              if (match) {
                filePath = match[0];
              }
            }
            
            props = fiber.memoizedProps || {};
            break;
          } else if (typeof fiber.type === 'string') {
            componentName = `<${fiber.type}>`;
          }
        }
        fiber = fiber.return;
      }

      // אם לא מצאנו מידע, ננסה לזהות לפי data attributes או class names
      if (componentName === 'Unknown' || componentName === 'Anonymous') {
        // בדיקה של data attributes
        const dataComponent = element.getAttribute('data-component');
        if (dataComponent) {
          componentName = dataComponent;
        } else {
          // ניסיון לזהות לפי class names מוכרים
          const classNames = element.className.split(' ');
          const knownPatterns = [
            'HabitCard', 'Statistics', 'Calendar', 'Achievement', 
            'Goal', 'Tracker', 'Chart', 'Analytics', 'Button', 'Dialog'
          ];
          
          for (const pattern of knownPatterns) {
            const found = classNames.find(cn => cn.includes(pattern));
            if (found) {
              componentName = pattern;
              break;
            }
          }
        }
      }

      // ניסיון למצוא את הקובץ לפי שם הקומפוננטה
      if (!filePath && componentName !== 'Unknown') {
        const possiblePaths = [
          `src/components/${componentName}.tsx`,
          `src/pages/${componentName}.tsx`,
          `src/components/ui/${componentName.toLowerCase()}.tsx`
        ];
        filePath = possiblePaths[0];
      }

      return {
        componentName,
        filePath: filePath || 'לא זוהה',
        props: Object.keys(props).reduce((acc, key) => {
          if (!key.startsWith('__') && key !== 'children') {
            const val = props[key];
            if (typeof val === 'function') {
              acc[key] = '[Function]';
            } else if (typeof val === 'object' && val !== null) {
              // מטפל באובייקטים מורכבים - לא שומר הפניות מעגליות
              try {
                acc[key] = '[Object]';
              } catch {
                acc[key] = '[Complex Object]';
              }
            } else {
              acc[key] = val;
            }
          }
          return acc;
        }, {} as Record<string, any>),
        elementType: element.tagName,
        className: element.className,
        htmlTag: element.tagName.toLowerCase(),
        position,
        page: currentPage,
        textContent
      };
    } catch (error) {
      console.error('Error inspecting element:', error);
      return null;
    }
  }, []);

  // מטפל בהזזת עכבר
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;
    
    const target = e.target as HTMLElement;
    if (target && !target.closest('.dev-inspector-ui')) {
      setHoveredElement(target);
    }
  }, [isActive]);

  // מטפל בלחיצה
  const handleClick = useCallback((e: MouseEvent) => {
    if (!isActive) return;
    
    const target = e.target as HTMLElement;
    
    // בדיקה אם לחצנו על UI של הכלי עצמו
    if (target.closest('.dev-inspector-ui')) {
      console.log('[DevInspector] לחיצה על UI של DevInspector - מתעלם');
      return; // לא עוצרים את האירוע, נותנים לו לעבור
    }
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation(); // עוצר גם handlers אחרים
    
    console.log('[DevInspector] אלמנט נלחץ');
    if (target) {
      console.log('[DevInspector] מזהה את האלמנט...');
      const info = getComponentInfo(target);
      if (info) {
        console.log('[DevInspector] מידע נמצא:', info.componentName);
        addLog(`🔍 נבדק: ${info.componentName} ב-${info.page}`);
        setInspectedElement(info);
      } else {
        console.log('[DevInspector] לא נמצא מידע');
        addLog('❌ לא ניתן לזהות את האלמנט');
      }
    }
    
    return false;
  }, [isActive, getComponentInfo]);

  // הוספת/הסרת event listeners
  useEffect(() => {
    if (isActive) {
      // משתמש ב-capture phase כדי לתפוס אירועים לפני handlers אחרים
      // אבל רק עבור אלמנטים שאינם חלק מה-UI
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('mousedown', handleClick, true); // גם mousedown
      document.addEventListener('mouseup', handleClick, true); // גם mouseup
      document.body.style.cursor = 'crosshair';
    } else {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('mouseup', handleClick, true);
      document.body.style.cursor = '';
      setHoveredElement(null);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('mouseup', handleClick, true);
      document.body.style.cursor = '';
    };
  }, [isActive, handleMouseMove, handleClick]);

  // סימון האלמנט שמרחפים מעליו
  useEffect(() => {
    if (hoveredElement) {
      hoveredElement.style.outline = '2px solid #3b82f6';
      hoveredElement.style.outlineOffset = '2px';
      return () => {
        hoveredElement.style.outline = '';
        hoveredElement.style.outlineOffset = '';
      };
    }
  }, [hoveredElement]);

  // סגירה עם Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConsole) {
          console.log('[DevInspector] סוגר קונסול עם ESC');
          setShowConsole(false);
          addLog('🔵 הקונסול נסגר');
        } else if (inspectedElement) {
          console.log('[DevInspector] סוגר מידע עם ESC');
          setInspectedElement(null);
        } else if (isActive) {
          console.log('[DevInspector] מכבה מצב בדיקה עם ESC');
          setIsActive(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [inspectedElement, isActive, showConsole]);

  // צילום מסך של האלמנט
  const captureScreenshot = async () => {
    if (!inspectedElement) return;

    setIsCapturingScreenshot(true);
    try {
      // מוצא את האלמנט שוב
      const elements = document.querySelectorAll(inspectedElement.htmlTag);
      let targetElement: HTMLElement | null = null;

      // מנסה למצוא את האלמנט המדויק
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          Math.abs(rect.left + window.scrollX - inspectedElement.position.x) < 5 &&
          Math.abs(rect.top + window.scrollY - inspectedElement.position.y) < 5
        ) {
          targetElement = el as HTMLElement;
        }
      });

      if (!targetElement) {
        console.error('Could not find element for screenshot');
        return;
      }

      // מסיר את הסימון הכחול זמנית
      const originalOutline = targetElement.style.outline;
      const originalOutlineOffset = targetElement.style.outlineOffset;
      targetElement.style.outline = '';
      targetElement.style.outlineOffset = '';

      // צילום המסך
      const canvas = await html2canvas(targetElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      // החזרת הסימון
      targetElement.style.outline = originalOutline;
      targetElement.style.outlineOffset = originalOutlineOffset;

      // המרה ל-data URL
      const screenshot = canvas.toDataURL('image/png');

      // עדכון המידע עם צילום המסך
      setInspectedElement({
        ...inspectedElement,
        screenshot
      });

      // שמירה אוטומטית
      const link = document.createElement('a');
      link.download = `element-${inspectedElement.componentName}-${Date.now()}.png`;
      link.href = screenshot;
      link.click();
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  // העתקת מידע
  const copyToClipboard = async () => {
    console.log('🔵 copyToClipboard נקרא');
    addLog('🔵 copyToClipboard נקרא');
    
    if (!inspectedElement) {
      console.log('❌ אין inspectedElement');
      addLog('❌ אין inspectedElement');
      return;
    }

    console.log('✅ inspectedElement קיים:', inspectedElement.componentName);
    addLog(`✅ inspectedElement קיים: ${inspectedElement.componentName}`);

    const formatValue = (value: any): string => {
      try {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'object') {
          // מטפל ב-circular references
          const seen = new WeakSet();
          const replacer = (key: string, val: any) => {
            if (typeof val === 'object' && val !== null) {
              if (seen.has(val)) return '[Circular]';
              seen.add(val);
            }
            if (typeof val === 'function') return '[Function]';
            return val;
          };
          return JSON.stringify(value, replacer, 2);
        }
        return String(value);
      } catch (e) {
        return '[Complex Object]';
      }
    };

    const info = `קומפוננטה: ${inspectedElement.componentName}
מיקום קובץ: ${inspectedElement.filePath}
עמוד: ${inspectedElement.page}
תג HTML: ${inspectedElement.htmlTag}
Class: ${inspectedElement.className || 'אין'}
מיקום על המסך: X=${inspectedElement.position.x}, Y=${inspectedElement.position.y}
גודל: ${inspectedElement.position.width}x${inspectedElement.position.height}px
${inspectedElement.textContent ? `תוכן טקסט: "${inspectedElement.textContent}"` : ''}

Props:
${Object.entries(inspectedElement.props).map(([key, value]) => 
  `  ${key}: ${formatValue(value)}`
).join('\n')}`;

    console.log('📋 המידע להעתקה:', info.substring(0, 100) + '...');
    console.log('📊 אורך המידע:', info.length, 'תווים');
    addLog(`📋 מידע מוכן להעתקה (${info.length} תווים)`);

    try {
      console.log('🔄 מנסה להעתיק עם navigator.clipboard...');
      addLog('🔄 מנסה להעתיק עם navigator.clipboard...');
      await navigator.clipboard.writeText(info);
      console.log('✅✅✅ מידע הועתק בהצלחה! ניתן להדביק עכשיו');
      addLog('✅✅✅ מידע הועתק בהצלחה!');
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        console.log('🔵 איפוס סטטוס העתקה');
      }, 2000);
    } catch (err) {
      console.error('❌ שגיאה בהעתקה עם Clipboard API:', err);
      addLog(`❌ שגיאה בהעתקה: ${err}`);
      // fallback - ניסיון חלופי
      try {
        console.log('🔄 מנסה fallback עם execCommand...');
        const textArea = document.createElement('textarea');
        textArea.value = info;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('✅✅✅ מידע הועתק בהצלחה עם fallback!');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('execCommand החזיר false');
        }
      } catch (fallbackErr) {
        console.error('❌❌ גם ה-fallback נכשל:', fallbackErr);
        alert('לא ניתן להעתיק אוטומטית.\n\nהמידע הודפס בקונסול - העתק משם או פתח DevTools (F12)');
        console.log('=== מידע להעתקה ידנית ===');
        console.log(info);
        console.log('=== סוף המידע ===');
      }
    }
  };

  // רק בסביבת פיתוח
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <>
      {/* כפתור ציף */}
      <div className="dev-inspector-ui fixed bottom-4 start-4 z-[9999] flex gap-2">
        <Button
          onClick={() => setIsActive(!isActive)}
          size="icon"
          variant={isActive ? "default" : "outline"}
          className={`rounded-full shadow-lg transition-all ${
            isActive ? 'bg-blue-600 hover:bg-blue-700' : ''
          }`}
          title="Dev Inspector (לחץ ESC לסגירה)"
        >
          <Bug className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={() => {
            console.log('[DevInspector] כפתור קונסול נלחץ, מצב נוכחי:', showConsole);
            const newState = !showConsole;
            setShowConsole(newState);
            if (newState) {
              console.log('[DevInspector] פותח קונסול');
              addLog('🟢 הקונסול נפתח - DevInspector מוכן!');
            } else {
              console.log('[DevInspector] סוגר קונסול');
            }
          }}
          size="icon"
          variant={showConsole ? "default" : "outline"}
          className={`rounded-full shadow-lg transition-all ${
            showConsole ? 'bg-green-600 hover:bg-green-700' : ''
          }`}
          title="Console Logs (לחץ ESC לסגירה)"
        >
          <Terminal className="h-5 w-5" />
        </Button>
      </div>

      {/* קונסול לוגים */}
      {showConsole && (
        <Card className="dev-inspector-ui fixed bottom-20 start-4 z-[9999] w-[500px] max-w-[calc(100vw-2rem)] h-[400px] max-h-[calc(100vh-8rem)] shadow-2xl border-2 border-green-500">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-bold text-green-900">Console Logs</h3>
                <span className="text-xs text-gray-500">({consoleLogs.length} הודעות)</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    console.log('[DevInspector] כפתור העתקת לוגים נלחץ');
                    copyConsoleLogs();
                  }}
                  title="העתק כל הלוגים"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    console.log('[DevInspector] כפתור ניקוי נלחץ');
                    clearConsole();
                  }}
                  title="נקה קונסול"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    console.log('[DevInspector] סוגר קונסול');
                    setShowConsole(false);
                  }}
                  title="סגור"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div 
              className="flex-1 overflow-y-auto p-3 bg-gray-900 font-mono text-xs"
              ref={(el) => {
                if (el && consoleLogs.length > 0) {
                  el.scrollTop = el.scrollHeight;
                }
              }}
            >
              {consoleLogs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  אין לוגים להצגה
                  <br />
                  <span className="text-xs">נסה לבצע פעולות כדי לראות לוגים כאן</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {consoleLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className="text-green-400 hover:bg-gray-800 px-2 py-1 rounded break-all"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 bg-gray-800 border-t border-gray-700 text-[10px] text-gray-400 text-center">
              לחץ ESC לסגירה | {new Date().toLocaleString('he-IL')}
            </div>
          </div>
        </Card>
      )}

      {/* מסגרת תקציר קצרה */}
      {inspectedElement && (
        <Card className="dev-inspector-ui fixed bottom-20 start-4 z-[9999] w-80 max-w-[calc(100vw-2rem)] shadow-xl border-2 border-blue-500">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="text-xs font-semibold text-blue-600 mb-1">תקציר מהיר</div>
                <div className="font-mono font-bold text-sm text-blue-900 break-all">
                  {inspectedElement.componentName}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    console.log('🟢🟢🟢 כפתור העתקה בתקציר נלחץ!!!');
                    addLog('🟢 לחצת על כפתור העתקה');
                    copyToClipboard();
                  }}
                  title="העתק מידע"
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 כפתור סגירה נלחץ');
                    setInspectedElement(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-1 text-xs">
              {inspectedElement.textContent && (
                <div className="flex items-start gap-2 text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="font-semibold flex-shrink-0">📝</span>
                  <span className="font-mono text-[11px] line-clamp-2 break-all">
                    "{inspectedElement.textContent}"
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-purple-700">
                <span className="font-semibold">📁</span>
                <span className="font-mono truncate">{inspectedElement.filePath}</span>
              </div>
              
              <div className="flex items-center gap-2 text-teal-700">
                <span className="font-semibold">🗺️</span>
                <span className="font-mono">{inspectedElement.page}</span>
              </div>
              
              <div className="flex items-center gap-2 text-indigo-700">
                <span className="font-semibold">📍</span>
                <span className="font-mono">
                  X:{inspectedElement.position.x} Y:{inspectedElement.position.y} | 
                  {inspectedElement.position.width}×{inspectedElement.position.height}px
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-semibold">🏷️</span>
                <span className="font-mono">&lt;{inspectedElement.htmlTag}&gt;</span>
              </div>
            </div>
            
            <div className="text-[10px] text-gray-500 text-center mt-2 pt-2 border-t border-blue-200">
              לחץ ESC לסגירה | גלול למטה לפרטים מלאים ↓
            </div>
          </div>
        </Card>
      )}

      {/* חלון מידע מפורט */}
      {inspectedElement && (
        <Card className="dev-inspector-ui fixed top-4 end-4 z-[9999] w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden shadow-2xl">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Bug className="h-5 w-5 text-blue-600" />
                Component Inspector
              </h3>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📸 כפתור צילום מסך נלחץ');
                    captureScreenshot();
                  }}
                  disabled={isCapturingScreenshot}
                  title="צילום מסך של האלמנט"
                >
                  <Camera className={`h-4 w-4 ${isCapturingScreenshot ? 'animate-pulse' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    console.log('🟢🟢🟢 כפתור העתקה במסגרת הגדולה נלחץ!!!');
                    addLog('🟢 לחצת על כפתור העתקה במסגרת גדולה');
                    copyToClipboard();
                  }}
                  title="העתק מידע"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 כפתור סגירה במסגרת הגדולה נלחץ');
                    setInspectedElement(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-gray-600 mb-1">קומפוננטה</div>
                <div className="font-mono font-bold text-blue-700">
                  {inspectedElement.componentName}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-gray-600 mb-1">מיקום בקוד</div>
                <div className="font-mono text-sm text-purple-700 break-all">
                  {inspectedElement.filePath}
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  עמוד נוכחי
                </div>
                <div className="font-mono text-sm text-teal-700">
                  {inspectedElement.page}
                </div>
              </div>

              {inspectedElement.textContent && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-xs text-gray-600 mb-1">תוכן טקסט</div>
                  <div className="font-mono text-xs text-emerald-800 break-all max-h-24 overflow-y-auto">
                    "{inspectedElement.textContent}"
                  </div>
                </div>
              )}

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-xs text-gray-600 mb-1">מיקום על המסך</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-gray-500">X:</span>{' '}
                    <span className="text-indigo-700 font-semibold">{inspectedElement.position.x}px</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Y:</span>{' '}
                    <span className="text-indigo-700 font-semibold">{inspectedElement.position.y}px</span>
                  </div>
                  <div>
                    <span className="text-gray-500">רוחב:</span>{' '}
                    <span className="text-indigo-700 font-semibold">{inspectedElement.position.width}px</span>
                  </div>
                  <div>
                    <span className="text-gray-500">גובה:</span>{' '}
                    <span className="text-indigo-700 font-semibold">{inspectedElement.position.height}px</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">תג HTML</div>
                <div className="font-mono text-sm">
                  &lt;{inspectedElement.htmlTag}&gt;
                </div>
              </div>

              {inspectedElement.className && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Classes</div>
                  <div className="font-mono text-xs break-all">
                    {inspectedElement.className}
                  </div>
                </div>
              )}

              {Object.keys(inspectedElement.props).length > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-xs text-gray-600 mb-2">Props</div>
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {Object.entries(inspectedElement.props).map(([key, value]) => {
                      let displayValue;
                      try {
                        if (typeof value === 'function') {
                          displayValue = '[Function]';
                        } else if (typeof value === 'object' && value !== null) {
                          // מטפל ב-circular references
                          const seen = new WeakSet();
                          const replacer = (k: string, v: any) => {
                            if (typeof v === 'object' && v !== null) {
                              if (seen.has(v)) return '[Circular]';
                              seen.add(v);
                            }
                            if (typeof v === 'function') return '[Function]';
                            return v;
                          };
                          displayValue = JSON.stringify(value, replacer, 2);
                        } else if (typeof value === 'string') {
                          displayValue = `"${value}"`;
                        } else {
                          displayValue = String(value);
                        }
                      } catch (e) {
                        displayValue = '[Complex Object]';
                      }

                      return (
                        <div key={key} className="text-xs font-mono">
                          <span className="text-orange-700 font-semibold">{key}:</span>{' '}
                          <span className="text-gray-700">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {inspectedElement.screenshot && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-gray-600 mb-2">צילום מסך</div>
                  <img 
                    src={inspectedElement.screenshot} 
                    alt="Element screenshot" 
                    className="w-full rounded border border-slate-300"
                  />
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              לחץ על אלמנטים באתר כדי לבדוק אותם
            </div>
          </div>
        </Card>
      )}

      {/* הודעת מצב פעיל */}
      {isActive && !inspectedElement && (
        <div className="dev-inspector-ui fixed top-4 start-1/2 -translate-x-1/2 z-[9999] max-w-[calc(100vw-2rem)]">
          <Card className="px-4 py-2 bg-blue-600 text-white border-0 shadow-lg">
            <div className="text-sm font-medium whitespace-nowrap">
              🔍 מצב בדיקה פעיל - לחץ על אלמנט כדי לבדוק אותו (ESC לסגירה)
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
