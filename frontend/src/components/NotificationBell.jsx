import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionsService } from '../services/predictions';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await predictionsService.getAllInsights();

            const alerts = [];

            // Add critical/warning budget alerts
            if (data.budget_alerts) {
                data.budget_alerts
                    .filter(alert => alert.alert_level === 'critical' || alert.alert_level === 'warning')
                    .forEach(alert => {
                        alerts.push({
                            id: `budget-${alert.category}`,
                            type: 'budget',
                            severity: alert.alert_level,
                            title: `${alert.category} Budget`,
                            message: alert.message,
                            icon: alert.alert_level === 'critical' ? '🚨' : '⚠️',
                            link: '/insights'
                        });
                    });
            }

            // Add high-severity anomalies
            if (data.anomalies) {
                data.anomalies
                    .filter(anomaly => anomaly.severity === 'high')
                    .forEach(anomaly => {
                        alerts.push({
                            id: `anomaly-${anomaly.id}`,
                            type: 'anomaly',
                            severity: 'high',
                            title: 'Unusual Transaction',
                            message: `₹${anomaly.amount.toLocaleString()} - ${anomaly.description}`,
                            icon: '🔍',
                            link: '/insights'
                        });
                    });
            }

            setNotifications(alerts.slice(0, 5)); // Max 5 notifications
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = (notification) => {
        navigate(notification.link);
        setIsOpen(false);
    };

    const notificationCount = notifications.length;

    return (
        <div className="relative" onMouseLeave={() => setIsOpen(false)}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Badge */}
                {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {notificationCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notificationCount} {notificationCount === 1 ? 'alert' : 'alerts'}
                            </p>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <span className="text-4xl mb-2 block"></span>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        No alerts! Everything looks good.
                                    </p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-left transition"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{notification.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${notification.severity === 'critical'
                                                    ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                                    : notification.severity === 'warning'
                                                        ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                                        : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                                                    }`}>
                                                    {notification.severity}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        navigate('/insights');
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-center text-sm text-teal-600 dark:text-teal-400 hover:text-teal-500 font-medium"
                                >
                                    View All Insights →
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
