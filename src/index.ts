import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

/**
 * A PDF input:
 * - raw bytes (`Uint8Array` / `Buffer` / `ArrayBuffer`)
 * - a `URL` or a string starting with `http://` / `https://` (fetched)
 * - any other string, treated as a local file path
 */
export type PdfSource = Uint8Array | ArrayBuffer | URL | string;

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);

async function toBytes(source: PdfSource): Promise<Uint8Array | ArrayBuffer> {
  if (source instanceof Uint8Array || source instanceof ArrayBuffer) return source;
  if (source instanceof URL || isHttpUrl(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${source}`);
    return res.arrayBuffer();
  }
  return readFile(source);
}

/**
 * Merges the given PDFs into a single document, keeping the input order.
 * Sources are loaded in parallel. Fails as a whole if any source can't be read or parsed.
 */
export async function mergePdfs(sources: PdfSource[]): Promise<Uint8Array> {
  const inputs = await Promise.all(sources.map(toBytes));
  const merged = await PDFDocument.create();
  for (const bytes of inputs) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

/** Merges the given PDFs and writes the result to `outputPath`. */
export async function mergePdfsToFile(sources: PdfSource[], outputPath: string): Promise<void> {
  await writeFile(outputPath, await mergePdfs(sources));
}
