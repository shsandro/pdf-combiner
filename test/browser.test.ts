// Exercises the browser entry. Runs under Node, using only APIs browsers also have (File, Blob, fetch).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import { mergePdfs, mergePdfsToBlob } from "../src/browser.ts";

async function makePdf(pageCount: number, width: number): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([width, 100]);
  return (await doc.save()) as Uint8Array<ArrayBuffer>;
}

const pageWidths = async (bytes: Uint8Array | ArrayBuffer) =>
  (await PDFDocument.load(bytes)).getPages().map((p) => p.getWidth());

test("merges File and Blob sources in order", async () => {
  const file = new File([await makePdf(2, 100)], "a.pdf", { type: "application/pdf" });
  const blob = new Blob([await makePdf(1, 200)]);
  assert.deepEqual(await pageWidths(await mergePdfs([file, blob])), [100, 100, 200]);
});

test("rejects local file paths with a clear error", async () => {
  await assert.rejects(mergePdfs(["./a.pdf"]), /not supported in the browser/);
  await assert.rejects(mergePdfs([new URL("file:///tmp/a.pdf")]), /not supported in the browser/);
});

test("downloads URL sources, and fails on non-2xx responses", async () => {
  const pdf = await makePdf(1, 300);
  const server = createServer((req, res) => {
    if (req.url === "/a.pdf") res.end(pdf);
    else res.writeHead(404).end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const merged = await mergePdfs([`${base}/a.pdf`, new URL(`${base}/a.pdf`)]);
    assert.deepEqual(await pageWidths(merged), [300, 300]);
    await assert.rejects(mergePdfs([`${base}/missing.pdf`]), /Download failed \(404\)/);
  } finally {
    server.close();
  }
});

test("mergePdfsToBlob returns an application/pdf Blob", async () => {
  const blob = await mergePdfsToBlob([await makePdf(1, 400)]);
  assert.equal(blob.type, "application/pdf");
  assert.deepEqual(await pageWidths(await blob.arrayBuffer()), [400]);
});

test("browser entry does not import Node built-ins", async () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), "../src");
  const seen = new Set<string>();
  const visit = async (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const code = await readFile(join(srcDir, file), "utf8");
    for (const [, spec] of code.matchAll(/from\s+["']([^"']+)["']/g)) {
      assert.ok(!spec.startsWith("node:"), `${file} imports ${spec}`);
      if (spec.startsWith("./")) await visit(spec.slice(2));
    }
  };
  await visit("browser.ts");
  assert.ok(seen.has("merge.ts"));
});
