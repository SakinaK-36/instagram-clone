import { API } from './client';

export const registerUser = async (data: Record<string, string>) => {
  const response = await API.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: Record<string, string>) => {
  const response = await API.post('/auth/login', data);
  return response.data;
};