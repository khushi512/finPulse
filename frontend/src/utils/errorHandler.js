// Error handling utility
import toast from 'react-hot-toast';

export const handleApiError = (error, customMessage = null) => {
    console.error('API Error:', error);

    if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const message = error.response.data?.detail || error.response.data?.message;

        switch (status) {
            case 400:
                toast.error(message || 'Invalid request. Please check your input.');
                break;
            case 401:
                toast.error('Session expired. Please login again.');
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }, 1500);
                break;
            case 403:
                toast.error('You don\'t have permission to perform this action.');
                break;
            case 404:
                toast.error(message || 'Resource not found.');
                break;
            case 422:
                toast.error(message || 'Validation error. Please check your input.');
                break;
            case 500:
                toast.error('Server error. Please try again later.');
                break;
            default:
                toast.error(customMessage || message || 'Something went wrong.');
        }
    } else if (error.request) {
        // Request made but no response
        toast.error('Network error. Please check your connection.');
    } else {
        // Something else happened
        toast.error(customMessage || error.message || 'An unexpected error occurred.');
    }
};

export const showSuccess = (message) => {
    toast.success(message, {
        duration: 3000,
        icon: '✅',
    });
};

export const showError = (message) => {
    toast.error(message, {
        duration: 4000,
    });
};

export const showLoading = (message = 'Loading...') => {
    return toast.loading(message);
};

export const dismissToast = (toastId) => {
    toast.dismiss(toastId);
};
