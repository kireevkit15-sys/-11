import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Монорепо: diva-admin импортирует общую схему ../db/schema.ts (alias @db/*).
  // Без outputFileTracingRoot Next трассит зависимости только внутри diva-admin/,
  // и standalone-бандл не включит ../db/schema.ts → MODULE_NOT_FOUND на @db/schema
  // в runtime. Указываем корень репо, чтобы tracer уходил выше каталога приложения.
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
