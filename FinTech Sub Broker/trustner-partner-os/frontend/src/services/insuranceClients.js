import api from './api'

export const insuranceClientsAPI = {
  create: (data) => api.post('/insurance/clients', data),
  getAll: (params) => api.get('/insurance/clients', { params }),
  getOne: (id) => api.get(`/insurance/clients/${id}`),
  update: (id, data) => api.patch(`/insurance/clients/${id}`, data),
  getPortfolio: (id) => api.get(`/insurance/clients/${id}/portfolio`),
  getStats: () => api.get('/insurance/clients/stats'),
}

export default insuranceClientsAPI
