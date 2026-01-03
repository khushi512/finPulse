import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from '../services/transactions';
import { mlService } from '../services/ml';

export default function AddTransactionModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        merchant: '',
        category: 'Other',
        is_income: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mlSuggestion, setMlSuggestion] = useState(null);
    const [suggestingCategory, setSuggestingCategory] = useState(false);

    // Get ML suggestion when description or merchant changes
    useEffect(() => {
        if (!isOpen) {
            setMlSuggestion(null);
            return;
        }

        if (!formData.description || formData.description.length < 3) {
            setMlSuggestion(null);
            return;
        }

        const getSuggestion = async () => {
            setSuggestingCategory(true);
            try {
                const result = await mlService.suggestCategory(
                    formData.description,
                    formData.merchant || null
                );

                if (result.suggestions && result.suggestions.length > 0) {
                    const topSuggestion = result.suggestions[0];
                    setMlSuggestion(topSuggestion);

                    // Auto-set category if confidence is high, not income, and category is still default
                    if (topSuggestion.confidence > 60 && !formData.is_income && formData.category === 'Other') {
                        setFormData(prev => ({ ...prev, category: topSuggestion.category }));
                    }
                }
            } catch (err) {
                // Silently fail - ML is optional
                // Silently fail - ML is optional
                // console.log('ML suggestion failed:', err);
                setMlSuggestion(null);
            } finally {
                setSuggestingCategory(false);
            }
        };

        const debounce = setTimeout(getSuggestion, 500);
        return () => clearTimeout(debounce);
    }, [isOpen, formData.description, formData.merchant, formData.is_income, formData.category]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const amountPaise = Math.round(parseFloat(formData.amount) * 100);

            await onSubmit({
                ...formData,
                amount: amountPaise,
            });

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                description: '',
                merchant: '',
                category: 'Other',
                is_income: false,
            });
            setMlSuggestion(null);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const applySuggestion = () => {
        if (mlSuggestion) {
            setFormData(prev => ({ ...prev, category: mlSuggestion.category }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700/50">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add Transaction</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                placeholder="What was this for?"
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Merchant */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant (optional)</label>
                            <input
                                type="text"
                                name="merchant"
                                value={formData.merchant}
                                onChange={handleChange}
                                placeholder="Store or company name"
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* ML Suggestion Banner */}
                        {mlSuggestion && mlSuggestion.category !== formData.category && (
                            <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🤖</span>
                                        <div>
                                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                                                AI suggests: <span className="font-bold">{mlSuggestion.category}</span>
                                            </p>
                                            <p className="text-xs text-teal-600 dark:text-teal-400">
                                                {mlSuggestion.confidence}% confidence
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={applySuggestion}
                                        className="px-3 py-1 text-xs bg-teal-600 hover:bg-teal-500 text-white rounded-md transition"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                                {suggestingCategory && (
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                        (analyzing...)
                                    </span>
                                )}
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Income toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="is_income"
                                id="is_income"
                                checked={formData.is_income}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-teal-500 focus:ring-indigo-500"
                            />
                            <label htmlFor="is_income" className="text-sm text-gray-700 dark:text-gray-300">
                                This is income (money received)
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Transaction'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
