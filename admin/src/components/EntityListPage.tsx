'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface EntityListPageProps {
  entity: string;
  entityLabel: string;
  entityKey?: string;
}

interface Entity {
  id: string;
  [key: string]: unknown;
}

export function EntityListPage({ entity, entityLabel, entityKey }: EntityListPageProps) {
  const [items, setItems] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/${entity}`).then(r => r.json()).then(d => setItems(d.data || [])).catch(console.error).finally(() => setIsLoading(false));
  }, [entity]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Удалить ${entityLabel}?`)) return;
    await fetch(`/api/${entity}/${id}`, { method: 'DELETE' });
    setItems(i => i.filter(x => x.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-900 hover:text-gray-700 mb-2 flex items-center gap-1">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">{entityLabel}</h1>
        </div>
        <Link href={`/admin/${entity}/new`} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg font-medium hover:from-violet-700 transition-all">
          <Plus className="w-5 h-5" /> Добавить
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Нет записей</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">{entityLabel}</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const displayKey = entityKey || Object.keys(item).find(k => ['title', 'name', 'question', 'term', 'label', 'fullName', 'authorName'].includes(k)) || 'id';
                return (
                  <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{String(item[displayKey] || '')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/${entity}/${item.id}`} className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
