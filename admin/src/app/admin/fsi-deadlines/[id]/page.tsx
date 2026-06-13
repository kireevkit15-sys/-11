import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'title', label: 'Название', required: true },
  { name: 'description', label: 'Описание', type: 'textarea' },
  { name: 'deadlineDate', label: 'Дата дедлайна', required: true },
  { name: 'grantType', label: 'Тип гранта', type: 'select', options: ['Старт', 'Развитие', 'Коммерциализация', 'Прочее'] },
  { name: 'stage', label: 'Этап' },
  { name: 'url', label: 'URL' },
];

export default function EditFsiDeadlinePage() {
  return <EntityFormPage entity="fsi-deadlines" entityLabel="дедлайн" fields={fields} />;
}