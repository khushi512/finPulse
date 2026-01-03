import { useState, useEffect } from 'react';
import { predictionsService } from '../services/predictions';

export default function PredictionsWidget() {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const data = await predictionsService.getAllInsights();
            setInsights(data);
        } catch (error) {
            console.error('Failed to fetch predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (amount) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getAlertColor = (level) => {
        switch (level) {
            case 'critical': return 'bg-red-100 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400';
            case 'warning': return 'bg-yellow-100 dark:bg-yellow-500/10 border-yellow-300 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400';
            case 'caution': return 'bg-orange-100 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/30 text-orange-700 dark:text-orange-400';
            default: return 'bg-blue-100 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400';
        }
    };

    const getAlertIcon = (level) => {
        switch (level) {
            case 'critical': return '🚨';
            case 'warning': return '⚠️';
            case 'caution': return '⚡';
            default: return 'ℹ️';
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!insights) return null;

    const { next_month_prediction, budget_alerts, anomalies } = insights;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Next Month Prediction */}
            {next_month_prediction && next_month_prediction.prediction > 0 && (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center">
                            <span className="text-xl">📊</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Next Month Forecast</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Based on {next_month_prediction.based_on_months} months of data
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Predicted Spending</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatAmount(next_month_prediction.prediction)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Range: {formatAmount(next_month_prediction.lower_bound)} - {formatAmount(next_month_prediction.upper_bound)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${next_month_prediction.confidence === 'high'
                                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                    : next_month_prediction.confidence === 'medium'
                                        ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                }`}>
                                {next_month_prediction.confidence} confidence
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Budget Alerts */}
            {budget_alerts && budget_alerts.length > 0 && (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Budget Alerts</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {budget_alerts.length} {budget_alerts.length === 1 ? 'alert' : 'alerts'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {budget_alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${getAlertColor(alert.alert_level)}`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">{getAlertIcon(alert.alert_level)}</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{alert.category}</p>
                                        <p className="text-xs mt-1">{alert.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs">
                                            <span>{formatAmount(alert.spent)} / {formatAmount(alert.limit)}</span>
                                            <span>•</span>
                                            <span>{alert.percentage_used}% used</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Anomalies - Full Width */}
            {anomalies && anomalies.length > 0 && (
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                            <span className="text-xl">🔍</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Unusual Transactions</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {anomalies.length} detected
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {anomalies.slice(0, 3).map((anomaly, index) => (
                            <div
                                key={index}
                                className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                                            {anomaly.description}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${anomaly.severity === 'high'
                                                ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                                : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                                            }`}>
                                            {anomaly.severity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        {new Date(anomaly.date).toLocaleDateString()} • {anomaly.category}
                                    </p>
                                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                                        {formatAmount(anomaly.amount)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
