'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Бухгалтерия', 'ФСИ', 'Цены и оплата', 'О компании', 'Прочее'];

export default function NewFaqPage() {
  const router = useRouter();
  const [form, setForm] = useState({ question: '', answer: '', category: 'Бухгалтерия' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.question.trim()) newErrors.question = 'Вопрос обязателен';
    if (!form.answer.trim()) newErrors.answer = 'Ответ обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка создания');
      }
      router.push('/admin/faqs');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Ошибка сервера');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/faqs" className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> К списку FAQ
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Новый FAQ</h1>

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" /> {serverError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Вопрос <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder="Как открыть ООО?"
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.question ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.question && <p className="text-sm text-red-600 mt-1">{errors.question}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Категория</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ответ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={5}
              placeholder="Для открытия ООО вам потребуется..."
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y ${errors.answer ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.answer && <p className="text-sm text-red-600 mt-1">{errors.answer}</p>}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 text-white rounded-xl font-medium transition-all disabled:opacity-50">
              <Save className="w-5 h-5" /> {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link href="/admin/faqs" className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
