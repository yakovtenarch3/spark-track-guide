import React, { useState, useRef, useEffect } from 'react';
import { Upload, Highlighter, MessageSquare, Trash2, Download, ZoomIn, ZoomOut } from 'lucide-react';

const PDFHighlighter = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#FFFF00');
  const [scale, setScale] = useState(1.5);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedText, setSelectedText] = useState(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const pdfDocRef = useRef(null);

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
    if (pdfData && window.pdfjsLib) {
      renderPage(currentPage);
    }
  }, [pdfData, currentPage, scale, highlights]);

  const loadPDFJS = () => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const arrayBuffer = await file.arrayBuffer();
      setPdfData(arrayBuffer);
      loadPDF(arrayBuffer);
    }
  };

  const loadPDF = async (data) => {
    const loadingTask = window.pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    pdfDocRef.current = pdf;
    setTotalPages(pdf.numPages);
    setCurrentPage(1);
  };

  const renderPage = async (pageNum) => {
    if (!pdfDocRef.current) return;

    const page = await pdfDocRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
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

  const renderTextLayer = (textContent, viewport) => {
    const textLayer = textLayerRef.current;
    textLayer.innerHTML = '';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    textContent.items.forEach((item) => {
      const div = document.createElement('div');
      div.textContent = item.str;
      div.className = 'pdf-text-item';
      
      const transform = window.pdfjsLib.Util.transform(
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

  const renderHighlights = (pageNum) => {
    const pageHighlights = highlights.filter(h => h.page === pageNum);
    const textLayer = textLayerRef.current;
    
    const textItems = textLayer.querySelectorAll('.pdf-text-item');
    textItems.forEach(item => {
      item.style.backgroundColor = 'transparent';
    });

    pageHighlights.forEach(highlight => {
      textItems.forEach(item => {
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
    const text = selection.toString().trim();
    
    if (text.length > 0) {
      setSelectedText({
        text,
        page: currentPage
      });
    }
  };

  const addHighlight = () => {
    if (!selectedText) return;

    const newHighlight = {
      id: Date.now(),
      text: selectedText.text,
      color: selectedColor,
      page: currentPage,
      timestamp: new Date().toISOString()
    };

    setHighlights([...highlights, newHighlight]);
    window.getSelection().removeAllRanges();
    setSelectedText(null);
  };

  const addNote = () => {
    if (!selectedText || !currentNote.trim()) return;

    const newNote = {
      id: Date.now(),
      text: selectedText.text,
      note: currentNote,
      page: currentPage,
      timestamp: new Date().toISOString()
    };

    setNotes([...notes, newNote]);
    
    const newHighlight = {
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
    window.getSelection().removeAllRanges();
  };

  const showHighlightNote = (highlight) => {
    const relatedNote = notes.find(n => n.id === highlight.noteId);
    if (relatedNote) {
      alert(`הערה: ${relatedNote.note}`);
    }
  };

  const deleteHighlight = (id) => {
    setHighlights(highlights.filter(h => h.id !== id));
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
    setHighlights(highlights.filter(h => h.noteId !== id));
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-indigo-900 text-center mb-4">
            מערכת הדגשת PDF מתקדמת
          </h1>
          
          {!pdfFile ? (
            <div className="flex justify-center">
              <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors shadow-md">
                <Upload size={20} />
                <span className="font-semibold">העלה קובץ PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="text-gray-700 font-medium">
                📄 {pdfFile.name}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  title="הקטן"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="font-semibold">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => setScale(Math.min(3, scale + 0.25))}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  title="הגדל"
                >
                  <ZoomIn size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  הקודם
                </button>
                <span className="font-semibold">
                  עמוד {currentPage} מתוך {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {pdfFile && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Color Picker */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
                  <Highlighter size={20} className="text-indigo-600" />
                  בחר צבע הדגשה
                </h3>
                <div className="space-y-2">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all ${
                        selectedColor === color.value 
                          ? 'border-indigo-600 scale-105' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      <span className="font-semibold text-gray-800">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedText && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">
                    טקסט נבחר
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                    {selectedText.text.substring(0, 50)}...
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={addHighlight}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Highlighter size={18} />
                      הדגש
                    </button>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <MessageSquare size={18} />
                      הוסף הערה
                    </button>
                  </div>
                </div>
              )}

              {/* Export */}
              {(highlights.length > 0 || notes.length > 0) && (
                <button
                  onClick={exportData}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors shadow-md"
                >
                  <Download size={18} />
                  ייצא הדגשות והערות
                </button>
              )}

              {/* Highlights List */}
              {highlights.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">
                    ההדגשות שלי ({highlights.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {highlights.map(h => (
                      <div
                        key={h.id}
                        className="p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50"
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
                            <div className="text-xs text-gray-500 mt-1">
                              עמוד {h.page}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHighlight(h.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes List */}
              {notes.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">
                    ההערות שלי ({notes.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notes.map(n => (
                      <div
                        key={n.id}
                        className="p-3 rounded border border-gray-200 bg-yellow-50 cursor-pointer hover:bg-yellow-100"
                        onClick={() => setCurrentPage(n.page)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-700">
                              {n.note}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              "{n.text.substring(0, 30)}..." - עמוד {n.page}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(n.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PDF Viewer */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-2xl p-6">
                <div
                  className="relative mx-auto"
                  style={{ width: 'fit-content' }}
                  onMouseUp={handleTextSelection}
                >
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 shadow-inner"
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">הוסף הערה</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
              {selectedText?.text.substring(0, 100)}...
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="כתוב את ההערה שלך כאן..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none"
              rows="4"
              dir="rtl"
            />
            <div className="flex gap-2">
              <button
                onClick={addNote}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                שמור הערה
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setCurrentNote('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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

export default PDFHighlighter;