import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getCategoryInfo, CATEGORIES } from '../services/transactions';

export default function CategoryPieChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No expense data to display
            </div>
        );
    }

    // Map data with colors
    const chartData = data.map(item => ({
        name: item.category,
        value: item.amount / 100, // Convert paise to rupees
        color: getCategoryInfo(item.category).color,
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-medium">{data.name}</p>
                    <p className="text-gray-300">₹{data.value.toLocaleString('en-IN')}</p>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }) => (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-400 text-xs">{entry.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
            </PieChart>
        </ResponsiveContainer>
    );
}
