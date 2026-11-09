// Shared merge logic. Must stay free of Node built-ins: the browser entry imports it.
import { PDFDocument } from "pdf-lib";

/**
 * A PDF input:
 * - raw bytes (`Uint8Array` / `Buffer` / `ArrayBuffer`)
 * - a `Blob` / `File` (e.g. from `<input type="file">`)
 * - a `URL`, or a string starting with `http:`, `https:`, `blob:` or `data:` (fetched)
 * - Node only: any other string or a `file:` URL, read as a local file
 */
export type PdfSource = Uint8Array | ArrayBuffer | Blob | URL | string;

type Bytes = Uint8Array | ArrayBuffer;

/** Reads a local file. Only the Node entry provides one. */
export type LocalFileReader = (path: string | URL) => Promise<Bytes>;

const isFetchableString = (s: string) => /^(https?|blob|data):/i.test(s);

async function download(url: string | URL): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  return res.arrayBuffer();
}

async function toBytes(source: PdfSource, readLocalFile?: LocalFileReader): Promise<Bytes> {
  if (source instanceof Uint8Array || source instanceof ArrayBuffer) return source;
  if (source instanceof Blob) return source.arrayBuffer();
  const fetchable = source instanceof URL ? source.protocol !== "file:" : isFetchableString(source);
  if (fetchable) return download(source);
  if (!readLocalFile) {
    throw new Error(`Local file paths are not supported in the browser, pass a File or Blob instead: ${source}`);
  }
  return readLocalFile(source);
}

/**
 * Merges the given PDFs into a single document, keeping the input order.
 * Sources are loaded in parallel. Fails as a whole if any source can't be read or parsed.
 */
export async function mergeSources(sources: PdfSource[], readLocalFile?: LocalFileReader): Promise<Uint8Array> {
  const inputs = await Promise.all(sources.map((s) => toBytes(s, readLocalFile)));
  const merged = await PDFDocument.create();
  for (const bytes of inputs) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}
