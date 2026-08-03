const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const statusOrder = ['Contacted', 'Samples Given', 'Follow Up Visit', 'Delivered'];

async function request(path, { method = 'GET', token, body, expectText = false } = {}) {
  const headers = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      message = response.statusText || message;
    }
    // Treat 401 as "session expired" only for authenticated requests.
    // Login/register can also return 401 for invalid credentials and should show backend message.
    if (response.status === 401 && token) {
      window.dispatchEvent(
        new CustomEvent('auth:invalid-token', {
          detail: { message },
        }),
      );
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(message);
  }

  if (expectText) {
    return response.text();
  }

  return response.json();
}

export const api = {
  auth: {
    login(email, password) {
      return request('/auth/login', { method: 'POST', body: { email, password } });
    },
    register(name, email, password) {
      return request('/auth/register', { method: 'POST', body: { name, email, password } });
    },
    selectBusiness(token, businessId) {
      return request('/auth/select-business', { method: 'POST', token, body: { businessId } });
    },
    me(token) {
      return request('/auth/me', { token });
    },
    listEmployees(token) {
      return request('/auth/employees', { token });
    },
  },

  affiliates: {
    list(token, query = {}) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
      const q = params.toString();
      return request(`/affiliates${q ? `?${q}` : ''}`, { token });
    },
    getById(token, id) {
      return request(`/affiliates/${id}`, { token });
    },
    create(token, payload) {
      return request('/affiliates', { method: 'POST', token, body: payload });
    },
    update(token, id, payload) {
      return request(`/affiliates/${id}`, { method: 'PATCH', token, body: payload });
    },
    transitionStatus(token, id, payload) {
      return request(`/affiliates/${id}/status`, { method: 'POST', token, body: payload });
    },
    exportCsv(token) {
      return request('/affiliates/export/csv', { token, expectText: true });
    },
    importCsv(token, csvText) {
      return request('/affiliates/import/csv', { method: 'POST', token, body: { csvText } });
    },
    importJson(token, data) {
      return request('/affiliates/import/json', { method: 'POST', token, body: { data } });
    },
    remove(token, id) {
      return request(`/affiliates/${id}`, { method: 'DELETE', token });
    },
  },

  reminders: {
    list(token, status = 'pending') {
      return request(`/reminders?status=${encodeURIComponent(status)}`, { token });
    },
    create(token, payload) {
      return request('/reminders', { method: 'POST', token, body: payload });
    },
    complete(token, id) {
      return request(`/reminders/${id}/complete`, { method: 'POST', token });
    },
  },

  activities: {
    list(token, limit = 30) {
      return request(`/activities?limit=${encodeURIComponent(limit)}`, { token });
    },
  },

  analytics: {
    affiliates(token, rangeDays = 7) {
      return request(`/analytics/affiliates?rangeDays=${encodeURIComponent(rangeDays)}`, { token });
    },
  },
};
