import { EntityListPage } from '@/components/EntityListPage';
import { Video } from 'lucide-react';

export default function VideosPage() {
  return (
    <EntityListPage
      entity="videos"
      entityLabel="Видео"
      entityKey="title"
      icon={<Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}