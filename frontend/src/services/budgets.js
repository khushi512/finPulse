import api from './api';

export const budgetService = {
    async getBudgetStatus(month = null) {
        const params = month ? { month } : {};
        const response = await api.get('/budgets/status', { params });
        return response.data;
    },

    async getBudgets(month = null) {
        const params = month ? { month } : {};
        const response = await api.get('/budgets', { params });
        return response.data;
    },

    async createBudget(data) {
        const response = await api.post('/budgets', data);
        return response.data;
    },

    async updateBudget(id, data) {
        const response = await api.put(`/budgets/${id}`, data);
        return response.data;
    },

    async deleteBudget(id) {
        await api.delete(`/budgets/${id}`);
    },
};

export default budgetService;
