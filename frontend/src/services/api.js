const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Frontend HTTP Client Helper API Wrapper
 * Programmatically routes request structures to MySQL + Express endpoints.
 * Automatically resolves and appends active JWT Bearer authentication headers.
 */
const request = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  });

  // Handle Token Expiry / Session Revocation
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.message || 'API request failed.');
  }

  return payload;
};

export const api = {
  // 1. Dashboard Aggregate statistics
  getStats: async () => {
    return request('/dashboard/stats');
  },

  // 2. Applicant CRUD operations
  getApplicants: async () => {
    return request('/applicants');
  },

  getApplicantById: async (id) => {
    return request(`/applicants/${id}`);
  },

  createApplicant: async (data) => {
    return request('/applicants', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateApplicant: async (id, data) => {
    return request(`/applicants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteApplicant: async (id) => {
    return request(`/applicants/${id}`, {
      method: 'DELETE'
    });
  },

  // 3. Underwriting Assessment triggers
  assessApplicant: async (id) => {
    return request(`/assessments/${id}`, {
      method: 'POST'
    });
  },

  getAssessment: async (id) => {
    return request(`/assessments/${id}`);
  },

  // 4. Binary streaming PDF Report Discharges
  downloadReport: async (id, firstName, lastName) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/applicants/${id}/report`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorPayload = await res.json().catch(() => ({}));
      throw new Error(errorPayload.message || 'Failed to stream underwriting PDF report.');
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create DOM download click hook
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.setAttribute('download', `Underwriting_Report_${firstName}_${lastName}.pdf`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  // 5. Compliance Audit logs (Admin exclusive)
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.action) query.append('action', params.action);
    if (params.userId) query.append('userId', params.userId);
    if (params.targetId) query.append('targetId', params.targetId);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return request(`/audit-logs?${query.toString()}`);
  },

  // 6. Advanced Portfolio Analytics
  getAnalytics: async () => {
    return request('/dashboard/analytics');
  },

  // 7. Applicant Notes & Timeline
  getNotes: async (applicantId) => {
    return request(`/notes/${applicantId}`);
  },

  addNote: async (applicantId, text) => {
    return request(`/notes/${applicantId}`, {
      method: 'POST',
      body: JSON.stringify({ note_text: text })
    });
  },

  // 8. Stream CSV Portfolio Download
  exportCSV: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/applicants/export`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorPayload = await res.json().catch(() => ({}));
      throw new Error(errorPayload.message || 'Failed to download CSV export.');
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.setAttribute('download', 'applicants_portfolio_export.csv');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  // 9. Conversational Underwriting AI Chatbot Assistant
  chat: async (message, history = []) => {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
  }
};

