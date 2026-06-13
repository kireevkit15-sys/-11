import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'title', label: 'Заголовок', required: true },
  { name: 'slug', label: 'Slug', required: true },
  { name: 'excerpt', label: 'Краткое описание', type: 'textarea' as const },
  { name: 'body', label: 'Содержание', type: 'textarea' as const },
  { name: 'coverUrl', label: 'URL обложки' },
  { name: 'category', label: 'Категория', type: 'select' as const, options: ['ФСИ', 'Налоги', 'ООО', 'Гранты', 'Прочее'] },
  { name: 'readingMinutes', label: 'Время чтения (мин)', type: 'number' as const },
  { name: 'seoTitle', label: 'SEO заголовок' },
  { name: 'seoDescription', label: 'SEO описание' },
];

export default function NewArticlePage() {
  return <EntityFormPage entity="articles" entityLabel="статья" fields={fields} />;
}
