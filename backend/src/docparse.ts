import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCLING_SCRIPT = path.resolve(__dirname, '../../ai/docling/extract.py')

export interface ExtractResult {
  text: string
  method: 'docling' | 'pdf-parse' | 'plain-text'
  chars: number
}

// Try real Docling (Python) first — it returns structured Markdown. Falls back
// to a JS PDF text extractor, then to treating the upload as plain text, so the
// pipeline always yields something for Granite to reason over.
export async function extractDocument(
  buffer: Buffer,
  filename: string,
): Promise<ExtractResult> {
  const ext = path.extname(filename).toLowerCase()

  // 1) Docling (best — structured Markdown). Needs `pip install docling`.
  if (process.env.USE_DOCLING === '1' && (ext === '.pdf' || ext === '.docx' || ext === '.pptx')) {
    try {
      const text = await runDocling(buffer, ext)
      if (text.trim()) return { text, method: 'docling', chars: text.length }
    } catch {
      /* fall through */
    }
  }

  // 2) PDF → text via pdf-parse (pure JS).
  if (ext === '.pdf') {
    try {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const res: any = await parser.getText()
      const text = (res?.text ?? '').trim()
      if (text) return { text, method: 'pdf-parse', chars: text.length }
    } catch {
      /* fall through */
    }
  }

  // 3) Plain text (.txt, .md, .csv, or anything decodable).
  const text = buffer.toString('utf8')
  return { text, method: 'plain-text', chars: text.length }
}

function runDocling(buffer: Buffer, ext: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Docling reads from a path, so we stream the upload to a temp file.
    const tmp = path.join(os.tmpdir(), `apexai-doc-${Date.now()}${ext}`)
    fs.writeFileSync(tmp, buffer)
    const py = spawn('python3', [DOCLING_SCRIPT, tmp])
    let out = ''
    let err = ''
    py.stdout.on('data', (d) => (out += d))
    py.stderr.on('data', (d) => (err += d))
    py.on('close', (code) => {
      try {
        fs.unlinkSync(tmp)
      } catch {
        /* ignore */
      }
      if (code === 0) resolve(out)
      else reject(new Error(err || `docling exit ${code}`))
    })
    py.on('error', reject)
  })
}
