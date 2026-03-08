const BASE = import.meta.env.VITE_API_URL || ''

const getToken = () => localStorage.getItem('advisor_token')

const headers = (auth = false) => ({
  'Content-Type': 'application/json',
  ...(auth ? { Authorization: `Bearer ${getToken()}` } : {})
})

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || err.message || 'Request failed')
  }
  return res.json()
}

export const api = {
  // === CAS Parser (public) ===
  parseCAS: (file, password) => {
    const form = new FormData()
    form.append('file', file)
    if (password) form.append('password', password)
    return fetch(`${BASE}/api/parse-cas`, { method: 'POST', body: form }).then(handleResponse)
  },

  // === Reports (advisor auth) ===
  generateReport: (type, data) =>
    fetch(`${BASE}/api/generate-report`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify({ type, data })
    }).then(handleResponse),

  sendEmail: (payload) =>
    fetch(`${BASE}/api/generate-report/email`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(payload)
    }).then(handleResponse),

  sendWhatsApp: (payload) =>
    fetch(`${BASE}/api/generate-report/whatsapp`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // === Clients (advisor auth) ===
  getClients: () =>
    fetch(`${BASE}/api/clients`, { headers: headers(true) }).then(handleResponse),

  createClient: (data) =>
    fetch(`${BASE}/api/clients`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(data)
    }).then(handleResponse),

  getClient: (id) =>
    fetch(`${BASE}/api/clients/${id}`, { headers: headers(true) }).then(handleResponse),

  getPortfolio: (id) =>
    fetch(`${BASE}/api/clients/${id}/portfolio`, { headers: headers(true) }).then(handleResponse),

  savePortfolio: (clientId, data) =>
    fetch(`${BASE}/api/clients/${clientId}/portfolio`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify(data)
    }).then(handleResponse),

  // === Reports list ===
  getReports: (clientId) =>
    fetch(`${BASE}/api/reports/${clientId}`, { headers: headers(true) }).then(handleResponse),

  // === NAV (public) ===
  getNAV: (code) =>
    fetch(`${BASE}/api/nav/${code}`).then(handleResponse),

  searchFunds: (query) =>
    fetch(`${BASE}/api/nav/search/${encodeURIComponent(query)}`).then(handleResponse),

  getNAVHistory: (code, days = 30) =>
    fetch(`${BASE}/api/nav/${code}/history?days=${days}`).then(handleResponse),

  // === Auth ===
  advisorLogin: (email) =>
    fetch(`${BASE}/api/auth/advisor-login`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ email })
    }).then(handleResponse),

  verifyOTP: (email, token) =>
    fetch(`${BASE}/api/auth/verify-otp`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ email, token })
    }).then(handleResponse),

  getMe: () =>
    fetch(`${BASE}/api/auth/me`, { headers: headers(true) }).then(handleResponse),

  // === Review Workflow ===
  submitForReview: (data) =>
    fetch(`${BASE}/api/review/submit`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  getReviewQueue: (status) =>
    fetch(`${BASE}/api/review/queue${status ? `?status=${status}` : ''}`, {
      headers: headers(true)
    }).then(handleResponse),

  getReviewItem: (id) =>
    fetch(`${BASE}/api/review/queue/${id}`, { headers: headers(true) }).then(handleResponse),

  updateReview: (id, decision) =>
    fetch(`${BASE}/api/review/queue/${id}`, {
      method: 'PATCH', headers: headers(true),
      body: JSON.stringify(decision)
    }).then(handleResponse),

  generateReviewedReport: (id) =>
    fetch(`${BASE}/api/review/queue/${id}/generate`, {
      method: 'POST', headers: headers(true)
    }).then(handleResponse),
}
