import axiosClient from './axiosClient'

export const registerUser = async ({ username, email, password }) => {
  const response = await axiosClient.post('/auth/register/', { username, email, password })
  return response.data
}

export const loginUser = async ({ username, password }) => {
  const response = await axiosClient.post('/auth/login/', { username, password })
  return response.data
}

export const logoutUser = async (refreshToken) => {
  const response = await axiosClient.post('/auth/logout/', { refresh: refreshToken })
  return response.data
}

export const getProfile = async () => {
  const response = await axiosClient.get('/auth/profile/')
  return response.data
}