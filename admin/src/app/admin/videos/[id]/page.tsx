import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'title', label: 'Название', required: true },
  { name: 'videoId', label: 'ID видео', required: true },
  { name: 'platform', label: 'Платформа', type: 'select', options: ['youtube', 'rutube'] },
  { name: 'description', label: 'Описание', type: 'textarea' },
  { name: 'views', label: 'Просмотры', type: 'number' },
  { name: 'duration', label: 'Длительность' },
  { name: 'thumbnailUrl', label: 'URL превью' },
];

export default function EditVideoPage() {
  return <EntityFormPage entity="videos" entityLabel="видео" fields={fields} />;
}