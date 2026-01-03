import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SpendingTrendChart({ transactions }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No transaction data to display
            </div>
        );
    }

    // Group transactions by date and calculate daily totals
    const dailyData = transactions.reduce((acc, txn) => {
        if (!txn.is_income) {
            const date = txn.date;
            if (!acc[date]) {
                acc[date] = { date, expenses: 0, income: 0 };
            }
            acc[date].expenses += txn.amount / 100;
        } else {
            const date = txn.date;
            if (!acc[date]) {
                acc[date] = { date, expenses: 0, income: 0 };
            }
            acc[date].income += txn.amount / 100;
        }
        return acc;
    }, {});

    // Convert to array and sort by date
    const chartData = Object.values(dailyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-14) // Last 14 days
        .map(item => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            }),
        }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
                    <p className="text-gray-400 text-sm mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="font-medium">
                            {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                    dataKey="displayDate"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                />
                <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
