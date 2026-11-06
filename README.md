# pdf-combiner

Merge several PDFs into a single PDF, keeping the input order. Built on [pdf-lib](https://pdf-lib.js.org/).

Extracted from the "Combine Vouchers" feature of db3-app.

## Install

```bash
npm install
npm run build
```

Requires Node.js 18+ (uses the global `fetch`).

## Usage

```ts
import { mergePdfs, mergePdfsToFile } from "pdf-combiner";

// Sources can be bytes (Buffer / Uint8Array / ArrayBuffer), local file paths, or http(s) URLs
const bytes = await mergePdfs([
  "./invoice.pdf",
  "https://example.com/voucher.pdf",
  someBuffer,
]);

// Or write straight to disk
await mergePdfsToFile(["./a.pdf", "./b.pdf"], "./merged.pdf");
```

### API

- `mergePdfs(sources: PdfSource[]): Promise<Uint8Array>`: returns the merged PDF bytes.
- `mergePdfsToFile(sources: PdfSource[], outputPath: string): Promise<void>`: merges and writes to `outputPath`.

`PdfSource` is `Uint8Array | ArrayBuffer | URL | string`. A string starting with `http://` or `https://` is fetched; any other string is read as a file path.

## Caveats

- **All or nothing:** if any source fails to load or parse, the call rejects and nothing is produced.
- **Encrypted PDFs** are loaded with `ignoreEncryption: true`; pages from truly encrypted files may come out blank or broken.

## Development

```bash
npm test        # node:test, runs the TS sources directly
npm run typecheck
```
