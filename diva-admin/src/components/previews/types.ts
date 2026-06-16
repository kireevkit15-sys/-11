/**
 * Контракт превью-компонентов. Каждое превью получает «сырые» значения формы
 * (строки/булевы/массивы) и рендерит, как блок будет выглядеть на сайте.
 */

export interface PreviewProps {
  values: Record<string, unknown>;
}

export function str(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export function num(v: unknown, fallback = 0): number {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isNaN(n) ? fallback : n;
}

export function bool(v: unknown): boolean {
  return v === true || v === 'true';
}

export function list(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter((x) => x.trim() !== '');
  if (typeof v === 'string' && v.trim()) return v.split('\n').map((s) => s.trim()).filter(Boolean);
  return [];
}

export function json<T>(v: unknown, fallback: T): T {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'object') return v as T;
  try {
    return JSON.parse(String(v)) as T;
  } catch {
    return fallback;
  }
}
