import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserHistory, clearUserHistory } from '../api/productApi'
import Loader from '../components/Loader'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUserHistory()
      // DRF pagination wraps results in { results: [...] }; fall back to a plain array
      setHistory(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setError('Could not load your history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear your entire search history? This cannot be undone.')) return
    try {
      await clearUserHistory()
      setHistory([])
    } catch (err) {
      setError('Could not clear history. Please try again.')
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/search')}
                  className="text-slate-400 hover:text-white text-sm">
            ← Back
          </button>
          <h2 className="text-white font-semibold text-lg">Your Search History</h2>
        </div>
        {history.length > 0 && (
          <button onClick={handleClear}
                  className="text-red-400 hover:text-red-300 text-sm">
            Clear All
          </button>
        )}
      </div>

      {loading && <Loader message="Loading your history..." />}

      {!loading && error && (
        <div className="bg-red-950/50 border border-red-800/50 text-red-300
                        rounded-xl px-5 py-3 text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="text-center text-slate-500 py-20">
          No search history yet. Start by analyzing a product!
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id}
                 onClick={() => entry.product_id && navigate(`/product/${entry.product_id}`)}
                 className="bg-card border border-border rounded-xl p-4
                            cursor-pointer hover:border-primary transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium text-sm">
                    {entry.product_name}
                  </p>
                  <p className="text-slate-500 text-xs mt-1 truncate max-w-md">
                    {entry.query_input}
                  </p>
                </div>
                <p className="text-slate-600 text-xs whitespace-nowrap ml-4">
                  {new Date(entry.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}