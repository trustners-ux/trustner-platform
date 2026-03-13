import api from './api'

export const dataMigrationAPI = {
  getStatus: () => api.get('/insurance/data-migration/status'),
  importClients: (rows) => api.post('/insurance/data-migration/clients', { rows }),
  importPolicyRegister: (rows) => api.post('/insurance/data-migration/policy-register', { rows }),
  importPayoutData: (rows) => api.post('/insurance/data-migration/payout-data', { rows }),
  importRenewalDue: (rows) => api.post('/insurance/data-migration/renewal-due', { rows }),
  syncToInsurancePolicies: () => api.post('/insurance/data-migration/sync-to-policies'),
  smartImport: (rows, headers) => api.post('/insurance/data-migration/smart-import', { rows, headers }),
}

export default dataMigrationAPI
