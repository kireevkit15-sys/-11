/**
 * Diva Admin — Entity Form Page Component
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'select';
  options?: string[];
  required?: boolean;
}

interface EntityFormPageProps {
  entity: string;
  entityLabel: string;
  fields: FormField[];
}

export function EntityFormPage({ entity, entityLabel, fields }: EntityFormPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf(entity) + 1;
    if (idIndex > 0 && pathParts[idIndex] && pathParts[idIndex] !== 'new') {
      setIsFetching(true);
      fetch(`/api/${entity}/${pathParts[idIndex]}`).then(r => r.json()).then(d => {
        if (d.data) {
          const initial: Record<string, string> = {};
          fields.forEach(f => {
            const val = d.data[f.name];
            initial[f.name] = val !== null && val !== undefined ? String(val) : '';
          });
          setForm(initial);
        }
      }).finally(() => setIsFetching(false));
    }
  }, [entity, fields]);

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf(entity) + 1;
    const id = idIndex > 0 ? pathParts[idIndex] : null;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/${entity}/${id}` : `/api/${entity}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push(`/admin/${entity}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Ошибка');
      }
    } catch {
      setError('Ошибка сервера');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/${entity}`} className="text-sm text-gray-900 hover:text-gray-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> К списку
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {form && Object.keys(form).length > 0 ? `Редактирование ${entityLabel}` : `Новый ${entityLabel}`}
      </h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={form[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="">Выберите...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={form[field.name] === 'true'}
                  onChange={e => handleChange(field.name, e.target.checked ? 'true' : 'false')}
                  className="w-5 h-5"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={form[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl font-medium hover:from-violet-700 disabled:opacity-50">
              <Save className="w-5 h-5" /> {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link href={`/admin/${entity}`} className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
