import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        if (authService.isAuthenticated()) {
            try {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            } catch (error) {
                authService.logout();
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        await authService.login(email, password);
        const userData = await authService.getCurrentUser();
        setUser(userData);
    };

    const register = async (email, password) => {
        await authService.register(email, password);
        // Auto-login after registration
        await authService.login(email, password);
        const userData = await authService.getCurrentUser();
        setUser(userData);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
