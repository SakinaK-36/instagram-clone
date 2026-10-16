import type { Post } from './posts';
import { API } from './client';

export interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: Post[];
}

export interface BasicUser {
  id: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export const searchUsers = async (query: string): Promise<BasicUser[]> => {
  const response = await API.get('/users/search', { params: { q: query } });
  return response.data;
};

export const toggleFollowUser = async (
  userId: string
): Promise<{ success: boolean; following: boolean }> => {
  const response = await API.post(`/users/follow/${userId}`);
  return response.data;
};

export const fetchUserProfile = async (username: string): Promise<UserProfile> => {
  const response = await API.get(`/users/profile/${username}`);
  return response.data;
};

export const fetchUserById = async (id: string): Promise<BasicUser> => {
  const response = await API.get(`/users/id/${id}`);
  return response.data;
};