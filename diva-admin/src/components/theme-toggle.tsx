'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/** Переключатель светлой/тёмной темы. Класс .dark на <html>, выбор в localStorage. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('diva-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-white/50 transition-all hover:bg-white/10 hover:text-white ${className}`}
      aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="text-sm">{dark ? 'Светлая тема' : 'Тёмная тема'}</span>
    </button>
  );
}
