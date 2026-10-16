import { API } from './client';

export interface NotificationItem {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  read: boolean;
  createdAt: string;
  issuer?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  post?: {
    id: string;
    imageUrl: string;
  } | null;
}

export const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const response = await API.get('/notifications');
  return response.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const response = await API.get('/notifications/unread-count');
  return response.data.count;
};

export const markNotificationsRead = async (): Promise<void> => {
  await API.put('/notifications/read');
};