import { useState, useRef } from 'react';

export default function ImportCSVModal({ isOpen, onClose, onImport }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            setError('');
            setResult(null);
        } else {
            setError('Please select a CSV file');
            setFile(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            setFile(droppedFile);
            setError('');
            setResult(null);
        } else {
            setError('Please drop a CSV file');
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            const importResult = await onImport(file);
            setResult(importResult);
        } catch (err) {
            // console.error("Import Error:", err);
            const errorMessage = err.response?.data?.detail || err.message || 'Import failed';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-700/50">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Import Transactions</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {result ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                        <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white font-medium">Import Complete</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">{result.imported} transactions imported</p>
                                    </div>
                                </div>

                                {result.skipped > 0 && (
                                    <p className="text-yellow-600 dark:text-yellow-400 text-sm">{result.skipped} rows skipped</p>
                                )}

                                {result.errors?.length > 0 && (
                                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-500/10 rounded-lg">
                                        <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Errors:</p>
                                        <ul className="text-red-600 dark:text-red-400 text-xs space-y-1">
                                            {result.errors.slice(0, 5).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Drop zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 transition-colors"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="hidden"
                                />

                                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>

                                {file ? (
                                    <p className="text-gray-900 dark:text-white font-medium">{file.name}</p>
                                ) : (
                                    <>
                                        <p className="text-gray-900 dark:text-white font-medium">Drop your CSV file here</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">or click to browse</p>
                                    </>
                                )}
                            </div>

                            {/* Expected format */}
                            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    <span className="font-medium">Expected columns:</span> date, amount, description, category, is_income, merchant
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-2.5 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!file || loading}
                                    className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
