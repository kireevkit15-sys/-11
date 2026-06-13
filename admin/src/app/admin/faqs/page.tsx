'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MessageSquare, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchFaqs(); }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      setFaqs(data.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить FAQ?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
      fetchFaqs();
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">FAQ</h1>
        </div>
        <Link href="/admin/faqs/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg font-medium hover:from-violet-700 transition-all">
          <Plus className="w-5 h-5" /> Добавить FAQ
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Нет вопросов-ответов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                      {faq.category}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/faqs/${faq.id}`} className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(faq.id)} disabled={deletingId === faq.id} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
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
