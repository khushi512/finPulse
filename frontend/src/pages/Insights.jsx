import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { predictionsService } from '../services/predictions';

const DISMISSED_ANOMALIES_KEY = 'finpulse_dismissed_anomalies';
const EXPIRY_DAYS = 30;

export default function Insights() {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dismissedAnomalies, setDismissedAnomalies] = useState(() => {
        // Load from localStorage on mount
        try {
            const stored = localStorage.getItem(DISMISSED_ANOMALIES_KEY);
            if (stored) {
                const { data, timestamp } = JSON.parse(stored);
                const now = new Date().getTime();
                const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 30 days in ms

                // Check if data is still valid
                if (now - timestamp < expiryTime) {
                    return data;
                } else {
                    // Expired, clear it
                    localStorage.removeItem(DISMISSED_ANOMALIES_KEY);
                }
            }
        } catch (error) {
            console.error('Error loading dismissed anomalies:', error);
        }
        return [];
    });
    const [selectedAnomaly, setSelectedAnomaly] = useState(null);

    useEffect(() => {
        fetchInsights();
    }, []);

    // Save to localStorage whenever dismissedAnomalies changes
    useEffect(() => {
        if (dismissedAnomalies.length > 0) {
            try {
                const dataToStore = {
                    data: dismissedAnomalies,
                    timestamp: new Date().getTime()
                };
                localStorage.setItem(DISMISSED_ANOMALIES_KEY, JSON.stringify(dataToStore));
            } catch (error) {
                console.error('Error saving dismissed anomalies:', error);
            }
        } else {
            // If dismissedAnomalies becomes empty, remove from localStorage
            localStorage.removeItem(DISMISSED_ANOMALIES_KEY);
        }
    }, [dismissedAnomalies]);

    const fetchInsights = async () => {
        try {
            const data = await predictionsService.getAllInsights();
            setInsights(data);
        } catch (error) {
            console.error('Failed to fetch insights:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate unique ID for anomaly (date + amount + description)
    const getAnomalyId = (anomaly) => {
        return `${anomaly.date}_${anomaly.amount}_${anomaly.description.substring(0, 20)}`;
    };

    const handleDismissAnomaly = (anomaly) => {
        const anomalyId = getAnomalyId(anomaly);
        setDismissedAnomalies([...dismissedAnomalies, anomalyId]);
    };

    const handleReviewAnomaly = (anomaly) => {
        setSelectedAnomaly(anomaly);
    };

    const getFinancialHealth = () => {
        if (!insights?.next_month_prediction) return { score: 0, status: 'Unknown', color: 'gray' };

        const prediction = insights.next_month_prediction.prediction;
        const confidence = insights.next_month_prediction.confidence;

        if (confidence === 'high' && prediction > 0) {
            return { score: 85, status: 'Good', color: 'green' };
        } else if (confidence === 'medium') {
            return { score: 70, status: 'Fair', color: 'yellow' };
        }
        return { score: 50, status: 'Needs Attention', color: 'orange' };
    };

    const health = getFinancialHealth();
    const visibleAnomalies = insights?.anomalies?.filter((anomaly) =>
        !dismissedAnomalies.includes(getAnomalyId(anomaly))
    ) || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Sidebar />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Insights & Predictions</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Smart analysis of your financial patterns</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                {/* AI Score */}
                                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl p-6 border border-teal-200 dark:border-teal-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🎯</span>
                                        <p className="text-teal-600 dark:text-teal-400 text-sm font-medium">AI Score</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{health.score}/100</p>
                                    <p className="text-teal-600 dark:text-teal-400 text-sm mt-1">Financial Health</p>
                                </div>

                                {/* Anomalies Detected */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-6 border border-red-200 dark:border-red-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🔍</span>
                                        <p className="text-red-600 dark:text-red-400 text-sm font-medium">Anomalies Detected</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {visibleAnomalies.length}
                                    </p>
                                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">Last 90 days</p>
                                </div>

                                {/* Savings Rate */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">📈</span>
                                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">Savings Rate</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">81%</p>
                                    <p className="text-green-600 dark:text-green-400 text-sm mt-1">This month</p>
                                </div>

                                {/* Financial Health */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">💚</span>
                                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">Financial Health</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{health.status}</p>
                                    <p className="text-green-600 dark:text-green-400 text-sm mt-1">Based on AI analysis</p>
                                </div>
                            </div>

                            {/* Predictions & Tips */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Predictions & Tips</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Food Budget Alert */}
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">⚠️</span>
                                            <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">Food Budget Alert</h3>
                                        </div>
                                        <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                            Based on your current spending pattern, you'll exceed your food budget by ₹2,150 by month end.
                                        </p>
                                    </div>

                                    {/* Savings Opportunity */}
                                    <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-700/30 rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">💡</span>
                                            <h3 className="font-semibold text-cyan-900 dark:text-cyan-300">Savings Opportunity</h3>
                                        </div>
                                        <p className="text-sm text-cyan-800 dark:text-cyan-400">
                                            If you keep up the current trend, you could save ₹5,500 monthly. Great job!
                                        </p>
                                    </div>

                                    {/* Smart Tip */}
                                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700/30 rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">💡</span>
                                            <h3 className="font-semibold text-purple-900 dark:text-purple-300">Smart Tip</h3>
                                        </div>
                                        <p className="text-sm text-purple-800 dark:text-purple-400">
                                            Your transport costs are 18% lower this month. Consider using public transit more!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Unusual Transactions */}
                            {visibleAnomalies.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Unusual Transactions</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {visibleAnomalies.map((anomaly, index) => (
                                            <div
                                                key={index}
                                                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border ${anomaly.severity === 'high'
                                                        ? 'border-red-200 dark:border-red-700/50'
                                                        : 'border-orange-200 dark:border-orange-700/50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${anomaly.severity === 'high'
                                                                ? 'bg-red-100 dark:bg-red-500/20'
                                                                : 'bg-orange-100 dark:bg-orange-500/20'
                                                            }`}>
                                                            <span className="text-2xl">🔍</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white">{anomaly.description}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {new Date(anomaly.date).toLocaleDateString()} • {anomaly.category}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${anomaly.severity === 'high'
                                                            ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                                            : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                                                        }`}>
                                                        {anomaly.severity}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                    {anomaly.reason}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        ₹{anomaly.amount.toLocaleString()}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDismissAnomaly(anomaly)}
                                                            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
                                                        >
                                                            Dismiss
                                                        </button>
                                                        <button
                                                            onClick={() => handleReviewAnomaly(anomaly)}
                                                            className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition"
                                                        >
                                                            Review
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <Footer />

            {/* Review Modal */}
            {selectedAnomaly && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAnomaly(null)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700/50">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Transaction Details</h2>
                                <button
                                    onClick={() => setSelectedAnomaly(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAnomaly.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">₹{selectedAnomaly.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {new Date(selectedAnomaly.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAnomaly.category}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Why it's unusual</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedAnomaly.reason}</p>
                                </div>

                                <div className={`p-4 rounded-lg ${selectedAnomaly.severity === 'high'
                                        ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-700/30'
                                        : 'bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-700/30'
                                    }`}>
                                    <p className={`text-sm font-medium ${selectedAnomaly.severity === 'high'
                                            ? 'text-red-700 dark:text-red-400'
                                            : 'text-orange-700 dark:text-orange-400'
                                        }`}>
                                        Severity: {selectedAnomaly.severity.toUpperCase()}
                                    </p>
                                    <p className={`text-xs mt-1 ${selectedAnomaly.severity === 'high'
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-orange-600 dark:text-orange-400'
                                        }`}>
                                        This transaction is {selectedAnomaly.z_score?.toFixed(1)}x above your average spending
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        handleDismissAnomaly(selectedAnomaly);
                                        setSelectedAnomaly(null);
                                    }}
                                    className="flex-1 py-2.5 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition"
                                >
                                    Mark as Normal
                                </button>
                                <button
                                    onClick={() => setSelectedAnomaly(null)}
                                    className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
