import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signup({ username, email, password })
      navigate('/search', { replace: true })
    } catch (err) {
      const data = err.response?.data
      const firstError = data && typeof data === 'object'
        ? Object.values(data)[0]?.[0] || Object.values(data)[0]
        : null
      setError(firstError || 'Could not create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-hero-gradient">
      <div className="w-full max-w-sm bg-card-gradient border border-border rounded-2xl p-8 shadow-glowCard">
        <h1 className="text-2xl font-bold text-white mb-1 text-center">
          Create your <span className="gradient-text">account</span>
        </h1>
        <p className="text-slate-400 text-sm text-center mb-6">
          Sign up to start analyzing product sentiment
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5
                         text-white text-sm placeholder-slate-600 focus:outline-none
                         focus:border-cyan-500/50 focus:shadow-glow transition-all"
              placeholder="yourname"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5
                         text-white text-sm placeholder-slate-600 focus:outline-none
                         focus:border-cyan-500/50 focus:shadow-glow transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5
                         text-white text-sm placeholder-slate-600 focus:outline-none
                         focus:border-cyan-500/50 focus:shadow-glow transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800/50 text-red-300
                            rounded-xl px-4 py-2.5 text-xs">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-gradient hover:shadow-glow disabled:opacity-40
                       text-white font-semibold text-sm py-2.5 rounded-xl
                       transition-all duration-300"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-slate-500 text-xs text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}