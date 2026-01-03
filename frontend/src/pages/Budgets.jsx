import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { budgetService } from '../services/budgets';
import { CATEGORIES, getCategoryInfo } from '../services/transactions';

export default function Budgets() {
    const [budgetStatus, setBudgetStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        fetchBudgetStatus();
    }, [selectedMonth]);

    const fetchBudgetStatus = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const monthDate = `${year}-${month}-01`;
            const data = await budgetService.getBudgetStatus(monthDate);
            setBudgetStatus(data);
        } catch (error) {
            console.error('Failed to fetch budget status:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (amount) => {
        return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 100) return 'text-red-500';
        if (percentage >= 80) return 'text-yellow-500';
        return 'text-green-500';
    };

    // Add Budget Modal
    const AddBudgetModal = () => {
        const [category, setCategory] = useState('');
        const [limit, setLimit] = useState('');
        const [error, setError] = useState('');
        const [submitting, setSubmitting] = useState(false);

        // Filter out categories that already have budgets
        const existingCategories = budgetStatus?.budgets.map(b => b.category) || [];
        const availableCategories = CATEGORIES.filter(
            c => !existingCategories.includes(c.value) && c.value !== 'Income'
        );

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!category || !limit) return;

            setSubmitting(true);
            setError('');

            try {
                const [year, month] = selectedMonth.split('-');
                await budgetService.createBudget({
                    category,
                    monthly_limit: Math.round(parseFloat(limit) * 100),
                    month: `${year}-${month}-01`,
                });
                setShowAddModal(false);
                fetchBudgetStatus();
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to create budget');
            } finally {
                setSubmitting(false);
            }
        };

        if (!showAddModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700/50">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add Budget</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {availableCategories.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-400">
                                    You've set budgets for all categories this month!
                                </p>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select category</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Monthly Limit (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={limit}
                                        onChange={(e) => setLimit(e.target.value)}
                                        required
                                        min="1"
                                        placeholder="5000"
                                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-2.5 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Adding...' : 'Add Budget'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const handleDeleteBudget = async (budgetId) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        try {
            // Need to get the budget ID from the status response
            const budgets = await budgetService.getBudgets(`${selectedMonth}-01`);
            const budget = budgets.find(b => b.category === budgetId);
            if (budget) {
                await budgetService.deleteBudget(budget.id);
                fetchBudgetStatus();
            }
        } catch (error) {
            console.error('Failed to delete budget:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Sidebar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Set and track monthly spending limits</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Budget
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                ) : budgetStatus?.budgets.length > 0 ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Budgeted</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatAmount(budgetStatus.total_budgeted)}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Spent</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatAmount(budgetStatus.total_spent)}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Remaining</p>
                                <p className={`text-2xl font-bold mt-1 ${budgetStatus.total_budgeted - budgetStatus.total_spent >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                    }`}>
                                    {formatAmount(budgetStatus.total_budgeted - budgetStatus.total_spent)}
                                </p>
                            </div>
                        </div>

                        {/* Budget Grid - 3 per row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {budgetStatus.budgets.map((budget) => {
                                const categoryInfo = getCategoryInfo(budget.category);

                                return (
                                    <div
                                        key={budget.category}
                                        className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                                                    style={{ backgroundColor: `${categoryInfo.color}20` }}
                                                >
                                                    {categoryInfo.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{budget.category}</h3>
                                                    <p className={`text-sm font-bold ${getStatusColor(budget.percentage_used)}`}>
                                                        {budget.percentage_used.toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteBudget(budget.category)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Amount */}
                                        <div className="mb-3">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Spent</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Limit</span>
                                            </div>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {formatAmount(budget.spent)}
                                                </span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatAmount(budget.monthly_limit)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                                            <div
                                                className={`h-full ${getProgressColor(budget.percentage_used)} transition-all duration-500`}
                                                style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                                            />
                                        </div>

                                        {/* Status Message */}
                                        {budget.is_over_budget && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Over by {formatAmount(Math.abs(budget.remaining))}
                                            </p>
                                        )}
                                        {budget.percentage_used >= 80 && !budget.is_over_budget && (
                                            <p className="text-xs text-yellow-500 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                {formatAmount(budget.remaining)} remaining
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-12 border border-gray-200 dark:border-gray-700/50 text-center shadow-sm">
                        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎯</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No budgets set</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Set monthly spending limits to track your finances better.
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition"
                        >
                            Add Your First Budget
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <Footer />

            <AddBudgetModal />
        </div>
    );
}
