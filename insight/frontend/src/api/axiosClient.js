import axios from 'axios'

export const BASE_URL = 'http://127.0.0.1:8000/api'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach the access token to every outgoing request ──────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── If a request comes back 401, try to refresh the access token once ──────
let isRefreshing = false
let pendingQueue = []

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      handleLogoutRedirect()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh finishes
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axiosClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      })
      localStorage.setItem('accessToken', data.access)
      processQueue(null, data.access)
      originalRequest.headers.Authorization = `Bearer ${data.access}`
      return axiosClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      handleLogoutRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

function handleLogoutRedirect() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('username')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export default axiosClient