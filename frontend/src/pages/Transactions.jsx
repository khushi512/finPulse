import { useState, useEffect } from 'react';
import { transactionService, CATEGORIES } from '../services/transactions';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import TransactionList from '../components/TransactionList';
import AddTransactionModal from '../components/AddTransactionModal';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/LoadingStates';
import { handleApiError, showSuccess } from '../utils/errorHandler';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, description: '' });

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 15;

    // Filters
    const [filters, setFilters] = useState({
        category: '',
        is_income: '',
        search: '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        fetchTransactions();
    }, [page, filters]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: pageSize,
                ...(filters.category && { category: filters.category }),
                ...(filters.is_income !== '' && { is_income: filters.is_income === 'true' }),
                ...(filters.search && { search: filters.search }),
                ...(filters.start_date && { start_date: filters.start_date }),
                ...(filters.end_date && { end_date: filters.end_date }),
            };

            const data = await transactionService.getTransactions(params);
            setTransactions(data.transactions);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (error) {
            handleApiError(error, 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            is_income: '',
            search: '',
            start_date: '',
            end_date: '',
        });
        setPage(1);
    };

    const handleAddTransaction = async (data) => {
        try {
            await transactionService.createTransaction(data);
            showSuccess('Transaction added successfully!');
            fetchTransactions();
        } catch (error) {
            handleApiError(error, 'Failed to add transaction');
            throw error; // Re-throw so modal can handle it
        }
    };

    const handleDeleteTransaction = (id, description) => {
        setDeleteConfirm({ show: true, id, description });
    };

    const confirmDelete = async () => {
        try {
            await transactionService.deleteTransaction(deleteConfirm.id);
            showSuccess('Transaction deleted successfully!');
            fetchTransactions();
        } catch (error) {
            handleApiError(error, 'Failed to delete transaction');
        }
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Sidebar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{total} total transactions</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Transaction
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Category */}
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>

                        {/* Type */}
                        <select
                            value={filters.is_income}
                            onChange={(e) => handleFilterChange('is_income', e.target.value)}
                            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Types</option>
                            <option value="false">Expenses</option>
                            <option value="true">Income</option>
                        </select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">From:</span>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">To:</span>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                {loading ? (
                    <SkeletonTable rows={8} />
                ) : transactions.length > 0 ? (
                    <>
                        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                            <TransactionList
                                transactions={transactions}
                                onDelete={handleDeleteTransaction}
                            />
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-2">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= page - 1 && pageNum <= page + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`px-4 py-2 rounded-lg transition ${page === pageNum
                                                        ? 'bg-teal-600 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                                            return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyState
                        icon="💳"
                        title={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
                        description={hasActiveFilters
                            ? 'Try adjusting your filters to see more results'
                            : 'Start tracking your finances by adding your first transaction'
                        }
                        action={!hasActiveFilters && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition"
                            >
                                Add Your First Transaction
                            </button>
                        )}
                    />
                )}
            </main>

            {/* Footer */}
            <Footer />

            {/* Add Modal */}
            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddTransaction}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onClose={() => setDeleteConfirm({ show: false, id: null, description: '' })}
                onConfirm={confirmDelete}
                title="Delete Transaction"
                message={`Are you sure you want to delete "${deleteConfirm.description}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
