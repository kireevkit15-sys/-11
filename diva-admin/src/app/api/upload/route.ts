/**
 * Diva Admin — загрузка изображений (логотипы, фото, обложки).
 * POST /api/upload  (multipart form-data, поле "file")
 *
 * Тип файла проверяется по СИГНАТУРЕ (magic bytes), а не по заголовку браузера.
 * SVG запрещён намеренно (вектор stored-XSS). Файл сохраняется в public/uploads
 * обоих приложений (web и diva-admin) для отображения и на сайте, и в превью.
 *
 * Безопасность:
 * - Content-Length проверяется ДО чтения тела — иначе 50 МБ зайдут в память.
 * - После formData() повторная проверка file.size (не доверяем заголовку).
 * - Magic bytes по первым 12 байтам, формат файла → uuid.{ext}, не пользовательский name.
 * - Лимит на размер: 5 МБ (см. MAX_SIZE).
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { authorize, jsonError, clientIp } from '@/lib/api-helpers';

/**
 * Скользящее окно для защиты от spam-загрузок (20 файлов / 5 минут / IP).
 * Хранится в памяти процесса; для multi-replica deploy перенести в Redis/PG.
 */
const UPLOAD_WINDOW_MS = 5 * 60 * 1000;
const UPLOAD_MAX_PER_IP = 20;
const uploadByIp = new Map<string, { count: number; resetAt: number }>();

function isUploadRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = uploadByIp.get(ip);
  if (!entry || entry.resetAt <= now) {
    uploadByIp.set(ip, { count: 1, resetAt: now + UPLOAD_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > UPLOAD_MAX_PER_IP;
}

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

  const ip = clientIp(request) ?? 'unknown';
  if (isUploadRateLimited(ip)) {
    return jsonError('Слишком много загрузок. Попробуйте позже.', 429);
  }

  // Ранняя проверка Content-Length — иначе formData() прочитает всё в RAM.
  // Next.js не делает это автоматически, поэтому контролируем явно.
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_SIZE) {
    return jsonError('Файл слишком большой (макс. 5 МБ)', 413);
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError('Файл не выбран', 400);
    // Повторная проверка — на случай, если Content-Length отсутствует или врёт.
    if (file.size > MAX_SIZE) return jsonError('Файл слишком большой (макс. 5 МБ)', 413);
    if (file.size === 0) return jsonError('Файл пустой', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = sniffImage(buffer);
    if (!ext) return jsonError('Допустимы только изображения: JPEG, PNG, GIF, WebP', 400);

    const fileName = `${randomUUID()}.${ext}`;

    // Целевые каталоги: public/uploads админки и сайта.
    // ВАЖНО: process.cwd() может быть как корнем монорепо (когда `next dev diva-admin`
    // запускается из корня), так и самим diva-admin/ (когда запускаются из него).
    // Проверяем оба варианта, чтобы файл попал в нужное место независимо от способа запуска.
    const cwd = process.cwd();
    const here = cwd.endsWith('diva-admin') ? cwd : join(cwd, 'diva-admin');
    const webSibling =
      cwd.endsWith('diva-admin') ? join(cwd, '..', 'web') : join(cwd, 'web');
    const adminUploads = join(here, 'public', 'uploads');
    const webUploads = join(webSibling, 'public', 'uploads');
    const targets = existsSync(webSibling) ? [adminUploads, webUploads] : [adminUploads];

    let writtenAnywhere = false;
    for (const dir of targets) {
      try {
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
