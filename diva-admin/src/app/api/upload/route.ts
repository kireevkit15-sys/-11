/**
 * Diva Admin — загрузка изображений (логотипы, фото, обложки).
 * POST /api/upload  (multipart form-data, поле "file")
 *
 * Тип файла проверяется по СИГНАТУРЕ (magic bytes), а не по заголовку браузера.
 * SVG запрещён намеренно (вектор stored-XSS). Файл сохраняется в public/uploads
 * обоих приложений (web и diva-admin) для отображения и на сайте, и в превью.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { authorize, jsonError } from '@/lib/api-helpers';

const MAX_SIZE = 5 * 1024 * 1024; // 5 МБ

/** Определяет реальный формат по первым байтам. Возвращает расширение или null. */
function sniffImage(buf: Buffer): 'jpg' | 'png' | 'gif' | 'webp' | null {
  if (buf.length < 12) return null;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'gif';
  // WEBP: 'RIFF' .... 'WEBP'
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'webp';
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await authorize('content:write');
  if ('error' in auth) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError('Файл не выбран', 400);
    if (file.size > MAX_SIZE) return jsonError('Файл слишком большой (макс. 5 МБ)', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = sniffImage(buffer);
    if (!ext) return jsonError('Допустимы только изображения: JPEG, PNG, GIF, WebP', 400);

    const fileName = `${randomUUID()}.${ext}`;

    // Целевые каталоги: public/uploads админки и сайта (если сайт рядом).
    const targets = [
      join(process.cwd(), 'public', 'uploads'),
      join(process.cwd(), '..', 'web', 'public', 'uploads'),
    ];

    let writtenAnywhere = false;
    for (const dir of targets) {
      try {
        const isWeb = dir.includes(`${join('..', 'web')}`);
        if (isWeb && !existsSync(join(process.cwd(), '..', 'web'))) continue;
        if (!existsSync(dir)) await mkdir(dir, { recursive: true });
        await writeFile(join(dir, fileName), buffer);
        writtenAnywhere = true;
      } catch (e) {
        console.error('[Upload] write failed for', dir, e);
      }
    }

    if (!writtenAnywhere) return jsonError('Не удалось сохранить файл', 500);

    return NextResponse.json({ url: `/uploads/${fileName}`, fileName, size: file.size });
  } catch (error) {
    console.error('[Upload] error:', error);
    return jsonError('Ошибка загрузки файла', 500);
  }
}
