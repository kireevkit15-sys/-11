import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'number', label: 'Номер', required: true },
  { name: 'title', label: 'Заголовок', required: true },
  { name: 'content', label: 'Содержание', type: 'textarea' },
  { name: 'quote', label: 'Цитата' },
  { name: 'hue', label: 'Оттенок (HUE)', type: 'number' },
];

export default function EditTrustPillarPage() {
  return <EntityFormPage entity="trust-pillars" entityLabel="столп доверия" fields={fields} />;
}