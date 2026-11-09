# pdf-combiner

Merge several PDFs into a single PDF, keeping the input order. Built on [pdf-lib](https://pdf-lib.js.org/).

Extracted from the "Combine Vouchers" feature of db3-app.

## Install

```bash
npm install
npm run build
```

Works in Node.js 18+ and in browsers. Bundlers pick the right build automatically through the `browser` / `node` export conditions. You can also import `pdf-combiner/browser` or `pdf-combiner/node` explicitly.

## Usage

### Node

```ts
import { mergePdfs, mergePdfsToFile } from "pdf-combiner";

// Sources can be bytes (Buffer / Uint8Array / ArrayBuffer), Blobs, local file paths, file: URLs, or http(s) URLs
const bytes = await mergePdfs([
  "./invoice.pdf",
  "https://example.com/voucher.pdf",
  someBuffer,
]);

// Or write straight to disk
await mergePdfsToFile(["./a.pdf", "./b.pdf"], "./merged.pdf");
```

### Browser

```ts
import { mergePdfsToBlob } from "pdf-combiner";

// Files the user picked with <input type="file" multiple accept="application/pdf">
const blob = await mergePdfsToBlob([...input.files]);

// Offer it as a download
const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "merged.pdf";
a.click();
URL.revokeObjectURL(a.href);
```

URLs work too, but the server must allow your page's origin (CORS). Local file paths aren't available in the browser and are rejected with an error.

### API

Both builds:

- `mergePdfs(sources: PdfSource[]): Promise<Uint8Array>`: returns the merged PDF bytes.

Node only:

- `mergePdfsToFile(sources: PdfSource[], outputPath: string): Promise<void>`: merges and writes to `outputPath`.

Browser only:

- `mergePdfsToBlob(sources: PdfSource[]): Promise<Blob>`: returns the merged PDF as an `application/pdf` Blob.

`PdfSource` is `Uint8Array | ArrayBuffer | Blob | URL | string`. URLs and strings starting with `http:`, `https:`, `blob:` or `data:` are fetched. In Node, any other string, or a `file:` URL, is read from disk.

## Caveats

- **All or nothing:** if any source fails to load or parse, the call rejects and nothing is produced.
- **Encrypted PDFs** are loaded with `ignoreEncryption: true`; pages from truly encrypted files may come out blank or broken.

## Development

```bash
npm test        # node:test, runs the TS sources directly
npm run typecheck
```
