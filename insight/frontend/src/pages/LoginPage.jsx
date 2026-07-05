import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/search'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ username, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-hero-gradient">
      <div className="w-full max-w-sm bg-card-gradient border border-border rounded-2xl p-8 shadow-glowCard">
        <h1 className="text-2xl font-bold text-white mb-1 text-center">
          Welcome <span className="gradient-text">back</span>
        </h1>
        <p className="text-slate-400 text-sm text-center mb-6">
          Log in to analyze products and view your history
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
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input
              type="password"
              required
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
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-slate-500 text-xs text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}