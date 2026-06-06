import { useState } from 'react'

export default function SearchBar({ onSearch, loading }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) onSearch(input.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2 p-1.5 bg-card border border-border rounded-2xl
                      focus-within:border-cyan-500/50 focus-within:shadow-glow
                      transition-all duration-300">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste Amazon URL or search product name..."
          className="flex-1 bg-transparent px-4 py-2.5 text-white text-sm
                     placeholder-slate-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-accent-gradient hover:shadow-glow disabled:opacity-40
                     disabled:cursor-not-allowed text-white font-semibold text-sm
                     px-6 py-2.5 rounded-xl transition-all duration-300
                     glow-pulse"
        >
          {loading ? '⏳ Analyzing...' : '⚡ Analyze'}
        </button>
      </div>
    </form>
  )
}