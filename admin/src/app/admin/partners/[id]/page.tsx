'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Plus, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ['fullstack', 'frontend', 'backend', 'design', 'devops', 'marketing', 'legal', 'other'];
const BADGES = ['team', 'partner', 'external', 'startup'];

interface PartnerData {
  id: string;
  name: string;
  role: string;
  company: string | null;
  bio: string | null;
  skills: string[];
  githubLink: string | null;
  portfolioLink: string | null;
  vkLink: string | null;
  telegramLink: string | null;
  contact: string | null;
  badge: string;
  hue: number;
  category: string;
  sortOrder: number;
  available: boolean;
  featured: boolean;
  photoUrl: string | null;
}

export default function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [form, setForm] = useState({
    name: '',
    role: '',
    company: '',
    bio: '',
    githubLink: '',
    portfolioLink: '',
    vkLink: '',
    telegramLink: '',
    contact: '',
    badge: 'team',
    hue: '240',
    category: 'fullstack',
    sortOrder: '0',
    available: 'true',
    featured: 'false',
    photoUrl: '',
  });

  useEffect(() => {
    params.then(async (p) => {
      setPartnerId(p.id);
      try {
        const res = await fetch(`/api/partners/${p.id}`);
        const d = await res.json();
        if (d.data) {
          const partner: PartnerData = d.data;
          setForm({
            name: partner.name || '',
            role: partner.role || '',
            company: partner.company || '',
            bio: partner.bio || '',
            githubLink: partner.githubLink || '',
            portfolioLink: partner.portfolioLink || '',
            vkLink: partner.vkLink || '',
            telegramLink: partner.telegramLink || '',
            contact: partner.contact || '',
            badge: partner.badge || 'team',
            hue: String(partner.hue || 240),
            category: partner.category || 'fullstack',
            sortOrder: String(partner.sortOrder || 0),
            available: String(partner.available ?? true),
            featured: String(partner.featured ?? false),
            photoUrl: partner.photoUrl || '',
          });
          setSkills(partner.skills || []);
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setIsFetching(false);
      }
    });
  }, [params]);

  const handleChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(s => [...s, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(s => s.filter(x => x !== skill));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        handleChange('photoUrl', data.url);
      } else {
        const data = await res.json();
        setError(data.error || 'Ошибка загрузки');
      }
    } catch (err) {
      setError('Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      setError('Имя и роль обязательны');
      return;
    }
    if (!partnerId) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hue: parseInt(form.hue) || 240,
          sortOrder: parseInt(form.sortOrder) || 0,
          available: form.available === 'true',
          featured: form.featured === 'true',
          skills,
        }),
      });
      if (res.ok) router.push('/admin/partners');
      else {
        const data = await res.json();
        setError(data.error || 'Ошибка');
      }
    } catch (err) {
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
      <Link href="/admin/partners" className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> К списку
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактирование партнёра</h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Фото */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Фото</label>
            <div className="flex items-start gap-4">
              {form.photoUrl ? (
                <div className="relative">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                    <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('photoUrl', '')}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {isUploading ? 'Загрузка...' : 'Загрузить фото'}
                </button>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, WebP до 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Иванов Иван"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Роль *</label>
              <input
                type="text"
                value={form.role}
                onChange={e => handleChange('role', e.target.value)}
                placeholder="Frontend Developer"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Компания</label>
              <input
                type="text"
                value={form.company}
                onChange={e => handleChange('company', e.target.value)}
                placeholder="Syntax Labs"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Категория</label>
              <select
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Биография</label>
            <textarea
              value={form.bio}
              onChange={e => handleChange('bio', e.target.value)}
              rows={3}
              placeholder="Расскажите о себе..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Навыки</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-violet-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="React, TypeScript..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button type="button" onClick={addSkill} className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">GitHub</label>
              <input
                type="text"
                value={form.githubLink}
                onChange={e => handleChange('githubLink', e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Портфолио</label>
              <input
                type="text"
                value={form.portfolioLink}
                onChange={e => handleChange('portfolioLink', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ВКонтакте</label>
              <input
                type="text"
                value={form.vkLink}
                onChange={e => handleChange('vkLink', e.target.value)}
                placeholder="https://vk.com/..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telegram</label>
              <input
                type="text"
                value={form.telegramLink}
                onChange={e => handleChange('telegramLink', e.target.value)}
                placeholder="@username"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Контакт (email/телефон)</label>
            <input
              type="text"
              value={form.contact}
              onChange={e => handleChange('contact', e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Badge</label>
              <select
                value={form.badge}
                onChange={e => handleChange('badge', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {BADGES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hue (цвет)</label>
              <input
                type="number"
                value={form.hue}
                onChange={e => handleChange('hue', e.target.value)}
                min="0"
                max="360"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Сортировка</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => handleChange('sortOrder', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" checked={form.available === 'true'} onChange={e => handleChange('available', e.target.checked ? 'true' : 'false')} className="w-4 h-4" />
                <label htmlFor="available" className="text-sm text-gray-700">Доступен</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={form.featured === 'true'} onChange={e => handleChange('featured', e.target.checked ? 'true' : 'false')} className="w-4 h-4" />
                <label htmlFor="featured" className="text-sm text-gray-700">Избранный</label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl font-medium hover:from-violet-700 disabled:opacity-50">
              <Save className="w-5 h-5" /> {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link href="/admin/partners" className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
