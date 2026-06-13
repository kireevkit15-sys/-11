'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', position: '', bio: '', education: '', yearsExperience: '', specialization: '', quote: '', photoUrl: '', isFounder: false });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.position.trim()) {
      setError('ФИО и должность обязательны');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
        }),
      });
      if (res.ok) router.push('/admin/team-members');
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

  return (
    <div className="max-w-2xl">
      <Link href="/admin/team-members" className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> К списку
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Новый член команды</h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            { name: 'fullName', label: 'ФИО *', placeholder: 'Иванов Иван Иванович' },
            { name: 'position', label: 'Должность *', placeholder: 'Главный бухгалтер' },
            { name: 'specialization', label: 'Специализация', placeholder: 'ФСИ, стартапы' },
            { name: 'education', label: 'Образование', placeholder: 'МГУ, 2010' },
            { name: 'yearsExperience', label: 'Опыт (лет)', placeholder: '10', type: 'number' },
            { name: 'photoUrl', label: 'URL фото', placeholder: 'https://...' },
            { name: 'quote', label: 'Цитата', placeholder: '"Мы любим свою работу"' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={form[field.name as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Биография</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={4}
              placeholder="Расскажите о себе..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="founder" checked={form.isFounder} onChange={e => setForm(f => ({ ...f, isFounder: e.target.checked }))} className="w-5 h-5" />
            <label htmlFor="founder" className="text-sm font-medium text-gray-700">Основатель компании</label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl font-medium hover:from-violet-700 disabled:opacity-50">
              <Save className="w-5 h-5" /> {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link href="/admin/team-members" className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
