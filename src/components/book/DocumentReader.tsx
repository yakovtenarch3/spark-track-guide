import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Trash2,
  Save,
  Edit3,
  Highlighter,
  MessageSquarePlus,
  List,
  Loader2,
} from "lucide-react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DocHeading = { id: string; text: string; level: number };

type DocNote = {
  id: string;
  selectedText: string;
  noteText: string;
  anchorId: string;
  createdAt: string;
};

const HIGHLIGHT_COLORS = [
  { value: "#FFEB3B", label: "צהוב" },
  { value: "#81C784", label: "ירוק" },
  { value: "#64B5F6", label: "כחול" },
  { value: "#FFB74D", label: "כתום" },
  { value: "#F48FB1", label: "ורוד" },
  { value: "#CE93D8", label: "סגול" },
];

const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });

const ensureHeadingIds = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));

  headings.forEach((h, idx) => {
    if (!h.id) h.id = `h-${idx}-${Math.random().toString(16).slice(2)}`;
  });

  return doc.body.innerHTML;
};

const extractHeadingsFromElement = (root: HTMLElement): DocHeading[] => {
  const nodes = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  return nodes
    .map((h) => {
      const level = Number(h.tagName.slice(1));
      const text = (h.textContent || "").trim();
      const id = h.id || "";
      if (!text || !id) return null;
      return { id, text, level };
    })
    .filter(Boolean) as DocHeading[];
};

const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || "";

const urlToStoragePath = (fileUrl: string) => {
  // Works for Supabase public URLs: .../object/public/<bucket>/<path>
  const parts = fileUrl.split("/");
  const lastTwo = parts.slice(-2).join("/");
  if (!lastTwo.includes("/")) return null;
  return lastTwo;
};

const loadDocumentAsHtml = async ({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string;
}): Promise<string> => {
  const ext = getFileExtension(fileName);

  if (ext === "docx") {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Failed to fetch DOCX");
    const arrayBuffer = await res.arrayBuffer();
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = `<!doctype html><html><body>${result.value}</body></html>`;
    return sanitizeHtml(ensureHeadingIds(html));
  }

  if (ext === "txt") {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Failed to fetch TXT");
    const text = await res.text();
    const escaped = escapeHtml(text);
    const html = `<!doctype html><html><body><pre style="white-space:pre-wrap;line-height:1.8">${escaped}</pre></body></html>`;
    return sanitizeHtml(ensureHeadingIds(html));
  }

  if (ext === "html" || ext === "htm") {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Failed to fetch HTML");
    const html = await res.text();
    return sanitizeHtml(ensureHeadingIds(html));
  }

  throw new Error("Unsupported document type");
};

const wrapSelection = (root: HTMLElement, wrapper: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return false;

  // Ensure selection is inside the root
  const commonAncestor = range.commonAncestorContainer;
  const ancestorEl =
    commonAncestor.nodeType === Node.ELEMENT_NODE
      ? (commonAncestor as Element)
      : commonAncestor.parentElement;
  if (!ancestorEl || !root.contains(ancestorEl)) return false;

  try {
    range.surroundContents(wrapper);
    selection.removeAllRanges();
    return true;
  } catch {
    // Fallback: extract + wrap
    try {
      const content = range.extractContents();
      wrapper.appendChild(content);
      range.insertNode(wrapper);
      selection.removeAllRanges();
      return true;
    } catch {
      return false;
    }
  }
};

export const DocumentReader = ({
  bookId,
  fileUrl,
  fileName,
  title,
  onFileSaved,
  onDelete,
  onBack,
}: {
  bookId: string;
  fileUrl: string;
  fileName: string;
  title: string;
  onFileSaved: (args: { fileUrl: string; fileName: string }) => void;
  onDelete: () => void;
  onBack: () => void;
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [html, setHtml] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [isDirty, setIsDirty] = useState(false);

  const [notes, setNotes] = useState<DocNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [selectionPreview, setSelectionPreview] = useState("");

  const [headings, setHeadings] = useState<DocHeading[]>([]);

  const notesStorageKey = useMemo(() => `document-notes-${bookId}`, [bookId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(notesStorageKey);
      if (raw) setNotes(JSON.parse(raw) as DocNote[]);
    } catch {
      // ignore
    }
  }, [notesStorageKey]);

  useEffect(() => {
    localStorage.setItem(notesStorageKey, JSON.stringify(notes));
  }, [notes, notesStorageKey]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const loaded = await loadDocumentAsHtml({ fileUrl, fileName });
        if (cancelled) return;
        setHtml(loaded);
        setIsDirty(false);
      } catch (e) {
        console.error(e);
        toast.error("שגיאה בטעינת המסמך");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [fileUrl, fileName]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setHeadings(extractHeadingsFromElement(el));
    update();

    const observer = new MutationObserver(() => {
      update();
    });

    observer.observe(el, { subtree: true, childList: true, characterData: true, attributes: true });
    return () => observer.disconnect();
  }, [html]);

  const captureSelectionText = () => {
    const selection = window.getSelection();
    const txt = selection?.toString() || "";
    setSelectionPreview(txt.trim().slice(0, 250));
  };

  const handleHighlight = () => {
    const root = contentRef.current;
    if (!root) return;

    const mark = document.createElement("mark");
    mark.style.backgroundColor = `${selectedColor}70`;
    mark.style.mixBlendMode = "multiply";

    const ok = wrapSelection(root, mark);
    if (!ok) {
      toast.error("בחר טקסט בתוך המסמך כדי להדגיש");
      return;
    }
    setIsDirty(true);
  };

  const handlePrepareNote = () => {
    captureSelectionText();
    if (!selectionPreview) {
      toast.error("בחר טקסט כדי לקשר אליו הערה");
      return;
    }
  };

  const handleAddNote = () => {
    const root = contentRef.current;
    if (!root) return;

    const selectedText = (window.getSelection()?.toString() || "").trim();
    if (!selectedText) {
      toast.error("בחר טקסט כדי לקשר אליו הערה");
      return;
    }

    if (!noteDraft.trim()) {
      toast.error("נא לכתוב תוכן הערה");
      return;
    }

    const id = `n-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const anchorId = `doc-anchor-${id}`;

    const span = document.createElement("span");
    span.id = anchorId;
    span.setAttribute("data-doc-note", id);
    span.style.backgroundColor = `${selectedColor}50`;
    span.style.borderBottom = "2px solid currentColor";

    const ok = wrapSelection(root, span);
    if (!ok) {
      toast.error("לא הצלחתי להצמיד את ההערה לטקסט הנבחר");
      return;
    }

    const next: DocNote = {
      id,
      anchorId,
      selectedText: selectedText.slice(0, 500),
      noteText: noteDraft.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [next, ...prev]);
    setNoteDraft("");
    setSelectionPreview("");
    setIsDirty(true);
    toast.success("הערה נוספה");
  };

  const scrollToAnchor = (anchorId: string) => {
    const root = contentRef.current;
    if (!root) return;
    const el = root.querySelector(`#${CSS.escape(anchorId)}`) as HTMLElement | null;
    if (!el) {
      toast.error("הטקסט המקושר לא נמצא במסמך (אולי נערך)");
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToHeading = (id: string) => {
    const root = contentRef.current;
    if (!root) return;
    const el = root.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    const root = contentRef.current;
    if (!root) return;

    const raw = root.innerHTML;
    const cleaned = sanitizeHtml(ensureHeadingIds(raw));

    try {
      const blob = new Blob([cleaned], { type: "text/html;charset=utf-8" });
      const newFileName = `${Date.now()}.html`;
      const filePath = `user-books/${newFileName}`;

      const { error } = await supabase.storage.from("books").upload(filePath, blob, {
        contentType: "text/html;charset=utf-8",
        upsert: false,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("books").getPublicUrl(filePath);
      onFileSaved({ fileUrl: urlData.publicUrl, fileName: newFileName });
      setIsDirty(false);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בשמירה");
    }
  };

  const handleOverwriteCurrentHtml = async () => {
    // Only meaningful when current file is HTML.
    const root = contentRef.current;
    if (!root) return;

    const ext = getFileExtension(fileName);
    if (ext !== "html" && ext !== "htm") {
      toast.error("שמירה על אותו קובץ זמינה רק ל-HTML");
      return;
    }

    const storagePath = urlToStoragePath(fileUrl);
    if (!storagePath) {
      toast.error("לא הצלחתי לזהות נתיב אחסון עבור הקובץ");
      return;
    }

    const raw = root.innerHTML;
    const cleaned = sanitizeHtml(ensureHeadingIds(raw));

    try {
      const blob = new Blob([cleaned], { type: "text/html;charset=utf-8" });
      const { error } = await supabase.storage.from("books").upload(storagePath, blob, {
        contentType: "text/html;charset=utf-8",
        upsert: true,
      });
      if (error) throw error;
      setIsDirty(false);
      toast.success("נשמר (דריסה) בהצלחה");
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בשמירה");
    }
  };

  const canOverwrite = useMemo(() => {
    const ext = getFileExtension(fileName);
    return ext === "html" || ext === "htm";
  }, [fileName]);

  return (
    <div
      className="flex flex-col h-[calc(100vh-100px)] min-h-[600px] rounded-xl overflow-hidden shadow-xl transition-colors ring-2 ring-primary/40 bg-background"
      dir="rtl"
    >
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <BookOpen className="w-4 h-4" />
            חזרה
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{title}</span>
              <Badge variant="outline" className="text-xs">
                {fileName}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">מסמך לעריכה, הדגשה והערות</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setIsEditMode((v) => !v)}
          >
            <Edit3 className="w-4 h-4" />
            {isEditMode ? "מצב עריכה" : "מצב צפייה"}
          </Button>

          <Button variant="outline" size="sm" className="gap-2" onClick={handleHighlight}>
            <Highlighter className="w-4 h-4" />
            הדגש
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              captureSelectionText();
              if (!window.getSelection()?.toString().trim()) {
                toast.error("בחר טקסט כדי לקשר אליו הערה");
                return;
              }
            }}
          >
            <MessageSquarePlus className="w-4 h-4" />
            הערה
          </Button>

          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={!isDirty}
            title={isDirty ? "שמור גרסה חדשה (HTML)" : "אין שינויים לשמירה"}
          >
            <Save className="w-4 h-4" />
            שמור
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOverwriteCurrentHtml}
            disabled={!isDirty || !canOverwrite}
            title={canOverwrite ? "דרוס את קובץ ה-HTML הנוכחי" : "זמין רק עבור HTML"}
          >
            דריסה
          </Button>

          <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[360px] border-l bg-card">
          <Tabs defaultValue="index" className="h-full flex flex-col">
            <div className="p-3 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="index" className="gap-2">
                  <List className="w-4 h-4" />
                  אינדקס
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <MessageSquarePlus className="w-4 h-4" />
                  הערות
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="index" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-3">
                {headings.length === 0 ? (
                  <div className="text-sm text-muted-foreground">אין כותרות (H1-H6) לאינדקס במסמך.</div>
                ) : (
                  <div className="space-y-1">
                    {headings.map((h) => (
                      <button
                        key={h.id}
                        className="w-full text-right text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                        style={{ paddingRight: `${8 + (h.level - 1) * 10}px` }}
                        onClick={() => scrollToHeading(h.id)}
                        title={h.text}
                      >
                        {h.text}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-3">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">בחר טקסט במסמך ואז כתוב הערה:</div>
                    <Input
                      value={selectionPreview}
                      onChange={() => {
                        // Read-only field; selection drives it.
                      }}
                      readOnly
                      placeholder="הטקסט הנבחר יופיע כאן..."
                    />
                    <Textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="כתוב הערה..."
                      rows={3}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1">
                        {HIGHLIGHT_COLORS.map((c) => (
                          <button
                            key={c.value}
                            className={`h-6 w-6 rounded-full border transition-all ${
                              selectedColor === c.value ? "ring-2 ring-primary border-foreground" : "border-border"
                            }`}
                            style={{ backgroundColor: c.value }}
                            onClick={() => setSelectedColor(c.value)}
                            title={c.label}
                            type="button"
                          />
                        ))}
                      </div>
                      <Button size="sm" onClick={handleAddNote} className="gap-2">
                        <MessageSquarePlus className="w-4 h-4" />
                        הוסף
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    {notes.length === 0 ? (
                      <div className="text-sm text-muted-foreground">אין הערות עדיין.</div>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((n) => (
                          <Card key={n.id} className="p-3">
                            <div className="text-xs text-muted-foreground mb-1">
                              {new Date(n.createdAt).toLocaleString("he-IL")}
                            </div>
                            <div className="text-sm font-medium mb-2">{n.noteText}</div>
                            <button
                              className="text-xs text-primary hover:underline"
                              onClick={() => scrollToAnchor(n.anchorId)}
                              title={n.selectedText}
                            >
                              קפוץ לטקסט: "{n.selectedText.slice(0, 80)}{n.selectedText.length > 80 ? "…" : ""}"
                            </button>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 bg-muted/30">
          {isLoading ? (
            <div className="h-full flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>טוען מסמך...</span>
            </div>
          ) : (
            <div className="h-full overflow-auto p-4">
              <Card className="p-6">
                <div
                  ref={contentRef}
                  className={`prose max-w-none ${isEditMode ? "outline outline-2 outline-primary/30 rounded" : ""}`}
                  dir="auto"
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onInput={() => setIsDirty(true)}
                  onMouseUp={() => {
                    captureSelectionText();
                  }}
                  onKeyUp={() => {
                    captureSelectionText();
                  }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </Card>
              {isDirty && (
                <div className="mt-2 text-xs text-muted-foreground">יש שינויים שלא נשמרו.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
