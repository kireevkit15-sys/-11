'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Star, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface Review {
  id: string;
  authorName: string;
  authorProject: string | null;
  text: string;
  rating: number;
  source: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews').then(r => r.json()).then(d => setReviews(d.data || [])).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить?')) return;
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    setReviews(r => r.filter(x => x.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Отзывы</h1>
        </div>
        <Link href="/admin/reviews/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg font-medium hover:from-violet-700 transition-all">
          <Plus className="w-5 h-5" /> Добавить
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Нет отзывов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{r.authorName}</span>
                    {r.authorProject && <span className="text-sm text-gray-500">({r.authorProject})</span>}
                    <span className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{r.source}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{r.text}</p>
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/reviews/${r.id}`} className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
