// src/components/AnnouncementsAdmin/index.ts
export { default as AnnouncementsList } from './AnnouncementsList';
export { default as AnnouncementForm } from './AnnouncementForm';
export { default as AnnouncementPreview } from './AnnouncementPreview';
export { default as AnnouncementsStats } from './AnnouncementsStats';

// Re-exportar tipos si es necesario
export type { 
  Announcement, 
  AnnouncementFormData, 
  AnnouncementStats 
} from '../../services/announcementsService';