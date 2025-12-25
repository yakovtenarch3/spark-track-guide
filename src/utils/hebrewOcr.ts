import { createWorker, type Worker, type PSM } from "tesseract.js";

export type OcrWordBox = {
  text: string;
  // Coordinates are in pixels relative to the source image.
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  confidence?: number;
};

export type OcrPageResult = {
  text: string;
  words: OcrWordBox[];
};

let sharedWorker: Worker | null = null;
let sharedWorkerLang: string | null = null;

async function getWorker(lang: string) {
  if (sharedWorker && sharedWorkerLang === lang) return sharedWorker;

  if (sharedWorker) {
    try {
      await sharedWorker.terminate();
    } catch {
      // ignore
    }
  }

  const worker = await createWorker(lang, 1, {
    logger: () => {
      // keep quiet; UI handles progress separately
    },
  });

  sharedWorker = worker;
  sharedWorkerLang = lang;
  return worker;
}

export async function runHebrewOcrOnCanvas(options: {
  canvas: HTMLCanvasElement;
  lang?: "heb" | "heb+eng";
  // Page segmentation mode. 6: Assume a single uniform block of text.
  psm?: number;
}): Promise<OcrPageResult> {
  const { canvas, lang = "heb", psm = 6 } = options;

  const worker = await getWorker(lang);

  // Tesseract.js is sensitive to input quality; use PNG.
  const dataUrl = canvas.toDataURL("image/png");

  // Hebrew works better when we avoid aggressive layout assumptions.
  await worker.setParameters({
    tessedit_pageseg_mode: String(psm),
    preserve_interword_spaces: "1",
  } as any);

  const result = await worker.recognize(dataUrl, {}, {
    // Use a CDN for traineddata so we don't ship huge files.
    // If you want fully offline, we can host tessdata in /public.
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
  } as any);

  const data = result.data as unknown as {
    text?: string;
    words?: Array<{
      text?: string;
      bbox?: { x0?: number; y0?: number; x1?: number; y1?: number };
      confidence?: number;
    }>;
  };

  const words: OcrWordBox[] = (data.words || [])
    .filter((w: any) => typeof w.text === "string" && w.text.trim().length > 0)
    .map((w: any) => ({
      text: String(w.text ?? "").trim(),
      x0: Number(w.bbox?.x0 ?? 0),
      y0: Number(w.bbox?.y0 ?? 0),
      x1: Number(w.bbox?.x1 ?? 0),
      y1: Number(w.bbox?.y1 ?? 0),
      confidence: typeof w.confidence === "number" ? w.confidence : undefined,
    }));

  return {
    text: data.text ?? "",
    words,
  };
}
