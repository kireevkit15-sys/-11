import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'title', label: 'Заголовок', required: true },
  { name: 'content', label: 'Содержание', type: 'textarea' as const, required: true },
  { name: 'key', label: 'Ключ', required: true },
  { name: 'category', label: 'Категория' },
  { name: 'badge', label: 'Бейдж', type: 'select' as const, options: ['team', 'client'] },
  { name: 'hue', label: 'Оттенок (HUE)', type: 'number' as const },
  { name: 'available', label: 'Доступно', type: 'checkbox' as const },
  { name: 'featured', label: 'Рекомендуемое', type: 'checkbox' as const },
];

export default function NewAnnouncementPage() {
  return <EntityFormPage entity="announcements" entityLabel="объявление" fields={fields} />;
}
