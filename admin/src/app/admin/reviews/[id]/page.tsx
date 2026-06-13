'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const SOURCES = ['VK', 'Telegram', 'Email', 'Google', 'Яндекс', 'Другое'];

export default function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [reviewId, setReviewId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ authorName: '', authorProject: '', text: '', rating: 5, source: 'VK', sourceUrl: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    params.then(async ({ id }) => {
      setReviewId(id);
      const res = await fetch(`/api/reviews/${id}`);
      const data = await res.json();
      if (data.data) setForm({
        authorName: data.data.authorName || '',
        authorProject: data.data.authorProject || '',
        text: data.data.text || '',
        rating: data.data.rating || 5,
        source: data.data.source || 'VK',
        sourceUrl: data.data.sourceUrl || '',
      });
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.authorName.trim() || !form.text.trim()) {
      setError('Имя автора и текст обязательны');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push('/admin/reviews');
      else {
        const data = await res.json();
        setError(data.error || 'Ошибка');
      }
    } catch (err) {
      setError('Ошибка сервера');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/reviews" className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> К списку
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактирование отзыва</h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя автора *</label>
            <input type="text" value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Проект</label>
            <input type="text" value={form.authorProject} onChange={e => setForm(f => ({ ...f, authorProject: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Текст отзыва *</label>
            <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Рейтинг</label>
              <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Источник</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL источника</label>
            <input type="url" value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl font-medium hover:from-violet-700 disabled:opacity-50">
              <Save className="w-5 h-5" /> {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link href="/admin/reviews" className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
