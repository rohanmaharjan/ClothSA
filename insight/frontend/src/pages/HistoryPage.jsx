import { useNavigate } from 'react-router-dom'

export default function HistoryPage() {
    const navigate = useNavigate()
    const history  = JSON.parse(localStorage.getItem('searchHistory') || '[]')

    const clearHistory = () => {
        localStorage.removeItem('searchHistory')
        window.location.reload()
    }

    return (
        <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')}
                            className="text-slate-400 hover:text-white text-sm">
                        ← Back
                    </button>
                    <h2 className="text-white font-semibold text-lg">Search History</h2>
                </div>
                {history.length > 0 && (
                    <button onClick={clearHistory}
                            className="text-red-400 hover:text-red-300 text-sm">
                        Clear All
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="text-center text-slate-500 py-20">
                    No search history yet. Start by analyzing a product!
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((entry, i) => (
                        <div key={i}
                             onClick={() => entry.productId && navigate(`/product/${entry.productId}`)}
                             className="bg-card border border-border rounded-xl p-4 
                                        cursor-pointer hover:border-primary transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white font-medium text-sm">
                                        {entry.productName}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-1 truncate max-w-md">
                                        {entry.input}
                                    </p>
                                </div>
                                <p className="text-slate-600 text-xs">
                                    {new Date(entry.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}