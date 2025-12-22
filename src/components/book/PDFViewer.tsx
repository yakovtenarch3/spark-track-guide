import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronLeft, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  ExternalLink,
  Trash2
} from "lucide-react";

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDelete: () => void;
}

export const PDFViewer = ({ 
  fileUrl, 
  fileName, 
  currentPage, 
  onPageChange,
  onDelete 
}: PDFViewerProps) => {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  // For PDF.js or iframe display
  const pdfUrlWithPage = `${fileUrl}#page=${currentPage}`;

  return (
    <Card className="p-4 royal-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate max-w-[200px]">{fileName}</h3>
          <Badge variant="outline">עמוד {currentPage}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div 
        className="bg-muted/50 rounded-lg overflow-hidden"
        style={{ height: '60vh' }}
      >
        <iframe
          src={pdfUrlWithPage}
          className="w-full h-full border-0"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          title={fileName}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          הקודם
        </Button>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page > 0) onPageChange(page);
            }}
            className="w-16 text-center p-1 border rounded"
            min={1}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          className="gap-2"
        >
          הבא
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
