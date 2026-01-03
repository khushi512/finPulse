import { getCategoryInfo } from '../services/transactions';

export default function TransactionList({ transactions, onEdit, onDelete }) {
    if (!transactions || transactions.length === 0) {
        return null;
    }

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {});

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateStr === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
        }
    };

    const formatAmount = (amount, isIncome) => {
        const rupees = (amount / 100).toFixed(2);
        return `${isIncome ? '+' : '-'}₹${rupees}`;
    };

    return (
        <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txns]) => (
                <div key={date}>
                    {/* Date header */}
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{formatDate(date)}</h3>

                    {/* Transaction cards */}
                    <div className="space-y-2">
                        {txns.map((transaction) => {
                            const categoryInfo = getCategoryInfo(transaction.category);

                            return (
                                <div
                                    key={transaction.id}
                                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Category icon */}
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                                            style={{ backgroundColor: `${categoryInfo.color}20` }}
                                        >
                                            {categoryInfo.icon}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-900 dark:text-white font-medium truncate">
                                                {transaction.merchant || transaction.description}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                                                {transaction.merchant ? transaction.description : transaction.category}
                                            </p>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <p className={`font-semibold ${transaction.is_income ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                                                {formatAmount(transaction.amount, transaction.is_income)}
                                            </p>
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: `${categoryInfo.color}20`,
                                                    color: categoryInfo.color
                                                }}
                                            >
                                                {transaction.category}
                                            </span>
                                        </div>

                                        {/* Actions (show on hover) */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={() => onEdit?.(transaction)}
                                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(transaction.id, transaction.merchant || transaction.description)}
                                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                                                title="Delete transaction"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
