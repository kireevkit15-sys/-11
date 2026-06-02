"""
Скрипт упрощения и объединения 8 GeoJSON федеральных округов России.
Источник: https://github.com/timurkanaz/Russia_geojson_OSM (OSM data)

Стратегия:
1. Парсим каждый из 8 raw geojson
2. Применяем Douglas-Peucker simplification к каждому полигону
3. Округляем координаты до 2 знаков (~1км точность достаточно на 800px карте)
4. Объединяем в один FeatureCollection с ASCII-кодами округов
5. Сохраняем в russia-federal-districts.json (готов к импорту в TS)

Запуск:
    python _simplify.py
"""

from __future__ import annotations

import json
import math
import os
from pathlib import Path

# === Метаданные федеральных округов ===
DISTRICTS = {
    'cfd':  {'code': 'CFD',  'name': 'Центральный',     'name_short': 'ЦФО'},
    'nwfo': {'code': 'NWFO', 'name': 'Северо-Западный', 'name_short': 'СЗФО'},
    'sfo':  {'code': 'SFO',  'name': 'Южный',           'name_short': 'ЮФО'},
    'ncfd': {'code': 'NCFD', 'name': 'Северо-Кавказский','name_short':'СКФО'},
    'vfd':  {'code': 'VFD',  'name': 'Приволжский',     'name_short': 'ПФО'},
    'urfo': {'code': 'UrFO', 'name': 'Уральский',       'name_short': 'УрФО'},
    'sfd':  {'code': 'SFD',  'name': 'Сибирский',       'name_short': 'СФО'},
    'fefo': {'code': 'FEFO', 'name': 'Дальневосточный', 'name_short': 'ДФО'},
}

# Порог упрощения (в градусах).
# 0.025° ≈ 1.5км — даёт смooth контуры для 1200px premium-карты
# (на старте было 0.08° / ~5км, выглядело блочно)
SIMPLIFY_TOLERANCE = 0.025
# Знаков после запятой в координатах. 3 знака ≈ 100м точность.
COORD_PRECISION = 3

ROOT = Path(__file__).parent
RAW_DIR = ROOT / '_raw'
OUTPUT = ROOT / 'russia-federal-districts.json'


# ─────────────────────────────────────────────────────────────────
# Douglas-Peucker simplification
# ─────────────────────────────────────────────────────────────────

def perpendicular_distance(point, line_start, line_end):
    if line_start == line_end:
        return math.hypot(point[0] - line_start[0], point[1] - line_start[1])
    x0, y0 = point
    x1, y1 = line_start
    x2, y2 = line_end
    num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
    den = math.hypot(y2 - y1, x2 - x1)
    return num / den


def douglas_peucker(points, epsilon):
    """Упрощает линию по алгоритму Douglas-Peucker."""
    if len(points) < 3:
        return points
    dmax = 0.0
    index = 0
    for i in range(1, len(points) - 1):
        d = perpendicular_distance(points[i], points[0], points[-1])
        if d > dmax:
            index = i
            dmax = d
    if dmax > epsilon:
        rec1 = douglas_peucker(points[:index + 1], epsilon)
        rec2 = douglas_peucker(points[index:], epsilon)
        return rec1[:-1] + rec2
    return [points[0], points[-1]]


def round_coords(coords):
    """Рекурсивно округляет все координаты."""
    if isinstance(coords[0], (list, tuple)):
        return [round_coords(c) for c in coords]
    return [round(coords[0], COORD_PRECISION), round(coords[1], COORD_PRECISION)]


def simplify_ring(ring):
    """Упрощает кольцо (полигон) — DP + округление + удаление дубликатов."""
    # DP simplify
    points = [tuple(p) for p in ring]
    simplified = douglas_peucker(points, SIMPLIFY_TOLERANCE)
    # Round
    simplified = [[round(p[0], COORD_PRECISION), round(p[1], COORD_PRECISION)] for p in simplified]
    # Remove consecutive duplicates after rounding
    out = [simplified[0]]
    for p in simplified[1:]:
        if p != out[-1]:
            out.append(p)
    # Polygon must close
    if out[0] != out[-1]:
        out.append(out[0][:])
    # Need at least 4 points (3 + closing)
    if len(out) < 4:
        return None
    return out


def simplify_geometry(geom):
    if geom['type'] == 'Polygon':
        new_rings = []
        for ring in geom['coordinates']:
            s = simplify_ring(ring)
            if s:
                new_rings.append(s)
        if not new_rings:
            return None
        return {'type': 'Polygon', 'coordinates': new_rings}
    elif geom['type'] == 'MultiPolygon':
        new_polys = []
        for poly in geom['coordinates']:
            new_rings = []
            for ring in poly:
                s = simplify_ring(ring)
                if s:
                    new_rings.append(s)
            if new_rings:
                new_polys.append(new_rings)
        if not new_polys:
            return None
        return {'type': 'MultiPolygon', 'coordinates': new_polys}
    return geom


# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

def count_points(geom):
    if geom['type'] == 'Polygon':
        return sum(len(r) for r in geom['coordinates'])
    if geom['type'] == 'MultiPolygon':
        return sum(len(r) for poly in geom['coordinates'] for r in poly)
    return 0


def main():
    features = []
    total_points_before = 0
    total_points_after = 0

    for code_lc, meta in DISTRICTS.items():
        path = RAW_DIR / f'{code_lc}.geojson'
        if not path.exists():
            print(f'  MISSING: {path}')
            continue

        with open(path, encoding='utf-8') as f:
            raw = json.load(f)

        # Source может быть FeatureCollection ИЛИ одиночным Feature.
        if raw.get('type') == 'FeatureCollection':
            geoms = [feat['geometry'] for feat in raw['features']]
        elif raw.get('type') == 'Feature':
            geoms = [raw['geometry']]
        else:
            print(f'  UNKNOWN type: {raw.get("type")}')
            continue

        # Если несколько Feature — объединяем геометрии в один MultiPolygon
        merged_polys = []
        for g in geoms:
            if g['type'] == 'Polygon':
                merged_polys.append(g['coordinates'])
            elif g['type'] == 'MultiPolygon':
                merged_polys.extend(g['coordinates'])
        merged = {'type': 'MultiPolygon', 'coordinates': merged_polys}

        before = count_points(merged)
        simplified = simplify_geometry(merged)
        if not simplified:
            print(f'  {meta["code"]}: empty after simplification!')
            continue
        after = count_points(simplified)

        total_points_before += before
        total_points_after += after

        features.append({
            'type': 'Feature',
            'properties': {
                'code': meta['code'],
                'name': meta['name'],
                'shortName': meta['name_short'],
            },
            'geometry': simplified,
        })

        ratio = after / before * 100 if before else 0
        print(f'  {meta["code"]:6} {meta["name"]:20} {before:>7} -> {after:>5} pts ({ratio:.1f}%)')

    fc = {'type': 'FeatureCollection', 'features': features}

    # Pretty-print? No — keep it as compact as possible.
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT.stat().st_size / 1024
    print()
    print(f'Total points: {total_points_before} -> {total_points_after}')
    print(f'Output: {OUTPUT.name}  =  {size_kb:.1f} KB')
    print(f'Done.')


if __name__ == '__main__':
    main()
