import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest-конфиг для юнит-тестов чистой логики diva-admin.
 *
 * - environment node — без браузерного DOM и без рантайма Next;
 * - globals true — describe/it/expect доступны без импорта;
 * - alias `@` → ./src и `@db` → ../db повторяют tsconfig paths,
 *   чтобы импорты в исходниках резолвились так же, как в приложении.
 *
 * Серверные модули (next/headers, postgres, @/lib/db и т.п.) в тестах
 * мокируются через vi.mock — реальная БД и рантайм Next не задействуются.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@db': path.resolve(__dirname, '../db'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
