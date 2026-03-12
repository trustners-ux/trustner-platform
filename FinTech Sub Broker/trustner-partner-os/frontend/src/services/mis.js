import api from './api'

export const misAPI = {
  // MIS Entries
  createEntry: (data) => api.post('/insurance/mis/entries', data),
  uploadFile: (data) => api.post('/insurance/mis/entries/upload', data),
  getEntries: (params) => api.get('/insurance/mis/entries', { params }),
  getEntry: (id) => api.get(`/insurance/mis/entries/${id}`),
  updateEntry: (id, data) => api.patch(`/insurance/mis/entries/${id}`, data),
  resolveGaps: (id, data) => api.patch(`/insurance/mis/entries/${id}/resolve-gaps`, data),
  getMyEntries: (params) => api.get('/insurance/mis/entries/my-entries', { params }),
  getStats: (params) => api.get('/insurance/mis/entries/stats', { params }),
  getPending: (params) => api.get('/insurance/mis/entries/pending', { params }),

  // Verification
  verify: (entryId, data) => api.post(`/insurance/mis/verification/${entryId}/verify`, data),
  getPendingVerification: (params) => api.get('/insurance/mis/verification/pending', { params }),
  getVerificationHistory: (entryId) => api.get(`/insurance/mis/verification/history/${entryId}`),
  assignRole: (data) => api.post('/insurance/mis/verification/roles', data),
  getRoles: (params) => api.get('/insurance/mis/verification/roles', { params }),
  removeRole: (id) => api.delete(`/insurance/mis/verification/roles/${id}`),

  // Reports
  generateReport: (data) => api.post('/insurance/mis/reports/generate', data),
  getReports: (params) => api.get('/insurance/mis/reports', { params }),
  getReport: (id) => api.get(`/insurance/mis/reports/${id}`),
  getSummary: (params) => api.get('/insurance/mis/reports/summary', { params }),

  // Dashboard Analytics
  getRenewalsDue: (period = '7days') => api.get('/insurance/mis/dashboard/renewals-due', { params: { period } }),
  getCompanyDistribution: () => api.get('/insurance/mis/dashboard/company-distribution'),
  getLOBDistribution: () => api.get('/insurance/mis/dashboard/lob-distribution'),
  getBusinessSummary: () => api.get('/insurance/mis/dashboard/business-summary'),
  getGrowthMetrics: () => api.get('/insurance/mis/dashboard/growth-metrics'),
  getClientStats: () => api.get('/insurance/mis/dashboard/client-stats'),
  getRenewalLossRatio: () => api.get('/insurance/mis/dashboard/renewal-loss-ratio'),

  // Hierarchy
  getHierarchyTree: (rootId) => api.get('/insurance/hierarchy/tree', { params: { rootId } }),
  getHierarchyLevels: () => api.get('/insurance/hierarchy/levels'),
  createLevel: (data) => api.post('/insurance/hierarchy/levels', data),
  updateLevel: (id, data) => api.patch(`/insurance/hierarchy/levels/${id}`, data),
  createNode: (data) => api.post('/insurance/hierarchy/nodes', data),
  updateNode: (id, data) => api.patch(`/insurance/hierarchy/nodes/${id}`, data),
  getTeam: (nodeId) => api.get(`/insurance/hierarchy/team/${nodeId}`),
  getUserPosition: (userId) => api.get(`/insurance/hierarchy/user/${userId}`),
  getDepartmentHierarchy: (dept) => api.get(`/insurance/hierarchy/department/${dept}`),

  // Product Grades
  getGrades: (params) => api.get('/insurance/product-grades', { params }),
  getGrade: (productId) => api.get(`/insurance/product-grades/${productId}`),
  assignGrade: (data) => api.post('/insurance/product-grades', data),
  updateGrade: (id, data) => api.patch(`/insurance/product-grades/${id}`, data),
  autoGrade: () => api.post('/insurance/product-grades/auto-grade'),
  getGradeDistribution: () => api.get('/insurance/product-grades/distribution'),

  // Contests
  getContests: (params) => api.get('/insurance/contests', { params }),
  getContest: (id) => api.get(`/insurance/contests/${id}`),
  createContest: (data) => api.post('/insurance/contests', data),
  updateContest: (id, data) => api.patch(`/insurance/contests/${id}`, data),
  activateContest: (id) => api.post(`/insurance/contests/${id}/activate`),
  closeContest: (id) => api.post(`/insurance/contests/${id}/close`),
  calculateContest: (id) => api.post(`/insurance/contests/${id}/calculate`),
  getLeaderboard: (id, params) => api.get(`/insurance/contests/${id}/leaderboard`, { params }),
  addMetric: (id, data) => api.post(`/insurance/contests/${id}/metrics`, data),
  removeMetric: (id, metricId) => api.delete(`/insurance/contests/${id}/metrics/${metricId}`),
  getMyPerformance: (params) => api.get('/insurance/contests/my-performance', { params }),
}

export default misAPI
