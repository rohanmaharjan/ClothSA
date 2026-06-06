import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000/api'

export const searchOrScrape = async (input) => {
    const response = await axios.post(`${BASE_URL}/product/`, 
        { input },                          // ← body
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
    return response.data
}

export const getProductDetail = async (id) => {
    const response = await axios.get(`${BASE_URL}/product/${id}/`)
    return response.data
}