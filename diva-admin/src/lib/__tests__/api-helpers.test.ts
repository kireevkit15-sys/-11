import { describe, it, expect, vi } from 'vitest';

/**
 * Тестируем чистую функцию coerceBody из api-helpers.ts.
 *
 * Сам модуль тянет server-only зависимости на верхнем уровне
 * (next/server, @/lib/session → next/headers, @/lib/rbac → @/lib/auth → @/lib/db → postgres).
 * Все они мокируются ниже, чтобы импорт модуля не падал и не открывал
 * соединение с БД. coerceBody при этом импортируется и проверяется как есть.
 */
vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: { json: (body: unknown, init?: unknown) => ({ body, init }) },
}));
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));
vi.mock('@/lib/rbac', () => ({
  hasPermission: vi.fn(),
}));

import { coerceBody } from '@/lib/api-helpers';

/**
 * Минимальный совместимый тип конфига поля/сущности.
 * entities.ts тянет drizzle-таблицы, поэтому реальный EntityConfig не импортируем —
 * coerceBody читает только entity.fields[].{name,label,type,required,...}.
 */
type Field = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
};
function entity(fields: Field[]) {
  // структурно совместимо с EntityConfig для нужд coerceBody
  return { fields } as unknown as Parameters<typeof coerceBody>[0];
}

describe('coerceBody — обязательные поля', () => {
  it('пустое required text → ошибка', () => {
    const e = entity([{ name: 'title', label: 'Заголовок', type: 'text', required: true }]);
    const res = coerceBody(e, { title: '' });
    expect(res.error).toBeDefined();
    expect(res.error).toContain('Заголовок');
  });

  it('пустое required (undefined) → ошибка', () => {
    const e = entity([{ name: 'title', label: 'Заголовок', type: 'text', required: true }]);
    const res = coerceBody(e, {});
    expect(res.error).toBeDefined();
  });

  it('заполненное required → без ошибки', () => {
    const e = entity([{ name: 'title', label: 'Заголовок', type: 'text', required: true }]);
    const res = coerceBody(e, { title: 'Привет' });
    expect(res.error).toBeUndefined();
    expect(res.data.title).toBe('Привет');
  });

  it('пустое необязательное text — пропускается (нет ключа)', () => {
    const e = entity([{ name: 'note', label: 'Заметка', type: 'text' }]);
    const res = coerceBody(e, { note: '' });
    expect(res.error).toBeUndefined();
    expect('note' in res.data).toBe(false);
  });
});

describe('coerceBody — числа', () => {
  it('строка "42" → 42 (parseInt)', () => {
    const e = entity([{ name: 'n', label: 'N', type: 'number' }]);
    const res = coerceBody(e, { n: '42' });
    expect(res.data.n).toBe(42);
  });

  it('число 7 остаётся числом', () => {
    const e = entity([{ name: 'n', label: 'N', type: 'number' }]);
    const res = coerceBody(e, { n: 7 });
    expect(res.data.n).toBe(7);
  });

  it('пустое необязательное число — пропускается', () => {
    const e = entity([{ name: 'n', label: 'N', type: 'number' }]);
    const res = coerceBody(e, { n: '' });
    expect(res.error).toBeUndefined();
    expect('n' in res.data).toBe(false);
  });

  it('пустое required число → ошибка', () => {
    const e = entity([{ name: 'n', label: 'N', type: 'number', required: true }]);
    const res = coerceBody(e, { n: '' });
    expect(res.error).toBeDefined();
  });

  it('нечисловая строка → ошибка', () => {
    const e = entity([{ name: 'n', label: 'N', type: 'number' }]);
    const res = coerceBody(e, { n: 'abc' });
    expect(res.error).toContain('числом');
  });
});

describe('coerceBody — checkbox', () => {
  it('true → true', () => {
    const e = entity([{ name: 'ok', label: 'OK', type: 'checkbox' }]);
    expect(coerceBody(e, { ok: true }).data.ok).toBe(true);
  });
  it('"true" → true', () => {
    const e = entity([{ name: 'ok', label: 'OK', type: 'checkbox' }]);
    expect(coerceBody(e, { ok: 'true' }).data.ok).toBe(true);
  });
  it('false → false', () => {
    const e = entity([{ name: 'ok', label: 'OK', type: 'checkbox' }]);
    expect(coerceBody(e, { ok: false }).data.ok).toBe(false);
  });
  it('отсутствие значения → false', () => {
    const e = entity([{ name: 'ok', label: 'OK', type: 'checkbox' }]);
    expect(coerceBody(e, {}).data.ok).toBe(false);
  });
});

describe('coerceBody — list', () => {
  it('массив строк фильтрует пустые', () => {
    const e = entity([{ name: 'tags', label: 'Теги', type: 'list' }]);
    const res = coerceBody(e, { tags: ['a', '', '  ', 'b'] });
    expect(res.data.tags).toEqual(['a', 'b']);
  });

  it('строка с переносами → массив без пустых', () => {
    const e = entity([{ name: 'tags', label: 'Теги', type: 'list' }]);
    const res = coerceBody(e, { tags: 'a\n\nb\n c ' });
    expect(res.data.tags).toEqual(['a', 'b', 'c']);
  });

  it('прочее значение → пустой массив', () => {
    const e = entity([{ name: 'tags', label: 'Теги', type: 'list' }]);
    expect(coerceBody(e, { tags: 123 }).data.tags).toEqual([]);
  });
});

describe('coerceBody — json', () => {
  it('валидный JSON парсится', () => {
    const e = entity([{ name: 'cfg', label: 'Конфиг', type: 'json' }]);
    const res = coerceBody(e, { cfg: '{"a":1}' });
    expect(res.data.cfg).toEqual({ a: 1 });
  });

  it('битый JSON → ошибка', () => {
    const e = entity([{ name: 'cfg', label: 'Конфиг', type: 'json' }]);
    const res = coerceBody(e, { cfg: '{a:1' });
    expect(res.error).toContain('JSON');
  });

  it('пустое необязательное json — пропускается', () => {
    const e = entity([{ name: 'cfg', label: 'Конфиг', type: 'json' }]);
    const res = coerceBody(e, { cfg: '' });
    expect(res.error).toBeUndefined();
    expect('cfg' in res.data).toBe(false);
  });

  it('пустое required json → ошибка', () => {
    const e = entity([{ name: 'cfg', label: 'Конфиг', type: 'json', required: true }]);
    expect(coerceBody(e, { cfg: '' }).error).toBeDefined();
  });
});

describe('coerceBody — date', () => {
  it('валидная дата → Date', () => {
    const e = entity([{ name: 'd', label: 'Дата', type: 'date' }]);
    const res = coerceBody(e, { d: '2026-06-15' });
    expect(res.data.d).toBeInstanceOf(Date);
    expect((res.data.d as Date).getUTCFullYear()).toBe(2026);
  });

  it('битая дата → ошибка', () => {
    const e = entity([{ name: 'd', label: 'Дата', type: 'date' }]);
    expect(coerceBody(e, { d: 'не-дата' }).error).toContain('дата');
  });

  it('пустое необязательное date — пропускается', () => {
    const e = entity([{ name: 'd', label: 'Дата', type: 'date' }]);
    const res = coerceBody(e, { d: '' });
    expect(res.error).toBeUndefined();
    expect('d' in res.data).toBe(false);
  });
});

describe('coerceBody — безопасность и длина (text)', () => {
  it('javascript:-схема → ошибка', () => {
    const e = entity([{ name: 'url', label: 'Ссылка', type: 'text' }]);
    expect(coerceBody(e, { url: 'javascript:alert(1)' }).error).toContain('недопустимое');
  });

  it('javascript: с ведущими пробелами → ошибка', () => {
    const e = entity([{ name: 'url', label: 'Ссылка', type: 'text' }]);
    // строка тримится перед проверкой, поэтому даже с пробелами ловится
    expect(coerceBody(e, { url: '   javascript:alert(1)' }).error).toContain('недопустимое');
  });

  it('data:text/html → ошибка', () => {
    const e = entity([{ name: 'url', label: 'Ссылка', type: 'text' }]);
    expect(coerceBody(e, { url: 'data:text/html;base64,xxx' }).error).toContain('недопустимое');
  });

  it('превышение макс. длины → ошибка', () => {
    const e = entity([{ name: 'big', label: 'Текст', type: 'text' }]);
    const res = coerceBody(e, { big: 'x'.repeat(50001) });
    expect(res.error).toContain('длинное');
  });

  it('обычная https-ссылка проходит', () => {
    const e = entity([{ name: 'url', label: 'Ссылка', type: 'text' }]);
    const res = coerceBody(e, { url: 'https://example.com' });
    expect(res.error).toBeUndefined();
    expect(res.data.url).toBe('https://example.com');
  });
});

describe('coerceBody — системные поля', () => {
  it('id/createdAt/updatedAt игнорируются', () => {
    const e = entity([
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'createdAt', label: 'Создано', type: 'date' },
      { name: 'title', label: 'Заголовок', type: 'text' },
    ]);
    const res = coerceBody(e, { id: '123', createdAt: '2026-01-01', title: 'T' });
    expect('id' in res.data).toBe(false);
    expect('createdAt' in res.data).toBe(false);
    expect(res.data.title).toBe('T');
  });
});
