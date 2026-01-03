// Loading skeleton components
export const SkeletonCard = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className="animate-pulse space-y-3">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
        ))}
    </div>
);

export const SkeletonStat = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
    </div>
);

export const SkeletonChart = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
);

export const LoadingSpinner = ({ size = 'md', message = '' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className={`animate-spin rounded-full border-t-2 border-b-2 border-teal-500 ${sizeClasses[size]}`} />
            {message && (
                <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">{message}</p>
            )}
        </div>
    );
};
