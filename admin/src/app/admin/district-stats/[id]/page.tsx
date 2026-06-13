import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'code', label: 'Код региона', required: true },
  { name: 'shortName', label: 'Короткое название', required: true },
  { name: 'name', label: 'Полное название' },
  { name: 'capital', label: 'Столица' },
  { name: 'clients', label: 'Количество клиентов', type: 'number' },
  { name: 'color', label: 'Цвет' },
];

export default function EditDistrictStatPage() {
  return <EntityFormPage entity="district-stats" entityLabel="округ" fields={fields} />;
}