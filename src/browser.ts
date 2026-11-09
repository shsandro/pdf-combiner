// Browser entry: no Node built-ins. Local paths are rejected; pass File/Blob objects instead.
import { mergeSources, type PdfSource } from "./merge.ts";

export type { PdfSource };

/**
 * Merges the given PDFs into a single document, keeping the input order.
 * Accepts bytes, `File`/`Blob`, and fetchable URLs (subject to CORS).
 */
export function mergePdfs(sources: PdfSource[]): Promise<Uint8Array> {
  return mergeSources(sources);
}

/** Merges the given PDFs and returns an `application/pdf` Blob, ready for `URL.createObjectURL`. */
export async function mergePdfsToBlob(sources: PdfSource[]): Promise<Blob> {
  return new Blob([(await mergePdfs(sources)) as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
}
