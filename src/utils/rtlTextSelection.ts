/**
 * RTL-aware text selection utility
 * Fixes the issue where getSelection().toString() returns reversed Hebrew text
 * from PDF.js rendered content
 */

interface TextRect {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get the selected text with proper RTL order
 * This fixes the issue where window.getSelection().toString() 
 * returns Hebrew text in reversed order from PDF content
 */
export function getRTLSelectedText(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();
  
  if (rects.length === 0) {
    // Fallback to regular selection
    return selection.toString().trim();
  }

  // Collect text nodes within the selection
  const textNodes: TextRect[] = [];
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        
        // Check if this text node is within the selection
        if (
          range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
          range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const nodeRange = document.createRange();
    
    // Get the actual selected portion of this text node
    nodeRange.selectNodeContents(textNode);
    
    // Adjust start if this is the start container
    if (textNode === range.startContainer) {
      nodeRange.setStart(textNode, range.startOffset);
    }
    // Adjust end if this is the end container
    if (textNode === range.endContainer) {
      nodeRange.setEnd(textNode, range.endOffset);
    }

    const nodeRects = nodeRange.getClientRects();
    if (nodeRects.length > 0) {
      const rect = nodeRects[0];
      textNodes.push({
        text: nodeRange.toString(),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      });
    }
  }

  if (textNodes.length === 0) {
    return selection.toString().trim();
  }

  // Sort by Y position (top to bottom), then by X position (right to left for RTL)
  const lineHeight = textNodes[0]?.height || 20;
  textNodes.sort((a, b) => {
    // Group into lines (same Y with some tolerance)
    const lineDiff = Math.abs(a.y - b.y);
    if (lineDiff < lineHeight * 0.5) {
      // Same line - sort right to left (RTL)
      return b.x - a.x;
    }
    // Different lines - sort top to bottom
    return a.y - b.y;
  });

  // Build the final text
  const result = textNodes.map(n => n.text).join("");
  return result.trim();
}

/**
 * Simple check if text appears to be RTL (Hebrew/Arabic)
 */
export function isRTLText(text: string): boolean {
  // Hebrew: \u0590-\u05FF, Arabic: \u0600-\u06FF
  const rtlPattern = /[\u0590-\u05FF\u0600-\u06FF]/;
  return rtlPattern.test(text);
}

/**
 * Normalize RTL text for display
 * Ensures proper unicode-bidi handling
 */
export function normalizeRTLText(text: string): string {
  if (!text) return "";
  
  // Remove any existing unicode control characters
  const cleaned = text.replace(/[\u200E\u200F\u202A-\u202E]/g, "");
  
  // If it contains RTL characters, wrap with RLE (Right-to-Left Embedding)
  if (isRTLText(cleaned)) {
    return `\u202B${cleaned}\u202C`; // RLE + text + PDF (Pop Directional Formatting)
  }
  
  return cleaned;
}
