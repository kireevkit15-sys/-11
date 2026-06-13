'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  position: string;
  photoUrl: string | null;
  isFounder: boolean;
}

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/team-members').then(r => r.json()).then(d => {
      setMembers(d.data || []);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить?')) return;
    await fetch(`/api/team-members/${id}`, { method: 'DELETE' });
    setMembers(m => m.filter(x => x.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
        </div>
        <Link href="/admin/team-members/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg font-medium hover:from-violet-700 transition-all">
          <Plus className="w-5 h-5" /> Добавить
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Нет членов команды</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center text-white font-semibold">
                    {m.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{m.fullName}</h3>
                    <p className="text-sm text-gray-500">{m.position}</p>
                    {m.isFounder && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded mt-1">Основатель</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/team-members/${m.id}`} className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
