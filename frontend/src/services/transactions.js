import api from './api';

export const transactionService = {
    async getTransactions(params = {}) {
        const response = await api.get('/transactions', { params });
        return response.data;
    },

    async createTransaction(data) {
        const response = await api.post('/transactions', data);
        return response.data;
    },

    async updateTransaction(id, data) {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data;
    },

    async deleteTransaction(id) {
        await api.delete(`/transactions/${id}`);
    },

    async importCSV(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/transactions/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async getDashboardSummary() {
        const response = await api.get('/dashboard/summary');
        return response.data;
    },
};

export const CATEGORIES = [
    { value: 'Food & Dining', label: 'Food & Dining', color: '#f59e0b', icon: '🍔' },
    { value: 'Transport', label: 'Transport', color: '#3b82f6', icon: '🚗' },
    { value: 'Shopping', label: 'Shopping', color: '#ec4899', icon: '🛍️' },
    { value: 'Bills & Utilities', label: 'Bills & Utilities', color: '#8b5cf6', icon: '💡' },
    { value: 'Entertainment', label: 'Entertainment', color: '#10b981', icon: '🎬' },
    { value: 'Healthcare', label: 'Healthcare', color: '#ef4444', icon: '🏥' },
    { value: 'Travel', label: 'Travel', color: '#06b6d4', icon: '✈️' },
    { value: 'Income', label: 'Income', color: '#22c55e', icon: '💰' },
    { value: 'Other', label: 'Other', color: '#6b7280', icon: '📦' },
];

export const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
};

export default transactionService;
