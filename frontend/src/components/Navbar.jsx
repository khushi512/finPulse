import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard'},
        { path: '/transactions', label: 'Transactions'},
        { path: '/budgets', label: 'Budgets' },
    ];

    return (
        <header className="bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-lg sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        FinPulse
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${location.pathname === item.path
                                        ? 'bg-gray-700/50 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm hidden sm:block">{user?.email}</span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${location.pathname === item.path
                                    ? 'bg-gray-700/50 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {item.icon} {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
