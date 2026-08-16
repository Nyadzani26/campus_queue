// API Base URL
const API_BASE = '/api';

class API {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Token ${this.token}`;
        }
        return headers;
    }

    async request(method, endpoint, data = null) {
        const url = `${API_BASE}${endpoint}`;
        const options = {
            method,
            headers: this.getHeaders(),
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.detail || `HTTP ${response.status}`);
            }

            return json;
        } catch (error) {
            throw error;
        }
    }

    async get(endpoint) {
        return this.request('GET', endpoint);
    }

    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    async patch(endpoint, data) {
        return this.request('PATCH', endpoint, data);
    }

    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }

    // Authentication
    async register(username, email, firstName, lastName, studentNumber, password) {
        const response = await this.post('/auth/register/', {
            username,
            email,
            first_name: firstName,
            last_name: lastName,
            student_number: studentNumber,
            password,
        });
        this.setToken(response.token, response.user);
        return response;
    }

    async login(username, password) {
        const response = await this.post('/auth/login/', {
            username,
            password,
        });
        this.setToken(response.token, response.user);
        return response;
    }

    async logout() {
        try {
            await this.post('/auth/logout/', {});
        } finally {
            this.clearToken();
        }
    }

    setToken(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    clearToken() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Department Operations
    async getDepartments() {
        return this.get('/departments/');
    }

    async joinDepartment(departmentId, note = '') {
        return this.post(`/departments/${departmentId}/join/`, { note });
    }

    // Ticket Operations
    async getMyTickets() {
        return this.get('/tickets/');
    }

    async getActiveTicket() {
        try {
            return await this.get('/tickets/active/');
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async cancelTicket(ticketId) {
        return this.post(`/tickets/${ticketId}/cancel/`, {});
    }

    // Staff Operations
    async getStaffQueue() {
        return this.get('/staff/queue/');
    }

    async callNextTicket() {
        return this.post('/staff/call-next/', {});
    }

    async startServing(ticketId) {
        return this.post(`/staff/tickets/${ticketId}/start/`, {});
    }

    async serveTicket(ticketId) {
        return this.post(`/staff/tickets/${ticketId}/serve/`, {});
    }

    async markNoShow(ticketId) {
        return this.post(`/staff/tickets/${ticketId}/no-show/`, {});
    }

    async updateQueueStatus(status) {
        return this.post('/staff/queue/status/', { status });
    }

    // Admin Operations
    async getReportSummary(date = null) {
        let endpoint = '/reports/summary/';
        if (date) {
            endpoint += `?date=${date}`;
        }
        return this.get(endpoint);
    }

    async getUsers(role = null) {
        let endpoint = '/users/';
        if (role) {
            endpoint += `?role=${role}`;
        }
        return this.get(endpoint);
    }
}

const api = new API();
