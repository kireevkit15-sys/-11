import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'key', label: 'Ключ', required: true },
  { name: 'value', label: 'Значение', type: 'number', required: true },
  { name: 'label', label: 'Подпись', required: true },
  { name: 'suffix', label: 'Суффикс (напр. +)' },
  { name: 'caption', label: 'Пояснение' },
];

export default function NewSiteStatisticPage() {
  return <EntityFormPage entity="site-statistics" entityLabel="статистика" fields={fields} />;
}