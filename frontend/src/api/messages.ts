import { API } from './client';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read?: boolean;
}

export interface ConversationUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface Conversation {
  user: ConversationUser;
  lastMessage: string;
  createdAt: string;
  unreadCount: number;
}

export const fetchConversations = async (): Promise<Conversation[]> => {
  const response = await API.get('/messages/conversations');
  return response.data;
};

export const fetchMessages = async (userId: string): Promise<Message[]> => {
  const response = await API.get(`/messages/${userId}`);
  return response.data;
};

export const postMessage = async (userId: string, content: string): Promise<Message> => {
  const response = await API.post(`/messages/${userId}`, { content });
  return response.data;
};