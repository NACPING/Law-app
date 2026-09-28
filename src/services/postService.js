import apiClient from './apiClient';

export const postService = {
  // ดึงกระทู้ทั้งหมด
  getPosts: async () => {
    const response = await apiClient.get('/posts');
    return response.data;
  },
  
  // ดึงรายละเอียดกระทู้ + คอมเมนต์
  getPostById: async (id) => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data;
  },
  
  // ตั้งกระทู้ใหม่
  createPost: async (title, content) => {
    const response = await apiClient.post('/posts', { title, content });
    return response.data;
  },
  
  // คอมเมนต์ตอบกระทู้
  createComment: async (postId, content) => {
    const response = await apiClient.post(`/posts/${postId}/comments`, { content });
    return response.data;
  }
};