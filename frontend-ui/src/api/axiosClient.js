import axios from 'axios'

const axiosClient = axios.create({
  // 透過 Vite proxy 轉發到 http://localhost:8080
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use(
  (config) => {
    // TODO: JWT 串接後可改由 Zustand/Context 或 localStorage 取 token
    const token = localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }

    return config
  },
  (error) => Promise.reject(error)
)

axiosClient.interceptors.response.use(
  (response) => {
    // 對齊後端統一格式: { code, message, data }
    const payload = response?.data

    if (payload && typeof payload.code !== 'undefined' && payload.code !== 200) {
      return Promise.reject({
        code: payload.code,
        message: payload.message || 'API business error',
        data: payload.data,
      })
    }

    return response
  },
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      // TODO: 未來可在這裡統一導向登入頁或觸發重新整理 token
      console.warn('Unauthorized (401), please login again.')
    }

    return Promise.reject({
      status,
      code: error?.response?.data?.code,
      message: error?.response?.data?.message || error.message || 'Network Error',
      data: error?.response?.data,
    })
  }
)

export default axiosClient
