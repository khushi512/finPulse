import api from './api';

export const mlService = {
    async suggestCategory(description, merchant = null) {
        const params = new URLSearchParams({ description });
        if (merchant) params.append('merchant', merchant);

        const response = await api.post(`/transactions/suggest-category?${params.toString()}`);
        return response.data;
    },

    async getModelStats() {
        const response = await api.get('/transactions/ml-stats');
        return response.data;
    },

    async retrainModel() {
        const response = await api.post('/transactions/retrain-model');
        return response.data;
    },
};

export default mlService;
