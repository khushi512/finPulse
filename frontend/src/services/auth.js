import api from './api';

export const authService = {
    async register(email, password) {
        const response = await api.post('/auth/register', { email, password });
        return response.data;
    },

    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token } = response.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        return response.data;
    },

    async getCurrentUser() {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    },
};

export default authService;
