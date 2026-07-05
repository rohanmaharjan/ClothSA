import { createContext, useContext, useState, useCallback } from 'react'
import { loginUser, registerUser, logoutUser } from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(() => localStorage.getItem('username'))
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'))

  const persistSession = (data) => {
    localStorage.setItem('accessToken', data.access)
    localStorage.setItem('refreshToken', data.refresh)
    localStorage.setItem('username', data.username || '')
    setAccessToken(data.access)
    setUsername(data.username || '')
  }

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials)
    persistSession(data)
    return data
  }, [])

  const signup = useCallback(async (credentials) => {
    const data = await registerUser(credentials)
    persistSession({ ...data, username: credentials.username })
    return data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) await logoutUser(refreshToken)
    } catch (e) {
      // Even if the blacklist call fails (e.g. token already expired),
      // we still want to clear the local session below.
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('username')
      setAccessToken(null)
      setUsername(null)
    }
  }, [])

  const value = {
    username,
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}