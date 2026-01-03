import { useState, useEffect } from 'react';

export default function QuickInsights({ summary, transactions, categoryBreakdown, formatAmount }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const insights = [
        {
            icon: '🏆',
            title: 'Top Spending Category',
            value: categoryBreakdown.sort((a, b) => b.amount - a.amount)[0]?.category || 'N/A',
            subtitle: formatAmount(categoryBreakdown.sort((a, b) => b.amount - a.amount)[0]?.amount || 0) + ' spent this month',
            gradient: 'from-purple-500 via-pink-500 to-rose-500'
        },
        {
            icon: '📊',
            title: 'Average Transaction',
            value: formatAmount(Math.round(summary.monthly_expenses / transactions.filter(t => !t.is_income).length) || 0),
            subtitle: `Across ${transactions.filter(t => !t.is_income).length} expense transactions`,
            gradient: 'from-blue-500 via-cyan-500 to-teal-500'
        },
        {
            icon: '💰',
            title: 'Monthly Income',
            value: formatAmount(summary.monthly_income || 0),
            subtitle: 'Total income this month',
            gradient: 'from-green-500 via-emerald-500 to-teal-500'
        },
        {
            icon: '💳',
            title: 'Total Transactions',
            value: transactions.length.toString(),
            subtitle: 'Recorded this month',
            gradient: 'from-orange-500 via-amber-500 to-yellow-500'
        }
    ];

    // Auto-slide every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % insights.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [insights.length]);

    const currentInsight = insights[activeIndex];

    return (
        <div className="mb-8 relative overflow-hidden rounded-2xl">
            {/* Full-width gradient background section */}
            <div className={`relative bg-gradient-to-br ${currentInsight.gradient} p-8 md:p-12 transition-all duration-700 ease-in-out`}>
                {/* Animated pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                                <span className="text-5xl md:text-6xl">{currentInsight.icon}</span>
                            </div>
                        </div>

                        {/* Text content */}
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-white/90 text-sm md:text-base font-semibold uppercase tracking-wider mb-2">
                                {currentInsight.title}
                            </p>
                            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 animate-slideIn">
                                {currentInsight.value}
                            </h3>
                            <p className="text-white/80 text-base md:text-lg">
                                {currentInsight.subtitle}
                            </p>
                        </div>

                        {/* Navigation arrows - desktop only */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => setActiveIndex((prev) => (prev - 1 + insights.length) % insights.length)}
                                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-lg"
                                aria-label="Previous"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setActiveIndex((prev) => (prev + 1) % insights.length)}
                                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-lg"
                                aria-label="Next"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex justify-center md:justify-start gap-2 mt-8">
                        {insights.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex
                                        ? 'bg-white w-12'
                                        : 'bg-white/40 w-2 hover:bg-white/60 hover:w-4'
                                    }`}
                                aria-label={`Insight ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slideIn {
                    animation: slideIn 0.6s ease-out;
                }
            `}</style>
        </div>
    );
}
