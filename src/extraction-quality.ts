import type { ExtractionQualityReport, PdfPageText } from "./types";

const SHORT_PAGE_CHARS = 80;

function ratio(count: number, total: number): number {
  return total > 0 ? count / total : 0;
}

export function assessExtractionQuality(pages: PdfPageText[]): ExtractionQualityReport {
  const normalizedPages = Array.isArray(pages) ? pages : [];
  const pageCount = normalizedPages.length;
  const pageTexts = normalizedPages.map((page) => String(page?.text || "").trim());
  const extractedChars = pageTexts.reduce((sum, text) => sum + text.length, 0);
  const emptyPages = pageTexts.filter((text) => !text).length;
  const shortPages = pageTexts.filter((text) => text.length < SHORT_PAGE_CHARS).length;
  const replacementChars = pageTexts.reduce((sum, text) => {
    const replacementCount = text.match(/\uFFFD/g)?.length || 0;
    const controlCount = text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g)?.length || 0;
    return sum + replacementCount + controlCount;
  }, 0);
  const emptyPageRatio = ratio(emptyPages, pageCount);
  const shortPageRatio = ratio(shortPages, pageCount);
  const replacementCharRatio = ratio(replacementChars, extractedChars);
  const averageChars = ratio(extractedChars, pageCount);

  let quality: ExtractionQualityReport["quality"] = "good";
  if (
    pageCount === 0 ||
    extractedChars < Math.max(200, pageCount * 40) ||
    emptyPageRatio >= 0.5 ||
    shortPageRatio >= 0.75 ||
    replacementCharRatio >= 0.02
  ) {
    quality = "poor";
  } else if (
    emptyPageRatio >= 0.2 ||
    shortPageRatio >= 0.4 ||
    replacementCharRatio >= 0.005 ||
    averageChars < 300
  ) {
    quality = "mixed";
  }

  return {
    pageCount,
    extractedChars,
    emptyPageRatio,
    replacementCharRatio,
    shortPageRatio,
    quality,
  };
}
