const config = {
  plugins: {
    // Передаём опции напрямую, чтобы @tailwindcss/postcss не зависел
    // от @source из `src/app/globals.css` — Next 15 standalone-build
    // теряет `**` из @source при обработке.
    //
    // Все .ts/.tsx/.js/.jsx в src/ — там лежат наши компоненты,
    // страницы и api/роуты; Tailwind сканирует их и генерит только
    // те utility-классы, что встречаются в этих файлах.
    "@tailwindcss/postcss": {
      base: process.cwd(),
      // paths — массив абсолютных или относительных путей.
      // 'base' указывать НЕ обязательно — он здесь, чтобы PostCSS-loader
      // мог корректно разрешить относительные пути.
      paths: [
        "./src/**/*.{ts,tsx,js,jsx}",
      ],
    },
  },
};

export default config;
