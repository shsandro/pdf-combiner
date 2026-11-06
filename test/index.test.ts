import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { mergePdfs, mergePdfsToFile } from "../src/index.ts";

async function makePdf(pageCount: number, width: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([width, 100]);
  return doc.save();
}

const pageWidths = async (bytes: Uint8Array) =>
  (await PDFDocument.load(bytes)).getPages().map((p) => p.getWidth());

test("merges byte sources in order", async () => {
  const merged = await mergePdfs([await makePdf(2, 100), await makePdf(1, 200)]);
  assert.deepEqual(await pageWidths(merged), [100, 100, 200]);
});

test("reads file paths and writes the output file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pdf-combiner-"));
  const a = join(dir, "a.pdf");
  const out = join(dir, "out.pdf");
  await writeFile(a, await makePdf(1, 300));
  await mergePdfsToFile([a, (await makePdf(1, 400)).buffer as ArrayBuffer], out);
  assert.deepEqual(await pageWidths(await readFile(out)), [300, 400]);
});

test("rejects when a source is not a PDF", async () => {
  await assert.rejects(mergePdfs([new TextEncoder().encode("not a pdf")]));
});
