import api from './api'

export const commissionsAPI = {
  // Payout Config
  getPayoutConfig: (pospId) => api.get(`/insurance/commissions/payout-config/${pospId}`),
  setPayoutConfig: (data) => api.post('/insurance/commissions/payout-config', data),
  listPayoutConfigs: (params) => api.get('/insurance/commissions/payout-config', { params }),
}

export default commissionsAPI
