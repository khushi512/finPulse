import { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactions';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import QuickInsights from '../components/QuickInsights';
import AddTransactionModal from '../components/AddTransactionModal';
import ImportCSVModal from '../components/ImportCSVModal';
import SpendingTrendChart from '../components/SpendingTrendChart';
import CategoryPieChart from '../components/CategoryPieChart';

const TIME_PERIODS = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'all_time', label: 'All Time' },
];

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [trendPeriod, setTrendPeriod] = useState('this_month');
    const [categoryPeriod, setCategoryPeriod] = useState('this_month');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryData, txnData] = await Promise.all([
                transactionService.getDashboardSummary(),
                transactionService.getTransactions({ page: 1, page_size: 100 })
            ]);
            setSummary(summaryData);
            setTransactions(txnData.transactions);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions by time period
    const filterByPeriod = (txns, period) => {
        const today = new Date();
        const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        return txns.filter(txn => {
            const txnDate = new Date(txn.date);
            switch (period) {
                case 'this_month':
                    return txnDate >= firstOfThisMonth;
                case 'last_month':
                    return txnDate >= firstOfLastMonth && txnDate <= lastOfLastMonth;
                case 'all_time':
                default:
                    return true;
            }
        });
    };

    // Filtered data for charts
    const trendTransactions = useMemo(() =>
        filterByPeriod(transactions, trendPeriod),
        [transactions, trendPeriod]
    );

    const categoryTransactions = useMemo(() =>
        filterByPeriod(transactions, categoryPeriod),
        [transactions, categoryPeriod]
    );

    // Calculate category breakdown from filtered transactions
    const categoryBreakdown = useMemo(() => {
        const breakdown = {};
        categoryTransactions.forEach(txn => {
            if (!txn.is_income) {
                breakdown[txn.category] = (breakdown[txn.category] || 0) + txn.amount;
            }
        });
        return Object.entries(breakdown).map(([category, amount]) => ({ category, amount }));
    }, [categoryTransactions]);

    const handleAddTransaction = async (data) => {
        await transactionService.createTransaction(data);
        fetchData();
    };

    const handleImportCSV = async (file) => {
        const result = await transactionService.importCSV(file);
        if (result.imported > 0) {
            fetchData();
        }
        return result;
    };

    const formatAmount = (amount) => {
        return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const PeriodDropdown = ({ value, onChange }) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            {TIME_PERIODS.map(period => (
                <option key={period.value} value={period.value}>
                    {period.label}
                </option>
            ))}
        </select>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Welcome Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back!</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Here's an overview of your finances</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Transaction
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg font-medium transition"
                        >
                            Import CSV
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Balance</p>
                                <p className={`text-3xl font-bold mt-2 ${(summary?.balance || 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                                    {formatAmount(summary?.balance || 0)}
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">All-time balance</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Monthly Income</p>
                                <p className="text-3xl font-bold text-green-500 mt-2">
                                    {formatAmount(summary?.monthly_income || 0)}
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">This month</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Monthly Expenses</p>
                                <p className="text-3xl font-bold text-red-500 mt-2">
                                    {formatAmount(summary?.monthly_expenses || 0)}
                                </p>
                                {summary?.expense_change_percent !== 0 && (
                                    <p className={`text-sm mt-2 ${summary.expense_change_percent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {summary.expense_change_percent > 0 ? '↑' : '↓'} {Math.abs(summary.expense_change_percent)}% vs last month
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Charts - 2 Column Grid */}
                        {transactions.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Spending Trend */}
                                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Trend</h3>
                                        <PeriodDropdown value={trendPeriod} onChange={setTrendPeriod} />
                                    </div>
                                    <SpendingTrendChart transactions={trendTransactions} />
                                </div>

                                {/* Category Breakdown */}
                                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
                                        <PeriodDropdown value={categoryPeriod} onChange={setCategoryPeriod} />
                                    </div>
                                    <CategoryPieChart data={categoryBreakdown} />
                                </div>
                            </div>
                        )}

                        {/* Quick Insights */}
                        {transactions.length > 0 && categoryBreakdown.length > 0 && (
                            <QuickInsights
                                summary={summary}
                                transactions={transactions}
                                categoryBreakdown={categoryBreakdown}
                                formatAmount={formatAmount}
                            />
                        )}

                        {/* Empty State */}
                        {transactions.length === 0 && (
                            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-12 border border-gray-200 dark:border-gray-700/50 text-center shadow-sm">
                                <div className="max-w-md mx-auto">
                                    <div className="w-16 h-16 bg-teal-100 dark:bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No transactions yet</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Start by adding your first transaction or import from a CSV file.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition"
                                        >
                                            Add Transaction
                                        </button>
                                        <button
                                            onClick={() => setShowImportModal(true)}
                                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg font-medium transition"
                                        >
                                            Import CSV
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <Footer />

            {/* Modals */}
            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddTransaction}
            />
            <ImportCSVModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}
