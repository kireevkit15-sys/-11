import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Монорепо: web импортирует общую схему ../db/schema.ts (alias @/db).
  // Без outputFileTracingRoot Next трассит зависимости только внутри web/,
  // и standalone-бандл не включит ../db/schema.ts → MODULE_NOT_FOUND на @/db
  // в runtime. Указываем только db/ (корень монорепо включать нельзя — Next
  // тогда пытается трейсить bot/, diva-admin/, что ломает collect page data).
  outputFileTracingRoot: path.join(__dirname, "..", "db"),
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // next/image проксирует внешние источники через свой /_next/image;
              // для HTML <img> разрешаем наш origin + https (для youtube-превью).
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              // 'unsafe-eval' нужен Next.js dev runtime; в prod он не используется,
              // но оставляем для безопасности совместимости (могут быть встроенные
              // JSON-LD inline-скрипты через dangerouslySetInnerHTML).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "font-src 'self' data:",
              // connect-src: разрешаем POST на /api/leads (same-origin) и Telegram webhook
              // в случае inline-виджетов. Если бот/CRM API вызывается с клиента — добавить.
              "connect-src 'self'",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
