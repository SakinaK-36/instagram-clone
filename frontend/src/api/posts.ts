import { API } from './client';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface Post {
  id: string;
  caption?: string;
  imageUrl: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  likes: { userId: string }[];
  comments: Comment[];
}

// Fetch feed posts (exported as both fetchPosts and getFeedPosts)
// Fetch feed posts (exported as both fetchPosts and getFeedPosts)
export const fetchPosts = async (): Promise<Post[]> => {
  const response = await API.get('/posts');
  return response.data;
};

export const getFeedPosts = fetchPosts;

// Create a new post
export const createPost = async (formData: FormData): Promise<Post> => {
  const response = await API.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Toggle like on a post
export const toggleLikePost = async (postId: string) => {
  const response = await API.post(`/interactions/like/${postId}`);
  return response.data;
};

// Create a comment on a post
export const createComment = async (postId: string, content: string): Promise<Comment> => {
  const response = await API.post(`/interactions/comment/${postId}`, { content });
  return response.data;
};

// Delete a post
export const deletePost = async (postId: string): Promise<void> => {
  await API.delete(`/posts/${postId}`);
};