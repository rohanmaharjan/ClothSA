import axiosClient from './axiosClient'

export const searchOrScrape = async (input) => {
  const response = await axiosClient.post('/product/', { input })
  return response.data
}

export const getProductDetail = async (id) => {
  const response = await axiosClient.get(`/product/${id}/`)
  return response.data
}

export const getUserHistory = async () => {
  const response = await axiosClient.get('/product/history/')
  return response.data
}

export const clearUserHistory = async () => {
  const response = await axiosClient.delete('/product/history/clear/')
  return response.data
}