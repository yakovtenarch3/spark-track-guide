import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BookOpen,
  Trash2,
  Save,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
  Palette,
  MessageSquarePlus,
  Loader2,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Quote,
} from "lucide-react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocxWordView } from "./DocxWordView";
import { CanvasDocumentEditor } from "./CanvasDocumentEditor";

// Custom FontSize extension
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    } as any;
  },
});

type DocHeading = { id: string; text: string; level: number };

type DocNote = {
  id: string;
  selectedText: string;
  noteText: string;
  createdAt: string;
};

const FONTS = [
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
  { value: "David", label: "דוד" },
  { value: "Frank Ruhl Libre", label: "פרנק רוהל" },
  { value: "Heebo", label: "היבו" },
  { value: "Assistant", label: "אסיסטנט" },
  { value: "Rubik", label: "רוביק" },
];

const FONT_SIZES = [
  { value: "10px", label: "10" },
  { value: "12px", label: "12" },
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "20px", label: "20" },
  { value: "24px", label: "24" },
  { value: "28px", label: "28" },
  { value: "32px", label: "32" },
  { value: "36px", label: "36" },
  { value: "48px", label: "48" },
  { value: "64px", label: "64" },
];

const HIGHLIGHT_COLORS = [
  { value: "#FFEB3B", label: "צהוב" },
  { value: "#81C784", label: "ירוק" },
  { value: "#64B5F6", label: "כחול" },
  { value: "#FFB74D", label: "כתום" },
  { value: "#F48FB1", label: "ורוד" },
  { value: "#CE93D8", label: "סגול" },
];

const TEXT_COLORS = [
  { value: "#000000", label: "שחור" },
  { value: "#374151", label: "אפור כהה" },
  { value: "#6B7280", label: "אפור" },
  { value: "#EF4444", label: "אדום" },
  { value: "#F97316", label: "כתום" },
  { value: "#EAB308", label: "צהוב" },
  { value: "#22C55E", label: "ירוק" },
  { value: "#3B82F6", label: "כחול" },
  { value: "#8B5CF6", label: "סגול" },
  { value: "#EC4899", label: "ורוד" },
];

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });

const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || "";

const extractBooksStoragePath = (fileUrl: string) => {
  const m = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/books\/(.+)$/);
  if (m?.[1]) return decodeURIComponent(m[1]);

  const m2 = fileUrl.match(/\/object\/(?:public|sign)\/books\/(.+)$/);
  if (m2?.[1]) return decodeURIComponent(m2[1]);

  return null;
};

const loadArrayBufferWithFallback = async (fileUrl: string) => {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.arrayBuffer();
  } catch (e) {
    const storagePath = extractBooksStoragePath(fileUrl);
    if (!storagePath) throw e;
    const { data, error } = await supabase.storage.from("books").download(storagePath);
    if (error) throw error;
    return await data.arrayBuffer();
  }
};

const loadTextWithFallback = async (fileUrl: string) => {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } catch (e) {
    const storagePath = extractBooksStoragePath(fileUrl);
    if (!storagePath) throw e;
    const { data, error } = await supabase.storage.from("books").download(storagePath);
    if (error) throw error;
    return await data.text();
  }
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
    const arrayBuffer = await loadArrayBufferWithFallback(fileUrl);
    const mammoth = await import("mammoth");
    const result = await (mammoth as any).convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
        ],
      }
    );
    return sanitizeHtml(result.value);
  }

  if (ext === "txt") {
    const text = await loadTextWithFallback(fileUrl);
    // Convert plain text to HTML with paragraphs
    const paragraphs = text.split(/\n\n+/).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
    return paragraphs || `<p>${escapeHtml(text)}</p>`;
  }

  if (ext === "html" || ext === "htm") {
    const html = await loadTextWithFallback(fileUrl);
    return sanitizeHtml(html);
  }

  throw new Error("Unsupported document type");
};

interface RichDocumentEditorProps {
  bookId: string;
  fileUrl: string;
  fileName: string;
  title: string;
  onFileSaved: (args: { fileUrl: string; fileName: string }) => void;
  onDelete: () => void;
  onBack: () => void;
}

export const RichDocumentEditor = ({
  bookId,
  fileUrl,
  fileName,
  title,
  onFileSaved,
  onDelete,
  onBack,
}: RichDocumentEditorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "word" | "canvas">("edit");

  const [notes, setNotes] = useState<DocNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [selectionPreview, setSelectionPreview] = useState("");

  const [headings, setHeadings] = useState<DocHeading[]>([]);

  const ext = useMemo(() => getFileExtension(fileName), [fileName]);
  const isDocx = ext === "docx";
  const isWordView = isDocx && viewMode === "word";

  useEffect(() => {
    // For DOCX, default to a Word-like view (closer to the original layout).
    if (isDocx) setViewMode("word");
    else setViewMode("edit");
  }, [isDocx]);

  const notesStorageKey = useMemo(() => `document-notes-${bookId}`, [bookId]);

  // Load notes from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(notesStorageKey);
      if (raw) setNotes(JSON.parse(raw) as DocNote[]);
    } catch {
      // ignore
    }
  }, [notesStorageKey]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(notesStorageKey, JSON.stringify(notes));
  }, [notes, notesStorageKey]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setIsDirty(true);
      // Extract headings
      const html = editor.getHTML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const headingEls = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      const extracted: DocHeading[] = headingEls
        .map((h, idx) => ({
          id: `heading-${idx}`,
          text: (h.textContent || "").trim(),
          level: Number(h.tagName.slice(1)),
        }))
        .filter((h) => h.text);
      setHeadings(extracted);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        setSelectionPreview(text.slice(0, 250));
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none min-h-[500px] focus:outline-none p-4",
        dir: "auto",
      },
    },
  });

  // Load document
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const html = await loadDocumentAsHtml({ fileUrl, fileName });
        if (cancelled) return;
        editor?.commands.setContent(html);
        setIsDirty(false);
        // Initial headings extraction
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const headingEls = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
        const extracted: DocHeading[] = headingEls
          .map((h, idx) => ({
            id: `heading-${idx}`,
            text: (h.textContent || "").trim(),
            level: Number(h.tagName.slice(1)),
          }))
          .filter((h) => h.text);
        setHeadings(extracted);
      } catch (e) {
        console.error(e);
        toast.error("שגיאה בטעינת המסמך");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    if (!editor) return;
    // In Word view, we don't need to load content into the editor.
    if (isWordView) return;
    run();
    return () => {
      cancelled = true;
    };
  }, [fileUrl, fileName, editor, isWordView]);

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);

    try {
      const html = editor.getHTML();
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
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
      toast.success("המסמך נשמר בהצלחה!");
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בשמירה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = () => {
    if (!selectionPreview.trim()) {
      toast.error("בחר טקסט כדי לקשר אליו הערה");
      return;
    }
    if (!noteDraft.trim()) {
      toast.error("נא לכתוב תוכן הערה");
      return;
    }

    const newNote: DocNote = {
      id: `n-${Date.now()}`,
      selectedText: selectionPreview.slice(0, 500),
      noteText: noteDraft.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNoteDraft("");
    setSelectionPreview("");
    toast.success("הערה נוספה");
  };

  const scrollToHeading = useCallback(
    (index: number) => {
      if (!editor) return;
      const { doc } = editor.state;
      let headingCount = 0;
      let targetPos = 0;

      doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          if (headingCount === index) {
            targetPos = pos;
            return false;
          }
          headingCount++;
        }
      });

      if (targetPos > 0) {
        editor.commands.setTextSelection(targetPos);
        editor.commands.scrollIntoView();
      }
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div
      className="flex flex-col h-[calc(100vh-100px)] min-h-[600px] rounded-xl overflow-hidden shadow-xl transition-colors ring-2 ring-primary/40 bg-background"
      dir="rtl"
    >
      {/* Header */}
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
              {isDirty && (
                <Badge variant="secondary" className="text-xs">
                  לא נשמר
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {isWordView ? "תצוגת Word" : "עורך מסמכים מתקדם"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDocx && (
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "word" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("word")}
              >
                תצוגת Word
              </Button>
              <Button
                variant={viewMode === "canvas" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("canvas")}
              >
                עריכת Word (Canvas)
              </Button>
              <Button
                variant={viewMode === "edit" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("edit")}
              >
                עריכה רגילה
              </Button>
            </div>
          )}
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {viewMode === "edit" && (
        <div className="border-b bg-card p-2 flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="בטל"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="חזור"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Font Family */}
        <Select
          value={editor.getAttributes("textStyle").fontFamily || ""}
          onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
        >
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue placeholder="גופן" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((font) => (
              <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select
          value={editor.getAttributes("textStyle").fontSize || ""}
          onValueChange={(value) => (editor.chain().focus() as any).setFontSize(value).run()}
        >
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue placeholder="גודל" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="כותרת 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="כותרת 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="כותרת 3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="מודגש"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="נטוי"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="קו תחתון"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="קו חוצה"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="צבע טקסט">
              <Type className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().setColor(color.value).run()}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={editor.isActive("highlight") ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title="הדגשה"
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-3 gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
                  title={color.label}
                />
              ))}
              <button
                className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform flex items-center justify-center text-xs"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                title="הסר הדגשה"
              >
                ✕
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <Button
          variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="יישור לימין"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="יישור למרכז"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="יישור לשמאל"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="יישור לשני הצדדים"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="רשימה"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="רשימה ממוספרת"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Block elements */}
        <Button
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="ציטוט"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="קו מפריד"
        >
          <Minus className="w-4 h-4" />
        </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[320px] border-l bg-card">
          <Tabs defaultValue="index" className="h-full flex flex-col">
            <div className="p-3 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="index" className="gap-2">
                  <List className="w-4 h-4" />
                  אינדקס
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <MessageSquarePlus className="w-4 h-4" />
                  הערות וסימניות
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="index" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-3">
                {headings.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    אין כותרות לאינדקס. הוסף כותרות (H1-H3) כדי ליצור תוכן עניינים.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {headings.map((h, idx) => (
                      <button
                        key={`${h.id}-${idx}`}
                        className="w-full text-right text-sm px-2 py-1 rounded hover:bg-muted transition-colors truncate"
                        style={{ paddingRight: `${8 + (h.level - 1) * 12}px` }}
                        onClick={() => scrollToHeading(idx)}
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
                      readOnly
                      placeholder="הטקסט הנבחר יופיע כאן..."
                      className="text-sm"
                    />
                    <Textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="כתוב הערה..."
                      rows={3}
                    />
                    <Button size="sm" onClick={handleAddNote} className="w-full gap-2">
                      <MessageSquarePlus className="w-4 h-4" />
                      הוסף הערה
                    </Button>
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
                            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                              "{n.selectedText.slice(0, 100)}
                              {n.selectedText.length > 100 ? "…" : ""}"
                            </div>
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

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {viewMode === "word" ? (
            <>
              <div className="bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs py-1.5 px-3 text-center border-b border-blue-100 dark:border-blue-800/30 backdrop-blur-sm">
                מצב צפייה (Word). לעריכה, סימון, בולד והוספת הערות - עבור למצב "עריכה" בכפתור למעלה.
              </div>
              <DocxWordView fileUrl={fileUrl} />
            </>
          ) : viewMode === "canvas" ? (
            <CanvasDocumentEditor fileUrl={fileUrl} />
          ) : (
            <div className="flex-1 bg-muted/30 overflow-auto">
              {isLoading ? (
                <div className="h-full flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>טוען מסמך...</span>
                </div>
              ) : (
                <div className="p-4">
                  <Card className="bg-white dark:bg-zinc-900 shadow-lg min-h-[600px]">
                    <EditorContent editor={editor} />
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
