import apiClient from './apiClient';

const apiOrigin = (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '');

export const getEbookAssetUrl = (path) => {
  if (typeof path !== 'string' || !path.trim()) return null;
  if (/^https?:\/\//i.test(path)) return path;

  return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`;
};

export const ebookService = {
  // ดึงรายการ E-Book ทั้งหมด (รองรับการค้นหาและกรองตามหมวดหมู่)
  getEbooks: async (search = '', category = '') => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;

    const response = await apiClient.get('/ebooks', { params });
    return response.data;
  },

  // ดึงรายการหมวดหมู่ E-Book
  getCategories: async () => {
    const response = await apiClient.get('/ebooks/categories');
    return response.data;
  },

  // ดึงรายละเอียด E-Book รายเล่ม
  getEbookById: async (id) => {
    const response = await apiClient.get(`/ebooks/${id}`);
    return response.data;
  }
};

export const getFavorites = async () => {
  const response = await apiClient.get('/ebooks/favorites');
  return response.data;
};

export const toggleFavoriteEbook = async (id) => {
  const response = await apiClient.post(`/ebooks/${id}/favorite`);
  return response.data;
};