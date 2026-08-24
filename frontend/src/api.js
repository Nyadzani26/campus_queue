// frontend/src/api.js
const API_BASE_URL = 'http://localhost:8000/api';

// Helper to get token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  console.log('Token being sent:', token ? 'Token exists' : 'No token');
  return token;
};

// Generic fetch wrapper that adds the Token header
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
    console.log('Authorization header set with token');
  } else {
    console.warn('No token found in localStorage');
  }

  const config = {
    method,
    headers,
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
    console.log(`Sending ${method} request to ${endpoint} with data:`, data);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making ${method} request to:`, url);

  try {
    const response = await fetch(url, config);
    console.log(`Response status for ${endpoint}:`, response.status);
    
    if (response.status === 401 && token) {
      console.warn('401 Unauthorized - Clearing invalid token');
      localStorage.removeItem('authToken');
      if (window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    return response;
  } catch (error) {
    console.error('Network error in apiRequest:', error);
    throw error;
  }
};

// ==================== AUTHENTICATION ====================

export const login = (username, password) => {
  console.log('Login attempt for:', username);
  return apiRequest('/auth/login/', 'POST', { username, password });
};

export const register = (userData) => {
  console.log('Register attempt with:', userData);
  return apiRequest('/auth/register/', 'POST', {
    username: userData.username,
    email: userData.email,
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    student_number: userData.student_number || '',
    password: userData.password,
    password2: userData.password2 || userData.password,
  });
};

export const getProfile = () => {
  return apiRequest('/auth/profile/', 'GET');
};

export const logout = () => {
  return apiRequest('/auth/logout/', 'POST');
};

// ==================== USERS ====================

export const listUsers = () => {
  return apiRequest('/users/', 'GET');
};

export const createStaff = (userData) => {
  return apiRequest('/users/staff/', 'POST', userData);
};

export const getUserDetail = (userId) => {
  return apiRequest(`/users/${userId}/`, 'GET');
};

export const updateUser = (userId, userData) => {
  return apiRequest(`/users/${userId}/`, 'PUT', userData);
};

export const deleteUser = (userId) => {
  return apiRequest(`/users/${userId}/`, 'DELETE');
};

// ==================== QUEUES & DEPARTMENTS ====================

export const getDepartments = () => {
  return apiRequest('/departments/', 'GET');
};

export const getDepartmentDetail = (departmentId) => {
  return apiRequest(`/departments/${departmentId}/`, 'GET');
};

export const getMyActiveTicket = () => {
  return apiRequest('/tickets/active/', 'GET');
};

export const getMyTickets = () => {
  return apiRequest('/tickets/', 'GET');
};

export const joinQueue = (departmentId, description = '') => {
  return apiRequest(`/departments/${departmentId}/join/`, 'POST', {
    note: description,
  });
};

export const cancelTicket = (ticketId) => {
  return apiRequest(`/tickets/${ticketId}/cancel/`, 'POST');
};

// ==================== STAFF ENDPOINTS (CRITICAL!) ====================

/**
 * GET /api/staff/queue/ - Staff view of the current queue
 * Returns: department info, waiting list, now serving
 */
export const getStaffQueue = () => {
  return apiRequest('/staff/queue/', 'GET');
};

/**
 * POST /api/staff/call-next/ - Call the next ticket in queue
 */
export const callNextTicket = () => {
  return apiRequest('/staff/call-next/', 'POST');
};

/**
 * POST /api/staff/tickets/{id}/start/ - Start serving a ticket
 */
export const startServingTicket = (ticketId) => {
  return apiRequest(`/staff/tickets/${ticketId}/start/`, 'POST');
};

/**
 * POST /api/staff/tickets/{id}/serve/ - Mark a ticket as served
 */
export const serveTicket = (ticketId) => {
  return apiRequest(`/staff/tickets/${ticketId}/serve/`, 'POST');
};

/**
 * POST /api/staff/tickets/{id}/no-show/ - Mark a ticket as no-show
 */
export const noShowTicket = (ticketId) => {
  return apiRequest(`/staff/tickets/${ticketId}/no-show/`, 'POST');
};

/**
 * GET /api/staff/queue/status/ - Get the current queue status
 */
export const getQueueStatus = () => {
  return apiRequest('/staff/queue/status/', 'GET');
};

/**
 * PATCH /api/departments/{id}/ - Toggle department status (Open/Closed)
 */
export const toggleDepartmentStatus = (departmentId, isOpen) => {
  return apiRequest(`/departments/${departmentId}/`, 'PATCH', { is_open: isOpen });
};

// ==================== REPORTS ====================

export const getReportSummary = () => {
  return apiRequest('/reports/summary/', 'GET');
};

