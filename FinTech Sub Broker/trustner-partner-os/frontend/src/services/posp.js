import api from './api'

export const pospAPI = {
  // Standard POSP endpoints
  getAll: (params) => api.get('/insurance/posp', { params }),
  getById: (id) => api.get(`/insurance/posp/${id}`),
  register: (data) => api.post('/insurance/posp/register', data),
  update: (id, data) => api.patch(`/insurance/posp/${id}`, data),
  updateBankDetails: (id, data) => api.patch(`/insurance/posp/${id}/bank-details`, data),

  // Training lifecycle
  startTraining: (id) => api.post(`/insurance/posp/${id}/training/start`),
  updateTrainingProgress: (id, data) => api.post(`/insurance/posp/${id}/training/progress`, data),
  completeTraining: (id) => api.post(`/insurance/posp/${id}/training/complete`),
  scheduleExam: (id, examDate) => api.post(`/insurance/posp/${id}/exam/schedule`, { examDate }),
  recordExamResult: (id, passed, score) => api.post(`/insurance/posp/${id}/exam/result`, { passed, score }),
  issueCertificate: (id, certNumber, expiryDate) => api.post(`/insurance/posp/${id}/certificate/issue`, { certNumber, expiryDate }),
  activate: (id) => api.post(`/insurance/posp/${id}/activate`),
  suspend: (id, reason) => api.post(`/insurance/posp/${id}/suspend`, { reason }),
  terminate: (id, reason) => api.post(`/insurance/posp/${id}/terminate`, { reason }),

  // Performance
  getPerformance: (id) => api.get(`/insurance/posp/${id}/performance`),
  getDashboard: (id) => api.get(`/insurance/posp/${id}/dashboard`),

  // Search for dropdown selector
  search: (q, limit = 20) => api.get('/insurance/posp/search', { params: { q, limit } }),

  // POSP self-service dashboard
  getMyDashboard: () => api.get('/insurance/posp/my-dashboard'),

  // Hierarchy-scoped endpoints
  getMyPOSPs: (params) => api.get('/insurance/posp/my-posps', { params }),
  getMyTeam: () => api.get('/insurance/posp/my-team'),

  // Export (returns blob for file download)
  exportData: async (format = 'xlsx', filters = {}) => {
    const params = { format, ...filters }
    const response = await api.get('/insurance/posp/export', {
      params,
      responseType: 'blob',
    })
    return response
  },

  // Helper: trigger download from export blob
  downloadExport: async (format = 'xlsx', filters = {}) => {
    try {
      const blob = await pospAPI.exportData(format, filters)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      const ext = format === 'csv' ? 'csv' : 'xlsx'
      link.setAttribute('download', `posps_${new Date().toISOString().slice(0, 10)}.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  },
}

export default pospAPI
