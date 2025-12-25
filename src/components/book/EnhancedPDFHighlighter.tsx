import React, { useState, useRef, useEffect } from 'react';
import { Upload, Highlighter, MessageSquare, Trash2, Download, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Highlight {
  id: number;
  text: string;
  color: string;
  page: number;
  timestamp: string;
  noteId?: number;
}

interface Note {
  id: number;
  text: string;
  note: string;
  page: number;
  timestamp: string;
}

interface SelectedText {
  text: string;
  page: number;
}

const EnhancedPDFHighlighter = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedColor, setSelectedColor] = useState('#FFFF00');
  const [scale, setScale] = useState(1.5);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedText, setSelectedText] = useState<SelectedText | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const { toast } = useToast();

  const colors = [
    { name: 'צהוב', value: '#FFFF00' },
    { name: 'ירוק', value: '#90EE90' },
    { name: 'כחול', value: '#ADD8E6' },
    { name: 'ורוד', value: '#FFB6C1' },
    { name: 'כתום', value: '#FFD580' }
  ];

  useEffect(() => {
    loadPDFJS();
  }, []);

  useEffect(() => {
    if (pdfData && (window as any).pdfjsLib) {
      renderPage(currentPage);
    }
  }, [pdfData, currentPage, scale, highlights]);

  const loadPDFJS = () => {
    if (!(window as any).pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const arrayBuffer = await file.arrayBuffer();
      setPdfData(arrayBuffer);
      await loadPDF(arrayBuffer);
      toast({
        title: "קובץ הועלה בהצלחה",
        description: `${file.name} נטען`,
      });
    }
  };

  const loadPDF = async (data: ArrayBuffer) => {
    const pdfjsLib = (window as any).pdfjsLib;
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    pdfDocRef.current = pdf;
    setTotalPages(pdf.numPages);
    setCurrentPage(1);
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDocRef.current) return;

    const page = await pdfDocRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const textContent = await page.getTextContent();
    renderTextLayer(textContent, viewport);
    renderHighlights(pageNum);
  };

  const renderTextLayer = (textContent: any, viewport: any) => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;
    
    textLayer.innerHTML = '';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    const pdfjsLib = (window as any).pdfjsLib;
    
    textContent.items.forEach((item: any) => {
      const div = document.createElement('div');
      div.textContent = item.str;
      div.className = 'pdf-text-item';
      
      const transform = pdfjsLib.Util.transform(
        viewport.transform,
        item.transform
      );
      
      const angle = Math.atan2(transform[1], transform[0]);
      const fontHeight = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
      
      div.style.left = `${transform[4]}px`;
      div.style.top = `${transform[5]}px`;
      div.style.fontSize = `${fontHeight}px`;
      div.style.fontFamily = item.fontName;
      div.style.transform = `rotate(${angle}rad)`;
      div.style.transformOrigin = '0 0';

      textLayer.appendChild(div);
    });
  };

  const renderHighlights = (pageNum: number) => {
    const pageHighlights = highlights.filter(h => h.page === pageNum);
    const textLayer = textLayerRef.current;
    if (!textLayer) return;
    
    const textItems = textLayer.querySelectorAll('.pdf-text-item');
    textItems.forEach((item: any) => {
      item.style.backgroundColor = 'transparent';
    });

    pageHighlights.forEach(highlight => {
      textItems.forEach((item: any) => {
        if (item.textContent.includes(highlight.text)) {
          item.style.backgroundColor = highlight.color;
          item.style.cursor = 'pointer';
          item.onclick = () => showHighlightNote(highlight);
        }
      });
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText({
        text,
        page: currentPage
      });
    }
  };

  const addHighlight = () => {
    if (!selectedText) return;

    const newHighlight: Highlight = {
      id: Date.now(),
      text: selectedText.text,
      color: selectedColor,
      page: currentPage,
      timestamp: new Date().toISOString()
    };

    setHighlights([...highlights, newHighlight]);
    window.getSelection()?.removeAllRanges();
    setSelectedText(null);
    
    toast({
      title: "הדגשה נוספה",
      description: `"${selectedText.text.substring(0, 30)}..." הודגש בהצלחה`,
    });
  };

  const addNote = () => {
    if (!selectedText || !currentNote.trim()) return;

    const newNote: Note = {
      id: Date.now(),
      text: selectedText.text,
      note: currentNote,
      page: currentPage,
      timestamp: new Date().toISOString()
    };

    setNotes([...notes, newNote]);
    
    const newHighlight: Highlight = {
      id: Date.now() + 1,
      text: selectedText.text,
      color: '#FFE4B5',
      page: currentPage,
      timestamp: new Date().toISOString(),
      noteId: newNote.id
    };
    
    setHighlights([...highlights, newHighlight]);
    
    setCurrentNote('');
    setShowNoteModal(false);
    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
    
    toast({
      title: "הערה נוספה",
      description: "ההערה נשמרה בהצלחה",
    });
  };

  const showHighlightNote = (highlight: Highlight) => {
    const relatedNote = notes.find(n => n.id === highlight.noteId);
    if (relatedNote) {
      toast({
        title: "הערה",
        description: relatedNote.note,
        duration: 5000,
      });
    }
  };

  const deleteHighlight = (id: number) => {
    setHighlights(highlights.filter(h => h.id !== id));
    toast({
      title: "הדגשה נמחקה",
      variant: "destructive",
    });
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
    setHighlights(highlights.filter(h => h.noteId !== id));
    toast({
      title: "הערה נמחקה",
      variant: "destructive",
    });
  };

  const exportData = () => {
    const data = {
      highlights,
      notes,
      pdfName: pdfFile?.name
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlights-and-notes.json';
    a.click();
    
    toast({
      title: "הייצוא הושלם",
      description: "הקובץ הורד בהצלחה",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-4" dir="rtl">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            מערכת הדגשת PDF מתקדמת
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pdfFile ? (
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <Button className="gap-2">
                  <Upload size={20} />
                  <span>העלה קובץ PDF</span>
                </Button>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{pdfFile.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                  title="הקטן"
                >
                  <ZoomOut size={20} />
                </Button>
                <span className="font-semibold text-sm">{Math.round(scale * 100)}%</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScale(Math.min(3, scale + 0.25))}
                  title="הגדל"
                >
                  <ZoomIn size={20} />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  הקודם
                </Button>
                <span className="text-sm font-semibold">
                  עמוד {currentPage} מתוך {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  הבא
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {pdfFile && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Color Picker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Highlighter size={18} />
                  בחר צבע הדגשה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {colors.map(color => (
                  <Button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-full justify-center ${
                      selectedColor === color.value ? 'ring-2 ring-primary' : ''
                    }`}
                    variant={selectedColor === color.value ? 'default' : 'outline'}
                    style={{ backgroundColor: selectedColor === color.value ? color.value : 'transparent' }}
                  >
                    <span className="font-semibold text-gray-800">{color.name}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            {selectedText && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">טקסט נבחר</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground p-2 bg-secondary rounded">
                    {selectedText.text.substring(0, 50)}...
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={addHighlight}
                      className="w-full gap-2"
                      variant="default"
                    >
                      <Highlighter size={18} />
                      הדגש
                    </Button>
                    <Button
                      onClick={() => setShowNoteModal(true)}
                      className="w-full gap-2"
                      variant="secondary"
                    >
                      <MessageSquare size={18} />
                      הוסף הערה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export */}
            {(highlights.length > 0 || notes.length > 0) && (
              <Button
                onClick={exportData}
                className="w-full gap-2"
                variant="default"
              >
                <Download size={18} />
                ייצא הדגשות והערות
              </Button>
            )}

            {/* Highlights List */}
            {highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    ההדגשות שלי ({highlights.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {highlights.map(h => (
                        <div
                          key={h.id}
                          className="p-2 rounded border cursor-pointer hover:bg-secondary"
                          onClick={() => setCurrentPage(h.page)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div
                                className="text-sm p-1 rounded"
                                style={{ backgroundColor: h.color }}
                              >
                                {h.text.substring(0, 40)}...
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                עמוד {h.page}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHighlight(h.id);
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Notes List */}
            {notes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    ההערות שלי ({notes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {notes.map(n => (
                        <div
                          key={n.id}
                          className="p-3 rounded border bg-yellow-50 cursor-pointer hover:bg-yellow-100"
                          onClick={() => setCurrentPage(n.page)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-semibold">
                                {n.note}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                "{n.text.substring(0, 30)}..." - עמוד {n.page}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(n.id);
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div
                  className="relative mx-auto"
                  style={{ width: 'fit-content' }}
                  onMouseUp={handleTextSelection}
                >
                  <canvas
                    ref={canvasRef}
                    className="border shadow-lg"
                  />
                  <div
                    ref={textLayerRef}
                    className="absolute top-0 left-0 overflow-hidden"
                    style={{
                      pointerEvents: 'auto',
                      userSelect: 'text'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף הערה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded text-sm">
              {selectedText?.text.substring(0, 100)}...
            </div>
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="כתוב את ההערה שלך כאן..."
              className="resize-none"
              rows={4}
              dir="rtl"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={addNote}
              disabled={!currentNote.trim()}
            >
              שמור הערה
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteModal(false);
                setCurrentNote('');
              }}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .pdf-text-item {
          position: absolute;
          white-space: pre;
          user-select: text;
          cursor: text;
          transition: background-color 0.2s;
        }
        .pdf-text-item::selection {
          background: rgba(0, 123, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default EnhancedPDFHighlighter;
