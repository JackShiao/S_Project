import axiosClient from './axiosClient'

export async function fetchMarketIndices() {
  const response = await axiosClient.get('/market/indices')
  return response?.data?.data
}

export async function searchMarketIndices(keyword) {
  const response = await axiosClient.get('/market/search', { params: { q: keyword } })
  return response?.data?.data ?? []
}

