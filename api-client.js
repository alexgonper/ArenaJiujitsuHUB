// Arena Matrix - API Configuration
// This file configures the connection to the backend API

const API_CONFIG = {
    // Backend API URL
    baseURL: window.API_URL || 'http://localhost:5000/api/v1',

    // API Endpoints
    endpoints: {
        franchises: '/franchises',
        franchiseStats: '/franchises/stats/network',
        topFranchises: '/franchises/stats/top',
        directives: '/directives',
        recentDirectives: '/directives/recent',
        health: '/health'
    },

    // Request timeout (ms)
    timeout: 10000
};

// API Helper Functions
const API = {
    /**
     * Make GET request to API
     */
    async get(endpoint, params = {}) {
        try {
            const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
            Object.keys(params).forEach(key =>
                url.searchParams.append(key, params[key])
            );

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },

    /**
     * Make POST request to API
     */
    async post(endpoint, body = {}) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },

    /**
     * Make PUT request to API
     */
    async put(endpoint, body = {}) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },

    /**
     * Make DELETE request to API
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    },

    /**
     * Check if backend is available
     */
    async checkHealth() {
        try {
            const response = await fetch(`${API_CONFIG.baseURL.replace('/api/v1', '')}/health`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
};

// Franchise API Methods
const FranchiseAPI = {
    async getAll(params = {}) {
        return await API.get(API_CONFIG.endpoints.franchises, params);
    },

    async getById(id) {
        return await API.get(`${API_CONFIG.endpoints.franchises}/${id}`);
    },

    async create(data) {
        return await API.post(API_CONFIG.endpoints.franchises, data);
    },

    async update(id, data) {
        return await API.put(`${API_CONFIG.endpoints.franchises}/${id}`, data);
    },

    async delete(id) {
        return await API.delete(`${API_CONFIG.endpoints.franchises}/${id}`);
    },

    async getStats() {
        return await API.get(API_CONFIG.endpoints.franchiseStats);
    },

    async getTop(limit = 5) {
        return await API.get(`${API_CONFIG.endpoints.topFranchises}?limit=${limit}`);
    }
};

// Directive API Methods
const DirectiveAPI = {
    async getAll(params = {}) {
        return await API.get(API_CONFIG.endpoints.directives, params);
    },

    async getById(id) {
        return await API.get(`${API_CONFIG.endpoints.directives}/${id}`);
    },

    async create(data) {
        return await API.post(API_CONFIG.endpoints.directives, data);
    },

    async update(id, data) {
        return await API.put(`${API_CONFIG.endpoints.directives}/${id}`, data);
    },

    async delete(id) {
        return await API.delete(`${API_CONFIG.endpoints.directives}/${id}`);
    },

    async getRecent(limit = 10) {
        return await API.get(`${API_CONFIG.endpoints.recentDirectives}/${limit}`);
    },

    async acknowledge(id, franchiseId) {
        return await API.post(`${API_CONFIG.endpoints.directives}/${id}/acknowledge`, { franchiseId });
    }
};

// Student API Methods
const StudentAPI = {
    async getAll(params = {}) {
        return await API.get('/students', params);
    },

    async getById(id) {
        return await API.get(`/students/${id}`);
    },

    async getByFranchise(franchiseId, filters = {}) {
        return await API.get('/students', { franchiseId, ...filters });
    },

    async create(data) {
        return await API.post('/students', data);
    },

    async update(id, data) {
        return await API.put(`/students/${id}`, data);
    },

    async delete(id) {
        return await API.delete(`/students/${id}`);
    },

    async getStats(franchiseId) {
        return await API.get(`/students/stats/${franchiseId}`);
    },

    async updatePaymentStatus(id, status) {
        return await API.put(`/students/${id}/payment`, { paymentStatus: status });
    }
};

// Teacher API Methods
const TeacherAPI = {
    async getAll(params = {}) {
        return await API.get('/teachers', params);
    },

    async getById(id) {
        return await API.get(`/teachers/${id}`);
    },

    async getByFranchise(franchiseId, filters = {}) {
        return await API.get('/teachers', { franchiseId, ...filters });
    },

    async create(data) {
        return await API.post('/teachers', data);
    },

    async update(id, data) {
        return await API.put(`/teachers/${id}`, data);
    },

    async delete(id) {
        return await API.delete(`/teachers/${id}`);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        API,
        FranchiseAPI,
        DirectiveAPI,
        StudentAPI,
        TeacherAPI
    };
}
