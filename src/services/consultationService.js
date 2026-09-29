import apiClient from './apiClient';

export const consultationService = {
  getMyRequests: async () => {
    const response = await apiClient.get('/consultations/my-requests');
    const requests = response.data?.requests ?? response.data;
    return Array.isArray(requests) ? requests : [];
  },
  approveRequest: (id) => {
    console.log('[consultationService] Approving request:', id);
    return apiClient.put(`/consultations/request/${id}/approve`);
  },
  completeConsultation: (id, review) => (
    apiClient.post(`/consultations/${id}/complete`, review)
  ),
  createConsultationReview: (id, review) => (
    apiClient.post(`/consultations/${id}/review`, review)
  ),
  getChatHistory: async (consultationId) => {
    const response = await apiClient.get(`/chat/consultations/${consultationId}/messages`);
    const history = response.data?.messages ?? response.data;
    return Array.isArray(history) ? history : [];
  },
};