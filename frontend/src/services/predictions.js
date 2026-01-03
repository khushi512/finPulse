import api from './api';

export const predictionsService = {
    async getSpendingPrediction() {
        const response = await api.get('/predictions/spending');
        return response.data;
    },

    async getCategoryPrediction(category) {
        const response = await api.get(`/predictions/category/${category}`);
        return response.data;
    },

    async getBudgetAlerts() {
        const response = await api.get('/predictions/budget-alerts');
        return response.data;
    },

    async getAnomalies(days = 90, threshold = 2.5) {
        const response = await api.get('/predictions/anomalies', {
            params: { days, threshold }
        });
        return response.data;
    },

    async getAllInsights() {
        const response = await api.get('/predictions/insights');
        return response.data;
    },
};

export default predictionsService;
