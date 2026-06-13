import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'platform', label: 'Платформа', required: true },
  { name: 'label', label: 'Название', required: true },
  { name: 'href', label: 'Ссылка', required: true },
  { name: 'actionText', label: 'Текст кнопки' },
  { name: 'iconColor', label: 'Цвет иконки' },
];

export default function EditSocialLinkPage() {
  return <EntityFormPage entity="social-links" entityLabel="соцсеть" fields={fields} />;
}