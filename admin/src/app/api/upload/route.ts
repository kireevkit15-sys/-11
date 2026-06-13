/**
 * Diva Admin — File Upload API
 */

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('admin_session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  return null;
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
    }

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Допускаются только изображения (JPEG, PNG, GIF, WebP)' }, { status: 400 });
    }

    // Проверяем размер (макс 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Файл слишком большой (макс 5MB)' }, { status: 400 });
    }

    // Создаём папку для загрузок если её нет
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${randomUUID()}.${ext}`;
    const filePath = join(uploadDir, fileName);

    // Записываем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Возвращаем URL
    const url = `/uploads/avatars/${fileName}`;
    return NextResponse.json({ url, fileName, size: file.size });
  } catch (error) {
    console.error('[API] Upload error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
  }
}
