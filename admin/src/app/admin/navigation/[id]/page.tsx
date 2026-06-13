import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'label', label: 'Название', required: true },
  { name: 'href', label: 'Ссылка', required: true },
  { name: 'type', label: 'Тип', type: 'select', options: ['nav', 'about'] },
  { name: 'icon', label: 'Иконка' },
  { name: 'description', label: 'Описание' },
];

export default function EditNavigationPage() {
  return <EntityFormPage entity="navigation" entityLabel="пункт меню" fields={fields} />;
}