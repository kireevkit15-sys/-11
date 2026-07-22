import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Монорепо: web импортирует общую схему ../db/schema.ts (alias @/db).
  // Без outputFileTracingRoot Next трассит зависимости только внутри web/,
  // и standalone-бандл не включит ../db/schema.ts → MODULE_NOT_FOUND на @/db
  // в runtime. Указываем корень репо, чтобы tracer уходил выше каталога приложения.
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    qualities: [75, 92],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    // Загрузки админки и пользовательские изображения лежат на нашем домене
    // (Caddy проксирует /uploads к общему volume). Внешние CDN-источники для
    // прода не нужны — оставляем только собственный хост.
    // Раньше здесь был wildcard hostname: '**' + pathname '/uploads/**' —
    // открытый прокси: любой https-хост с путем /uploads/... проксировался
    // через наш image optimizer. Также убраны dev-заглушки (unsplash, picsum,
    // localhost) — в проде они не нужны.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
