#!/usr/bin/env node
/**
 * Минимальная build-time генерация для «созвездия»:
 *   - один SVG path = силуэт всей России (union 8 округов)
 *   - 8 городов-столиц округов с проецированными x/y
 *   - tight viewBox
 *
 * Output: src/data/geo/russia-silhouette.json (~50 КБ).
 * Заменяет тяжёлый russia-regions-paths.json (3.4 МБ).
 *
 * Запуск: node scripts/build-russia-silhouette.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoMercator, geoPath } from 'd3-geo'
import rewind from '@turf/rewind'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const INPUT = resolve(ROOT, 'src/data/geo/russia-federal-districts.json')
const OUTPUT = resolve(ROOT, 'src/data/geo/russia-silhouette.json')

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 600
const PADDING = 8

const CITIES = [
  { code: 'CFD',  name: 'Москва',           lng: 37.6173,  lat: 55.7558 },
  { code: 'NWFO', name: 'Санкт-Петербург',  lng: 30.3158,  lat: 59.9389 },
  { code: 'SFO',  name: 'Ростов-на-Дону',   lng: 39.7188,  lat: 47.2225 },
  { code: 'NCFD', name: 'Ставрополь',       lng: 41.9734,  lat: 45.0428 },
  { code: 'VFD',  name: 'Казань',           lng: 49.1064,  lat: 55.7887 },
  { code: 'UrFO', name: 'Екатеринбург',     lng: 60.5975,  lat: 56.8389 },
  { code: 'SFD',  name: 'Новосибирск',      lng: 82.9357,  lat: 55.0084 },
  { code: 'FEFO', name: 'Владивосток',      lng: 131.8855, lat: 43.1198 },
]

// ─────────────── load + rewind ───────────────
const geo = JSON.parse(readFileSync(INPUT, 'utf-8'))
console.log(`Loaded ${geo.features.length} federal districts`)

geo.features = geo.features.map((feat) => rewind(feat, { reverse: true }))

// Filter antimeridian для FEFO (как раньше)
const fefo = geo.features.find((f) => f.properties.code === 'FEFO')
if (fefo && fefo.geometry.type === 'MultiPolygon') {
  fefo.geometry.coordinates = fefo.geometry.coordinates.filter((poly) => {
    const outer = poly[0]
    return !outer.some((p) => p[0] < 0)
  })
}

// ─────────────── projection ───────────────
const projection = geoMercator()
  .rotate([-94, 0, 0])
  .fitExtent(
    [
      [PADDING, PADDING],
      [CANVAS_WIDTH - PADDING, CANVAS_HEIGHT - PADDING],
    ],
    geo,
  )

const path = geoPath(projection)

// ─────────────── silhouette = union всех 8 округов одним path'ом ───────────────
const fc = { type: 'FeatureCollection', features: geo.features }
const silhouetteRaw = path(fc)
if (!silhouetteRaw) throw new Error('Silhouette generation failed')

// Compactify: округляем до ЦЕЛЫХ пикселей. Для силуэта точность 1px более
// чем достаточно (на 1200×600 viewport даже 2-3px не видны), а размер
// уменьшается значительно. Затем удаляем подряд идущие дубликаты.
const rounded = silhouetteRaw.replace(/-?\d+\.\d+/g, (m) =>
  Math.round(Number(m)).toString(),
)
// Remove zero-length segments: "L100,200L100,200" → "L100,200"
const silhouettePath = rounded.replace(/(L[\d-]+,[\d-]+)(?=\1[ML])/g, '')

// ─────────────── cities ───────────────
const cities = CITIES.map((c) => {
  const projected = projection([c.lng, c.lat])
  if (!projected) throw new Error(`Could not project ${c.name}`)
  const [x, y] = projected
  return {
    code: c.code,
    name: c.name,
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  }
})

// ─────────────── tight viewBox ───────────────
const allBounds = geo.features.map((feat) => path.bounds(feat))
const minX = Math.min(...allBounds.map((b) => b[0][0]))
const minY = Math.min(...allBounds.map((b) => b[0][1]))
const maxX = Math.max(...allBounds.map((b) => b[1][0]))
const maxY = Math.max(...allBounds.map((b) => b[1][1]))

const viewBox = {
  x: Math.floor(minX - PADDING),
  y: Math.floor(minY - PADDING),
  width: Math.ceil(maxX - minX + PADDING * 2),
  height: Math.ceil(maxY - minY + PADDING * 2),
}

// ─────────────── output ───────────────
const out = { viewBox, silhouettePath, cities }
writeFileSync(OUTPUT, JSON.stringify(out), 'utf-8')

const sizeKb = (JSON.stringify(out).length / 1024).toFixed(1)
console.log(`\nOutput: ${OUTPUT}`)
console.log(`        ${sizeKb} KB`)
console.log(`        viewBox: "${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}"`)
console.log(`        silhouette path length: ${silhouettePath.length} chars`)
console.log(`        cities: ${cities.length}`)
console.log('Done.')
