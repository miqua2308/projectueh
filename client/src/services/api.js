const BASE_URL = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data?.error?.message || 'Có lỗi xảy ra khi gọi API';
    throw new Error(errorMsg);
  }
  return data.data;
}

export const api = {
  getCategories: () => request('/categories'),

  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transactions${query ? `?${query}` : ''}`);
  },

  createTransaction: (data) =>
    request('/transactions', { method: 'POST', body: JSON.stringify(data) }),

  deleteTransaction: (id) =>
    request(`/transactions/${id}`, { method: 'DELETE' }),

  getTopExpenses: (month, limit = 5) =>
    request(`/transactions/top-expenses?month=${month}&limit=${limit}`),

  getBudgets: (month) =>
    request(`/budgets?month=${month}`),

  setBudget: (data) =>
    request('/budgets', { method: 'POST', body: JSON.stringify(data) }),

  deleteBudget: (id) =>
    request(`/budgets/${id}`, { method: 'DELETE' }),

  getSummary: (month) =>
    request(`/dashboard/summary?month=${month}`),

  getCategoryBreakdown: (month, type = 'EXPENSE') =>
    request(`/dashboard/category-breakdown?month=${month}&type=${type}`),

  getMonthlyTrend: (months = 6) =>
    request(`/dashboard/monthly-trend?months=${months}`),

  getAiSuggestions: (month) =>
    request(`/ai/suggestions?month=${month}`)
};
