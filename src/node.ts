// Node entry: adds local file paths (and file: URLs) plus writing the result to disk.
import { readFile, writeFile } from "node:fs/promises";
import { mergeSources, type PdfSource } from "./merge.ts";

export type { PdfSource };

/**
 * Merges the given PDFs into a single document, keeping the input order.
 * Sources are loaded in parallel. Fails as a whole if any source can't be read or parsed.
 */
export function mergePdfs(sources: PdfSource[]): Promise<Uint8Array> {
  return mergeSources(sources, readFile);
}

/** Merges the given PDFs and writes the result to `outputPath`. */
export async function mergePdfsToFile(sources: PdfSource[], outputPath: string): Promise<void> {
  await writeFile(outputPath, await mergePdfs(sources));
}
