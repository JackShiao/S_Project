import axiosClient from './axiosClient'

export async function getMarketIndices() {
  const response = await axiosClient.get('/market/indices')
  return response?.data?.data
}
