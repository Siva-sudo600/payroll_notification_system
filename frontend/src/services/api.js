import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('payroll_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('payroll_token');
      localStorage.removeItem('payroll_admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
};

export const employeeAPI = {
  lookup: (empId) => API.get(`/employees/lookup/${empId}`),
  getAll: () => API.get('/employees'),
  getStats: () => API.get('/employees/stats'),
};

export const payrollAPI = {
  initiate: (data) => API.post('/payroll/initiate', data),
  calculate: (data) => API.post('/payroll/calculate', data),
  generatePayslip: (id) => API.post(`/payroll/payslip/${id}`),
  getHistory: (params) => API.get('/payroll/history', { params }),
  getById: (id) => API.get(`/payroll/${id}`),
  getStats: () => API.get('/payroll/stats/overview'),
};

export default API;