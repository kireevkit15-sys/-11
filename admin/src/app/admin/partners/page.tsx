'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Edit, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  role: string;
  company: string | null;
  photoUrl: string | null;
  badge: string;
  category: string;
  available: boolean;
  featured: boolean;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partners').then(r => r.json()).then(d => {
      setPartners(d.data || []);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить партнёра?')) return;
    await fetch(`/api/partners/${id}`, { method: 'DELETE' });
    setPartners(m => m.filter(x => x.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Партнёры</h1>
        </div>
        <Link href="/admin/partners/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg font-medium hover:from-violet-700 transition-all">
          <Plus className="w-5 h-5" /> Добавить
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Нет партнёров</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {p.photoUrl ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.role}</p>
                    {p.company && <p className="text-xs text-gray-400">{p.company}</p>}
                    <div className="flex gap-1 mt-1">
                      {p.featured && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">Избранный</span>
                      )}
                      {!p.available && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">Недоступен</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/partners/${p.id}`} className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
