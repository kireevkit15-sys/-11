import { EntityFormPage } from '@/components/EntityFormPage';

const fields = [
  { name: 'term', label: 'Термин', required: true },
  { name: 'definition', label: 'Определение', type: 'textarea', required: true },
  { name: 'category', label: 'Категория' },
];

export default function NewGlossaryTermPage() {
  return <EntityFormPage entity="glossary" entityLabel="термин" fields={fields} />;
}