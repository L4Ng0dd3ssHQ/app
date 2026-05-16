export type ParseResult = {
  text: string;
  chars: number;
  format: "pdf" | "docx" | "txt" | "md";
  filename: string;
};

export class ParseError extends Error {
  constructor(message: string, public reason: string) {
    super(message);
    this.name = "ParseError";
  }
}

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_TEXT_CHARS = 50;

function detectFormat(file: File): ParseResult["format"] | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (file.type === "text/markdown") return "md";
  if (file.type === "text/plain") return "txt";
  return null;
}

async function parsePDF(file: File): Promise<string> {
  const { default: pdfjs } = await import("./lib/pdfWorker");
  const buf = await file.arrayBuffer();
  let doc;

  try {
    doc = await pdfjs.getDocument({ data: buf }).promise;
  } catch (e: unknown) {
    if (e && typeof e === "object" && "name" in e && e.name === "PasswordException") {
      throw new ParseError("This PDF is password-protected. Please remove the password and try again.", "encrypted");
    }
    throw new ParseError("Couldn't read this PDF. Try saving it as a new PDF or paste the text below.", "pdf_load_failed");
  }

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    type PdfTextItem = { str: string; x: number; y: number };
    const items: PdfTextItem[] = content.items
      .flatMap((it) => {
        if (!("str" in it) || typeof it.str !== "string" || !it.str.trim()) return [];
        const transform = "transform" in it && Array.isArray(it.transform) ? it.transform : [0, 0, 0, 0, 0, 0];
        return [{
          str: String(it.str).trim(),
          x: Number(transform[4] || 0),
          y: Number(transform[5] || 0),
        }];
      })
      .sort((a, b) => (Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x));

    const rows: Array<{ y: number; items: PdfTextItem[] }> = [];
    items.forEach((item) => {
      const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2);
      if (row) row.items.push(item);
      else rows.push({ y: item.y, items: [item] });
    });

    const pageText = rows
      .map((row) =>
        row.items
          .sort((a, b) => a.x - b.x)
          .map((item) => item.str)
          .join(" ")
          .replace(/\s+([,.;:])/g, "$1")
          .replace(/•\s+/g, "• ")
          .trim(),
      )
      .filter(Boolean)
      .join("\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
    parts.push(pageText);
  }

  return parts.join("\n\n").trim();
}

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();

  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return (result.value || "").trim();
  } catch {
    throw new ParseError("Couldn't read this DOCX. Try saving it as PDF or paste the text below.", "docx_failed");
  }
}

async function parseText(file: File): Promise<string> {
  return (await file.text()).trim();
}

export async function parseResumeFile(file: File): Promise<ParseResult> {
  if (file.size > MAX_BYTES) {
    throw new ParseError("File is too large (max 5 MB).", "too_large");
  }

  const format = detectFormat(file);
  if (!format) {
    throw new ParseError("Unsupported file type. Use PDF, DOCX, TXT, or MD.", "unsupported_format");
  }

  let text = "";
  if (format === "pdf") text = await parsePDF(file);
  else if (format === "docx") text = await parseDOCX(file);
  else text = await parseText(file);

  if (!text || text.length < MIN_TEXT_CHARS) {
    throw new ParseError(
      "Couldn't extract text - this looks like an image-only PDF or a scan. Paste the text manually below.",
      "no_text_extracted",
    );
  }

  return { text, chars: text.length, format, filename: file.name };
}
