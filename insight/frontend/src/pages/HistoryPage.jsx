import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserHistory, clearUserHistory, deleteHistoryItem } from '../api/productApi'
import Loader from '../components/Loader'

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUserHistory()
      setHistory(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setError('Could not load your history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear your entire search history? This cannot be undone.')) return
    try {
      await clearUserHistory()
      setHistory([])
    } catch (err) {
      setError('Could not clear history. Please try again.')
    }
  }

  const handleDeleteOne = async (e, id) => {
    e.stopPropagation() // don't trigger the row's navigate-to-product click
    setDeletingId(id)
    try {
      await deleteHistoryItem(id)
      setHistory((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      setError('Could not delete that entry. Please try again.')
    } finally {
      setDeletingId(null)
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
          <button onClick={handleClearAll}
                  className="text-red-400 hover:text-red-300 text-sm">
            Clear All
          </button>
        )}
      </div>

      {loading && <Loader message="Loading your history..." />}

      {!loading && error && (
        <div className="bg-red-950/50 border border-red-800/50 text-red-300
                        rounded-xl px-5 py-3 text-sm text-center mb-4">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="text-center text-slate-500 py-20">
          No search history yet. Start by analyzing a product!
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id}
                 onClick={() => entry.product_id && navigate(`/product/${entry.product_id}`)}
                 className="group bg-card border border-border rounded-xl p-4
                            cursor-pointer hover:border-primary transition-colors
                            flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {entry.product_name}
                </p>
                <p className="text-slate-500 text-xs mt-1 truncate max-w-md">
                  {entry.query_input}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <p className="text-slate-600 text-xs whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => handleDeleteOne(e, entry.id)}
                  disabled={deletingId === entry.id}
                  title="Remove this entry"
                  className="text-slate-600 hover:text-red-400 disabled:opacity-40
                             p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}