import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'title', label: 'Название', required: true },
  { name: 'slug', label: 'Slug', required: true },
  { name: 'clientName', label: 'Имя клиента' },
  { name: 'clientLogoUrl', label: 'URL логотипа' },
  { name: 'task', label: 'Задача', type: 'textarea' },
  { name: 'solution', label: 'Решение', type: 'textarea' },
  { name: 'result', label: 'Результат', type: 'textarea' },
  { name: 'quote', label: 'Цитата' },
  { name: 'quoteAuthor', label: 'Автор цитаты' },
  { name: 'period', label: 'Период' },
];

export default function NewCaseStudyPage() {
  return <EntityFormPage entity="case-studies" entityLabel="кейс" fields={fields} />;
}