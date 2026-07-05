import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import Loader    from '../components/Loader'
import { searchOrScrape } from '../api/productApi'

export default function SearchPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const navigate = useNavigate()

  const handleSearch = async (input) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchOrScrape(input)
      // History is now recorded server-side (per logged-in user) — no localStorage needed.
      navigate('/results', { state: { data, input } })
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4
                    bg-hero-gradient relative overflow-hidden">

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3
                      w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20
                        text-cyan-400 text-xs px-3 py-1 rounded-full mb-4">
          ✦ AI-Powered Review Analysis
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Analyze a <span className="gradient-text">product</span>
        </h1>
        <p className="text-slate-400 text-base">
          Paste an Amazon URL or search a product to analyze customer sentiment
        </p>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {loading && (
        <div className="mt-10 relative z-10">
          <Loader message="Scraping and analyzing reviews... this may take 30-40 seconds" />
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-950/50 border border-red-800/50 text-red-300
                        rounded-xl px-5 py-3 text-sm max-w-2xl w-full text-center
                        relative z-10">
          ⚠️ {error}
        </div>
      )}

      {!loading && (
        <p className="text-slate-600 text-xs mt-8 relative z-10">
          Tip: Use a clean Amazon URL like amazon.com/dp/PRODUCT_ID
        </p>
      )}
    </div>
  )
}