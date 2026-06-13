/**
 * Diva Admin - New Service Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const TAX_SYSTEMS = [
  { value: 'УСН-Д', label: 'УСН-Д (Income)' },
  { value: 'УСН-ДР', label: 'УСН-ДР (Income-Expenses)' },
  { value: 'ОСН', label: 'ОСН (General)' },
  { value: 'АУСН', label: 'АУСН (Automated)' },
  { value: 'ПСН', label: 'ПСН (Patent)' },
  { value: 'ФСИ', label: 'ФСИ (Startup Fund)' },
  { value: 'Разовое', label: 'One-time' },
];

interface FormData {
  title: string;
  slug: string;
  taxSystem: string;
  basePrice: string;
  includes: string[];
  targetAudience: string;
  isHighlighted: boolean;
}

export default function NewServicePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    title: '',
    slug: '',
    taxSystem: 'УСН-Д',
    basePrice: '',
    includes: [],
    targetAudience: '',
    isHighlighted: false,
  });
  const [newInclude, setNewInclude] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: !prev.slug || prev.slug === generateSlug(prev.title)
        ? generateSlug(value)
        : prev.slug,
    }));
  };

  const addInclude = () => {
    if (newInclude.trim()) {
      setForm((prev) => ({
        ...prev,
        includes: [...prev.includes, newInclude.trim()],
      }));
      setNewInclude('');
    }
  };

  const removeInclude = (index: number) => {
    setForm((prev) => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.slug.trim()) newErrors.slug = 'Slug is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          taxSystem: form.taxSystem,
          basePrice: form.basePrice ? parseInt(form.basePrice) : null,
          includes: form.includes,
          targetAudience: form.targetAudience || null,
          isHighlighted: form.isHighlighted,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create service');
      }

      router.push('/admin/services');
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <Link
        href="/admin/services"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Services
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Service</h1>

      {/* Error */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Accounting for Startups"
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                }))
              }
              placeholder="accounting-for-startups"
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                errors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            <p className="text-sm text-gray-500 mt-1">
              URL: /services/{form.slug || '...'}
            </p>
            {errors.slug && (
              <p className="text-sm text-red-600 mt-1">{errors.slug}</p>
            )}
          </div>

          {/* Tax System */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tax System
            </label>
            <select
              value={form.taxSystem}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, taxSystem: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              {TAX_SYSTEMS.map((sys) => (
                <option key={sys.value} value={sys.value}>
                  {sys.label}
                </option>
              ))}
            </select>
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Base Price (₽)
            </label>
            <input
              type="number"
              value={form.basePrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, basePrice: e.target.value }))
              }
              placeholder="15000"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty for "On request"
            </p>
          </div>

          {/* Includes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What's Included
            </label>
            <div className="space-y-2">
              {form.includes.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-4 py-2 bg-gray-50 rounded-lg text-sm">
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeInclude(i)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclude}
                  onChange={(e) => setNewInclude(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addInclude())
                  }
                  placeholder="Add item..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={addInclude}
                  className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, targetAudience: e.target.value }))
              }
              placeholder="FSU grant recipients"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Highlighted */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="highlighted"
              checked={form.isHighlighted}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isHighlighted: e.target.checked }))
              }
              className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="highlighted" className="text-sm font-medium text-gray-700">
              Featured service
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Service'}
            </button>
            <Link
              href="/admin/services"
              className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
