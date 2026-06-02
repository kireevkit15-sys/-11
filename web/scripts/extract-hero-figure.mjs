// One-off: extracts the base64 PNG embedded in 15 1 1.svg, then writes
// optimized WebP + PNG variants to public/hero/.
//
// Usage: node scripts/extract-hero-figure.mjs <path-to-source-svg>

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const outDir = resolve(projectRoot, 'public/hero')

const sourcePath = process.argv[2]
if (!sourcePath) {
  console.error('Usage: node scripts/extract-hero-figure.mjs <path-to-source-svg>')
  process.exit(1)
}

const svgRaw = await readFile(sourcePath, 'utf8')

const match = svgRaw.match(/data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/)
if (!match) {
  console.error('No base64 image data found in SVG.')
  process.exit(1)
}

const [, ext, b64] = match
console.log(`Found embedded ${ext}, base64 length: ${b64.length.toLocaleString()}`)
const buf = Buffer.from(b64, 'base64')
console.log(`Decoded buffer: ${(buf.length / 1024 / 1024).toFixed(2)} MB`)

await mkdir(outDir, { recursive: true })

const meta = await sharp(buf).metadata()
console.log(`Source dimensions: ${meta.width}x${meta.height}`)

// Hero displays the figure roughly at ~600-900px width on desktop, retina x2 → 1600px max is plenty.
const targetWidth = 1600

const baseName = 'diva-figure'

// Trim transparent edges (figure presumably sits on transparent background)
// then resize to target width.
const pipeline = sharp(buf).trim({ threshold: 5 }).resize({ width: targetWidth, withoutEnlargement: true })

const webpPath = resolve(outDir, `${baseName}.webp`)
const pngPath = resolve(outDir, `${baseName}.png`)
const avifPath = resolve(outDir, `${baseName}.avif`)

await pipeline.clone().webp({ quality: 88, effort: 6 }).toFile(webpPath)
await pipeline.clone().png({ compressionLevel: 9, palette: true }).toFile(pngPath)
await pipeline.clone().avif({ quality: 70, effort: 6 }).toFile(avifPath)

const stat = async (p) => (await readFile(p)).length

const sizes = {
  webp: await stat(webpPath),
  png: await stat(pngPath),
  avif: await stat(avifPath),
}

console.log('\nOutput files:')
for (const [k, v] of Object.entries(sizes)) {
  console.log(`  ${baseName}.${k}: ${(v / 1024).toFixed(1)} KB`)
}

// Persist a tiny manifest so the React component can read final dimensions if needed.
const finalMeta = await sharp(webpPath).metadata()
await writeFile(
  resolve(outDir, `${baseName}.json`),
  JSON.stringify({ width: finalMeta.width, height: finalMeta.height }, null, 2),
)

console.log(`\nDone. Final dimensions: ${finalMeta.width}x${finalMeta.height}`)
