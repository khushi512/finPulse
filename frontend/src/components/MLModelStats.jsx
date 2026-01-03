import { useState, useEffect } from 'react';
import { mlService } from '../services/ml';

export default function MLModelStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retraining, setRetraining] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await mlService.getModelStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch ML stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRetrain = async () => {
        setRetraining(true);
        try {
            await mlService.retrainModel();
            await fetchStats();
            alert('Model retrained successfully!');
        } catch (error) {
            alert('Failed to retrain model');
        } finally {
            setRetraining(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!stats?.trained) {
        return (
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">ML Model Status</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Not trained yet</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats?.message || 'Add more transactions to enable ML-based categorization'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">ML Model Active</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.model_type}</p>
                    </div>
                </div>
                <button
                    onClick={handleRetrain}
                    disabled={retraining}
                    className="px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition disabled:opacity-50"
                >
                    {retraining ? 'Retraining...' : 'Retrain'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Training Data</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total_transactions}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">transactions</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vocabulary</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.vocabulary_size}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">unique words</p>
                </div>
            </div>

            {stats.categories && (
                <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Categories learned:</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.categories).map(([cat, count]) => (
                            <span
                                key={cat}
                                className="px-2 py-1 text-xs bg-teal-100 dark:bg-teal-500/20 text-indigo-700 dark:text-indigo-300 rounded-full"
                            >
                                {cat} ({count})
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
