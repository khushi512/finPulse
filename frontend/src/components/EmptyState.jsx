// Empty state component
export default function EmptyState({
    icon = '📭',
    title = 'No data found',
    description = 'Get started by adding your first item',
    action = null,
    className = ''
}) {
    return (
        <div className={`text-center py-12 px-4 ${className}`}>
            <div className="text-6xl mb-4 animate-bounce">{icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {description}
            </p>
            {action && (
                <div className="flex justify-center">
                    {action}
                </div>
            )}
        </div>
    );
}
