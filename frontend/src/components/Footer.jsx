export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            © 2025 <span className="font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">FinPulse</span>. All rights reserved.
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                            Smart financial management powered by AI
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 text-sm transition">
                            Privacy
                        </a>
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 text-sm transition">
                            Terms
                        </a>
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 text-sm transition">
                            Help
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
