import axiosClient from './axiosClient'

export async function getMarketIndices() {
  // const response = await axiosClient.get('/market/indices')
  // return response?.data?.data

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: '道瓊工業指數', value: '39,087.38', change: '+0.23%' },
        { name: '那斯達克指數', value: '16,274.94', change: '+1.14%' },
        { name: '標普 500', value: '5,137.08', change: '+0.80%' },
        { name: '台股加權指數', value: '19,305.31', change: '-0.15%' },
      ])
    }, 800)
  })
}
