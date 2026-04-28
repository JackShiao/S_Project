import { useEffect } from 'react'
import Footer from './components/layout/Footer'
import AuthModals from './components/auth/AuthModals'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Market from './pages/Market'
import News from './pages/News'
import About from './pages/About'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

function App() {
  const initAuth = useAuthStore((state) => state.initAuth)

  // 頁面載入時從 localStorage 恢復登入狀態
  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market" element={<Market />} />
        <Route path="/news" element={<News />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <Footer />
      <AuthModals />
    </BrowserRouter>
  )
}

export default App
