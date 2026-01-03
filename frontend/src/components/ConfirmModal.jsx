// Confirmation modal component
import { useState } from 'react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger' // 'danger' | 'warning' | 'info'
}) {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            // Error is handled by the parent
        } finally {
            setIsLoading(false);
        }
    };

    const typeStyles = {
        danger: {
            icon: '⚠️',
            iconBg: 'bg-red-100 dark:bg-red-500/20',
            iconText: 'text-red-600 dark:text-red-400',
            button: 'bg-red-600 hover:bg-red-500 focus:ring-red-500'
        },
        warning: {
            icon: '⚡',
            iconBg: 'bg-yellow-100 dark:bg-yellow-500/20',
            iconText: 'text-yellow-600 dark:text-yellow-400',
            button: 'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-500'
        },
        info: {
            icon: 'ℹ️',
            iconBg: 'bg-blue-100 dark:bg-blue-500/20',
            iconText: 'text-blue-600 dark:text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
        }
    };

    const style = typeStyles[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-slideIn">
                <div className="p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center mx-auto mb-4`}>
                        <span className="text-2xl">{style.icon}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2.5 ${style.button} text-white rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
        </div>
    );
}
